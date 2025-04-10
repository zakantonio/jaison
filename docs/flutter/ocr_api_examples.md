# Jaison OCR API - Flutter Integration Examples

This document provides code snippets for integrating the Jaison OCR API with your Flutter application.

## Setup

First, add the required dependencies to your `pubspec.yaml` file:

```yaml
dependencies:
  flutter:
    sdk: flutter
  http: ^1.1.0
  dio: ^5.3.2  # For handling file uploads
  image_picker: ^1.0.4  # For picking images from gallery/camera
  path: ^1.8.3
```

## API Client Class

Create a dedicated API client class to handle all interactions with the Jaison OCR API:

```dart
import 'dart:convert';
import 'dart:io';
import 'package:dio/dio.dart';
import 'package:http/http.dart' as http;
import 'package:path/path.dart';

class JaisonOcrApiClient {
  final String baseUrl;
  final String apiKey;
  final Dio dio = Dio();
  final http.Client httpClient = http.Client();

  JaisonOcrApiClient({
    required this.baseUrl,
    required this.apiKey,
  }) {
    // Set up Dio for file uploads
    dio.options.headers = {
      'X-API-Key': apiKey,
    };
    
    // Set up HTTP client for other requests
    httpClient.defaultHeaders = {
      'X-API-Key': apiKey,
      'Content-Type': 'application/json',
    };
  }

  // Check if the API is healthy
  Future<Map<String, dynamic>> checkHealth() async {
    final response = await http.get(
      Uri.parse('$baseUrl/api/v1/health'),
      headers: {'X-API-Key': apiKey},
    );

    if (response.statusCode == 200) {
      return json.decode(response.body);
    } else {
      throw Exception('Failed to check API health: ${response.statusCode}');
    }
  }

  // Upload a document
  Future<Map<String, dynamic>> uploadDocument(File file) async {
    String fileName = basename(file.path);
    FormData formData = FormData.fromMap({
      'file': await MultipartFile.fromFile(
        file.path,
        filename: fileName,
      ),
    });

    final response = await dio.post(
      '$baseUrl/api/v1/upload',
      data: formData,
    );

    if (response.statusCode == 200) {
      return response.data;
    } else {
      throw Exception('Failed to upload document: ${response.statusCode}');
    }
  }

  // Process a document
  Future<Map<String, dynamic>> processDocument({
    required String fileId,
    required String documentType,
    String? extractionPrompt,
    String? model,
    Map<String, dynamic>? outputSchema,
  }) async {
    final Map<String, dynamic> requestBody = {
      'file_id': fileId,
      'document_type': documentType,
    };

    if (extractionPrompt != null) {
      requestBody['extraction_prompt'] = extractionPrompt;
    }

    if (model != null) {
      requestBody['model'] = model;
    }

    if (outputSchema != null) {
      requestBody['output_schema'] = outputSchema;
    }

    final response = await http.post(
      Uri.parse('$baseUrl/api/v1/process'),
      headers: {
        'X-API-Key': apiKey,
        'Content-Type': 'application/json',
      },
      body: json.encode(requestBody),
    );

    if (response.statusCode == 200) {
      return json.decode(response.body);
    } else {
      throw Exception('Failed to process document: ${response.statusCode}');
    }
  }

  // Get processing status
  Future<Map<String, dynamic>> getProcessingStatus(String requestId) async {
    final response = await http.get(
      Uri.parse('$baseUrl/api/v1/status/$requestId'),
      headers: {'X-API-Key': apiKey},
    );

    if (response.statusCode == 200) {
      return json.decode(response.body);
    } else {
      throw Exception('Failed to get processing status: ${response.statusCode}');
    }
  }

  // Dispose resources
  void dispose() {
    httpClient.close();
    dio.close();
  }
}
```

## Usage Examples

### Initialize the API Client

```dart
final apiClient = JaisonOcrApiClient(
  baseUrl: 'http://your-api-url:8420',
  apiKey: 'sk_your_api_key_here',
);
```

### Check API Health

```dart
Future<void> checkApiHealth() async {
  try {
    final healthStatus = await apiClient.checkHealth();
    print('API Status: ${healthStatus['status']}');
  } catch (e) {
    print('Error checking API health: $e');
  }
}
```

### Upload and Process a Document

