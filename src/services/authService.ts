import apiClient from './apiClient';
import type {
  LoginRequest,
  LoginResponse,
  ResetPasswordRequest,
  ResetPasswordResponse,
} from '../types/auth';

// Authentication service for login and password management
class AuthService {
  /**
   * Login user with username and password
   * @param credentials - Username and password
   * @returns Promise with login response containing user data and JWT token
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>('/auth/login', credentials);
    const payload = response.data.data;

    // Store token in sessionStorage if login successful (expires when browser closes)
    if (payload?.token) {
      sessionStorage.setItem('authToken', payload.token);
      sessionStorage.setItem('user', JSON.stringify({
        cashierId: payload.cashierId ?? null,
        userId: payload.userId ?? null,
        username: payload.username,
        name: payload.name,
        email: payload.email,
        requirePasswordReset: payload.requirePasswordReset === true,
        categories: payload.userCategories ?? [],
        access: payload.userAccess ?? [],
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
    
    // Don't update sessionStorage here - user will be logged out after password reset
    // and need to login again with new password
    
    return response.data;
  }

  /**
   * Logout user by clearing stored token and user data
   */
  logout(): void {
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('user');
  }

  /**
   * Get current user from sessionStorage
   * @returns User object or null if not authenticated
   */
  getCurrentUser() {
    const userStr = sessionStorage.getItem('user');
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
   * Get current auth token from sessionStorage
   * @returns JWT token or null if not authenticated
   */
  getToken(): string | null {
    return sessionStorage.getItem('authToken');
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
