// src/services/project.service.js

import api from './api'

export const projectService = {
  getAll: async (filters = {}) => {
    const params = new URLSearchParams()
    if (filters.status) params.append('status', filters.status)
    if (filters.client_id) params.append('client_id', filters.client_id)
    if (filters.creator_id) params.append('creator_id', filters.creator_id) // FIX 1
    return (await api.get(`/projects?${params.toString()}`)).data
  },
  getById: async (projectId) => (await api.get(`/projects/${projectId}`)).data,

  create: async (data) => (await api.post('/projects', data)).data,
  update: async (projectId, versionId, data) =>
    (await api.put(`/projects/${projectId}/versions/${versionId}`, data)).data,
  submit: async (projectId, versionId, reviewerId) =>
    (await api.post(`/projects/${projectId}/versions/${versionId}/submit`,
      { reviewer_id: reviewerId })).data,
  createNewVersion: async (projectId) =>
    (await api.post(`/projects/${projectId}/new-version`)).data,

  getAuditTrail: async (projectId) =>
    (await api.get(`/audit/projects/${projectId}`)).data,

  // ---- Contracts ----
  uploadContract: async (projectId, versionId, formData) =>
    (await api.post(`/projects/${projectId}/versions/${versionId}/contracts`, formData,
      { headers: { 'Content-Type': 'multipart/form-data' } })).data,
  getContracts: async (projectId, versionId) =>
    (await api.get(`/projects/${projectId}/versions/${versionId}/contracts`)).data,
  deleteContract: async (contractId) =>
    (await api.delete(`/contracts/${contractId}`)).data,

  // FIX 2 - returns a full usable download URL (prepends API base for local /uploads/)
  downloadContract: async (contractId) => {
    const { download_url } = (await api.get(`/contracts/${contractId}/download`)).data
    const base = import.meta.env.VITE_API_BASE_URL
    return download_url.startsWith('/') ? `${base}${download_url}` : download_url
  },

  // ---- Lookups ----
  getRateCards: async () => (await api.get('/rate-cards')).data,
  getApprovers: async () => (await api.get('/users/approvers')).data,
  // FIX 1 - list of CRM creators for the Creator filter
  getCreators: async () => (await api.get('/users/creators')).data
}
