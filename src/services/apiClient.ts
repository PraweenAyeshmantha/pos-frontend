import axios, { type AxiosInstance, type AxiosError } from 'axios';
import env from '../config/env';

// Create axios instance with default config
const apiClient: AxiosInstance = axios.create({
  baseURL: env.apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout
});

// Request interceptor for adding auth token and tenant ID
apiClient.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = sessionStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add tenant ID from URL
    // Extract tenant ID from current URL path
    const pathParts = window.location.pathname.split('/');
    const posaiIndex = pathParts.indexOf('posai');
    if (posaiIndex !== -1 && pathParts.length > posaiIndex + 1) {
      const tenantId = pathParts[posaiIndex + 1];
      if (tenantId) {
        config.headers['X-Tenant-ID'] = tenantId;
      }
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
  (error: AxiosError) => {
    // Log errors in development
    if (env.isDevelopment) {
      console.error('API Error:', {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        data: error.response?.data,
      });
    }

    // Handle network errors
    if (!error.response) {
      console.error('Network error: Unable to reach the server');
      return Promise.reject({
        ...error,
        message: 'Network error: Unable to reach the server. Please check your connection.',
      });
    }
    
    // Handle unauthorized access (401)
    if (error.response.status === 401) {
      // Clear auth data and redirect to login with tenant ID preserved
      sessionStorage.removeItem('authToken');
      sessionStorage.removeItem('user');
      
      // Extract tenant ID from current URL
      const pathParts = window.location.pathname.split('/');
      const posaiIndex = pathParts.indexOf('posai');
      if (posaiIndex !== -1 && pathParts.length > posaiIndex + 1) {
        const tenantId = pathParts[posaiIndex + 1];
        window.location.href = `/posai/${tenantId}/login`;
      } else {
        window.location.href = '/';
      }
    }
    
    // Handle password reset required (423)
    if (error.response.status === 423) {
      // Check if user has already reset their password based on user data
      const userStr = sessionStorage.getItem('user');
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
      
      // Extract tenant ID from current URL
      const pathParts = window.location.pathname.split('/');
      const posaiIndex = pathParts.indexOf('posai');
      let tenantId = '';
      if (posaiIndex !== -1 && pathParts.length > posaiIndex + 1) {
        tenantId = pathParts[posaiIndex + 1];
      }
      
      // If password was already reset according to user data, treat as session expired
      if (!requirePasswordReset) {
        sessionStorage.removeItem('authToken');
        sessionStorage.removeItem('user');
        window.location.href = tenantId ? `/posai/${tenantId}/login` : '/';
      } else {
        // Password not yet reset, redirect to password reset page
        window.location.href = tenantId ? `/posai/${tenantId}/reset-password` : '/';
      }
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;
