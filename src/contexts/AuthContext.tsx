import React, { createContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import authService from '../services/authService';
import type { User, AuthState } from '../types/auth';

interface AuthContextType extends AuthState {
  login: (username: string, password: string) => Promise<void>;
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

  // Initialize auth state from localStorage on mount
  useEffect(() => {
    const token = authService.getToken();
    const user = authService.getCurrentUser();
    
    setAuthState({
      user,
      token,
      isAuthenticated: !!token,
      isLoading: false,
    });
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const response = await authService.login({ username, password });
      const userData = response.data;
      
      setAuthState({
        user: {
          cashierId: userData.cashierId,
          username: userData.username,
          name: userData.name,
          email: userData.email,
          requirePasswordReset: userData.requirePasswordReset,
        },
        token: userData.token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      setAuthState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });
      throw error;
    }
  };

  const logout = () => {
    authService.logout();
    setAuthState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });
  };

  const resetPassword = async (currentPassword: string, newPassword: string, confirmPassword: string) => {
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
  };

  const updateUser = (user: User) => {
    setAuthState(prev => ({
      ...prev,
      user,
    }));
    localStorage.setItem('user', JSON.stringify(user));
  };

  return (
    <AuthContext.Provider value={{ ...authState, login, logout, resetPassword, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};
