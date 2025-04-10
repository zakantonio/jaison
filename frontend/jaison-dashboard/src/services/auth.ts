import axios from 'axios';
import { User, UserUpdateRequest } from '../types';

// API base URL
const API_URL = process.env.REACT_APP_ADMIN_API_URL || 'http://localhost:8421';
const AUTH_ENDPOINT = `${API_URL}/api/v1/auth`;

// Axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Check if user is already logged in
export const checkAuth = async (): Promise<User | null> => {
  const token = getToken();
  if (!token) {
    return null;
  }

  try {
    const response = await api.get(`${AUTH_ENDPOINT}/me`);
    return response.data;
  } catch (error) {
    console.error('Error fetching user:', error);
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    return null;
  }
};

// Login
export const login = async (email: string, password: string, rememberMe: boolean = false): Promise<User> => {
  try {
    const response = await api.post(`${AUTH_ENDPOINT}/login`, { email, password, remember_me: rememberMe });
    const { access_token, user } = response.data;

    // Store token in localStorage or sessionStorage based on rememberMe
    if (rememberMe) {
      localStorage.setItem('token', access_token);
    } else {
      sessionStorage.setItem('token', access_token);
    }

    return user;
  } catch (error) {
    console.error('Login error:', error);
    throw new Error('Invalid email or password');
  }
};

// Register
export const register = async (email: string, password: string, name?: string): Promise<User> => {
  try {
    const response = await api.post(`${AUTH_ENDPOINT}/register`, {
      email,
      password,
      name: name || '',
    });

    return response.data;
  } catch (error) {
    console.error('Registration error:', error);
    throw new Error('Registration failed. Please try again.');
  }
};

// Logout
export const logout = (): void => {
  localStorage.removeItem('token');
  sessionStorage.removeItem('token');
};

// Request password reset
export const requestPasswordReset = async (email: string): Promise<void> => {
  try {
    await api.post(`${AUTH_ENDPOINT}/password-reset/request`, { email });
  } catch (error) {
    console.error('Password reset request error:', error);
    // Don't throw error to prevent email enumeration
  }
};

// Confirm password reset
export const confirmPasswordReset = async (token: string, password: string): Promise<void> => {
  try {
    await api.post(`${AUTH_ENDPOINT}/password-reset/confirm`, { token, password });
  } catch (error) {
    console.error('Password reset confirmation error:', error);
    throw new Error('Password reset failed. Please try again.');
  }
};

// Update user profile
export const updateProfile = async (data: UserUpdateRequest): Promise<User> => {
  try {
    const response = await api.put(`${AUTH_ENDPOINT}/me`, data);
    return response.data;
  } catch (error) {
    console.error('Profile update error:', error);
    throw new Error('Profile update failed. Please try again.');
  }
};

// Get token
export const getToken = (): string | null => {
  // Check localStorage first, then sessionStorage
  return localStorage.getItem('token') || sessionStorage.getItem('token');
};

// Check if authenticated
export const isAuthenticated = (): boolean => {
  return getToken() !== null;
};
