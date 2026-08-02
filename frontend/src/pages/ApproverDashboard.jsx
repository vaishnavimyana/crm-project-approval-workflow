// pages/ApproverDashboard.jsx
// What the approver sees after login.
// Shows all projects pending their review.

import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ClipboardCheck, CheckCircle } from 'lucide-react'
import Navbar from '../components/common/Navbar'
import LoadingSpinner from '../components/common/LoadingSpinner'
import { approvalService } from '../services/approval.service'
import { formatDate } from '../utils/dateHelpers'

export default function ApproverDashboard() {
  const navigate = useNavigate()

  const { data: pending = [], isLoading } = useQuery({
    queryKey: ['approvals', 'pending'],
    queryFn: approvalService.getPending,
    // Refresh every 30 seconds — approver needs reasonably fresh data
    refetchInterval: 30000,
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Pending Approvals
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Projects waiting for your review and decision
          </p>
        </div>

        {/* Stats card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg 
                              flex items-center justify-center">
                <ClipboardCheck size={20} className="text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {pending.length}
                </p>
                <p className="text-sm text-gray-500">Awaiting Review</p>
              </div>
            </div>
          </div>
        </div>

        {/* Pending Projects */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
            <h2 className="text-sm font-semibold text-gray-700">
              Projects Pending Your Approval
            </h2>
          </div>

          {isLoading ? (
            <LoadingSpinner message="Loading pending approvals..." />
          ) : pending.length === 0 ? (
            <div className="text-center py-16">
              <CheckCircle size={40} className="mx-auto text-green-300 mb-3" />
              <p className="text-gray-500 font-medium">All caught up!</p>
              <p className="text-gray-400 text-sm mt-1">
                No projects pending your review right now
              </p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Project ID', 'Project Name', 'Client',
                    'Submitted By', 'Version', 'Submitted On', 'Action'
                  ].map(h => (
                    <th
                      key={h}
                      className="text-left text-xs font-semibold 
                                 text-gray-500 uppercase tracking-wide 
                                 px-4 py-3"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pending.map(item => (
                  <tr
                    key={item.version_id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <span className="text-sm font-mono text-gray-600">
                        {item.display_id}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {item.project_name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {item.business_unit}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-600">
                        {item.client_name}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-600">
                        {item.submitted_by}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-500">
                        v{item.version_number}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-500">
                        {formatDate(item.submitted_at)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() =>
                          navigate(`/projects/${item.project_id}`)
                        }
                        className="text-sm bg-blue-600 text-white 
                                   px-3 py-1.5 rounded-md 
                                   hover:bg-blue-700 font-medium
                                   transition-colors"
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}