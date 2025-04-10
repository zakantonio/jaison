import React, { useState, useEffect } from 'react';
import { DocumentType, ProcessingStatus, UploadResponse, ProcessingResponse } from '../types';
// Import real API functions
import { uploadImage, processDocument, getProcessingStatus } from '../services/ocrApi';
import { JsonView } from 'react-json-view-lite';
import 'react-json-view-lite/dist/index.css';
import { checkAdminHealth } from '../services/api';

const ApiTesting: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [uploadResponse, setUploadResponse] = useState<UploadResponse | null>(null);
  const [documentType, setDocumentType] = useState<DocumentType>(DocumentType.RECEIPT);
  const [extractionPrompt, setExtractionPrompt] = useState<string>('Extract all information from this document.');
  const [processingResponse, setProcessingResponse] = useState<ProcessingResponse | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isPolling, setIsPolling] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [apiReady, setApiReady] = useState<boolean>(true); // Assume API is ready by default
  const [isCheckingApi, setIsCheckingApi] = useState<boolean>(false);
  const [showApiSuccess, setShowApiSuccess] = useState<boolean>(false);

  // Function to check API health
  const checkApiHealth = async () => {
    try {
      setIsCheckingApi(true);
      setError(null);
      const data = await checkAdminHealth();
      if (data && data["status"] === 'ok') {
        setApiReady(true);
        setShowApiSuccess(true);
        // Hide success message after 3 seconds
        setTimeout(() => setShowApiSuccess(false), 3000);
      } else {
        setApiReady(false);
        setError('API server is not responding properly. Please try again later.');
      }
    } catch (err) {
      console.error('API health check failed:', err);
      setApiReady(false);
      setError('Cannot connect to the API server. Please check your connection and try again.');
    } finally {
      setIsCheckingApi(false);
    }
  };

  // Check API health on component mount
  useEffect(() => {
    checkApiHealth();
  }, []);

  // Reset state when file changes
  useEffect(() => {
    if (file) {
      setUploadResponse(null);
      setProcessingResponse(null);
      setError(null);

      // Create file preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setFilePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  }, [file]);

  // Poll for status updates when processing
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const pollStatus = async () => {
      if (
        processingResponse &&
        processingResponse.request_id &&
        (processingResponse.status === ProcessingStatus.PENDING ||
          processingResponse.status === ProcessingStatus.PROCESSING)
      ) {
        try {
          // Use real API
          const response = await getProcessingStatus(processingResponse.request_id);
          setProcessingResponse(response);

          if (
            response.status === ProcessingStatus.COMPLETED ||
            response.status === ProcessingStatus.FAILED
          ) {
            setIsPolling(false);
          }
        } catch (err: any) {
          console.error('Error polling status:', err);
          // Handle axios error response
          if (err.response && err.response.data && err.response.data.message) {
            setError(err.response.data.message);
          } else {
            setError('Failed to get processing status');
          }
          setIsPolling(false);
        }
      } else {
        setIsPolling(false);
      }
    };

    if (isPolling) {
      intervalId = setInterval(pollStatus, 2000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isPolling, processingResponse]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file to upload');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      // Use real API
      const response = await uploadImage(file);
      setUploadResponse(response);
    } catch (err: any) {
      console.error('Upload error:', err);
      // Handle axios error response
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError(err instanceof Error ? err.message : 'Failed to upload file');
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleProcess = async () => {
    if (!uploadResponse) {
      setError('Please upload a file first');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Use real API
      const response = await processDocument({
        file_id: uploadResponse.file_id,
        document_type: documentType,
        extraction_prompt: extractionPrompt,
      });
      setProcessingResponse(response);
      setIsPolling(true);
    } catch (err: any) {
      console.error('Processing error:', err);
      // Handle axios error response
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError(err instanceof Error ? err.message : 'Failed to process document');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div>
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">API Testing</h1>
          <p className="dashboard-subtitle">
            Test the OCR API with your own images
          </p>
          {apiReady ? (
            (isCheckingApi || showApiSuccess) && (
              <div className="api-testing-success-message mt-2">
                <div className="flex items-center">
                  <span className="api-testing-success-icon">✓</span>
                  <h3 className="font-medium">
                    {isCheckingApi ? 'Checking API connection...' : 'API connected successfully!'}
                  </h3>
                </div>
              </div>
            )
          ) : (
            <div className="api-testing-error-message mt-2">
              <div className="flex items-center">
                <span className="api-testing-error-icon">⚠️</span>
                <h3 className="font-medium">API Connection Issue</h3>
              </div>
              <p>The API server is not responding. Some features may not work properly.</p>
              <button
                onClick={checkApiHealth}
                className="mt-2 text-sm text-blue-600 hover:text-blue-800 underline"
                disabled={isCheckingApi}
              >
                {isCheckingApi ? 'Checking connection...' : 'Retry connection'}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="api-testing-container">
        {/* Left column - Input */}
        <div className="api-testing-card">
          <div className="api-testing-card-header">
            <h2 className="api-testing-card-title">Upload Image</h2>
            <p className="api-testing-card-description">
              Upload an image to extract information from
            </p>
          </div>

          <div className="api-testing-section">
            <div className="api-testing-form-group">
              <label className="api-testing-form-label">
                Select file (JPG, PNG, PDF)
              </label>
              <div
                className="file-upload"
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    const droppedFile = e.dataTransfer.files[0];
                    if (droppedFile.type.match('image.*') || droppedFile.type === 'application/pdf') {
                      setFile(droppedFile);
                    }
                  }
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
              >
                <div className="file-upload-icon">
                  📄
                </div>
                <div className="file-upload-text">
                  <label htmlFor="file-upload" className="file-upload-button">
                    Choose a file
                    <input
                      id="file-upload"
                      name="file-upload"
                      type="file"
                      className="sr-only"
                      accept="image/jpeg,image/png,application/pdf"
                      onChange={handleFileChange}
                    />
                  </label>
                  <p>or drag and drop</p>
                  <p className="mt-2 text-xs">
                    JPG, PNG, PDF up to 10MB
                  </p>
                </div>
              </div>
            </div>

            {filePreview && (
              <div className="mt-4">
                <label className="api-testing-form-label">
                  Preview
                </label>
                <div className="file-preview">
                  <img
                    src={filePreview}
                    alt="Preview"
                    className="file-preview-image"
                  />
                </div>
              </div>
            )}

            <div className="mt-4">
              <button
                type="button"
                className="api-testing-button api-testing-button-primary"
                onClick={handleUpload}
                disabled={!file || isUploading || !apiReady}
              >
                {isUploading ? 'Uploading...' : 'Upload'}
              </button>
            </div>

            {uploadResponse && (
              <div className="api-testing-success-message">
                <div className="flex items-center">
                  <span className="api-testing-success-icon">✔</span>
                  <h3 className="font-medium">Upload successful</h3>
                </div>
                <div className="mt-2">
                  <p>File ID: <span className="font-mono">{uploadResponse.file_id}</span></p>
                </div>
              </div>
            )}

          </div>

          <div className="api-testing-section">
            <div className="api-testing-section-title">Process Document</div>
            <p className="api-testing-card-description mb-4">
              Extract information from the uploaded image
            </p>

            <div className="api-testing-form-group">
              <label className="api-testing-form-label">
                Document Type
              </label>
              <select
                className="api-testing-form-select"
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value as DocumentType)}
              >
                <option value={DocumentType.RECEIPT}>Receipt</option>
                <option value={DocumentType.INVOICE}>Invoice</option>
                <option value={DocumentType.ID_CARD}>ID Card</option>
                <option value={DocumentType.BUSINESS_CARD}>Business Card</option>
                <option value={DocumentType.TICKET}>Ticket</option>
                <option value={DocumentType.COUPON}>Coupon</option>
                <option value={DocumentType.GENERIC}>Generic</option>
              </select>
            </div>

            <div className="api-testing-form-group">
              <label className="api-testing-form-label">
                Extraction Prompt
              </label>
              <textarea
                rows={4}
                className="api-testing-form-textarea"
                placeholder="Describe what information to extract from the document"
                value={extractionPrompt}
                onChange={(e) => setExtractionPrompt(e.target.value)}
              />
              <p className="mt-2 text-sm text-gray-500">
                Be specific about what information you want to extract
              </p>
            </div>

            <div className="mt-4">
              <button
                type="button"
                className="api-testing-button api-testing-button-primary"
                onClick={handleProcess}
                disabled={!uploadResponse || isProcessing || !apiReady}
              >
                {isProcessing ? 'Processing...' : 'Process Document'}
              </button>
            </div>

            {error && (
              <div className="api-testing-error-message mt-4">
                <div className="flex items-center">
                  <span className="api-testing-error-icon">✖</span>
                  <h3 className="font-medium">Error</h3>
                </div>
                <div className="mt-2">
                  <p>{error}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right column - Output */}
        <div className="api-testing-card">
          <div className="api-testing-card-header">
            <h2 className="api-testing-card-title">Processing Results</h2>
            <p className="api-testing-card-description">
              View the extracted information from your document
            </p>
          </div>

          {processingResponse ? (
            <div>
              <div className="api-testing-status">
                <span className="mr-2 font-medium">Status:</span>
                {processingResponse.status === ProcessingStatus.PENDING && (
                  <span className="api-testing-status-badge api-testing-status-pending">
                    Pending
                  </span>
                )}
                {processingResponse.status === ProcessingStatus.PROCESSING && (
                  <span className="api-testing-status-badge api-testing-status-processing">
                    Processing
                  </span>
                )}
                {processingResponse.status === ProcessingStatus.COMPLETED && (
                  <span className="api-testing-status-badge api-testing-status-completed">
                    Completed
                  </span>
                )}
                {processingResponse.status === ProcessingStatus.FAILED && (
                  <span className="api-testing-status-badge api-testing-status-failed">
                    Failed
                  </span>
                )}
              </div>

              <div className="api-testing-section">
                <div className="api-testing-form-group">
                  <label className="api-testing-form-label">Request ID:</label>
                  <div className="font-mono text-sm bg-gray-50 p-2 rounded">
                    {processingResponse.request_id}
                  </div>
                </div>

                {processingResponse.status === ProcessingStatus.PENDING ||
                processingResponse.status === ProcessingStatus.PROCESSING ? (
                  <div className="api-testing-spinner">
                    <div className="api-testing-spinner-icon"></div>
                    <span className="ml-3 text-gray-500">
                      {processingResponse.status === ProcessingStatus.PENDING
                        ? 'Waiting to process...'
                        : 'Processing document...'}
                    </span>
                  </div>
                ) : processingResponse.status === ProcessingStatus.COMPLETED ? (
                  <div>
                    <div className="api-testing-form-group">
                      <label className="api-testing-form-label">Processing Time:</label>
                      <div className="text-sm">
                        {processingResponse.processing_time
                          ? `${processingResponse.processing_time.toFixed(2)} seconds`
                          : 'Unknown'}
                      </div>
                    </div>

                    <div className="api-testing-form-group">
                      <label className="api-testing-form-label">Model Used:</label>
                      <div className="text-sm font-mono">
                        {processingResponse.model_used || 'Default model'}
                      </div>
                    </div>

                    <div className="api-testing-form-group">
                      <label className="api-testing-form-label">Extracted Data:</label>
                      <div className="api-testing-result">
                        {processingResponse.result ? (
                          <JsonView data={processingResponse.result} />
                        ) : (
                          <p className="text-sm text-gray-500">No data extracted</p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="api-testing-error-message">
                    <div className="flex items-center">
                      <span className="api-testing-error-icon">✖</span>
                      <h3 className="font-medium">Processing Failed</h3>
                    </div>
                    <div className="mt-2">
                      <p>{processingResponse.error || 'Unknown error'}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="dashboard-empty">
              <div className="dashboard-empty-icon">📄</div>
              <h3 className="dashboard-empty-title">No results yet</h3>
              <p className="dashboard-empty-description">
                Upload and process a document to see the extracted information here.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ApiTesting;
