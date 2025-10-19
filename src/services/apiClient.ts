import axios, { type AxiosInstance } from 'axios';

// Create axios instance with default config
const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/pos-codex/api',
  headers: {
    'Content-Type': 'application/json',
    'X-Tenant-ID': import.meta.env.VITE_TENANT_ID || 'PaPos',
  },
});

// Request interceptor for adding auth token if needed
apiClient.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // TODO: Uncomment when login page is implemented
    // if (error.response?.status === 401) {
    //   // Handle unauthorized access
    //   localStorage.removeItem('authToken');
    //   window.location.href = '/login';
    // }
    return Promise.reject(error);
  }
);

export default apiClient;
