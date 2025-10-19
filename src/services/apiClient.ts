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
    // Handle unauthorized access (401)
    if (error.response?.status === 401) {
      // Clear auth data and redirect to login
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    // Handle password reset required (423)
    if (error.response?.status === 423) {
      // Check if user has already reset their password
      const userStr = localStorage.getItem('user');
      let requirePasswordReset = true;
      
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          requirePasswordReset = user.requirePasswordReset !== false;
        } catch {
          // If parsing fails, assume password reset is required
          requirePasswordReset = true;
        }
      }
      
      // If password was already reset, treat 423 as session expired (like 401)
      if (!requirePasswordReset) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
      } else {
        // Password not yet reset, redirect to password reset page
        window.location.href = '/reset-password';
      }
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;
