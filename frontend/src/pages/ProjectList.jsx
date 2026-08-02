// src/pages/ProjectList.jsx
// ============================================================================
// Main landing page for CRM users after login.
// Shows all projects (shared view) with status, client AND creator filters.
// FIX 1: Creator filter added.
// ============================================================================
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Plus, FolderOpen } from 'lucide-react'
import Navbar from '../components/common/Navbar'
import Badge from '../components/common/Badge'
import LoadingSpinner from '../components/common/LoadingSpinner'
import Button from '../components/common/Button'
import { projectService } from '../services/project.service'
import { clientService } from '../services/client.service'
import { formatDate } from '../utils/dateHelpers'

export default function ProjectList() {
  const navigate = useNavigate()
  const [filters, setFilters] = useState({ status: '', client_id: '', creator_id: '' })

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects', filters],
    queryFn: () => projectService.getAll(filters),
  })

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: clientService.getAll,
  })

  // FIX 1 - fetch CRM creators for the Creator dropdown
  const { data: creators = [] } = useQuery({
    queryKey: ['creators'],
    queryFn: projectService.getCreators,
  })

  function handleFilterChange(key, value) {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const hasActiveFilters = filters.status || filters.client_id || filters.creator_id

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage and track your project approvals
            </p>
          </div>
          <Button
            onClick={() => navigate('/projects/new')}
            className="flex items-center gap-2"
          >
            <Plus size={16} />
            New Project
          </Button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="flex gap-4 flex-wrap">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="pending_approval">Pending Approval</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Client
              </label>
              <select
                value={filters.client_id}
                onChange={(e) => handleFilterChange('client_id', e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Clients</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.legal_entity_name}
                  </option>
                ))}
              </select>
            </div>

            {/* FIX 1 - Creator filter dropdown */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Creator
              </label>
              <select
                value={filters.creator_id}
                onChange={(e) => handleFilterChange('creator_id', e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Creators</option>
                {creators.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {hasActiveFilters && (
              <div className="flex items-end">
                <button
                  onClick={() => setFilters({ status: '', client_id: '', creator_id: '' })}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Projects Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {isLoading ? (
            <LoadingSpinner message="Loading projects..." />
          ) : projects.length === 0 ? (
            <div className="text-center py-16">
              <FolderOpen size={40} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500 font-medium">No projects found</p>
              <p className="text-gray-400 text-sm mt-1">
                Create your first project to get started
              </p>
              <Button
                onClick={() => navigate('/projects/new')}
                className="mt-4"
                size="sm"
              >
                <Plus size={14} className="mr-1" />
                New Project
              </Button>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Project ID', 'Project Name', 'Client', 'Status',
                    'Version', 'Created By', 'Last Updated', 'Actions'
                  ].map(header => (
                    <th
                      key={header}
                      className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {projects.map(project => (
                  <tr
                    key={project.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <span className="text-sm font-mono text-gray-600">
                        {project.display_id}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-gray-900">
                        {project.name}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-600">
                        {project.client_name}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge status={project.current_status} />
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-500">
                        v{project.current_version_number}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-600">
                        {project.crm_user_name}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-500">
                        {formatDate(project.updated_at)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => navigate(`/projects/${project.id}`)}
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                      >
                        {project.current_status === 'draft' ||
                          project.current_status === 'rejected'
                          ? 'Edit'
                          : 'View'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Summary */}
        {projects.length > 0 && (
          <p className="text-xs text-gray-400 mt-3 text-right">
            Showing {projects.length} project{projects.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>
    </div>
  )
}
