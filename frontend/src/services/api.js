import axios from 'axios';

// Vite's dev server and the production Nginx proxy use relative API paths.
// Render provides the backend host without a scheme, so normalize it for browsers.
const configuredApiUrl = import.meta.env.VITE_API_URL || '';
const API_BASE_URL = configuredApiUrl && !/^https?:\/\//i.test(configuredApiUrl)
  ? `https://${configuredApiUrl}`
  : configuredApiUrl;

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor to attach JWT Authorization Bearer token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('smart_citizen_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle unauthorized/forbidden responses gracefully
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If token is invalid or expired, clear it
      const currentToken = localStorage.getItem('smart_citizen_token');
      if (currentToken) {
        localStorage.removeItem('smart_citizen_token');
        localStorage.removeItem('smart_citizen_user');
      }
    }
    return Promise.reject(error);
  }
);

export const AuthService = {
  // Citizen Registration
  register: async (registrationData) => {
    const response = await apiClient.post('/api/auth/register', registrationData);
    if (response.data && response.data.token) {
      localStorage.setItem('smart_citizen_token', response.data.token);
      localStorage.setItem('smart_citizen_user', JSON.stringify(response.data));
    }
    return response.data;
  },

  // Citizen & Admin Login
  login: async (credentials) => {
    const response = await apiClient.post('/api/auth/login', credentials);
    if (response.data && response.data.token) {
      localStorage.setItem('smart_citizen_token', response.data.token);
      localStorage.setItem('smart_citizen_user', JSON.stringify(response.data));
    }
    return response.data;
  },

  // Protected administrator provisioning
  provisionAdmin: async (adminData, setupKey) => {
    const headers = {};
    if (setupKey) {
      headers['X-Admin-Setup-Key'] = setupKey;
    }
    const registration = { ...adminData };
    delete registration.setupKey;
    const response = await apiClient.post('/api/auth/admin/register', registration, { headers });
    if (response.data && response.data.token) {
      localStorage.setItem('smart_citizen_token', response.data.token);
      localStorage.setItem('smart_citizen_user', JSON.stringify(response.data));
    }
    return response.data;
  },

  // Protected municipal officer provisioning
  provisionOfficer: async (officerData, setupKey) => {
    const headers = {};
    if (setupKey) {
      headers['X-Admin-Setup-Key'] = setupKey;
    }
    const registration = { ...officerData };
    delete registration.setupKey;
    const response = await apiClient.post('/api/auth/officer/register', registration, { headers });
    return response.data;
  },

  // Get current user profile
  getMe: async () => {
    const response = await apiClient.get('/api/auth/me');
    const storedUser = AuthService.getCurrentUser() || {};
    localStorage.setItem(
      'smart_citizen_user',
      JSON.stringify({ ...storedUser, ...response.data })
    );
    return response.data;
  },

  // Logout
  logout: () => {
    localStorage.removeItem('smart_citizen_token');
    localStorage.removeItem('smart_citizen_user');
  },

  // Get stored session
  getCurrentUser: () => {
    try {
      const userStr = localStorage.getItem('smart_citizen_user');
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  },

  getToken: () => {
    return localStorage.getItem('smart_citizen_token');
  },
};

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

  // Get complaints submitted by the currently logged-in citizen
  getMy: async () => {
    const response = await apiClient.get('/api/complaints/my');
    return response.data;
  },

  // Get single complaint by ID or identifier string
  getById: async (id) => {
    const response = await apiClient.get(`/api/complaints/${encodeURIComponent(id)}`);
    return response.data;
  },

  // Securely track a complaint by reference ID and verification (email or phone)
  track: async (complaintId, verification) => {
    const response = await apiClient.post('/api/complaints/track', {
      complaintId,
      verification,
    });
    return response.data;
  },

  // Submit a new complaint
  create: async (complaintData) => {
    const response = await apiClient.post('/api/complaints', complaintData);
    return response.data;
  },

  // Update complaint status & admin remark (ADMIN ONLY)
  updateStatus: async (id, statusData) => {
    const response = await apiClient.put(`/api/complaints/${encodeURIComponent(id)}/status`, statusData);
    return response.data;
  },

  // Delete complaint by ID (ADMIN ONLY)
  delete: async (id) => {
    const response = await apiClient.delete(`/api/complaints/${encodeURIComponent(id)}`);
    return response.data;
  },

  // Get aggregate statistics
  getStats: async () => {
    const response = await apiClient.get('/api/complaints/stats');
    return response.data;
  },

  // Check backend service health
  checkHealth: async () => {
    try {
      const response = await apiClient.get('/actuator/health', { timeout: 3000 });
      return response.data?.status === 'UP';
    } catch {
      return false;
    }
  },
};

export const NotificationService = {
  // Get all officer notifications and unread count
  getAll: async () => {
    const response = await apiClient.get('/api/notifications');
    return response.data;
  },

  // Mark single notification as read
  markAsRead: async (id) => {
    const response = await apiClient.put(`/api/notifications/${id}/read`);
    return response.data;
  },

  // Mark all notifications as read
  markAllAsRead: async () => {
    const response = await apiClient.put('/api/notifications/read-all');
    return response.data;
  },
};

export default ComplaintService;
