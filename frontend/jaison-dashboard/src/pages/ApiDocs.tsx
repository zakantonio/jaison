import React from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { DocumentType } from '../types';
import TabContainer, { TabItem } from '../components/TabContainer';
import '../styles/apidocs.css';
import '../styles/tabs.css';

const ApiDocs: React.FC = () => {
  // Example code snippets
  const authCodeSnippet = `// Using API Key in header
const response = await fetch('http://localhost:8421/api/v1/ocr/upload', {
  method: 'POST',
  headers: {
    'X-API-Key': 'your-api-key-here'
  },
  body: formData
});`;

  const uploadCodeSnippet = `// Upload an image
const formData = new FormData();
formData.append('file', document.getElementById('fileInput').files[0]);

const response = await fetch('http://localhost:8421/api/v1/ocr/upload', {
  method: 'POST',
  headers: {
    'X-API-Key': 'your-api-key-here'
  },
  body: formData
});

const data = await response.json();
console.log(data.file_id); // Use this file_id for processing`;

  const processCodeSnippet = `// Process an uploaded image
const response = await fetch('http://localhost:8421/api/v1/ocr/process', {
  method: 'POST',
  headers: {
    'X-API-Key': 'your-api-key-here',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    file_id: 'file-id-from-upload-response',
    document_type: 'receipt',
    extraction_prompt: 'Extract the store name, date, items purchased with prices, and total amount from this receipt.'
  })
});

const data = await response.json();
console.log(data.request_id); // Use this request_id to check status`;

  const statusCodeSnippet = `// Check processing status
const response = await fetch('http://localhost:8421/api/v1/ocr/status/request-id-from-process-response', {
  method: 'GET',
  headers: {
    'X-API-Key': 'your-api-key-here'
  }
});

const data = await response.json();
console.log(data.status); // 'pending', 'processing', 'completed', or 'failed'

if (data.status === 'completed') {
  console.log(data.result); // The extracted data
}`;

  // Create tab content components
  const OverviewPanel = () => (
    <>
      <h2 className="api-docs-section-title">API Overview</h2>
      <p className="api-docs-text">
        The Jaison OCR API allows you to extract structured data from document images using multimodal LLMs.
        You can upload images, specify what information you want to extract, and receive structured JSON data in response.
      </p>

      <h3 className="api-docs-subsection-title">Base URL</h3>
      <p className="api-docs-text">
        All API endpoints are relative to the base URL:
      </p>
      <div className="api-docs-base-url">
        <code>
          {process.env.REACT_APP_API_URL || 'http://localhost:8421'}
        </code>
      </div>

      <h3 className="api-docs-subsection-title">Rate Limits</h3>
      <p className="api-docs-text">
        The API has rate limits to ensure fair usage. The current limits are:
      </p>
      <ul className="api-docs-text">
        <li>10 requests per minute per API key</li>
        <li>Maximum file size: 10MB</li>
        <li>Supported file formats: JPG, PNG, PDF</li>
      </ul>
    </>
  );

  const AuthenticationPanel = () => (
    <>
      <h2 className="api-docs-section-title">Authentication</h2>
      <p className="api-docs-text">
        The API uses API keys for authentication. You must include your API key in the <code>X-API-Key</code> header with every request.
      </p>

      <h3 className="api-docs-subsection-title">API Key Management</h3>
      <p className="api-docs-text">
        You can manage your API keys in the <a href="/dashboard/api-keys" className="text-blue-600 hover:text-blue-800">API Keys</a> section of the dashboard.
      </p>

      <h3 className="api-docs-subsection-title">Example</h3>
      <div className="api-docs-code-block">
        <SyntaxHighlighter language="javascript" style={vscDarkPlus}>
          {authCodeSnippet}
        </SyntaxHighlighter>
      </div>

      <div className="api-docs-alert">
        <p className="api-docs-alert-content">
          <strong>Important:</strong> Keep your API keys secure and never expose them in client-side code.
          If you suspect your API key has been compromised, revoke it immediately and generate a new one.
        </p>
      </div>
    </>
  );

  const EndpointsPanel = () => (
    <>
      <h2 className="api-docs-section-title">API Endpoints</h2>

      {/* Upload Endpoint */}
      <div className="api-docs-subsection">
        <h3 className="api-docs-subsection-title">Upload Image</h3>
        <div className="api-docs-endpoint">
          <span className="api-docs-method api-docs-method-post">
            POST
          </span>
          <span className="api-docs-endpoint-path">/api/v1/ocr/upload</span>
        </div>
        <p className="api-docs-text">
          Upload an image for OCR processing. The response includes a file ID that you can use with the process endpoint.
        </p>

        <h4 className="api-docs-subsection-title">Request</h4>
        <p className="api-docs-text">
          Content-Type: multipart/form-data
        </p>
        <table className="api-docs-table">
          <thead>
            <tr>
              <th>
                Parameter
              </th>
              <th>
                Type
              </th>
              <th>
                Description
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="api-docs-table-param">
                file
              </td>
              <td className="api-docs-table-type">
                File
              </td>
              <td className="api-docs-table-desc">
                The image file to upload (JPG, PNG, or PDF)
              </td>
            </tr>
          </tbody>
        </table>

        <h4 className="api-docs-subsection-title">Response</h4>
        <div className="api-docs-code-block">
          <SyntaxHighlighter language="json" style={vscDarkPlus}>
            {JSON.stringify({
              file_id: "550e8400-e29b-41d4-a716-446655440000",
              filename: "receipt.jpg",
              content_type: "image/jpeg",
              size: 125320,
              upload_time: "2023-04-15T12:34:56Z"
            }, null, 2)}
          </SyntaxHighlighter>
        </div>

        <h4 className="api-docs-subsection-title">Example</h4>
        <div className="api-docs-code-block">
          <SyntaxHighlighter language="javascript" style={vscDarkPlus}>
            {uploadCodeSnippet}
          </SyntaxHighlighter>
        </div>
      </div>

      {/* Process Endpoint */}
      <div className="api-docs-subsection">
        <h3 className="api-docs-subsection-title">Process Document</h3>
        <div className="api-docs-endpoint">
          <span className="api-docs-method api-docs-method-post">
            POST
          </span>
          <span className="api-docs-endpoint-path">/api/v1/ocr/process</span>
        </div>
        <p className="api-docs-text">
          Process an uploaded document with OCR. The response includes a request ID that you can use to check the processing status.
          This endpoint supports both predefined document types and custom document processing with user-defined output schemas.
        </p>

        <div className="api-docs-alert">
          <p className="api-docs-alert-content">
            <strong>Pro Tip:</strong> For custom document types or when you need specific structured data, use the <code>output_schema</code> parameter to define the exact structure of the JSON you want to receive. This helps the model format the extracted information according to your needs.
          </p>
        </div>

        <h4 className="api-docs-subsection-title">Request</h4>
        <p className="api-docs-text">
          Content-Type: application/json
        </p>
        <table className="api-docs-table">
          <thead>
            <tr>
              <th>
                Parameter
              </th>
              <th>
                Type
              </th>
              <th>
                Description
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="api-docs-table-param">
                file_id
              </td>
              <td className="api-docs-table-type">
                String
              </td>
              <td className="api-docs-table-desc">
                ID of the previously uploaded file
              </td>
            </tr>
            <tr>
              <td className="api-docs-table-param">
                document_type
              </td>
              <td className="api-docs-table-type">
                String
              </td>
              <td className="api-docs-table-desc">
                Type of document (receipt, invoice, id_card, business_card, ticket, generic)
              </td>
            </tr>
            <tr>
              <td className="api-docs-table-param">
                extraction_prompt
              </td>
              <td className="api-docs-table-type">
                String
              </td>
              <td className="api-docs-table-desc">
                Natural language prompt describing what information to extract
              </td>
            </tr>
            <tr>
              <td className="api-docs-table-param">
                model
              </td>
              <td className="api-docs-table-type">
                String (optional)
              </td>
              <td className="api-docs-table-desc">
                Model to use for processing (defaults to system default)
              </td>
            </tr>
            <tr>
              <td className="api-docs-table-param">
                output_schema
              </td>
              <td className="api-docs-table-type">
                Object (optional)
              </td>
              <td className="api-docs-table-desc">
                JSON schema for structuring the output. This allows you to define the exact format of the data you want to receive. The schema should follow the JSON Schema specification and can include nested objects, arrays, and specific data types.
              </td>
            </tr>
          </tbody>
        </table>

        <h4 className="api-docs-subsection-title">Output Schema Example</h4>
        <p className="api-docs-text">
          Here's an example of how to use the output_schema parameter to define a custom structure for extracted data:
        </p>
        <div className="api-docs-code-block">
          <SyntaxHighlighter language="json" style={vscDarkPlus}>
            {JSON.stringify({
              type: "object",
              properties: {
                customer_info: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    email: { type: "string", format: "email" },
                    phone: { type: "string" }
                  }
                },
                order_details: {
                  type: "object",
                  properties: {
                    order_id: { type: "string" },
                    date: { type: "string", format: "date" },
                    status: { type: "string", enum: ["pending", "shipped", "delivered"] }
                  }
                },
                items: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      product_id: { type: "string" },
                      name: { type: "string" },
                      quantity: { type: "integer", minimum: 1 },
                      price: { type: "number" },
                      subtotal: { type: "number" }
                    }
                  }
                },
                payment: {
                  type: "object",
                  properties: {
                    method: { type: "string" },
                    subtotal: { type: "number" },
                    tax: { type: "number" },
                    shipping: { type: "number" },
                    total: { type: "number" }
                  }
                }
              }
            }, null, 2)}
          </SyntaxHighlighter>
        </div>
        <p className="api-docs-text">
          When you provide this schema, the API will attempt to extract and format the data according to this structure, making it easier to integrate with your existing systems.
        </p>

        <h4 className="api-docs-subsection-title">Response Format</h4>
        <p className="api-docs-text">
          The API will return the extracted data in the <code>result</code> field of the response. The backend automatically handles JSON extraction from markdown code blocks, so you'll always receive a properly structured JSON object.
        </p>

        <p className="api-docs-text">
          In rare cases where JSON extraction fails, the API may return a <code>raw_content</code> field instead. This is a fallback mechanism and should occur infrequently with the improved backend processing.
        </p>

        <div className="api-docs-alert">
          <p className="api-docs-alert-content">
            <strong>Note:</strong> For maximum compatibility, client code should check for both formats: first look for the <code>result</code> field, and if not present, check for and process the <code>raw_content</code> field.
          </p>
        </div>

        <h4 className="api-docs-subsection-title">Response</h4>
        <div className="api-docs-code-block">
          <SyntaxHighlighter language="json" style={vscDarkPlus}>
            {JSON.stringify({
              request_id: "550e8400-e29b-41d4-a716-446655440001",
              status: "pending",
              created_at: "2023-04-15T12:35:00Z",
              updated_at: "2023-04-15T12:35:00Z"
            }, null, 2)}
          </SyntaxHighlighter>
        </div>

        <h4 className="api-docs-subsection-title">Example</h4>
        <div className="api-docs-code-block">
          <SyntaxHighlighter language="javascript" style={vscDarkPlus}>
            {processCodeSnippet}
          </SyntaxHighlighter>
        </div>
      </div>

      {/* Status Endpoint */}
      <div className="api-docs-subsection">
        <h3 className="api-docs-subsection-title">Get Processing Status</h3>
        <div className="api-docs-endpoint">
          <span className="api-docs-method api-docs-method-get">
            GET
          </span>
          <span className="api-docs-endpoint-path">/api/v1/ocr/status/{'{request_id}'}</span>
        </div>
        <p className="api-docs-text">
          Get the status of a document processing request. When processing is complete, the response includes the extracted data.
        </p>

        <h4 className="api-docs-subsection-title">Path Parameters</h4>
        <table className="api-docs-table">
          <thead>
            <tr>
              <th>
                Parameter
              </th>
              <th>
                Type
              </th>
              <th>
                Description
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="api-docs-table-param">
                request_id
              </td>
              <td className="api-docs-table-type">
                String
              </td>
              <td className="api-docs-table-desc">
                ID of the processing request
              </td>
            </tr>
          </tbody>
        </table>

        <h4 className="api-docs-subsection-title">Response</h4>
        <div className="api-docs-code-block">
          <SyntaxHighlighter language="json" style={vscDarkPlus}>
            {JSON.stringify({
              request_id: "550e8400-e29b-41d4-a716-446655440001",
              status: "completed",
              created_at: "2023-04-15T12:35:00Z",
              updated_at: "2023-04-15T12:35:10Z",
              completed_at: "2023-04-15T12:35:10Z",
              result: {
                date: "2023-04-15",
                total_amount: 42.99,
                items: [
                  { name: "Item 1", price: 19.99 },
                  { name: "Item 2", price: 23.00 }
                ]
              },
              model_used: "meta-llama/llama-4-maverick:free",
              processing_time: 10.5,
              credits_used: 1.0
            }, null, 2)}
          </SyntaxHighlighter>
        </div>

        <h4 className="api-docs-subsection-title">Example</h4>
        <div className="api-docs-code-block">
          <SyntaxHighlighter language="javascript" style={vscDarkPlus}>
            {statusCodeSnippet}
          </SyntaxHighlighter>
        </div>
      </div>
    </>
  );

  const ExamplesPanel = () => (
    <>
      <h2 className="api-docs-section-title">Example Use Cases</h2>
      <p className="api-docs-text">
        Here are some example use cases for the Jaison OCR API:
      </p>

      <div className="api-docs-examples">
        {/* Custom Document Example */}
        <div className="api-docs-example">
          <h3 className="api-docs-subsection-title">Custom Document Processing</h3>
          <p className="api-docs-text">
            Process any type of document with custom extraction prompts and receive structured data in a custom schema format.
            This is especially useful for document types not covered by the predefined categories or when you need specific information in a custom format.
          </p>

          <h4 className="api-docs-subsection-title">Example Request with Custom Schema</h4>
          <div className="api-docs-code-block">
            <SyntaxHighlighter language="json" style={vscDarkPlus}>
              {JSON.stringify({
                file_id: "550e8400-e29b-41d4-a716-446655440003",
                document_type: "generic",
                extraction_prompt: "This is a research paper about climate change. Extract the title, authors, publication date, abstract, key findings, and methodology.",
                output_schema: {
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
                }
              }, null, 2)}
            </SyntaxHighlighter>
          </div>

          <h4 className="api-docs-subsection-title">Example Response</h4>
          <div className="api-docs-code-block">
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

          <div className="api-docs-alert">
            <p className="api-docs-alert-content">
              <strong>Tip:</strong> When using custom schemas, be as specific as possible with your extraction prompt to guide the model toward extracting the exact information you need in the format you've specified.
            </p>
          </div>
        </div>

        {/* Receipt Example */}
        <div className="api-docs-example">
          <h3 className="api-docs-subsection-title">Receipt Processing</h3>
          <p className="api-docs-text">
            Extract structured data from receipts, including store name, date, items, and total amount.
          </p>

          <h4 className="api-docs-subsection-title">Example Request</h4>
          <div className="api-docs-code-block">
            <SyntaxHighlighter language="json" style={vscDarkPlus}>
              {JSON.stringify({
                file_id: "550e8400-e29b-41d4-a716-446655440000",
                document_type: DocumentType.RECEIPT,
                extraction_prompt: "Extract the store name, date, items purchased with prices, and total amount from this receipt."
              }, null, 2)}
            </SyntaxHighlighter>
          </div>

          <h4 className="api-docs-subsection-title">Example Response</h4>
          <div className="api-docs-code-block">
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

        {/* Invoice Example */}
        <div className="api-docs-example">
          <h3 className="api-docs-subsection-title">Invoice Processing</h3>
          <p className="api-docs-text">
            Extract structured data from invoices, including vendor information, invoice number, line items, and payment details.
          </p>

          <h4 className="api-docs-subsection-title">Example Request</h4>
          <div className="api-docs-code-block">
            <SyntaxHighlighter language="json" style={vscDarkPlus}>
              {JSON.stringify({
                file_id: "550e8400-e29b-41d4-a716-446655440002",
                document_type: DocumentType.INVOICE,
                extraction_prompt: "Extract the vendor name, invoice number, date, line items, subtotal, tax, and total amount from this invoice."
              }, null, 2)}
            </SyntaxHighlighter>
          </div>

          <h4 className="api-docs-subsection-title">Example Response</h4>
          <div className="api-docs-code-block">
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
      </div>
    </>
  );

  // Define tabs
  const tabs: TabItem[] = [
    { key: 'overview', name: 'Overview', content: <OverviewPanel /> },
    { key: 'auth', name: 'Authentication', content: <AuthenticationPanel /> },
    { key: 'endpoints', name: 'Endpoints', content: <EndpointsPanel /> },
    { key: 'examples', name: 'Examples', content: <ExamplesPanel /> },
  ];

  return (
    <div className="api-docs-container">
      <div className="api-docs-header">
        <h1 className="api-docs-title">API Documentation</h1>
        <p className="api-docs-subtitle">
          Learn how to integrate with the Jaison OCR API
        </p>
      </div>

      <TabContainer tabs={tabs} />
    </div>
  );
};

export default ApiDocs;
