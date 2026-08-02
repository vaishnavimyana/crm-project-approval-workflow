// src/pages/ProjectDetail.jsx
// ============================================================================
// Shows full project details.
// CRM sees edit/submit options. Approver sees approve/reject buttons.
// Both see audit trail and version history.
// ============================================================================
import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import Navbar from '../components/common/Navbar'
import Badge from '../components/common/Badge'
import Button from '../components/common/Button'
import LoadingSpinner from '../components/common/LoadingSpinner'
import AuditTrail from '../components/projects/AuditTrail'
import VersionHistory from '../components/projects/VersionHistory'
import RejectModal from '../components/approvals/RejectModal'
import { projectService } from '../services/project.service'
import { approvalService } from '../services/approval.service'
import { useAuth } from '../context/AuthContext'
import { formatDate } from '../utils/dateHelpers'

export default function ProjectDetail() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const [activeTab, setActiveTab] = useState('details')
  const [showRejectModal, setShowRejectModal] = useState(false)

  const { data: project, isLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => projectService.getById(projectId),
  })

  const activeVersion = project?.active_version ||
    project?.versions?.[project.versions.length - 1]
  const latestVersion = project?.versions?.length > 0
    ? [...project.versions].sort((a, b) => b.version_number - a.version_number)[0]
    : null

  // FIX 2 - fetch contracts for the active/latest version
  const { data: contracts = [] } = useQuery({
    queryKey: ['contracts', projectId, latestVersion?.id],
    queryFn: () => projectService.getContracts(projectId, latestVersion.id),
    enabled: !!projectId && !!latestVersion?.id,
  })

  // FIX 2 - download a contract
  async function handleDownloadContract(contractId) {
    try {
      const url = await projectService.downloadContract(contractId)
      window.open(url, '_blank')
    } catch (err) {
      alert('Failed to download contract')
    }
  }

  const approveMutation = useMutation({
    mutationFn: ({ versionId }) => approvalService.approve(projectId, versionId),
    onSuccess: () => {
      queryClient.invalidateQueries(['project', projectId])
      queryClient.invalidateQueries(['approvals'])
      alert('Project approved successfully!')
    },
    onError: (err) => alert(err.response?.data?.detail || 'Approval failed'),
  })

  const rejectMutation = useMutation({
    mutationFn: ({ versionId, comments }) =>
      approvalService.reject(projectId, versionId, comments),
    onSuccess: () => {
      queryClient.invalidateQueries(['project', projectId])
      queryClient.invalidateQueries(['approvals'])
      setShowRejectModal(false)
      alert('Project rejected.')
    },
    onError: (err) => alert(err.response?.data?.detail || 'Rejection failed'),
  })

  const newVersionMutation = useMutation({
    mutationFn: () => projectService.createNewVersion(projectId),
    onSuccess: (data) => {
      queryClient.invalidateQueries(['project', projectId])
      navigate(`/projects/${projectId}`)
      alert(`New version v${data.version_number} created. You can now edit it.`)
    },
  })

  if (isLoading) return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <LoadingSpinner message="Loading project..." />
    </div>
  )
  if (!project) return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="text-center py-16 text-gray-500">Project not found</div>
    </div>
  )

  const isApprover = user?.role === 'approver'
  const isCRM = user?.role === 'crm'
  const isOwner = project.crm_user_id === user?.id
  const canApproveReject = isApprover && latestVersion?.status === 'pending_approval'
  const canEdit = isCRM && isOwner &&
    (latestVersion?.status === 'draft' || latestVersion?.status === 'rejected')
  const canCreateNewVersion = isCRM && isOwner && latestVersion?.status === 'approved'

  const tabs = [
    { id: 'details', label: 'Project Details' },
    { id: 'versions', label: `Versions (${project.versions?.length || 0})` },
    { id: 'audit', label: 'Audit Trail' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft size={16} />
          Back
        </button>

        {/* Project Header */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-xl font-bold text-gray-900">
                  {latestVersion?.name || 'Unnamed Project'}
                </h1>
                <Badge status={latestVersion?.status || 'draft'} />
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {project.display_id} • v{latestVersion?.version_number} •
                Client: {project.client?.legal_entity_name}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Created by {project.crm_user_name} • {formatDate(project.created_at)}
              </p>
            </div>
            {/* Action Buttons */}
            <div className="flex gap-3 flex-wrap">
              {canEdit && (
                <Button onClick={() => navigate(`/projects/new?edit=${projectId}`)} variant="secondary">
                  Edit Project
                </Button>
              )}
              {canCreateNewVersion && (
                <Button
                  onClick={() => {
                    if (window.confirm(
                      'Editing this approved project will create a new version ' +
                      'that requires re-approval. Continue?')) {
                      newVersionMutation.mutate()
                    }
                  }}
                  variant="secondary"
                  loading={newVersionMutation.isPending}
                >
                  Edit (Create New Version)
                </Button>
              )}
              {canApproveReject && (
                <>
                  <Button
                    variant="success"
                    onClick={() => {
                      if (window.confirm('Approve this project?')) {
                        approveMutation.mutate({ versionId: latestVersion.id })
                      }
                    }}
                    loading={approveMutation.isPending}
                    className="flex items-center gap-2"
                  >
                    <CheckCircle size={16} />
                    Approve
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => setShowRejectModal(true)}
                    className="flex items-center gap-2"
                  >
                    <XCircle size={16} />
                    Reject
                  </Button>
                </>
              )}
            </div>
          </div>
          {/* Rejection reason banner for CRM */}
          {isCRM && latestVersion?.status === 'rejected' && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
              <AlertCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-700">Project Rejected</p>
                <p className="text-sm text-red-600 mt-1">
                  Please edit the project to address the reviewer's comments and resubmit for approval.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="border-b border-gray-200 flex">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 text-sm font-medium transition-colors
                  ${activeTab === tab.id
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="p-6">
            {/* Details Tab */}
            {activeTab === 'details' && activeVersion && (
              <div className="space-y-6">
                {/* Client Info */}
                <section>
                  <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">
                    Client Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-lg p-4">
                    <Field label="Legal Entity" value={project.client?.legal_entity_name} />
                    <Field label="GST Number" value={project.client?.gst_number} />
                    <Field label="Billing Currency" value={project.client?.billing_currency} />
                    <Field label="Mode of Payment" value={project.client?.mode_of_payment} />
                    <Field label="Registered Address" value={project.client?.registered_address} />
                    <Field label="Contact"
                      value={`${project.client?.contact_name} (${project.client?.contact_designation})`} />
                    <Field label="Contact Email" value={project.client?.contact_email} />
                    <Field label="Contact Phone" value={project.client?.contact_phone} />
                  </div>
                </section>

                {/* FIX 2 - Contract Documents section */}
                <section>
                  <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">
                    Contract Documents
                  </h3>
                  {contracts.length === 0 ? (
                    <p className="text-sm text-gray-400">No contracts uploaded.</p>
                  ) : (
                    <div className="space-y-2">
                      {contracts.map(c => (
                        <div key={c.id}
                          className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3">
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {c.original_filename}
                            </p>
                            <p className="text-xs text-gray-500">
                              {c.document_type} • {c.valid_from} to {c.valid_till}
                            </p>
                          </div>
                          <button
                            onClick={() => handleDownloadContract(c.id)}
                            className="text-xs text-blue-600 hover:text-blue-800"
                          >
                            Download
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                {/* Project Info */}
                <section>
                  <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">
                    Project Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-lg p-4">
                    <Field label="Project Name" value={activeVersion.name} />
                    <Field label="Business Unit" value={activeVersion.business_unit} />
                    <Field label="Start Date" value={formatDate(activeVersion.start_date)} />
                    <Field label="End Date" value={formatDate(activeVersion.end_date)} />
                    <Field label="Reviewer" value={activeVersion.reviewer_name || 'Not assigned'} />
                  </div>
                </section>

                {/* Job Categories */}
                {activeVersion.job_categories?.length > 0 && (
                  <section>
                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">
                      Job Categories & Rate Cards
                    </h3>
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">
                              Job Category
                            </th>
                            <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">
                              Rate Card
                            </th>
                            <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">
                              Rate
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {activeVersion.job_categories.map(jc => (
                            <tr key={jc.id}>
                              <td className="px-4 py-2 text-gray-900">{jc.category_name}</td>
                              <td className="px-4 py-2 text-gray-600">{jc.rate_card_title}</td>
                              <td className="px-4 py-2 text-gray-600">
                                ${jc.rate_card_rate} {jc.rate_card_currency}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>
                )}
              </div>
            )}

            {/* Versions Tab */}
            {activeTab === 'versions' && (
              <VersionHistory versions={project.versions || []} />
            )}

            {/* Audit Tab */}
            {activeTab === 'audit' && (
              <AuditTrail projectId={projectId} />
            )}
          </div>
        </div>
      </div>

      {/* Reject Modal */}
      <RejectModal
        isOpen={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        onConfirm={(comments) => {
          rejectMutation.mutate({ versionId: latestVersion?.id, comments })
        }}
        loading={rejectMutation.isPending}
      />
    </div>
  )
}

// Small helper component for label-value pairs
function Field({ label, value }) {
  return (
    <div>
      <p className="text-xs text-gray-500 font-medium">{label}</p>
      <p className="text-sm text-gray-900 mt-0.5">{value || '—'}</p>
    </div>
  )
}
