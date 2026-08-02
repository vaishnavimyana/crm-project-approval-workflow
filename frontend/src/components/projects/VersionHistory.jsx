// components/projects/VersionHistory.jsx
// Shows all versions of a project with their status.

import Badge from '../common/Badge'
import { formatDate } from '../../utils/dateHelpers'
import { CheckCircle } from 'lucide-react'

export default function VersionHistory({ versions = [], onSelectVersion }) {
  if (versions.length === 0) {
    return (
      <p className="text-sm text-gray-400 text-center py-4">
        No version history yet.
      </p>
    )
  }

  // Show newest first
  const sorted = [...versions].sort(
    (a, b) => b.version_number - a.version_number
  )

  return (
    <div className="space-y-3">
      {sorted.map(version => (
        <div
          key={version.id}
          className={`border rounded-lg p-4 transition-colors
            ${version.is_active
              ? 'border-green-300 bg-green-50'
              : 'border-gray-200 bg-white'
            }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900">
                v{version.version_number}
              </span>
              {version.is_active && (
                <span className="flex items-center gap-1 text-xs 
                                 font-medium text-green-700 
                                 bg-green-100 px-2 py-0.5 rounded-full">
                  <CheckCircle size={10} />
                  Active
                </span>
              )}
              <Badge status={version.status} />
            </div>

            <button
              onClick={() => onSelectVersion && onSelectVersion(version)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              View Details
            </button>
          </div>

          <div className="mt-2 text-sm text-gray-600">
            <p className="font-medium">{version.name}</p>
            <p className="text-xs text-gray-500 mt-1">
              {formatDate(version.start_date)} → {formatDate(version.end_date)}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Created {formatDate(version.created_at)}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}