```dart
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';

class DocumentScannerScreen extends StatefulWidget {
  @override
  _DocumentScannerScreenState createState() => _DocumentScannerScreenState();
}

class _DocumentScannerScreenState extends State<DocumentScannerScreen> {
  final JaisonOcrApiClient apiClient = JaisonOcrApiClient(
    baseUrl: 'http://your-api-url:8420',
    apiKey: 'sk_your_api_key_here',
  );
  
  final ImagePicker _picker = ImagePicker();
  
  String? fileId;
  String? requestId;
  Map<String, dynamic>? result;
  bool isLoading = false;
  String? errorMessage;

  @override
  void dispose() {
    apiClient.dispose();
    super.dispose();
  }

  Future<void> _pickAndUploadImage() async {
    setState(() {
      isLoading = true;
      errorMessage = null;
    });
    
    try {
      // Pick an image
      final XFile? image = await _picker.pickImage(source: ImageSource.gallery);
      if (image == null) {
        setState(() {
          isLoading = false;
        });
        return;
      }
      
      // Upload the image
      final uploadResult = await apiClient.uploadDocument(File(image.path));
      fileId = uploadResult['file_id'];
      
      // Process the document
      final processResult = await apiClient.processDocument(
        fileId: fileId!,
        documentType: 'receipt',
        extractionPrompt: 'Extract the total amount, date, and vendor name',
        model: 'meta-llama/llama-4-maverick:free',
        outputSchema: {
          'type': 'object',
          'properties': {
            'total_amount': {'type': 'number'},
            'date': {'type': 'string', 'format': 'date'},
            'vendor_name': {'type': 'string'}
          }
        },
      );
      
      requestId = processResult['request_id'];
      
      // Poll for results
      await _pollForResults();
      
    } catch (e) {
      setState(() {
        errorMessage = 'Error: $e';
        isLoading = false;
      });
    }
  }

  Future<void> _pollForResults() async {
    if (requestId == null) return;
    
    try {
      bool isComplete = false;
      
      while (!isComplete) {
        final statusResult = await apiClient.getProcessingStatus(requestId!);
        
        if (statusResult['status'] == 'completed') {
          setState(() {
            result = statusResult['result'];
            isLoading = false;
          });
          isComplete = true;
        } else if (statusResult['status'] == 'failed') {
          setState(() {
            errorMessage = 'Processing failed: ${statusResult['error']}';
            isLoading = false;
          });
          isComplete = true;
        } else {
          // Wait before polling again
          await Future.delayed(Duration(seconds: 2));
        }
      }
    } catch (e) {
      setState(() {
        errorMessage = 'Error polling for results: $e';
        isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Document Scanner'),
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            if (isLoading)
              CircularProgressIndicator()
            else if (errorMessage != null)
              Text(errorMessage!, style: TextStyle(color: Colors.red))
            else if (result != null)
              Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Extracted Data:', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
                    SizedBox(height: 8),
                    Text('Vendor: ${result!['vendor_name']}'),
                    Text('Date: ${result!['date']}'),
                    Text('Total Amount: \$${result!['total_amount']}'),
                  ],
                ),
              )
            else
              Text('Scan a document to extract information'),
            
            SizedBox(height: 20),
            
            ElevatedButton(
              onPressed: isLoading ? null : _pickAndUploadImage,
              child: Text('Scan Document'),
            ),
          ],
        ),
      ),
    );
  }
}
```

## Complete Example with Provider State Management

For a more robust implementation, you can use Provider for state management:

