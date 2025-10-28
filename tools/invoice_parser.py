import json
import google.generativeai as genai
from config import Config
from models import InvoiceData, InvoiceMetadata, LineItem
from typing import Optional

class InvoiceParser:
    """Tool for extracting structured data from invoice text"""
    
    def __init__(self):
        Config.validate()
        genai.configure(api_key=Config.GOOGLE_API_KEY)
        self.model = genai.GenerativeModel(Config.GEMINI_MODEL)
    
    def parse_invoice(self, text_content: str) -> InvoiceData:
        """
        Parse invoice text into structured JSON format
        """
        text_content = text_content.strip()
        if not text_content:
            return InvoiceData(metadata=InvoiceMetadata(), line_items=[])
        print(f"[PARSE] Parsing invoice data...")
        prompt = self._build_extraction_prompt()
        response = self.model.generate_content([prompt, text_content])
        try:
            json_text = self._extract_json(response.text)
            data_dict = json.loads(json_text)
            invoice_data = InvoiceData(**data_dict)
            print(f"[SUCCESS] Parsed metadata fields: {len([k for k, v in invoice_data.metadata.model_dump().items() if v is not None])}")
            print(f"[SUCCESS] Parsed line items: {len(invoice_data.line_items)}")
            return invoice_data
        except Exception as e:
            print(f"[ERROR] Error parsing invoice: {e}")
            print(f"Raw response: {response.text[:500]}...")
            raise
    
    def reprompt_correction(
        self,
        text_content: str,
        current_data: InvoiceData,
        correction_query: str
    ) -> InvoiceData:
        """
        Handle follow-up corrections without re-processing entire document
        
        Args:
            text_content: Original extracted text
            current_data: Current invoice data
            correction_query: User's correction request
            
        Returns:
            Updated InvoiceData with corrections applied
        """
        print(f"[UPDATE] Processing correction: {correction_query}")
        
        prompt = self._build_correction_prompt(current_data, correction_query)
        
        response = self.model.generate_content([prompt, text_content])
        
        try:
            json_text = self._extract_json(response.text)
            correction_dict = json.loads(json_text)
            
            # Merge corrections into current data
            updated_data = self._apply_corrections(current_data, correction_dict)
            
            print(f"[SUCCESS] Applied corrections successfully")
            return updated_data
        except Exception as e:
            print(f"[ERROR] Error applying correction: {e}")
            print(f"Raw response: {response.text[:500]}...")
            raise
    
    def extract_specific_field(
        self,
        text_content: str,
        field_name: str,
        context: Optional[str] = None
    ) -> dict:
        """
        Extract a specific field or set of fields from invoice
        
        Args:
            text_content: Original extracted text
            field_name: Name of field to extract
            context: Additional context for extraction
            
        Returns:
            Dictionary with extracted field(s)
        """
        print(f"[TARGET] Extracting specific field: {field_name}")
        
        prompt = f"""
        From the following invoice text, extract ONLY the requested field(s).
        
        Requested field: {field_name}
        {f"Additional context: {context}" if context else ""}
        
        Return your response as a JSON object with the field name as key.
        If the field is not found or unclear, return null as the value.
        
        Examples:
        - For "PO number": {{"po_number": "PO-12345"}}
        - For "line items": {{"line_items": [...]}}
        - For "currency": {{"currency": "GBP"}}
        
        Only return the JSON, no other text.
        
        Invoice text:
        """
        
        response = self.model.generate_content([prompt, text_content])
        
        try:
            json_text = self._extract_json(response.text)
            result = json.loads(json_text)
            print(f"[SUCCESS] Extracted: {result}")
            return result
        except Exception as e:
            print(f"[ERROR] Error extracting field: {e}")
            return {field_name: None}
    
    def _build_extraction_prompt(self) -> str:
        """Build prompt for initial invoice extraction"""
        return """
        Extract ALL information from this invoice document and structure it as JSON.
        
        Return the data in this EXACT format:
        {
          "metadata": {
            "invoice_number": "string or null",
            "invoice_date": "string or null",
            "due_date": "string or null",
            "vendor_name": "string or null",
            "vendor_address": "string or null",
            "vendor_tax_id": "string or null",
            "customer_name": "string or null",
            "customer_address": "string or null",
            "po_number": "string or null",
            "currency": "string or null",
            "subtotal": number or null,
            "tax_total": number or null,
            "total_amount": number or null,
            "payment_terms": "string or null"
          },
          "line_items": [
            {
              "description": "string or null",
              "quantity": number or null,
              "unit_price": number or null,
              "amount": number or null,
              "tax_rate": number or null,
              "tax_amount": number or null
            }
          ]
        }
        
        IMPORTANT:
        - Extract ALL line items as separate objects in the line_items array
        - Use null for fields that are not found or unclear
        - For numbers, use numeric types (not strings)
        - For dates, keep as strings in the format found
        - Only return the JSON, no other text 
        
        Invoice text:
        """
    
    def _build_correction_prompt(
        self,
        current_data: InvoiceData,
        correction_query: str
    ) -> str:
        """Build prompt for correction/re-prompting"""
        current_json = json.dumps(current_data.model_dump(), indent=2)
        
        return f"""
        You have previously extracted this invoice data:
        
        {current_json}
        
        The user has provided this correction/request:
        "{correction_query}"
        
        Based on the invoice text below, provide ONLY the corrected or newly requested fields.
        Return a JSON object with the same structure, but include ONLY the fields that need updating.
        
        Examples:
        - If user says "PO number is missing", extract: {{"metadata": {{"po_number": "value"}}}}
        - If user says "Currency is GBP not USD", return: {{"metadata": {{"currency": "GBP"}}}}
        - If user says "Extract line items", return: {{"line_items": [...]}}
        
        Only return the JSON with changed/new fields, no other text.
        
        Invoice text:
        """
    
    def _apply_corrections(
        self,
        current_data: InvoiceData,
        correction_dict: dict
    ) -> InvoiceData:
        """Apply delta corrections to current data"""
        current_dict = current_data.model_dump()
        
        # Apply metadata corrections
        if 'metadata' in correction_dict:
            for key, value in correction_dict['metadata'].items():
                if value is not None:
                    current_dict['metadata'][key] = value
        
        # Apply line items corrections (replace entirely if provided)
        if 'line_items' in correction_dict and correction_dict['line_items']:
            current_dict['line_items'] = correction_dict['line_items']
        
        return InvoiceData(**current_dict)
    
    def _extract_json(self, text: str) -> str:
        """Extract JSON from response text"""
        import re
        
        text = text.strip()
        
        # Remove markdown code blocks if present
        if text.startswith('```json'):
            text = text[7:]
        elif text.startswith('```'):
            text = text[3:]
        if text.endswith('```'):
            text = text[:-3]
        
        # Handle embedded JSON - find JSON objects in text
        json_pattern = r'\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}'
        matches = re.findall(json_pattern, text, re.DOTALL)
        
        if matches:
            # Return the first complete JSON object found
            return matches[0].strip()
        
        return text.strip()