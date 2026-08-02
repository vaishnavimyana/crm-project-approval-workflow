// components/approvals/RejectModal.jsx
// Modal that appears when approver clicks Reject.
// Comments are mandatory — enforced here and in backend.

import { useState } from 'react'
import Modal from '../common/Modal'
import Button from '../common/Button'

export default function RejectModal({ isOpen, onClose, onConfirm, loading }) {
  const [comments, setComments] = useState('')
  const [error, setError] = useState('')

  function handleConfirm() {
    if (!comments.trim()) {
      setError('Please provide a rejection reason.')
      return
    }
    if (comments.trim().length < 10) {
      setError('Please provide a more detailed reason (min 10 characters).')
      return
    }
    setError('')
    onConfirm(comments.trim())
  }

  function handleClose() {
    setComments('')
    setError('')
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Reject Project">
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          Please provide a clear reason for rejection.
          The CRM user will see this when they view their project.
        </p>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Rejection Reason <span className="text-red-500">*</span>
          </label>
          <textarea
            value={comments}
            onChange={(e) => {
              setComments(e.target.value)
              setError('')
            }}
            rows={4}
            placeholder="e.g. The billing address is incomplete. 
Please also verify the GST number and update the contract validity dates."
            className="w-full border border-gray-300 rounded-lg 
                       px-3 py-2 text-sm resize-none
                       focus:outline-none focus:ring-2 focus:ring-red-500
                       focus:border-transparent"
          />
          {error && (
            <p className="text-red-500 text-xs mt-1">{error}</p>
          )}
          <p className="text-xs text-gray-400 mt-1">
            {comments.length} characters
          </p>
        </div>

        <div className="flex gap-3 justify-end pt-2">
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleConfirm}
            loading={loading}
          >
            Confirm Rejection
          </Button>
        </div>
      </div>
    </Modal>
  )
}