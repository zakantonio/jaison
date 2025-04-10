import axios, { AxiosError } from 'axios';
import {
  APIKeyRequest,
  APIKeyResponse,
  ErrorResponse
} from '../types';

// Create axios instance
const api = axios.create({
  baseURL: process.env.REACT_APP_ADMIN_API_URL || 'http://localhost:8421',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to add JWT token
api.interceptors.request.use((config) => {
  // Get token from localStorage or sessionStorage
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }

  // Also add API key if available (for OCR API)
  const apiKey = localStorage.getItem('apiKey');
  if (apiKey) {
    config.headers['X-API-Key'] = apiKey;
  }

  return config;
});

// Add response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ErrorResponse>) => {
    // Handle API errors
    if (error.response) {
      // The request was made and the server responded with an error status
      console.error('API Error:', error.response.data);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('Network Error:', error.request);
    } else {
      // Something happened in setting up the request
      console.error('Request Error:', error.message);
    }
    return Promise.reject(error);
  }
);

// Health check for admin API
export const checkAdminHealth = async () => {
  const response = await api.get('/api/v1/health');
  return response.data;
};

// API Key Management
export const generateApiKey = async (request: APIKeyRequest): Promise<APIKeyResponse> => {
  const response = await api.post('/api/v1/api-keys', request);
  const data = response.data;

  return data;
};

export const listApiKeys = async (): Promise<APIKeyResponse[]> => {
  const response = await api.get('/api/v1/api-keys');

  // Ensure key_id is set for each item if only id is present
  return response.data.map((item: any) => {
    return item;
  });
};

export const revokeApiKey = async (keyId: string): Promise<void> => {
  await api.delete(`/api/v1/api-keys/${keyId}`);
};

export default api;
