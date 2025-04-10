import axios from 'axios';
import * as authService from '../auth';

// Mock axios
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    interceptors: {
      request: {
        use: jest.fn(),
      },
    },
  })),
}));

describe('Auth Service', () => {
  let mockAxios: any;
  
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    
    // Get the mocked axios instance
    mockAxios = (axios.create as jest.Mock).mock.results[0].value;
  });
  
  describe('login', () => {
    test('should call API and store token on successful login', async () => {
      const mockUser = { id: '1', name: 'Test User', email: 'test@example.com', created_at: new Date().toISOString() };
      const mockResponse = {
        data: {
          access_token: 'mock-token',
          user: mockUser,
          expires_in: 3600,
        },
      };
      
      mockAxios.post.mockResolvedValue(mockResponse);
      
      const result = await authService.login('test@example.com', 'password123');
      
      expect(mockAxios.post).toHaveBeenCalledWith(expect.stringContaining('/auth/login'), {
        email: 'test@example.com',
        password: 'password123',
      });
      
      expect(localStorage.getItem('token')).toBe('mock-token');
      expect(result).toEqual(mockUser);
    });
    
    test('should throw error on login failure', async () => {
      mockAxios.post.mockRejectedValue(new Error('Invalid email or password'));
      
      await expect(authService.login('test@example.com', 'wrongpassword')).rejects.toThrow('Invalid email or password');
      
      expect(localStorage.getItem('token')).toBeNull();
    });
  });
  
  describe('register', () => {
    test('should call API with registration data', async () => {
      const mockUser = { id: '1', name: 'Test User', email: 'test@example.com', created_at: new Date().toISOString() };
      mockAxios.post.mockResolvedValue({ data: mockUser });
      
      const result = await authService.register('test@example.com', 'password123', 'Test User');
      
      expect(mockAxios.post).toHaveBeenCalledWith(expect.stringContaining('/auth/register'), {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      });
      
      expect(result).toEqual(mockUser);
    });
  });
  
  describe('checkAuth', () => {
    test('should return null if no token', async () => {
      const result = await authService.checkAuth();
      
      expect(result).toBeNull();
      expect(mockAxios.get).not.toHaveBeenCalled();
    });
    
    test('should call API and return user if token exists', async () => {
      localStorage.setItem('token', 'mock-token');
      
      const mockUser = { id: '1', name: 'Test User', email: 'test@example.com', created_at: new Date().toISOString() };
      mockAxios.get.mockResolvedValue({ data: mockUser });
      
      const result = await authService.checkAuth();
      
      expect(mockAxios.get).toHaveBeenCalledWith(expect.stringContaining('/auth/me'));
      expect(result).toEqual(mockUser);
    });
    
    test('should clear token and return null if API call fails', async () => {
      localStorage.setItem('token', 'invalid-token');
      
      mockAxios.get.mockRejectedValue(new Error('Unauthorized'));
      
      const result = await authService.checkAuth();
      
      expect(mockAxios.get).toHaveBeenCalledWith(expect.stringContaining('/auth/me'));
      expect(result).toBeNull();
      expect(localStorage.getItem('token')).toBeNull();
    });
  });
  
  describe('logout', () => {
    test('should remove token from localStorage', () => {
      localStorage.setItem('token', 'mock-token');
      
      authService.logout();
      
      expect(localStorage.getItem('token')).toBeNull();
    });
  });
  
  describe('requestPasswordReset', () => {
    test('should call API with email', async () => {
      mockAxios.post.mockResolvedValue({});
      
      await authService.requestPasswordReset('test@example.com');
      
      expect(mockAxios.post).toHaveBeenCalledWith(expect.stringContaining('/auth/password-reset/request'), {
        email: 'test@example.com',
      });
    });
  });
  
  describe('confirmPasswordReset', () => {
    test('should call API with token and new password', async () => {
      mockAxios.post.mockResolvedValue({});
      
      await authService.confirmPasswordReset('reset-token', 'newpassword123');
      
      expect(mockAxios.post).toHaveBeenCalledWith(expect.stringContaining('/auth/password-reset/confirm'), {
        token: 'reset-token',
        password: 'newpassword123',
      });
    });
  });
  
  describe('updateProfile', () => {
    test('should call API with profile data', async () => {
      const mockUser = { id: '1', name: 'Updated Name', email: 'test@example.com', created_at: new Date().toISOString() };
      mockAxios.put.mockResolvedValue({ data: mockUser });
      
      const result = await authService.updateProfile({ name: 'Updated Name' });
      
      expect(mockAxios.put).toHaveBeenCalledWith(expect.stringContaining('/auth/me'), {
        name: 'Updated Name',
      });
      
      expect(result).toEqual(mockUser);
    });
  });
  
  describe('getToken', () => {
    test('should return token from localStorage', () => {
      localStorage.setItem('token', 'mock-token');
      
      const result = authService.getToken();
      
      expect(result).toBe('mock-token');
    });
    
    test('should return null if no token in localStorage', () => {
      const result = authService.getToken();
      
      expect(result).toBeNull();
    });
  });
  
  describe('isAuthenticated', () => {
    test('should return true if token exists', () => {
      localStorage.setItem('token', 'mock-token');
      
      const result = authService.isAuthenticated();
      
      expect(result).toBe(true);
    });
    
    test('should return false if no token exists', () => {
      const result = authService.isAuthenticated();
      
      expect(result).toBe(false);
    });
  });
});
