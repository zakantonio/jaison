import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { AuthState, UserUpdateRequest } from '../types';
import * as authService from '../services/auth';

// Create auth context
const AuthContext = createContext<{
  authState: AuthState;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => void;
  requestPasswordReset: (email: string) => Promise<void>;
  confirmPasswordReset: (token: string, password: string) => Promise<void>;
  updateProfile: (data: UserUpdateRequest) => Promise<void>;
}>({
  authState: {
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  },
  login: async () => {},
  register: async () => {},
  logout: () => {},
  requestPasswordReset: async () => {},
  confirmPasswordReset: async () => {},
  updateProfile: async () => {},
});

// Auth provider component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  // Check if user is already logged in on mount
  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        const user = await authService.checkAuth();
        setAuthState({
          user,
          isAuthenticated: !!user,
          isLoading: false,
          error: null,
          token: authService.getToken() || undefined,
        });
      } catch (error) {
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: 'Failed to check authentication',
        });
      }
    };

    checkAuthentication();
  }, []);

  // Login function
  const login = async (email: string, password: string, rememberMe: boolean = false) => {
    setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const user = await authService.login(email, password, rememberMe);
      setAuthState({
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        token: authService.getToken() || undefined,
      });
    } catch (error) {
      setAuthState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Login failed',
      }));
      throw error;
    }
  };

  // Register function
  const register = async (email: string, password: string, name?: string) => {
    setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      await authService.register(email, password, name);
      // After registration, log the user in
      await login(email, password);
    } catch (error) {
      setAuthState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Registration failed',
      }));
      throw error;
    }
  };

  // Logout function
  const logout = () => {
    authService.logout();
    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  };

  // Request password reset function
  const requestPasswordReset = async (email: string) => {
    setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      await authService.requestPasswordReset(email);
      setAuthState((prev) => ({ ...prev, isLoading: false }));
    } catch (error) {
      setAuthState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Password reset request failed',
      }));
      throw error;
    }
  };

  // Confirm password reset function
  const confirmPasswordReset = async (token: string, password: string) => {
    setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      await authService.confirmPasswordReset(token, password);
      setAuthState((prev) => ({ ...prev, isLoading: false }));
    } catch (error) {
      setAuthState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Password reset failed',
      }));
      throw error;
    }
  };

  // Update profile function
  const updateProfile = async (data: UserUpdateRequest) => {
    setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const updatedUser = await authService.updateProfile(data);
      setAuthState((prev) => ({
        ...prev,
        user: updatedUser,
        isLoading: false,
      }));
    } catch (error) {
      setAuthState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Profile update failed',
      }));
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        authState,
        login,
        register,
        logout,
        requestPasswordReset,
        confirmPasswordReset,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => useContext(AuthContext);

export default useAuth;
