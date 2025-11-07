import React, { createContext, useState, useEffect, useMemo, useCallback } from 'react';
import type { ReactNode } from 'react';
import authService from '../services/authService';
import type { User, AuthState } from '../types/auth';

interface AuthContextType extends AuthState {
  login: (username: string, password: string) => Promise<User>;
  logout: () => void;
  resetPassword: (currentPassword: string, newPassword: string, confirmPassword: string) => Promise<void>;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export { AuthContext };

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // Initialize auth state from sessionStorage on mount
  useEffect(() => {
    // Clean up any old localStorage data (migration from localStorage to sessionStorage)
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    
    const token = authService.getToken();
    const storedUser = authService.getCurrentUser() as User | null;
    const normalizedUser = storedUser
      ? {
          cashierId: storedUser.cashierId ?? null,
          userId: storedUser.userId ?? null,
          username: storedUser.username,
          name: storedUser.name,
          email: storedUser.email,
          requirePasswordReset: storedUser.requirePasswordReset === true,
          categories: Array.isArray(storedUser.categories) ? storedUser.categories : [],
          access: Array.isArray(storedUser.access) ? storedUser.access : [],
        }
      : null;

    setAuthState({
      user: normalizedUser,
      token,
      isAuthenticated: !!token,
      isLoading: false,
    });
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    try {
      const response = await authService.login({ username, password });
      const userData = response.data; // response.data contains the user data from the nested API response
      
      // Create user object with explicit boolean for requirePasswordReset
      const user = {
        cashierId: userData.cashierId ?? null,
        userId: userData.userId ?? null,
        username: userData.username,
        name: userData.name,
        email: userData.email,
        // Explicitly convert to boolean to avoid any truthy/falsy issues
        requirePasswordReset: userData.requirePasswordReset === true,
        categories: userData.userCategories ?? [],
        access: userData.userAccess ?? [],
      };
      
      sessionStorage.setItem('user', JSON.stringify(user));

      setAuthState({
        user,
        token: userData.token,
        isAuthenticated: true,
        isLoading: false,
      });
      
      return user; // Return the user object so caller can check requirePasswordReset
    } catch (error) {
      setAuthState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });
      throw error;
    }
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setAuthState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });
  }, []);

  const resetPassword = useCallback(async (currentPassword: string, newPassword: string, confirmPassword: string) => {
    if (!authState.user) {
      throw new Error('No user logged in');
    }
    
    await authService.resetPassword({
      username: authState.user.username,
      currentPassword,
      newPassword,
      confirmPassword,
    });
    
    // Don't update auth state here - caller will handle logout
    // User needs to login again with new password after reset
  }, [authState.user]);

  const updateUser = useCallback((user: User) => {
    setAuthState(prev => ({
      ...prev,
      user,
    }));
    sessionStorage.setItem('user', JSON.stringify(user));
  }, []);

  const contextValue = useMemo(
    () => ({
      ...authState,
      login,
      logout,
      resetPassword,
      updateUser,
    }),
    [authState, login, logout, resetPassword, updateUser]
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
