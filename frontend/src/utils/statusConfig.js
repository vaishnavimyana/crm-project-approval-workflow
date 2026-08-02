// utils/statusConfig.js
// Centralized status display config.
// Pulled this out because I was copy-pasting colors everywhere.

export const STATUS_CONFIG = {
  draft: {
    label: 'Draft',
    className: 'bg-gray-100 text-gray-700 border border-gray-200',
    dot: 'bg-gray-400',
  },
  pending_approval: {
    label: 'Pending Approval',
    className: 'bg-amber-100 text-amber-700 border border-amber-200',
    dot: 'bg-amber-400',
  },
  approved: {
    label: 'Approved',
    className: 'bg-green-100 text-green-700 border border-green-200',
    dot: 'bg-green-400',
  },
  rejected: {
    label: 'Rejected',
    className: 'bg-red-100 text-red-700 border border-red-200',
    dot: 'bg-red-400',
  },
}

export const AUDIT_ACTION_CONFIG = {
  PROJECT_CREATED:         { icon: '📋', label: 'Project Created' },
  PROJECT_UPDATED:         { icon: '✏️',  label: 'Project Updated' },
  CLIENT_SELECTED:         { icon: '🏢', label: 'Client Selected' },
  CONTRACT_UPLOADED:       { icon: '📎', label: 'Contract Uploaded' },
  CONTRACT_DELETED:        { icon: '🗑️', label: 'Contract Deleted' },
  JOB_CATEGORY_ADDED:      { icon: '➕', label: 'Job Category Added' },
  JOB_CATEGORY_REMOVED:    { icon: '➖', label: 'Job Category Removed' },
  SUBMITTED_FOR_APPROVAL:  { icon: '📤', label: 'Submitted for Approval' },
  APPROVED:                { icon: '✅', label: 'Approved' },
  REJECTED:                { icon: '❌', label: 'Rejected' },
  RESUBMITTED:             { icon: '🔄', label: 'Resubmitted' },
  VERSION_CREATED:         { icon: '📌', label: 'New Version Created' },
  VERSION_ACTIVATED:       { icon: '🚀', label: 'Version Activated' },
}

export const BUSINESS_UNITS = [
  'Technology',
  'Finance',
  'Operations',
  'Marketing',
  'Human Resources',
  'Legal',
  'Sales',
]

export const DOCUMENT_TYPES = [
  'Master Service Agreement',
  'Non-Disclosure Agreement',
  'Statement of Work',
  'Purchase Order',
  'Amendment',
  'Service Level Agreement',
]