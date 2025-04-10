import axios, { AxiosRequestConfig } from 'axios';
import {
  UploadResponse,
  ProcessingRequest,
  ProcessingResponse
} from '../types';

// Create axios instance for OCR API
const ocrApi = axios.create({
  baseURL: process.env.REACT_APP_OCR_API_URL || 'http://localhost:8420',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to add API key
ocrApi.interceptors.request.use((config) => {
  const apiKey = localStorage.getItem('apiKey');
  if (apiKey) {
    config.headers['X-API-Key'] = apiKey;
  }
  return config;
});

// Health check for OCR API
export const checkOcrHealth = async () => {
  const response = await ocrApi.get('/api/v1/health');
  return response.data;
};

// Upload image
export const uploadImage = async (file: File): Promise<UploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);

  const config: AxiosRequestConfig = {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  };

  const response = await ocrApi.post('/api/v1/upload', formData, config);
  return response.data;
};

// Process document
export const processDocument = async (request: ProcessingRequest): Promise<ProcessingResponse> => {
  const response = await ocrApi.post('/api/v1/process', request);
  return response.data;
};

// Get processing status
export const getProcessingStatus = async (requestId: string): Promise<ProcessingResponse> => {
  const response = await ocrApi.get(`/api/v1/status/${requestId}`);
  return response.data;
};