```dart
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';

// Add provider to pubspec.yaml
// provider: ^6.0.5

class OcrState extends ChangeNotifier {
  final JaisonOcrApiClient apiClient;
  
  OcrState({required this.apiClient});
  
  String? fileId;
  String? requestId;
  Map<String, dynamic>? result;
  bool isLoading = false;
  String? errorMessage;
  
  Future<void> scanDocument() async {
    final ImagePicker picker = ImagePicker();
    
    isLoading = true;
    errorMessage = null;
    notifyListeners();
    
    try {
      // Pick an image
      final XFile? image = await picker.pickImage(source: ImageSource.gallery);
      if (image == null) {
        isLoading = false;
        notifyListeners();
        return;
      }
      
      // Upload the image
      final uploadResult = await apiClient.uploadDocument(File(image.path));
      fileId = uploadResult['file_id'];
      
      // Process the document
      final processResult = await apiClient.processDocument(
        fileId: fileId!,
        documentType: 'receipt',
        extractionPrompt: 'Extract the total amount, date, and vendor name',
      );
      
      requestId = processResult['request_id'];
      
      // Poll for results
      await _pollForResults();
      
    } catch (e) {
      errorMessage = 'Error: $e';
      isLoading = false;
      notifyListeners();
    }
  }
  
  Future<void> _pollForResults() async {
    if (requestId == null) return;
    
    try {
      bool isComplete = false;
      
      while (!isComplete && isLoading) {
        final statusResult = await apiClient.getProcessingStatus(requestId!);
        
        if (statusResult['status'] == 'completed') {
          result = statusResult['result'];
          isLoading = false;
          notifyListeners();
          isComplete = true;
        } else if (statusResult['status'] == 'failed') {
          errorMessage = 'Processing failed: ${statusResult['error']}';
          isLoading = false;
          notifyListeners();
          isComplete = true;
        } else {
          // Wait before polling again
          await Future.delayed(Duration(seconds: 2));
        }
      }
    } catch (e) {
      errorMessage = 'Error polling for results: $e';
      isLoading = false;
      notifyListeners();
    }
  }
  
  void reset() {
    fileId = null;
    requestId = null;
    result = null;
    isLoading = false;
    errorMessage = null;
    notifyListeners();
  }
}

// Usage in main.dart
void main() {
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(
          create: (_) => OcrState(
            apiClient: JaisonOcrApiClient(
              baseUrl: 'http://your-api-url:8420',
              apiKey: 'sk_your_api_key_here',
            ),
          ),
        ),
      ],
      child: MyApp(),
    ),
  );
}

// Usage in a screen
class ScannerScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Document Scanner')),
      body: Consumer<OcrState>(
        builder: (context, ocrState, child) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                if (ocrState.isLoading)
                  CircularProgressIndicator()
                else if (ocrState.errorMessage != null)
                  Text(ocrState.errorMessage!, style: TextStyle(color: Colors.red))
                else if (ocrState.result != null)
                  _buildResultCard(ocrState.result!)
                else
                  Text('Scan a document to extract information'),
                
                SizedBox(height: 20),
                
                ElevatedButton(
                  onPressed: ocrState.isLoading ? null : () => ocrState.scanDocument(),
                  child: Text('Scan Document'),
                ),
                
                if (ocrState.result != null)
                  TextButton(
                    onPressed: () => ocrState.reset(),
                    child: Text('Scan Another'),
                  ),
              ],
            ),
          );
        },
      ),
    );
  }
  
  Widget _buildResultCard(Map<String, dynamic> result) {
    return Card(
      margin: EdgeInsets.all(16),
      child: Padding(
        padding: EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Extracted Data:', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
            SizedBox(height: 8),
            Text('Vendor: ${result['vendor_name']}'),
            Text('Date: ${result['date']}'),
            Text('Total Amount: \$${result['total_amount']}'),
          ],
        ),
      ),
    );
  }
}
```

## Error Handling

It's important to handle errors properly when interacting with the API:

```dart
try {
  // API call
} on DioException catch (e) {
  // Handle Dio errors (for file uploads)
  if (e.response != null) {
    print('Dio error: ${e.response?.statusCode} - ${e.response?.data}');
  } else {
    print('Dio error: ${e.message}');
  }
} on http.ClientException catch (e) {
  // Handle HTTP client errors
  print('HTTP error: $e');
} catch (e) {
  // Handle other errors
  print('Error: $e');
}
```

## Handling Different Document Types

You can create specialized methods for different document types:

```dart
// Process a receipt
Future<Map<String, dynamic>> processReceipt(String fileId) {
  return processDocument(
    fileId: fileId,
    documentType: 'receipt',
    extractionPrompt: 'Extract the total amount, date, vendor name, and all line items with prices',
    outputSchema: {
      'type': 'object',
      'properties': {
        'vendor_name': {'type': 'string'},
        'date': {'type': 'string', 'format': 'date'},
        'total_amount': {'type': 'number'},
        'items': {
          'type': 'array',
          'items': {
            'type': 'object',
            'properties': {
              'name': {'type': 'string'},
              'price': {'type': 'number'},
              'quantity': {'type': 'number'}
            }
          }
        }
      }
    },
  );
}

// Process an invoice
Future<Map<String, dynamic>> processInvoice(String fileId) {
  return processDocument(
    fileId: fileId,
    documentType: 'invoice',
    extractionPrompt: 'Extract the invoice number, date, due date, vendor, customer, and all line items with prices',
    outputSchema: {
      'type': 'object',
      'properties': {
        'invoice_number': {'type': 'string'},
        'date': {'type': 'string', 'format': 'date'},
        'due_date': {'type': 'string', 'format': 'date'},
        'vendor': {'type': 'string'},
        'customer': {'type': 'string'},
        'total_amount': {'type': 'number'},
        'items': {
          'type': 'array',
          'items': {
            'type': 'object',
            'properties': {
              'description': {'type': 'string'},
              'price': {'type': 'number'},
              'quantity': {'type': 'number'}
            }
          }
        }
      }
    },
  );
}
```

## Conclusion

This document provides the basic code snippets needed to integrate the Jaison OCR API with your Flutter application. You can customize these examples to fit your specific needs and UI requirements.

For more information, refer to the [Jaison API Documentation](../api.md).
