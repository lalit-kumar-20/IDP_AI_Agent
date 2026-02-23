import json
from typing import Optional
from tools.pdf_extractor import PDFExtractor
from tools.vector_indexer import VectorIndexer
from tools.invoice_parser import InvoiceParser
from tools.vendor_manager import VendorManager
from models import InvoiceData, Vendor

class InvoiceAgent:
    """
    Main orchestrator for Invoice Intelligence Agent
    Coordinates all tools to process invoices and handle corrections
    """
    
    def __init__(self):
        self.pdf_extractor = PDFExtractor()
        self.vector_indexer = VectorIndexer()
        self.invoice_parser = InvoiceParser()
        self.vendor_manager = VendorManager()
        
        # Session state
        self.current_document_id: Optional[str] = None
        self.current_text: Optional[str] = None
        self.current_invoice_data: Optional[InvoiceData] = None
    
    def process_invoice(self, pdf_path: str, document_id: str) -> dict:
        """
        Complete invoice processing pipeline
        
        1. Extract text from PDF
        2. Index text in vector database
        3. Parse structured data
        4. Search/create vendor
        
        Args:
            pdf_path: Path to PDF invoice
            document_id: Unique identifier for this invoice
            
        Returns:
            Dictionary with invoice data and vendor info
        """
        print(f"\n{'='*60}")
        print(f"PROCESSING INVOICE: {document_id}")
        print(f"{'='*60}\n")
        
        # Step 1: Extract text
        print("STEP 1: Extract Text from PDF")
        print("-" * 40)
        self.current_text = self.pdf_extractor.extract_text(pdf_path, document_id)
        self.current_document_id = document_id
        
        # Step 2: Index in vector database
        print(f"\nSTEP 2: Index Document in Vector Database")
        print("-" * 40)
        self.vector_indexer.index_document(document_id, self.current_text)
        
        # Step 3: Parse invoice data
        print(f"\nSTEP 3: Parse Invoice Data")
        print("-" * 40)
        self.current_invoice_data = self.invoice_parser.parse_invoice(self.current_text)
        
        # Step 4: Handle vendor
        print(f"\nSTEP 4: Vendor Management")
        print("-" * 40)
        vendor = self._handle_vendor()
        
        # Prepare response
        result = {
            "document_id": document_id,
            "extracted_text": self.current_text,
            "invoice_data": self.current_invoice_data.model_dump(),
            "vendor": vendor.model_dump() if vendor else None
        }
        
        print(f"\n{'='*60}")
        print(f"[SUCCESS] PROCESSING COMPLETE")
        print(f"{'='*60}\n")
        
        return result
    
    def apply_correction(self, correction_query: str) -> dict:
        """
        Apply correction to current invoice without re-processing
        
        Args:
            correction_query: User's correction request
            
        Returns:
            Updated invoice data
        """
        if not self.current_document_id or not self.current_text:
            raise ValueError("No invoice currently loaded. Process an invoice first.")
        
        print(f"\n{'='*60}")
        print(f"[UPDATE] APPLYING CORRECTION")
        print(f"{'='*60}\n")
        print(f"Query: {correction_query}")
        print("-" * 40)
        
        # Use vector retrieval for corrections to find relevant context
        print(f"[SEARCH] Using vector retrieval for correction context")
        relevant_chunks = self.vector_indexer.query_document(
            self.current_document_id,
            correction_query,
            n_results=2
        )
        
        print(f"Relevant chunks: {relevant_chunks}")
        if relevant_chunks:
            # Combine relevant chunks with full text for better context
            # This ensures we have the exact relevant parts plus surrounding context
            focused_text = "\n\n".join(relevant_chunks)
            print(f"[SUCCESS] Retrieved {len(relevant_chunks)} relevant chunks from vector DB")
            print(f"[EFFICIENCY] Using {len(focused_text)} relevant chars for correction")
        else:
            focused_text = self.current_text
            print(f"[INFO] Using full document for correction")
        
        # Apply correction using re-prompting
        self.current_invoice_data = self.invoice_parser.reprompt_correction(
            focused_text,
            self.current_invoice_data,
            correction_query
        )
        
        # Re-check vendor if vendor name was updated
        vendor = None
        if self.current_invoice_data.metadata.vendor_name:
            print(f"\nRe-checking vendor after correction...")
            vendor = self._handle_vendor()
        
        result = {
            "document_id": self.current_document_id,
            "invoice_data": self.current_invoice_data.model_dump(),
            "vendor": vendor.model_dump() if vendor else None
        }
        
        print(f"\n{'='*60}")
        print(f"[SUCCESS] CORRECTION APPLIED")
        print(f"{'='*60}\n")
        
        return result
    
    def extract_field(self, field_name: str, context: Optional[str] = None) -> dict:
        """
        Extract specific field from current invoice using vector retrieval
        
        Args:
            field_name: Name of field to extract
            context: Additional context
            
        Returns:
            Extracted field data
        """
        if not self.current_document_id or not self.current_text:
            raise ValueError("No invoice currently loaded. Process an invoice first.")
        
        print(f"\n{'='*60}")
        print(f"[TARGET] EXTRACTING SPECIFIC FIELD")
        print(f"{'='*60}\n")
        
        # Build enhanced query for better semantic search
        semantic_query = self._build_semantic_query(field_name, context)
        print(f"[SEARCH] Querying vector database with: '{semantic_query}'")
        
        # Use vector retrieval to get relevant chunks
        relevant_chunks = self.vector_indexer.query_document(
            self.current_document_id, 
            semantic_query,
            n_results=2
        )
        
        print(f"Relevant chunks: {relevant_chunks}")
        if relevant_chunks:
            # Combine relevant chunks into focused text
            focused_text = "\n\n".join(relevant_chunks)
            print(f"[SUCCESS] Retrieved {len(relevant_chunks)} relevant chunks from vector DB")
            print(f"[EFFICIENCY] Sending {len(focused_text)} chars (vs {len(self.current_text)} full doc) - "
                  f"{(1 - len(focused_text)/len(self.current_text))*100:.1f}% reduction")
        else:
            # Fallback to full text if no chunks found
            print(f"[WARNING] No relevant chunks found, using full document")
            focused_text = self.current_text
        
        extracted = self.invoice_parser.extract_specific_field(
            focused_text,
            field_name,
            context
        )
        
        print(f"\n{'='*60}")
        print(f"[SUCCESS] FIELD EXTRACTED")
        print(f"{'='*60}\n")
        
        return extracted
    
    def _build_semantic_query(self, field_name: str, context: Optional[str] = None) -> str:
        """Build semantic query from field name for better vector search"""
        # Field name to semantic query mapping
        field_queries = {
            "po_number": "purchase order number P.O. PO",
            "po": "purchase order number P.O. PO",
            "invoice_number": "invoice number invoice #",
            "invoice_date": "invoice date issue date billed date",
            "due_date": "due date payment due by",
            "vendor_name": "vendor company seller supplier",
            "vendor_address": "vendor address seller address",
            "customer_name": "bill to customer buyer client",
            "customer_address": "bill to address customer address",
            "currency": "currency USD EUR GBP money",
            "subtotal": "subtotal before tax sum total",
            "tax_total": "tax total VAT GST sales tax",
            "total_amount": "total amount grand total final total",
            "payment_terms": "payment terms net days",
            "line_items": "line items products services items quantities prices",
            "description": "item description product service",
            "quantity": "quantity qty amount",
            "unit_price": "unit price price per",
            "amount": "amount total price",
            "tax_rate": "tax rate percentage",
        }
        
        # Normalize field name
        normalized_field = field_name.lower().replace(" ", "_").replace("-", "_")
        
        # Try to find exact match in mappings
        if normalized_field in field_queries:
            query = field_queries[normalized_field]
        else:
            # Otherwise use field name with related terms
            query = f"{field_name} {normalized_field}"
        
        # Add context if provided
        if context:
            query = f"{query} {context}"
        
        return query
    
    def get_current_data(self) -> Optional[dict]:
        """Get current invoice data"""
        if not self.current_invoice_data:
            return None
        
        return {
            "document_id": self.current_document_id,
            "invoice_data": self.current_invoice_data.model_dump()
        }
    
    def _handle_vendor(self) -> Optional[Vendor]:
        """Handle vendor search and creation"""
        vendor_name = self.current_invoice_data.metadata.vendor_name
        
        if not vendor_name:
            print("[WARNING] No vendor name found in invoice")
            return None
        
        # Search for existing vendor
        vendor = self.vendor_manager.search_vendor(vendor_name)
        
        if vendor:
            print(f"[SUCCESS] Using existing vendor: {vendor.name} (ID: {vendor.vendor_id})")
            return vendor
        
        # Create new vendor
        print(f"[INFO] Vendor not found, creating new vendor...")
        vendor = self.vendor_manager.create_vendor(
            name=vendor_name,
            address=self.current_invoice_data.metadata.vendor_address,
            tax_id=self.current_invoice_data.metadata.vendor_tax_id
        )
        
        return vendor
    
    def print_invoice_summary(self):
        """Print formatted summary of current invoice"""
        if not self.current_invoice_data:
            print("No invoice data available")
            return
        
        data = self.current_invoice_data
        
        print("\n" + "="*60)
        print("[SUMMARY] INVOICE SUMMARY")
        print("="*60)
        
        print("\n[METADATA]:")
        print("-" * 40)
        for key, value in data.metadata.model_dump().items():
            if value is not None:
                print(f"  {key:20s}: {value}")
        
        print(f"\n[LINE ITEMS] ({len(data.line_items)} items):")
        print("-" * 40)
        for i, item in enumerate(data.line_items, 1):
            print(f"\n  Item {i}:")
            for key, value in item.model_dump().items():
                if value is not None:
                    print(f"    {key:15s}: {value}")
        
        print("\n" + "="*60 + "\n")