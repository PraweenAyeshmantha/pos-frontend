import apiClient from './apiClient';
import type { LoginRequest, LoginResponse, ResetPasswordRequest, ResetPasswordResponse } from '../types/auth';

// Authentication service for login and password management
class AuthService {
  /**
   * Login user with username and password
   * @param credentials - Username and password
   * @returns Promise with login response containing user data and JWT token
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>('/auth/login', credentials);
    
    // Store token in localStorage if login successful
    if (response.data.data.token) {
      localStorage.setItem('authToken', response.data.data.token);
      localStorage.setItem('user', JSON.stringify({
        cashierId: response.data.data.cashierId,
        username: response.data.data.username,
        name: response.data.data.name,
        email: response.data.data.email,
        requirePasswordReset: response.data.data.requirePasswordReset,
      }));
    }
    
    return response.data;
  }

  /**
   * Reset password for first-time login or forced password change
   * @param resetData - Current password, new password, and confirmation
   * @returns Promise with reset response containing new JWT token
   */
  async resetPassword(resetData: ResetPasswordRequest): Promise<ResetPasswordResponse> {
    const response = await apiClient.post<ResetPasswordResponse>('/auth/reset-password', resetData);
    
    // Update token in localStorage after successful password reset
    if (response.data.data.token) {
      localStorage.setItem('authToken', response.data.data.token);
      localStorage.setItem('user', JSON.stringify({
        cashierId: response.data.data.cashierId,
        username: response.data.data.username,
        name: response.data.data.name,
        email: response.data.data.email,
        requirePasswordReset: response.data.data.requirePasswordReset,
      }));
    }
    
    return response.data;
  }

  /**
   * Logout user by clearing stored token and user data
   */
  logout(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  }

  /**
   * Get current user from localStorage
   * @returns User object or null if not authenticated
   */
  getCurrentUser() {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
    return null;
  }

  /**
   * Get current auth token from localStorage
   * @returns JWT token or null if not authenticated
   */
  getToken(): string | null {
    return localStorage.getItem('authToken');
  }

  /**
   * Check if user is authenticated
   * @returns true if user has valid token, false otherwise
   */
  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}

export default new AuthService();
