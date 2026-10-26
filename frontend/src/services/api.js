import axios from 'axios';

// Default base URL uses Vite proxy (/api) or environment variable if defined
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

export const ComplaintService = {
  // Get all complaints with optional filters: { category, status, search }
  getAll: async (filters = {}) => {
    const params = {};
    if (filters.category) params.category = filters.category;
    if (filters.status) params.status = filters.status;
    if (filters.search) params.search = filters.search;
    const response = await apiClient.get('/api/complaints', { params });
    return response.data;
  },

  // Get single complaint by ID or identifier string
  getById: async (id) => {
    const response = await apiClient.get(`/api/complaints/${encodeURIComponent(id)}`);
    return response.data;
  },

  // Submit a new complaint
  create: async (complaintData) => {
    const response = await apiClient.post('/api/complaints', complaintData);
    return response.data;
  },

  // Update complaint status & admin remark
  updateStatus: async (id, statusData) => {
    const response = await apiClient.put(`/api/complaints/${encodeURIComponent(id)}/status`, statusData);
    return response.data;
  },

  // Delete complaint by ID
  delete: async (id) => {
    const response = await apiClient.delete(`/api/complaints/${encodeURIComponent(id)}`);
    return response.data;
  },

  // Get dashboard aggregate statistics
  getStats: async () => {
    const response = await apiClient.get('/api/complaints/stats');
    return response.data;
  },

  // Actuator health check
  getHealth: async () => {
    try {
      const response = await apiClient.get('/actuator/health');
      return response.data;
    } catch {
      return { status: 'DOWN' };
    }
  },
};

export default ComplaintService;
