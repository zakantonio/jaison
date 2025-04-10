"""
Service for managing and generating prompts
"""
from typing import Dict, Any, Optional, List
import json
from loguru import logger

from jaison.ocr_api.api.models import DocumentType, PromptTemplate


class PromptService:
    """Service for managing and generating prompts"""

    def __init__(self):
        """Initialize prompt service with default templates"""
        self.templates: Dict[DocumentType, PromptTemplate] = self._initialize_default_templates()

    def _initialize_default_templates(self) -> Dict[DocumentType, PromptTemplate]:
        """Initialize default prompt templates for each document type"""
        templates = {}

        # Receipt template
        templates[DocumentType.RECEIPT] = PromptTemplate(
            name="Default Receipt Template",
            document_type=DocumentType.RECEIPT,
            template="""
You are an expert OCR system specialized in extracting information from receipts.

Extract the following information from the receipt image:
1. Store/merchant name
2. Date of purchase
3. Time of purchase (if available)
4. Total amount
5. Currency
6. Payment method (if available)
7. List of items purchased with:
   - Item name
   - Quantity
   - Unit price
   - Total price for the item
8. Tax information (if available)
9. Receipt number or identifier (if available)
10. Store address (if available)
11. Store phone number (if available)

Additional user instructions: {user_prompt}

Format the output as a clean, structured JSON object with appropriate fields.
If a piece of information is not found in the receipt, use null for that field.
For the items list, create an array of objects with appropriate fields.

{output_schema_instruction}
""",
            description="Default template for extracting information from receipts",
            is_default=True,
            parameters=["user_prompt", "output_schema_instruction"],
        )

        # Invoice template
        templates[DocumentType.INVOICE] = PromptTemplate(
            name="Default Invoice Template",
            document_type=DocumentType.INVOICE,
            template="""
You are an expert OCR system specialized in extracting information from invoices.

Extract the following information from the invoice image:
1. Company/vendor name
2. Invoice number
3. Invoice date
4. Due date
5. Total amount
6. Currency
7. Payment terms
8. Customer information (name, address, etc.)
9. List of items/services with:
   - Description
   - Quantity
   - Unit price
   - Total price
10. Subtotal
11. Tax amount and rate
12. Shipping/handling fees (if applicable)
13. Payment instructions (if available)

Additional user instructions: {user_prompt}

Format the output as a clean, structured JSON object with appropriate fields.
If a piece of information is not found in the invoice, use null for that field.
For the items list, create an array of objects with appropriate fields.

{output_schema_instruction}
""",
            description="Default template for extracting information from invoices",
            is_default=True,
            parameters=["user_prompt", "output_schema_instruction"],
        )

        # ID Card template
        templates[DocumentType.ID_CARD] = PromptTemplate(
            name="Default ID Card Template",
            document_type=DocumentType.ID_CARD,
            template="""
You are an expert OCR system specialized in extracting information from ID cards.

Extract the following information from the ID card image:
1. Full name
2. ID number
3. Date of birth
4. Issue date
5. Expiration date
6. Address
7. Gender
8. Nationality (if available)
9. Document type (e.g., national ID, driver's license)
10. Issuing authority

Additional user instructions: {user_prompt}

Format the output as a clean, structured JSON object with appropriate fields.
If a piece of information is not found in the ID card, use null for that field.

IMPORTANT: If this is a real ID card, DO NOT include any sensitive personal information in the response.
Instead, replace actual values with placeholders like "REDACTED" while keeping the structure intact.

{output_schema_instruction}
""",
            description="Default template for extracting information from ID cards",
            is_default=True,
            parameters=["user_prompt", "output_schema_instruction"],
        )

        # Business Card template
        templates[DocumentType.BUSINESS_CARD] = PromptTemplate(
            name="Default Business Card Template",
            document_type=DocumentType.BUSINESS_CARD,
            template="""
You are an expert OCR system specialized in extracting information from business cards.

Extract the following information from the business card image:
1. Full name
2. Job title
3. Company name
4. Email address
5. Phone number(s)
6. Website
7. Physical address
8. Social media handles (if available)
9. Company logo description (if visible)
10. Any additional information or services mentioned

Additional user instructions: {user_prompt}

Format the output as a clean, structured JSON object with appropriate fields.
If a piece of information is not found in the business card, use null for that field.
For multiple phone numbers, create an array with labeled types (e.g., mobile, office, fax).

{output_schema_instruction}
""",
            description="Default template for extracting information from business cards",
            is_default=True,
            parameters=["user_prompt", "output_schema_instruction"],
        )

        # Ticket template
        templates[DocumentType.TICKET] = PromptTemplate(
            name="Default Ticket Template",
            document_type=DocumentType.TICKET,
            template="""
You are an expert OCR system specialized in extracting information from tickets.

Extract the following information from the ticket image:
1. Event name
2. Date and time
3. Venue name
4. Venue address
5. Seat/section information
6. Ticket price
7. Currency
8. Ticket holder name (if available)
9. Ticket/order number
10. Barcode/QR code presence (yes/no)
11. Additional information (restrictions, policies, etc.)

Additional user instructions: {user_prompt}

Format the output as a clean, structured JSON object with appropriate fields.
If a piece of information is not found in the ticket, use null for that field.

{output_schema_instruction}
""",
            description="Default template for extracting information from tickets",
            is_default=True,
            parameters=["user_prompt", "output_schema_instruction"],
        )

        # Coupon template
        templates[DocumentType.COUPON] = PromptTemplate(
            name="Default Coupon Template",
            document_type=DocumentType.COUPON,
            template="""
You are an expert OCR system specialized in extracting information from discount coupons.

Extract the following information from the coupon image:
1. Store/merchant name
2. Discount amount or percentage
3. Minimum purchase amount (if applicable)
4. Valid from date
5. Expiration date
6. Coupon code or identifier
7. Terms and conditions
8. Restrictions or exclusions
9. Barcode/QR code presence (yes/no)
10. Store location(s) where valid (if specified)

Additional user instructions: {user_prompt}

Format the output as a clean, structured JSON object with appropriate fields.
If a piece of information is not found in the coupon, use null for that field.

{output_schema_instruction}
""",
            description="Default template for extracting information from discount coupons",
            is_default=True,
            parameters=["user_prompt", "output_schema_instruction"],
        )

        # Generic template
        templates[DocumentType.GENERIC] = PromptTemplate(
            name="Default Generic Template",
            document_type=DocumentType.GENERIC,
            template="""
You are an expert OCR system specialized in extracting information from documents.

Extract the following information from the document image:
1. Document type/title
2. Date(s) mentioned
3. Names of individuals or organizations
4. Key data points and values
5. Any tables or structured data (convert to structured format)
6. Contact information
7. Any numerical values with their context
8. Any important notes, terms, or conditions

Additional user instructions: {user_prompt}

Format the output as a clean, structured JSON object with appropriate fields.
If a piece of information is not found in the document, use null for that field.
For tables, create arrays of objects with appropriate fields.

{output_schema_instruction}
""",
            description="Default template for extracting information from generic documents",
            is_default=True,
            parameters=["user_prompt", "output_schema_instruction"],
        )

        return templates

    def generate_prompt(
        self,
        document_type: DocumentType,
        user_prompt: str,
        output_schema: Optional[Dict[str, Any]] = None,
    ) -> str:
        """
        Generate a prompt for the given document type and user prompt

        Args:
            document_type: Type of document
            user_prompt: User's instructions for extraction
            output_schema: Optional JSON schema for structuring the output

        Returns:
            Generated prompt
        """
        # Get template for document type
        template = self.templates.get(document_type, self.templates[DocumentType.GENERIC])

        # Generate output schema instruction
        output_schema_instruction = ""
        if output_schema:
            output_schema_instruction = f"""
Use the following JSON schema for the output:
```json
{json.dumps(output_schema, indent=2)}
```
Ensure that your response strictly follows this schema.
"""

        # Format template with parameters
        prompt = template.template.format(
            user_prompt=user_prompt,
            output_schema_instruction=output_schema_instruction,
        )

        logger.debug(f"Generated prompt for {document_type}: {prompt[:100]}...")

        return prompt

    async def get_templates(self, document_type: Optional[DocumentType] = None) -> List[PromptTemplate]:
        """
        Get all templates or templates for a specific document type

        Args:
            document_type: Optional document type to filter templates

        Returns:
            List of templates
        """
        if document_type:
            return [self.templates[document_type]] if document_type in self.templates else []

        return list(self.templates.values())

    async def get_template(self, template_id: str) -> Optional[PromptTemplate]:
        """
        Get a template by ID

        Args:
            template_id: Template ID

        Returns:
            Template if found, None otherwise
        """
        for template in self.templates.values():
            if template.id == template_id:
                return template

        return None

    async def create_template(self, template: PromptTemplate) -> PromptTemplate:
        """
        Create a new template

        Args:
            template: Template to create

        Returns:
            Created template
        """
        # In a real implementation, we would save this to the database
        # For now, we'll just add it to our in-memory dictionary
        if template.is_default:
            # If this is a default template, unset default flag on existing default
            if template.document_type in self.templates:
                existing = self.templates[template.document_type]
                if existing.is_default:
                    existing.is_default = False

        self.templates[template.document_type] = template

        return template
