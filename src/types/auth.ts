// Authentication related types

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  code: string;
  message: string;
  timestamp: string;
  path: string;
  data: {
    cashierId: number;
    username: string;
    name: string;
    email: string;
    requirePasswordReset: boolean;
    message: string;
    token: string;
  };
}

export interface ResetPasswordRequest {
  username: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ResetPasswordResponse {
  code: string;
  message: string;
  timestamp: string;
  path: string;
  data: {
    cashierId: number;
    username: string;
    name: string;
    email: string;
    requirePasswordReset: boolean;
    message: string;
    token: string;
  };
}

export interface User {
  cashierId: number;
  username: string;
  name: string;
  email: string;
  requirePasswordReset: boolean;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
