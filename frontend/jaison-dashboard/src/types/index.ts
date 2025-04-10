// API Types
export enum DocumentType {
  RECEIPT = "receipt",
  INVOICE = "invoice",
  ID_CARD = "id_card",
  BUSINESS_CARD = "business_card",
  TICKET = "ticket",
  COUPON = "coupon",
  GENERIC = "generic",
}

export enum ProcessingStatus {
  PENDING = "pending",
  PROCESSING = "processing",
  COMPLETED = "completed",
  FAILED = "failed",
}

export interface UploadResponse {
  file_id: string;
  filename: string;
  content_type: string;
  size: number;
  upload_time: string;
}

export interface ProcessingRequest {
  file_id: string;
  document_type: DocumentType;
  extraction_prompt: string;
  model?: string;
  output_schema?: Record<string, any>;
}

export interface ProcessingResponse {
  request_id: string;
  status: ProcessingStatus;
  created_at: string;
  updated_at?: string;
  completed_at?: string;
  result?: Record<string, any>;
  error?: string;
  model_used?: string;
  processing_time?: number;
  credits_used?: number;
}

export interface APIKeyResponse {
  key_id?: string;
  id?: string;  // Backend might return id instead of key_id
  key?: string;
  name: string;
  created_at: string;
  expires_at?: string;
  is_active: boolean;
  last_used?: string;
}

export interface APIKeyRequest {
  name: string;
  expires_in_days?: number | null;
}

export interface ErrorResponse {
  status_code: number;
  message: string;
  details?: Record<string, any>;
}

// Auth Types
export interface User {
  id: string;
  email: string;
  name?: string;
  created_at: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  token?: string;
  expiresIn?: number;
}

export interface LoginRequest {
  email: string;
  password: string;
  remember_me?: boolean;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirmRequest {
  token: string;
  password: string;
}

export interface UserUpdateRequest {
  name?: string;
  email?: string;
  password?: string;
}

// UI Types
export interface NavItem {
  name: string;
  path: string;
  icon?: React.ComponentType<any>;
}

export interface TabItem {
  name: string;
  key: string;
}

export interface RequestHistoryItem {
  id: string;
  timestamp: string;
  request: ProcessingRequest;
  response?: ProcessingResponse;
}

export interface SavedTemplate {
  id: string;
  name: string;
  document_type: DocumentType;
  prompt: string;
  output_schema?: Record<string, any>;
  created_at: string;
}
