// components/common/Badge.jsx
import { STATUS_CONFIG } from '../../utils/statusConfig'

export default function Badge({ status }) {
  const config = STATUS_CONFIG[status] || {
    label: status,
    className: 'bg-gray-100 text-gray-600',
    dot: 'bg-gray-400',
  }

  return (
    <span className={`inline-flex items-center gap-1.5 
                      px-2.5 py-0.5 rounded-full text-xs font-medium 
                      ${config.className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  )
}