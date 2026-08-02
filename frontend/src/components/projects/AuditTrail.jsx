// components/projects/AuditTrail.jsx
// Timeline view of all actions taken on a project.

import { useQuery } from '@tanstack/react-query'
import { projectService } from '../../services/project.service'
import { AUDIT_ACTION_CONFIG } from '../../utils/statusConfig'
import { formatDateTime } from '../../utils/dateHelpers'
import LoadingSpinner from '../common/LoadingSpinner'

export default function AuditTrail({ projectId }) {
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['audit', projectId],
    queryFn: () => projectService.getAuditTrail(projectId),
    enabled: !!projectId,
  })

  if (isLoading) return <LoadingSpinner message="Loading audit trail..." />

  if (logs.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400 text-sm">
        No audit history yet.
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {logs.map((log, index) => {
        const config = AUDIT_ACTION_CONFIG[log.action] || {
          icon: '•',
          label: log.action,
        }

        return (
          <div key={log.id} className="flex gap-4">
            {/* Timeline line */}
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-gray-100 
                              flex items-center justify-center 
                              text-base flex-shrink-0">
                {config.icon}
              </div>
              {index < logs.length - 1 && (
                <div className="w-px h-full bg-gray-200 my-1" />
              )}
            </div>

            {/* Content */}
            <div className="pb-6 flex-1">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {config.label}
                  </p>
                  <p className="text-sm text-gray-600 mt-0.5">
                    {log.description}
                  </p>

                  {/* Show rejection reason prominently */}
                  {log.action === 'REJECTED' && log.new_value && (
                    <div className="mt-2 bg-red-50 border border-red-200 
                                    rounded-md px-3 py-2">
                      <p className="text-xs font-medium text-red-700">
                        Rejection Reason:
                      </p>
                      <p className="text-xs text-red-600 mt-0.5">
                        {log.new_value}
                      </p>
                    </div>
                  )}

                  {/* Show field changes */}
                  {log.action === 'PROJECT_UPDATED' &&
                   log.old_value && log.new_value && (
                    <div className="mt-2 bg-gray-50 rounded-md 
                                    px-3 py-2 text-xs text-gray-500">
                      Fields updated — see project details for changes
                    </div>
                  )}
                </div>

                <div className="text-right flex-shrink-0">
                  <p className="text-xs font-medium text-gray-700">
                    {log.performer_name}
                  </p>
                  <p className="text-xs text-gray-400 capitalize">
                    {log.performer_role}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {formatDateTime(log.timestamp)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}