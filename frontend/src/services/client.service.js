// services/client.service.js
import api from './api'

export const clientService = {
  getAll: async () => {
    const response = await api.get('/clients')
    return response.data
  },

  getById: async (clientId) => {
    const response = await api.get(`/clients/${clientId}`)
    return response.data
  }
}