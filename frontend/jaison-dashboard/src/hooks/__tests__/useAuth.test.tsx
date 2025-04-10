import React from 'react';
import { renderHook, act } from '@testing-library/react-hooks';
import { AuthProvider, useAuth } from '../useAuth';
import * as authService from '../../services/auth';

// Mock the auth service
jest.mock('../../services/auth', () => ({
  login: jest.fn(),
  register: jest.fn(),
  logout: jest.fn(),
  checkAuth: jest.fn(),
  requestPasswordReset: jest.fn(),
  confirmPasswordReset: jest.fn(),
  updateProfile: jest.fn(),
  getToken: jest.fn(),
}));

describe('useAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (authService.checkAuth as jest.Mock).mockResolvedValue(null);
    (authService.getToken as jest.Mock).mockReturnValue(null);
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  );

  test('provides authentication state', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useAuth(), { wrapper });
    
    // Initial state should be loading
    expect(result.current.authState.isLoading).toBe(true);
    expect(result.current.authState.isAuthenticated).toBe(false);
    expect(result.current.authState.user).toBe(null);
    
    await waitForNextUpdate();
    
    // After checking auth, should not be loading anymore
    expect(result.current.authState.isLoading).toBe(false);
  });

  test('login updates auth state', async () => {
    const mockUser = { id: '1', name: 'Test User', email: 'test@example.com', created_at: new Date().toISOString() };
    (authService.login as jest.Mock).mockResolvedValue(mockUser);
    (authService.getToken as jest.Mock).mockReturnValue('mock-token');
    
    const { result, waitForNextUpdate } = renderHook(() => useAuth(), { wrapper });
    
    await waitForNextUpdate();
    
    await act(async () => {
      await result.current.login('test@example.com', 'password123');
    });
    
    expect(result.current.authState.isAuthenticated).toBe(true);
    expect(result.current.authState.user).toEqual(mockUser);
    expect(result.current.authState.token).toBe('mock-token');
  });

  test('register calls auth service', async () => {
    const mockUser = { id: '1', name: 'Test User', email: 'test@example.com', created_at: new Date().toISOString() };
    (authService.register as jest.Mock).mockResolvedValue(mockUser);
    (authService.login as jest.Mock).mockResolvedValue(mockUser);
    
    const { result, waitForNextUpdate } = renderHook(() => useAuth(), { wrapper });
    
    await waitForNextUpdate();
    
    await act(async () => {
      await result.current.register('test@example.com', 'password123', 'Test User');
    });
    
    expect(authService.register).toHaveBeenCalledWith('test@example.com', 'password123', 'Test User');
    expect(authService.login).toHaveBeenCalledWith('test@example.com', 'password123');
  });

  test('logout clears auth state', async () => {
    const mockUser = { id: '1', name: 'Test User', email: 'test@example.com', created_at: new Date().toISOString() };
    (authService.checkAuth as jest.Mock).mockResolvedValue(mockUser);
    
    const { result, waitForNextUpdate } = renderHook(() => useAuth(), { wrapper });
    
    await waitForNextUpdate();
    
    // Should be authenticated after checkAuth
    expect(result.current.authState.isAuthenticated).toBe(true);
    expect(result.current.authState.user).toEqual(mockUser);
    
    act(() => {
      result.current.logout();
    });
    
    expect(authService.logout).toHaveBeenCalled();
    expect(result.current.authState.isAuthenticated).toBe(false);
    expect(result.current.authState.user).toBe(null);
  });

  test('requestPasswordReset calls auth service', async () => {
    (authService.requestPasswordReset as jest.Mock).mockResolvedValue(undefined);
    
    const { result, waitForNextUpdate } = renderHook(() => useAuth(), { wrapper });
    
    await waitForNextUpdate();
    
    await act(async () => {
      await result.current.requestPasswordReset('test@example.com');
    });
    
    expect(authService.requestPasswordReset).toHaveBeenCalledWith('test@example.com');
  });

  test('confirmPasswordReset calls auth service', async () => {
    (authService.confirmPasswordReset as jest.Mock).mockResolvedValue(undefined);
    
    const { result, waitForNextUpdate } = renderHook(() => useAuth(), { wrapper });
    
    await waitForNextUpdate();
    
    await act(async () => {
      await result.current.confirmPasswordReset('token123', 'newpassword123');
    });
    
    expect(authService.confirmPasswordReset).toHaveBeenCalledWith('token123', 'newpassword123');
  });

  test('updateProfile calls auth service and updates user', async () => {
    const mockUser = { id: '1', name: 'Test User', email: 'test@example.com', created_at: new Date().toISOString() };
    const updatedUser = { ...mockUser, name: 'Updated Name' };
    (authService.checkAuth as jest.Mock).mockResolvedValue(mockUser);
    (authService.updateProfile as jest.Mock).mockResolvedValue(updatedUser);
    
    const { result, waitForNextUpdate } = renderHook(() => useAuth(), { wrapper });
    
    await waitForNextUpdate();
    
    await act(async () => {
      await result.current.updateProfile({ name: 'Updated Name' });
    });
    
    expect(authService.updateProfile).toHaveBeenCalledWith({ name: 'Updated Name' });
    expect(result.current.authState.user).toEqual(updatedUser);
  });
});
