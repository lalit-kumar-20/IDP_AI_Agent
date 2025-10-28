import os
import google.generativeai as genai
from config import Config

class PDFExtractor:
    """Tool for extracting text from PDF invoices"""
    
    def __init__(self):
        Config.validate()
        genai.configure(api_key=Config.GOOGLE_API_KEY)
        self.model = genai.GenerativeModel(Config.GEMINI_MODEL)
    
    def extract_text(self, pdf_path: str, document_id: str) -> str:
        """
        Extract text from PDF and save to file
        
        Args:
            pdf_path: Path to the PDF file
            document_id: Unique identifier for this document
            
        Returns:
            Extracted text content
        """
        if not os.path.exists(pdf_path):
            raise FileNotFoundError(f"PDF not found: {pdf_path}")
        
        print(f"[FILE] Extracting text from: {pdf_path}")
        
        # Read PDF as binary
        with open(pdf_path, "rb") as f:
            pdf_data = f.read()
        
        # Prompt for layout-preserving extraction
        prompt = """
        Extract all readable text from this PDF invoice document.
        Preserve the layout, structure, and formatting as closely as possible.
        Include all headers, tables, line items, totals, and footer information.
        Maintain proper spacing and line breaks.
        """
        
        # Send request to Gemini
        response = self.model.generate_content(
            [prompt, {"mime_type": "application/pdf", "data": pdf_data}]
        )
        
        extracted_text = response.text
        
        # Save to file
        output_path = os.path.join(
            Config.EXTRACTED_TEXT_DIR,
            f"{document_id}_extracted.txt"
        )
        
        with open(output_path, "w", encoding="utf-8") as out:
            out.write(extracted_text)
        
        print(f"[SUCCESS] Text extracted and saved to: {output_path}")
        print(f"[INFO] Extracted {len(extracted_text)} characters")
        
        return extracted_text