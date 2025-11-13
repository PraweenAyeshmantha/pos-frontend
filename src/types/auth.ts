// Authentication related types

export interface LoginRequest {
  username: string;
  password: string;
}

export interface UserCategory {
  id: number;
  categoryCode: string;
  categoryName: string;
  description?: string;
}

export interface UserAccess {
  screenCode: string;
  screenName: string;
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  category?: string;
  section?: string;
  routePath?: string;
  navigationItem?: boolean;
  sortOrder?: number;
  description?: string;
}

export interface LoginResponse {
  code: string;
  message: string;
  timestamp: string;
  path: string;
  data: {
    cashierId?: number | null;
    userId?: number | null;
    username: string;
    name: string;
    email: string;
    requirePasswordReset: boolean;
    message: string;
    token: string;
    userCategories?: UserCategory[];
    userAccess?: UserAccess[];
    defaultOutlet?: OutletSummary;
    assignedOutlets?: OutletSummary[];
  };
}

export interface OutletSummary {
  id: number;
  name: string;
  code: string;
  recordStatus: string;
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
  cashierId?: number | null;
  userId?: number | null;
  username: string;
  name: string;
  email: string;
  requirePasswordReset: boolean;
  categories?: UserCategory[];
  access?: UserAccess[];
  defaultOutlet?: OutletSummary;
  assignedOutlets?: OutletSummary[];
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
