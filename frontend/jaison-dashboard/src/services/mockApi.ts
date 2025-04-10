import { 
  UploadResponse, 
  ProcessingRequest, 
  ProcessingResponse, 
  ProcessingStatus,
  DocumentType
} from '../types';

// Mock upload image function
export const mockUploadImage = async (file: File): Promise<UploadResponse> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Check file type
  if (!file.type.match('image.*') && file.type !== 'application/pdf') {
    throw new Error('Invalid file type. Please upload an image or PDF file.');
  }
  
  // Check file size (max 10MB)
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('File too large. Maximum file size is 10MB.');
  }
  
  // Return mock response
  return {
    file_id: `file_${Math.random().toString(36).substring(2, 15)}`,
    filename: file.name,
    content_type: file.type,
    size: file.size,
    upload_time: new Date().toISOString()
  };
};

// Mock process document function
export const mockProcessDocument = async (request: ProcessingRequest): Promise<ProcessingResponse> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Validate request
  if (!request.file_id) {
    throw new Error('File ID is required');
  }
  
  if (!request.document_type) {
    throw new Error('Document type is required');
  }
  
  // Return mock response
  return {
    request_id: `req_${Math.random().toString(36).substring(2, 15)}`,
    status: ProcessingStatus.PENDING,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
};

// Mock get processing status function
export const mockGetProcessingStatus = async (requestId: string): Promise<ProcessingResponse> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Generate mock result based on document type
  const mockResults: Record<DocumentType, any> = {
    [DocumentType.RECEIPT]: {
      store_name: "Grocery Store",
      date: "2023-04-15",
      items: [
        { name: "Milk", quantity: 1, price: 3.99 },
        { name: "Bread", quantity: 2, price: 4.50 },
        { name: "Eggs", quantity: 1, price: 5.99 },
        { name: "Cheese", quantity: 1, price: 7.99 }
      ],
      subtotal: 22.47,
      tax: 1.80,
      total: 24.27
    },
    [DocumentType.INVOICE]: {
      vendor: {
        name: "ABC Supplies Inc.",
        address: "123 Business St, City, State 12345",
        phone: "555-123-4567",
        email: "billing@abcsupplies.com"
      },
      invoice_number: "INV-12345",
      date: "2023-04-10",
      due_date: "2023-05-10",
      items: [
        { description: "Office Supplies", quantity: 10, unit_price: 12.99, total: 129.90 },
        { description: "Furniture", quantity: 2, unit_price: 249.99, total: 499.98 },
        { description: "Electronics", quantity: 1, unit_price: 599.99, total: 599.99 }
      ],
      subtotal: 1229.87,
      tax_rate: 0.08,
      tax: 98.39,
      total: 1328.26,
      payment_terms: "Net 30"
    },
    [DocumentType.ID_CARD]: {
      document_type: "Driver's License",
      issuing_authority: "Department of Motor Vehicles",
      issuing_state: "California",
      issue_date: "2020-01-15",
      expiration_date: "2025-01-15"
    },
    [DocumentType.BUSINESS_CARD]: {
      name: "John Smith",
      job_title: "Senior Software Engineer",
      company: "Tech Solutions Inc.",
      email: "john.smith@techsolutions.com",
      phone_numbers: [
        { type: "office", number: "555-123-4567" },
        { type: "mobile", number: "555-987-6543" }
      ],
      address: "123 Tech Park, Suite 456, San Francisco, CA 94107",
      website: "www.techsolutions.com",
      social_media: [
        { platform: "LinkedIn", handle: "johnsmith" },
        { platform: "Twitter", handle: "@johnsmith" }
      ]
    },
    [DocumentType.TICKET]: {
      event_name: "Summer Music Festival",
      date: "2023-07-15",
      time: "19:00",
      venue_name: "City Park Amphitheater",
      venue_address: "456 Park Ave, City, State 12345",
      seat_info: "Section A, Row 10, Seat 15",
      ticket_price: 85.00,
      currency: "USD",
      ticket_holder: "Jane Doe",
      ticket_number: "TKT-987654",
      barcode_present: true,
      additional_info: "No refunds. No outside food or drinks."
    },
    [DocumentType.COUPON]: {
      store_name: "SuperMarket",
      discount_amount: "5€",
      discount_type: "fixed_amount",
      minimum_purchase: "30€",
      valid_from: "2023-06-20",
      valid_until: "2023-06-23",
      coupon_code: "SUMMER5",
      terms_and_conditions: "Valid only for purchases above 30€. Cannot be combined with other promotions. Valid in all stores.",
      restrictions: "Excludes alcohol and tobacco products.",
      barcode_present: true
    },
    [DocumentType.GENERIC]: {
      title: "Document Title",
      content: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
      date: "2023-04-15",
      author: "John Doe",
      pages: 5
    }
  };
  
  // Randomly decide if processing is complete
  const isComplete = Math.random() > 0.3;
  
  if (isComplete) {
    return {
      request_id: requestId,
      status: ProcessingStatus.COMPLETED,
      created_at: new Date(Date.now() - 10000).toISOString(),
      updated_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
      result: mockResults[DocumentType.COUPON], // Default to coupon for demo
      model_used: "meta-llama/llama-4-maverick:free",
      processing_time: 5.2,
      credits_used: 1.0
    };
  } else {
    return {
      request_id: requestId,
      status: ProcessingStatus.PROCESSING,
      created_at: new Date(Date.now() - 5000).toISOString(),
      updated_at: new Date().toISOString()
    };
  }
};
