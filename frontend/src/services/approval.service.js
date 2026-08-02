// services/approval.service.js
import api from './api'

export const approvalService = {
  getPending: async () => {
    const response = await api.get('/approvals/pending')
    return response.data
  },

  approve: async (projectId, versionId, comments = '') => {
    const response = await api.post(
      `/approvals/${projectId}/versions/${versionId}/approve`,
      { comments }
    )
    return response.data
  },

  reject: async (projectId, versionId, comments) => {
    const response = await api.post(
      `/approvals/${projectId}/versions/${versionId}/reject`,
      { comments }
    )
    return response.data
  },

  getDecision: async (projectId, versionId) => {
    const response = await api.get(
      `/approvals/${projectId}/versions/${versionId}/decision`
    )
    return response.data
  }
}