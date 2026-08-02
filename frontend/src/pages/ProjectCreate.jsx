// src/pages/ProjectCreate.jsx
// ============================================================================
// Multi-step wizard for creating or editing a project.
// Handles both new project creation and editing existing drafts.
// ============================================================================
import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ChevronRight, ChevronLeft, Send, Save } from 'lucide-react'
import Navbar from '../components/common/Navbar'
import Button from '../components/common/Button'
import LoadingSpinner from '../components/common/LoadingSpinner'
import { projectService } from '../services/project.service'
import { clientService } from '../services/client.service'
import { useAuth } from '../context/AuthContext'
import { BUSINESS_UNITS, DOCUMENT_TYPES } from '../utils/statusConfig'
import { toInputDate } from '../utils/dateHelpers'

const STEPS = [
  { id: 1, label: 'Client Info' },
  { id: 2, label: 'Contracts' },
  { id: 3, label: 'Basic Info' },
  { id: 4, label: 'Rate Cards' },
]

export default function ProjectCreate() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const editProjectId = searchParams.get('edit')
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const [currentStep, setCurrentStep] = useState(1)
  const [createdProjectId, setCreatedProjectId] = useState(editProjectId || null)
  const [createdVersionId, setCreatedVersionId] = useState(null)

  // Form state
  const [selectedClientId, setSelectedClientId] = useState('')
  const [clientData, setClientData] = useState(null)
  const [basicInfo, setBasicInfo] = useState({
    name: '',
    start_date: '',
    end_date: '',
    business_unit: '',
    reviewer_id: '',
  })
  const [jobCategories, setJobCategories] = useState([
    { category_name: '', rate_card_id: '' }
  ])
  const [submitReviewerId, setSubmitReviewerId] = useState('')
  const [contracts, setContracts] = useState([])
  const [uploadForm, setUploadForm] = useState({
    document_type: '',
    valid_from: '',
    valid_till: '',
    file: null,
  })
  const [uploading, setUploading] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')

  // Load existing project if editing
  const { data: existingProject, isLoading: loadingProject } = useQuery({
    queryKey: ['project', editProjectId],
    queryFn: () => projectService.getById(editProjectId),
    enabled: !!editProjectId,
  })

  // Pre-fill form when editing
  useEffect(() => {
    if (existingProject) {
      const latestVersion = existingProject.versions?.length > 0
        ? [...existingProject.versions].sort(
            (a, b) => b.version_number - a.version_number)[0]
        : null
      if (latestVersion) {
        setCreatedVersionId(latestVersion.id)
        setSelectedClientId(existingProject.client_id)
        setClientData(existingProject.client)
        setBasicInfo({
          name: latestVersion.name || '',
          start_date: toInputDate(latestVersion.start_date),
          end_date: toInputDate(latestVersion.end_date),
          business_unit: latestVersion.business_unit || '',
          reviewer_id: latestVersion.reviewer_id || '',
        })
        if (latestVersion.job_categories?.length > 0) {
          setJobCategories(latestVersion.job_categories.map(jc => ({
            category_name: jc.category_name,
            rate_card_id: jc.rate_card_id,
          })))
        }
        setSubmitReviewerId(latestVersion.reviewer_id || '')
      }
      // Load existing contracts
      if (latestVersion) {
        projectService.getContracts(editProjectId, latestVersion.id)
          .then(setContracts)
          .catch(() => {})
      }
    }
  }, [existingProject])

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: clientService.getAll,
  })
  const { data: rateCards = [] } = useQuery({
    queryKey: ['rate-cards'],
    queryFn: projectService.getRateCards,
  })
  const { data: approvers = [] } = useQuery({
    queryKey: ['approvers'],
    queryFn: projectService.getApprovers,
  })

  // Handle client selection - auto-fill client data
  async function handleClientSelect(clientId) {
    setSelectedClientId(clientId)
    if (clientId) {
      try {
        const data = await clientService.getById(clientId)
        setClientData(data)
      } catch (err) {
        console.error('Failed to fetch client details')
      }
    } else {
      setClientData(null)
    }
  }

  // Create project when moving past step 1
  async function ensureProjectCreated() {
    if (createdProjectId && createdVersionId) return true
    if (!selectedClientId) {
      alert('Please select a client first.')
      return false
    }
    try {
      const result = await projectService.create({
        client_id: selectedClientId,
        name: basicInfo.name || 'Draft Project',
        start_date: basicInfo.start_date || '2024-01-01',
        end_date: basicInfo.end_date || '2024-12-31',
        business_unit: basicInfo.business_unit || 'Technology',
        reviewer_id: basicInfo.reviewer_id || undefined,
        job_categories: [],
      })
      setCreatedProjectId(result.project_id)
      setCreatedVersionId(result.version_id)
      return true
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to create project draft')
      return false
    }
  }

  async function handleNext() {
    if (currentStep === 1) {
      if (!selectedClientId) {
        alert('Please select a client to continue.')
        return
      }
      if (!createdProjectId) {
        const created = await ensureProjectCreated()
        if (!created) return
      }
    }
    setCurrentStep(prev => Math.min(prev + 1, 4))
  }

  function handleBack() {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  // Save basic info
  async function saveBasicInfo() {
    if (!createdProjectId || !createdVersionId) return
    try {
      await projectService.update(createdProjectId, createdVersionId, {
        name: basicInfo.name,
        start_date: basicInfo.start_date,
        end_date: basicInfo.end_date,
        business_unit: basicInfo.business_unit,
        reviewer_id: basicInfo.reviewer_id || undefined,
        job_categories: jobCategories.filter(
          jc => jc.category_name && jc.rate_card_id),
      })
      setSaveMessage('Saved!')
      setTimeout(() => setSaveMessage(''), 2000)
    } catch (err) {
      alert(err.response?.data?.detail || 'Save failed')
    }
  }

  // Upload contract
  async function handleUploadContract() {
    if (!uploadForm.file || !uploadForm.document_type ||
        !uploadForm.valid_from || !uploadForm.valid_till) {
      alert('Please fill all contract fields and select a file.')
      return
    }
    if (!createdProjectId || !createdVersionId) {
      alert('Please complete Step 1 first.')
      return
    }
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', uploadForm.file)
      formData.append('document_type', uploadForm.document_type)
      formData.append('valid_from', uploadForm.valid_from)
      formData.append('valid_till', uploadForm.valid_till)
      await projectService.uploadContract(createdProjectId, createdVersionId, formData)
      const updated = await projectService.getContracts(createdProjectId, createdVersionId)
      setContracts(updated)
      setUploadForm({ document_type: '', valid_from: '', valid_till: '', file: null })
      alert('Contract uploaded successfully!')
    } catch (err) {
      alert(err.response?.data?.detail || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  // Delete contract
  async function handleDeleteContract(contractId) {
    if (!window.confirm('Delete this contract?')) return
    try {
      await projectService.deleteContract(contractId)
      setContracts(prev => prev.filter(c => c.id !== contractId))
    } catch (err) {
      alert('Failed to delete contract')
    }
  }

  // FIX 2 - Download contract
  async function handleDownloadContract(contractId) {
    try {
      const url = await projectService.downloadContract(contractId)
      window.open(url, '_blank')
    } catch (err) {
      alert('Failed to download contract')
    }
  }

  // Submit for approval
  async function handleSubmit() {
    if (!submitReviewerId) {
      alert('Please select an approver before submitting.')
      return
    }
    if (!createdProjectId || !createdVersionId) {
      alert('Project not created yet.')
      return
    }
    await saveBasicInfo()
    try {
      await projectService.submit(createdProjectId, createdVersionId, submitReviewerId)
      queryClient.invalidateQueries(['projects'])
      alert('Project submitted for approval!')
      navigate('/projects')
    } catch (err) {
      alert(err.response?.data?.detail || 'Submission failed')
    }
  }

  if (loadingProject) return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <LoadingSpinner message="Loading project..." />
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            {editProjectId ? 'Edit Project' : 'New Project'}
          </h1>
          {createdProjectId && (
            <p className="text-sm text-gray-500 mt-1">Draft saved automatically</p>
          )}
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-0 mb-8">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                  ${currentStep === step.id ? 'bg-blue-600 text-white'
                    : currentStep > step.id ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-500'}`}>
                  {currentStep > step.id ? '✓' : step.id}
                </div>
                <span className="text-xs text-gray-500 mt-1 whitespace-nowrap">
                  {step.label}
                </span>
              </div>
              {index < STEPS.length - 1 && (
                <div className={`h-px flex-1 mx-2 mt-[-14px]
                  ${currentStep > step.id ? 'bg-green-400' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          {/* STEP 1: Client Info */}
          {currentStep === 1 && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold text-gray-900">Client Information</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Client <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedClientId}
                  onChange={(e) => handleClientSelect(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Select a client --</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.legal_entity_name}</option>
                  ))}
                </select>
              </div>
              {clientData && (
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Auto-filled from database
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <ReadOnlyField label="Legal Entity Name" value={clientData.legal_entity_name} />
                    <ReadOnlyField label="GST Number" value={clientData.gst_number} />
                    <ReadOnlyField label="Billing Currency" value={clientData.billing_currency} />
                    <ReadOnlyField label="Mode of Payment" value={clientData.mode_of_payment} />
                    <ReadOnlyField label="Registered Address" value={clientData.registered_address} />
                    <ReadOnlyField label="Billing Address" value={clientData.billing_address || 'Same as registered'} />
                    <ReadOnlyField label="Contact Person"
                      value={`${clientData.contact_name} (${clientData.contact_designation})`} />
                    <ReadOnlyField label="Contact Email" value={clientData.contact_email} />
                    <ReadOnlyField label="Phone" value={clientData.contact_phone} />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Contracts */}
          {currentStep === 2 && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold text-gray-900">Contract Documents</h2>
              <p className="text-sm text-gray-500">
                Upload at least one contract document before submitting.
              </p>

              {/* Upload form */}
              <div className="border border-dashed border-gray-300 rounded-lg p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Document Type *
                    </label>
                    <select
                      value={uploadForm.document_type}
                      onChange={e => setUploadForm(p => ({ ...p, document_type: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select type...</option>
                      {DOCUMENT_TYPES.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      File *
                    </label>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={e => setUploadForm(p => ({ ...p, file: e.target.files[0] }))}
                      className="w-full text-sm text-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Valid From *
                    </label>
                    <input
                      type="date"
                      value={uploadForm.valid_from}
                      onChange={e => setUploadForm(p => ({ ...p, valid_from: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Valid Till *
                    </label>
                    <input
                      type="date"
                      value={uploadForm.valid_till}
                      onChange={e => setUploadForm(p => ({ ...p, valid_till: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <Button onClick={handleUploadContract} loading={uploading} size="sm">
                  Upload Contract
                </Button>
              </div>

              {/* Uploaded contracts */}
              {contracts.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Uploaded ({contracts.length})
                  </p>
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
                        {/* FIX 2 - Download button added */}
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleDownloadContract(c.id)}
                            className="text-xs text-blue-600 hover:text-blue-800"
                          >
                            Download
                          </button>
                          <button
                            onClick={() => handleDeleteContract(c.id)}
                            className="text-xs text-red-500 hover:text-red-700"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Basic Info */}
          {currentStep === 3 && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Project Name *
                  </label>
                  <input
                    type="text"
                    value={basicInfo.name}
                    onChange={e => setBasicInfo(p => ({ ...p, name: e.target.value }))}
                    placeholder="e.g. ABC Corp Digital Transformation Phase 1"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    value={basicInfo.start_date}
                    onChange={e => setBasicInfo(p => ({ ...p, start_date: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date *
                  </label>
                  <input
                    type="date"
                    value={basicInfo.end_date}
                    onChange={e => setBasicInfo(p => ({ ...p, end_date: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Business Unit *
                  </label>
                  <select
                    value={basicInfo.business_unit}
                    onChange={e => setBasicInfo(p => ({ ...p, business_unit: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select unit...</option>
                    {BUSINESS_UNITS.map(u => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CRM Creator
                  </label>
                  <input
                    type="text"
                    value={user?.name || ''}
                    disabled
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-gray-50 text-gray-500 cursor-not-allowed"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Rate Cards */}
          {currentStep === 4 && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold text-gray-900">
                Job Categories & Rate Cards
              </h2>
              <p className="text-sm text-gray-500">
                Define the job roles needed for this project and map each to a rate card.
              </p>
              <div className="space-y-3">
                {jobCategories.map((jc, index) => (
                  <div key={index} className="flex gap-3 items-start p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Job Category
                      </label>
                      <input
                        type="text"
                        value={jc.category_name}
                        onChange={e => {
                          const updated = [...jobCategories]
                          updated[index].category_name = e.target.value
                          setJobCategories(updated)
                        }}
                        placeholder="e.g. Senior Developer"
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Rate Card
                      </label>
                      <select
                        value={jc.rate_card_id}
                        onChange={e => {
                          const updated = [...jobCategories]
                          updated[index].rate_card_id = e.target.value
                          setJobCategories(updated)
                        }}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select rate...</option>
                        {rateCards.map(rc => (
                          <option key={rc.id} value={rc.id}>
                            {rc.title} — ${rc.rate}/{rc.unit}
                          </option>
                        ))}
                      </select>
                    </div>
                    {jobCategories.length > 1 && (
                      <button
                        onClick={() => setJobCategories(prev => prev.filter((_, i) => i !== index))}
                        className="mt-5 text-red-400 hover:text-red-600 text-sm"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={() => setJobCategories(prev => [...prev, { category_name: '', rate_card_id: '' }])}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  + Add Another Category
                </button>
              </div>

              {/* Reviewer selection for submission */}
              <div className="border-t border-gray-200 pt-4 mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Approver for Submission
                </label>
                <select
                  value={submitReviewerId}
                  onChange={e => setSubmitReviewerId(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Select approver --</option>
                  {approvers.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.email})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center mt-8 pt-4 border-t border-gray-100">
            <div>
              {currentStep > 1 && (
                <Button variant="ghost" onClick={handleBack} className="flex items-center gap-1">
                  <ChevronLeft size={16} />
                  Back
                </Button>
              )}
            </div>
            <div className="flex items-center gap-3">
              {saveMessage && <span className="text-sm text-green-600">{saveMessage}</span>}
              {currentStep === 4 && (
                <Button variant="secondary" onClick={saveBasicInfo} className="flex items-center gap-1">
                  <Save size={14} />
                  Save Draft
                </Button>
              )}
              {currentStep < 4 ? (
                <Button onClick={handleNext} className="flex items-center gap-1">
                  Next
                  <ChevronRight size={16} />
                </Button>
              ) : (
                <Button onClick={handleSubmit} className="flex items-center gap-2">
                  <Send size={14} />
                  Submit for Approval
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ReadOnlyField({ label, value }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm text-gray-900 font-medium mt-0.5">{value || '—'}</p>
    </div>
  )
}
