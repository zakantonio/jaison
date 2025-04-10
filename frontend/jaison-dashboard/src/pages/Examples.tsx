import React from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { DocumentType } from '../types';
import TabContainer, { TabItem } from '../components/TabContainer';
import '../styles/examples.css';
import '../styles/tabs.css';

const Examples: React.FC = () => {
  // Reusable component for handling response format section
  const ResponseFormatSection = () => (
    <div className="examples-subsection">
      <h3 className="examples-subsection-title">Handling Response Format</h3>
      <p className="examples-text">
        The API will return the extracted data in the <code>result</code> field of the response. The backend automatically handles JSON extraction from markdown code blocks, so you'll typically receive a properly structured JSON object.
      </p>

      <p className="examples-text">
        For maximum compatibility, client code should still check for both possible response formats:
      </p>

      <div className="examples-code-block">
        <SyntaxHighlighter language="javascript" style={vscDarkPlus}>
          {`// Function to handle API response
function handleApiResponse(response) {
  // Check if result field exists
  if (response.result) {
    return response.result;
  }

  // Fallback to raw_content if present
  if (response.raw_content) {
    // In most cases, this won't be needed as the backend now extracts JSON from markdown
    // But it's good to have as a fallback
    try {
      // Check if the content is wrapped in markdown code block
      if (response.raw_content.startsWith("\`\`\`json\n") && response.raw_content.endsWith("\n\`\`\`")) {
        // Remove the markdown code block formatting
        const jsonString = response.raw_content.substring(8, response.raw_content.length - 4);
        return JSON.parse(jsonString);
      }

      // Try parsing directly in case it's JSON without markdown
      return JSON.parse(response.raw_content);
    } catch (error) {
      console.error("Failed to parse content:", error);
      return { error: "Failed to parse response" };
    }
  }

  return { error: "No valid result found in response" };
}`}
        </SyntaxHighlighter>
      </div>
    </div>
  );
  // Example code snippets
  const receiptCodeSnippet = `// Process a receipt image
const formData = new FormData();
formData.append('file', receiptImage);

// Step 1: Upload the image
const uploadResponse = await fetch('http://localhost:8421/api/v1/ocr/upload', {
  method: 'POST',
  headers: {
    'X-API-Key': 'your-api-key-here'
  },
  body: formData
});

const uploadData = await uploadResponse.json();
const fileId = uploadData.file_id;

// Step 2: Process the image
const processResponse = await fetch('http://localhost:8421/api/v1/ocr/process', {
  method: 'POST',
  headers: {
    'X-API-Key': 'your-api-key-here',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    file_id: fileId,
    document_type: 'receipt',
    extraction_prompt: 'Extract the store name, date, items purchased with prices, and total amount from this receipt.'
  })
});

const processData = await processResponse.json();
const requestId = processData.request_id;

// Step 3: Poll for results
let result;
while (true) {
  const statusResponse = await fetch(\`http://localhost:8421/api/v1/ocr/status/\${requestId}\`, {
    method: 'GET',
    headers: {
      'X-API-Key': 'your-api-key-here'
    }
  });

  const statusData = await statusResponse.json();

  if (statusData.status === 'completed') {
    result = statusData.result;
    break;
  } else if (statusData.status === 'failed') {
    throw new Error(\`Processing failed: \${statusData.error}\`);
  }

  // Wait 2 seconds before polling again
  await new Promise(resolve => setTimeout(resolve, 2000));
}

// Now you can use the extracted data
console.log(result);`;

  const invoiceCodeSnippet = `// Process an invoice with a specific output schema
const formData = new FormData();
formData.append('file', invoiceImage);

// Step 1: Upload the image
const uploadResponse = await fetch('http://localhost:8421/api/v1/ocr/upload', {
  method: 'POST',
  headers: {
    'X-API-Key': 'your-api-key-here'
  },
  body: formData
});

const uploadData = await uploadResponse.json();
const fileId = uploadData.file_id;

// Define the output schema
const outputSchema = {
  type: "object",
  properties: {
    vendor: {
      type: "object",
      properties: {
        name: { type: "string" },
        address: { type: "string" },
        phone: { type: "string" },
        email: { type: "string" }
      }
    },
    invoice_number: { type: "string" },
    date: { type: "string" },
    due_date: { type: "string" },
    items: {
      type: "array",
      items: {
        type: "object",
        properties: {
          description: { type: "string" },
          quantity: { type: "number" },
          unit_price: { type: "number" },
          total: { type: "number" }
        }
      }
    },
    subtotal: { type: "number" },
    tax: { type: "number" },
    total: { type: "number" }
  }
};

// Step 2: Process the image with the output schema
const processResponse = await fetch('http://localhost:8421/api/v1/ocr/process', {
  method: 'POST',
  headers: {
    'X-API-Key': 'your-api-key-here',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    file_id: fileId,
    document_type: 'invoice',
    extraction_prompt: 'Extract all invoice details including vendor information, invoice number, date, line items, and payment details.',
    output_schema: outputSchema
  })
});

// Continue with polling as in the receipt example...`;

  const idCardCodeSnippet = `// Process an ID card with privacy considerations
const formData = new FormData();
formData.append('file', idCardImage);

// Step 1: Upload the image
const uploadResponse = await fetch('http://localhost:8421/api/v1/ocr/upload', {
  method: 'POST',
  headers: {
    'X-API-Key': 'your-api-key-here'
  },
  body: formData
});

const uploadData = await uploadResponse.json();
const fileId = uploadData.file_id;

// Step 2: Process the image with privacy instructions
const processResponse = await fetch('http://localhost:8421/api/v1/ocr/process', {
  method: 'POST',
  headers: {
    'X-API-Key': 'your-api-key-here',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    file_id: fileId,
    document_type: 'id_card',
    extraction_prompt: 'Extract the document type and issuing authority only. Do not extract any personal information.'
  })
});

// Continue with polling as in the receipt example...`;

  const businessCardCodeSnippet = `// Process a business card
const formData = new FormData();
formData.append('file', businessCardImage);

// Step 1: Upload the image
const uploadResponse = await fetch('http://localhost:8421/api/v1/ocr/upload', {
  method: 'POST',
  headers: {
    'X-API-Key': 'your-api-key-here'
  },
  body: formData
});

const uploadData = await uploadResponse.json();
const fileId = uploadData.file_id;

// Step 2: Process the image
const processResponse = await fetch('http://localhost:8421/api/v1/ocr/process', {
  method: 'POST',
  headers: {
    'X-API-Key': 'your-api-key-here',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    file_id: fileId,
    document_type: 'business_card',
    extraction_prompt: 'Extract the name, job title, company, email, phone numbers, and address from this business card.'
  })
});

// Continue with polling as in the receipt example...`;

  const couponCodeSnippet = `// Process a discount coupon
const formData = new FormData();
formData.append('file', couponImage);

// Step 1: Upload the image
const uploadResponse = await fetch('http://localhost:8421/api/v1/ocr/upload', {
  method: 'POST',
  headers: {
    'X-API-Key': 'your-api-key-here'
  },
  body: formData
});

const uploadData = await uploadResponse.json();
const fileId = uploadData.file_id;

// Step 2: Process the image
const processResponse = await fetch('http://localhost:8421/api/v1/ocr/process', {
  method: 'POST',
  headers: {
    'X-API-Key': 'your-api-key-here',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    file_id: fileId,
    document_type: 'coupon',
    extraction_prompt: 'Extract the store name, discount amount, minimum purchase amount, valid dates, and terms and conditions from this coupon.'
  })
});

// Continue with polling as in the receipt example...`;

  // Create tab content components
  const ReceiptPanel = () => (
    <>
      <h2 className="examples-section-title">Receipt Processing</h2>
      <p className="examples-text">
        Extract structured data from receipts, including store name, date, items, and total amount.
      </p>

      <div className="examples-grid">
        <div className="examples-subsection">
          <h3 className="examples-subsection-title">Example Request</h3>
          <div className="examples-request-box">
            <p className="examples-request-label">
              <strong>Document Type:</strong>
            </p>
            <p className="examples-request-value">
              {DocumentType.RECEIPT}
            </p>
            <p className="examples-request-label">
              <strong>Extraction Prompt:</strong>
            </p>
            <p className="examples-request-value">
              Extract the store name, date, items purchased with prices, and total amount from this receipt.
            </p>
          </div>

          <h3 className="examples-subsection-title">Example Response</h3>
          <div className="examples-code-block">
            <SyntaxHighlighter language="json" style={vscDarkPlus}>
              {JSON.stringify({
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
              }, null, 2)}
            </SyntaxHighlighter>
          </div>
        </div>

        <div className="examples-subsection">
          <h3 className="examples-subsection-title">Code Example</h3>
          <div className="examples-code-block">
            <SyntaxHighlighter language="javascript" style={vscDarkPlus}>
              {receiptCodeSnippet}
            </SyntaxHighlighter>
          </div>
        </div>
      </div>

      <div className="examples-info-box examples-tip-box">
        <p className="examples-info-box-content examples-tip-box-content">
          <strong>Tip:</strong> For receipts, it's helpful to be specific about what items you want to extract.
          For example, you might want to extract only certain categories of items or specific information like discounts.
        </p>
      </div>

      <ResponseFormatSection />
    </>
  );

  const InvoicePanel = () => (
    <>
      <h2 className="examples-section-title">Invoice Processing</h2>
      <p className="examples-text">
        Extract structured data from invoices, including vendor information, invoice number, line items, and payment details.
      </p>

      <div className="examples-grid">
        <div className="examples-subsection">
          <h3 className="examples-subsection-title">Example Request</h3>
          <div className="examples-request-box">
            <p className="examples-request-label">
              <strong>Document Type:</strong>
            </p>
            <p className="examples-request-value">
              {DocumentType.INVOICE}
            </p>
            <p className="examples-request-label">
              <strong>Extraction Prompt:</strong>
            </p>
            <p className="examples-request-value">
              Extract all invoice details including vendor information, invoice number, date, line items, and payment details.
            </p>
          </div>

          <h3 className="examples-subsection-title">Example Response</h3>
          <div className="examples-code-block">
            <SyntaxHighlighter language="json" style={vscDarkPlus}>
              {JSON.stringify({
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
              }, null, 2)}
            </SyntaxHighlighter>
          </div>
        </div>

        <div className="examples-subsection">
          <h3 className="examples-subsection-title">Code Example</h3>
          <div className="examples-code-block">
            <SyntaxHighlighter language="javascript" style={vscDarkPlus}>
              {invoiceCodeSnippet}
            </SyntaxHighlighter>
          </div>
        </div>
      </div>

      <div className="examples-info-box examples-tip-box">
        <p className="examples-info-box-content examples-tip-box-content">
          <strong>Tip:</strong> Using the <code>output_schema</code> parameter can help ensure that the extracted data
          follows a consistent structure, which is especially useful for invoices with complex layouts.
        </p>
      </div>

      <ResponseFormatSection />
    </>
  );

  const IdCardPanel = () => (
    <>
      <h2 className="examples-section-title">ID Card Processing</h2>
      <p className="examples-text">
        Extract information from ID cards with privacy considerations.
      </p>

      <div className="examples-grid">
        <div className="examples-subsection">
          <h3 className="examples-subsection-title">Example Request</h3>
          <div className="examples-request-box">
            <p className="examples-request-label">
              <strong>Document Type:</strong>
            </p>
            <p className="examples-request-value">
              {DocumentType.ID_CARD}
            </p>
            <p className="examples-request-label">
              <strong>Extraction Prompt:</strong>
            </p>
            <p className="examples-request-value">
              Extract only the name and expiration date from this ID card. Do not extract any other personal information.
            </p>
          </div>

          <h3 className="examples-subsection-title">Example Response</h3>
          <div className="examples-code-block">
            <SyntaxHighlighter language="json" style={vscDarkPlus}>
              {JSON.stringify({
                name: "John Smith",
                expiration_date: "2025-06-30"
              }, null, 2)}
            </SyntaxHighlighter>
          </div>
        </div>

        <div className="examples-subsection">
          <h3 className="examples-subsection-title">Code Example</h3>
          <div className="examples-code-block">
            <SyntaxHighlighter language="javascript" style={vscDarkPlus}>
              {idCardCodeSnippet}
            </SyntaxHighlighter>
          </div>
        </div>
      </div>

      <div className="examples-info-box examples-warning-box">
        <p className="examples-info-box-content examples-warning-box-content">
          <strong>Important:</strong> When processing ID cards, be mindful of privacy and security concerns.
          Consider extracting only the minimum necessary information and avoid storing sensitive personal data.
          Always comply with relevant privacy regulations like GDPR and CCPA.
        </p>
      </div>

      <ResponseFormatSection />
    </>
  );

  const BusinessCardPanel = () => (
    <>
      <h2 className="examples-section-title">Business Card Processing</h2>
      <p className="examples-text">
        Extract contact information from business cards.
      </p>

      <div className="examples-grid">
        <div className="examples-subsection">
          <h3 className="examples-subsection-title">Example Request</h3>
          <div className="examples-request-box">
            <p className="examples-request-label">
              <strong>Document Type:</strong>
            </p>
            <p className="examples-request-value">
              {DocumentType.BUSINESS_CARD}
            </p>
            <p className="examples-request-label">
              <strong>Extraction Prompt:</strong>
            </p>
            <p className="examples-request-value">
              Extract all contact information from this business card including name, title, company, phone numbers, email, address, and social media handles.
            </p>
          </div>

          <h3 className="examples-subsection-title">Example Response</h3>
          <div className="examples-code-block">
            <SyntaxHighlighter language="json" style={vscDarkPlus}>
              {JSON.stringify({
                name: "John Smith",
                title: "Senior Software Engineer",
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
              }, null, 2)}
            </SyntaxHighlighter>
          </div>
        </div>

        <div className="examples-subsection">
          <h3 className="examples-subsection-title">Code Example</h3>
          <div className="examples-code-block">
            <SyntaxHighlighter language="javascript" style={vscDarkPlus}>
              {businessCardCodeSnippet}
            </SyntaxHighlighter>
          </div>
        </div>
      </div>

      <div className="examples-info-box examples-tip-box">
        <p className="examples-info-box-content examples-tip-box-content">
          <strong>Tip:</strong> Business cards often have varied layouts and designs. For best results,
          be specific about what information you want to extract and consider using the API to extract
          information in batches for multiple business cards.
        </p>
      </div>

      <ResponseFormatSection />
    </>
  );

  const CouponPanel = () => (
    <>
      <h2 className="examples-section-title">Coupon Processing</h2>
      <p className="examples-text">
        Extract structured data from discount coupons, including store name, discount amount, valid dates, and terms and conditions.
      </p>

      <div className="examples-grid">
        <div className="examples-subsection">
          <h3 className="examples-subsection-title">Example Request</h3>
          <div className="examples-request-box">
            <p className="examples-request-label">
              <strong>Document Type:</strong>
            </p>
            <p className="examples-request-value">
              {DocumentType.COUPON}
            </p>
            <p className="examples-request-label">
              <strong>Extraction Prompt:</strong>
            </p>
            <p className="examples-request-value">
              Extract the store name, discount amount, valid dates, and any terms and conditions from this coupon.
            </p>
          </div>

          <h3 className="examples-subsection-title">Example Response</h3>
          <div className="examples-code-block">
            <SyntaxHighlighter language="json" style={vscDarkPlus}>
              {JSON.stringify({
                store_name: "Fashion Outlet",
                discount: {
                  type: "percentage",
                  amount: 20
                },
                validity: {
                  start_date: "2023-05-01",
                  end_date: "2023-05-31"
                },
                minimum_purchase: 50.00,
                terms_and_conditions: [
                  "Valid in-store and online",
                  "Cannot be combined with other offers",
                  "Excludes sale items",
                  "One coupon per customer"
                ]
              }, null, 2)}
            </SyntaxHighlighter>
          </div>
        </div>

        <div className="examples-subsection">
          <h3 className="examples-subsection-title">Code Example</h3>
          <div className="examples-code-block">
            <SyntaxHighlighter language="javascript" style={vscDarkPlus}>
              {couponCodeSnippet}
            </SyntaxHighlighter>
          </div>
        </div>
      </div>

      <div className="examples-info-box examples-tip-box">
        <p className="examples-info-box-content examples-tip-box-content">
          <strong>Tip:</strong> When processing coupons, pay attention to the valid dates and minimum purchase requirements.
          These details are crucial for determining when and how the coupon can be used.
        </p>
      </div>

      <ResponseFormatSection />
    </>
  );

  // Create Generic Document Panel
  const GenericPanel = () => (
    <>
      <h2 className="examples-section-title">Custom Document Processing</h2>
      <p className="examples-text">
        Process any type of document with custom extraction prompts and receive structured data in a custom schema format.
        This is especially useful for document types not covered by the predefined categories or when you need specific information in a custom format.
      </p>

      <div className="examples-grid">
        <div className="examples-subsection">
          <h3 className="examples-subsection-title">Example Request</h3>
          <div className="examples-request-box">
            <p className="examples-request-label">
              <strong>Document Type:</strong>
            </p>
            <p className="examples-request-value">
              generic
            </p>
            <p className="examples-request-label">
              <strong>Extraction Prompt:</strong>
            </p>
            <p className="examples-request-value">
              This is a research paper about climate change. Extract the title, authors, publication date, abstract, key findings, and methodology.
            </p>
            <p className="examples-request-label">
              <strong>Output Schema:</strong>
            </p>
            <p className="examples-request-value">
              Custom JSON schema defining the structure of the expected output.
            </p>
          </div>

          <h3 className="examples-subsection-title">Example Response</h3>
          <div className="examples-code-block">
            <SyntaxHighlighter language="json" style={vscDarkPlus}>
              {JSON.stringify({
                title: "Climate Change Impacts on Global Agriculture: A Systematic Review",
                authors: [
                  { name: "Jane Smith", affiliation: "University of Climate Science" },
                  { name: "John Doe", affiliation: "Agricultural Research Institute" }
                ],
                publication_date: "2023-02-15",
                abstract: "This paper reviews the current literature on climate change impacts on global agricultural systems, with a focus on crop yields, water resources, and adaptation strategies. Our analysis indicates significant regional variations in vulnerability to climate change, with developing countries facing the greatest challenges.",
                key_findings: [
                  "Global crop yields are projected to decrease by 2-6% per decade due to climate change",
                  "Water scarcity will affect 40% of agricultural regions by 2050",
                  "Adaptation strategies such as drought-resistant crops show promise in mitigating impacts",
                  "Economic impacts will be unevenly distributed, with equatorial regions facing greater losses"
                ],
                methodology: {
                  approach: "Systematic literature review of peer-reviewed studies published between 2010-2022",
                  data_sources: [
                    "Web of Science",
                    "Scopus",
                    "Agricultural Database",
                    "IPCC Assessment Reports"
                  ],
                  limitations: [
                    "Limited long-term observational data in some regions",
                    "Uncertainty in climate model projections at regional scales",
                    "Publication bias toward English-language journals"
                  ]
                }
              }, null, 2)}
            </SyntaxHighlighter>
          </div>
        </div>

        <div className="examples-subsection">
          <h3 className="examples-subsection-title">Code Example</h3>
          <div className="examples-code-block">
            <SyntaxHighlighter language="javascript" style={vscDarkPlus}>
              {`// Process a custom document with a specific output schema
const formData = new FormData();
formData.append('file', documentImage);

// Step 1: Upload the image
const uploadResponse = await fetch('http://localhost:8421/api/v1/ocr/upload', {
  method: 'POST',
  headers: {
    'X-API-Key': 'your-api-key-here'
  },
  body: formData
});

const uploadData = await uploadResponse.json();
const fileId = uploadData.file_id;

// Define the custom output schema
const outputSchema = {
  type: "object",
  properties: {
    title: { type: "string" },
    authors: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          affiliation: { type: "string" }
        }
      }
    },
    publication_date: { type: "string", format: "date" },
    abstract: { type: "string" },
    key_findings: {
      type: "array",
      items: { type: "string" }
    },
    methodology: {
      type: "object",
      properties: {
        approach: { type: "string" },
        data_sources: {
          type: "array",
          items: { type: "string" }
        },
        limitations: {
          type: "array",
          items: { type: "string" }
        }
      }
    }
  }
};

// Step 2: Process the image with the custom schema
const processResponse = await fetch('http://localhost:8421/api/v1/ocr/process', {
  method: 'POST',
  headers: {
    'X-API-Key': 'your-api-key-here',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    file_id: fileId,
    document_type: 'generic',
    extraction_prompt: 'This is a research paper about climate change. Extract the title, authors, publication date, abstract, key findings, and methodology.',
    output_schema: outputSchema
  })
});

// Continue with polling for results as in previous examples...`}
            </SyntaxHighlighter>
          </div>
        </div>
      </div>

      <div className="examples-info-box examples-tip-box">
        <p className="examples-info-box-content examples-tip-box-content">
          <strong>Tip:</strong> When using custom schemas, be as specific as possible with your extraction prompt to guide the model toward extracting the exact information you need in the format you've specified.
          The more detailed your schema, the more structured and consistent your results will be.
        </p>
      </div>

      <ResponseFormatSection />
    </>
  );

  // Define tabs
  const tabs: TabItem[] = [
    { key: 'receipts', name: 'Receipts', content: <ReceiptPanel /> },
    { key: 'invoices', name: 'Invoices', content: <InvoicePanel /> },
    { key: 'id_cards', name: 'ID Cards', content: <IdCardPanel /> },
    { key: 'business_cards', name: 'Business Cards', content: <BusinessCardPanel /> },
    { key: 'coupons', name: 'Coupons', content: <CouponPanel /> },
    { key: 'generic', name: 'Custom Documents', content: <GenericPanel /> },
  ];

  return (
    <div className="examples-container">
      <div className="examples-header">
        <h1 className="examples-title">Examples</h1>
        <p className="examples-subtitle">
          Example use cases and code snippets for the OCR API
        </p>
      </div>

      <TabContainer tabs={tabs} />
    </div>
  );
};

export default Examples;
