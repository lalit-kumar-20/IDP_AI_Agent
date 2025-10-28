#!/usr/bin/env python3
"""
Unit tests for invoice parsing edge cases
"""

import unittest
import json
from tools.invoice_parser import InvoiceParser
from models import InvoiceData

class TestInvoiceParserEdgeCases(unittest.TestCase):
    """Test edge cases for invoice parsing"""
    
    def setUp(self):
        self.parser = InvoiceParser()
    
    def test_empty_invoice_text(self):
        """Test parsing empty or whitespace-only text"""
        empty_text = ""
        whitespace_text = "   \n\t   "
        
        # Should handle gracefully without crashing
        try:
            result_empty = self.parser.parse_invoice(empty_text)
            result_whitespace = self.parser.parse_invoice(whitespace_text)
            
            # Should return valid InvoiceData structure with mostly null values
            self.assertIsInstance(result_empty, InvoiceData)
            self.assertIsInstance(result_whitespace, InvoiceData)
            
        except Exception as e:
            self.fail(f"Parser should handle empty text gracefully: {e}")
    
    def test_malformed_invoice_text(self):
        """Test parsing text that doesn't look like an invoice"""
        malformed_texts = [
            "This is just random text with no invoice data",
            "12345 !@#$% random symbols",
            "Invoice\nBut no actual data follows",
        ]
        
        for text in malformed_texts:
            with self.subTest(text=text[:20]):
                try:
                    result = self.parser.parse_invoice(text)
                    self.assertIsInstance(result, InvoiceData)
                    # Most fields should be None for malformed text
                    
                except Exception as e:
                    self.fail(f"Parser should handle malformed text gracefully: {e}")
    
    def test_partial_invoice_data(self):
        """Test parsing invoice with only some fields present"""
        partial_invoice = """
        INVOICE
        Invoice Number: INV-123
        Total: $500.00
        """
        
        try:
            result = self.parser.parse_invoice(partial_invoice)
            self.assertIsInstance(result, InvoiceData)
            
            # Should extract available fields
            self.assertIsNotNone(result.metadata)
            
        except Exception as e:
            self.fail(f"Parser should handle partial data gracefully: {e}")
    
    def test_extract_json_edge_cases(self):
        """Test JSON extraction from various response formats"""
        test_cases = [
            '{"invoice_number": "123"}',  # Clean JSON
            '```json\n{"invoice_number": "123"}\n```',  # Markdown wrapped
            '```\n{"invoice_number": "123"}\n```',  # Generic code block
            'Some text\n{"invoice_number": "123"}\nMore text',  # Embedded JSON
        ]
        
        for case in test_cases:
            with self.subTest(case=case[:30]):
                try:
                    extracted = self.parser._extract_json(case)
                    parsed = json.loads(extracted)
                    self.assertEqual(parsed["invoice_number"], "123")
                    
                except Exception as e:
                    self.fail(f"JSON extraction failed for case '{case[:30]}': {e}")
    
    def test_field_extraction_edge_cases(self):
        """Test specific field extraction edge cases"""
        test_text = "Invoice #12345 dated 2024-01-01 total $100.00"
        
        edge_cases = [
            ("", None),  # Empty field name
            ("nonexistent_field", None),  # Field that doesn't exist
            ("invoice_number", "12345"),  # Should find this
        ]
        for field_name, expected_contains in edge_cases:
            with self.subTest(field=field_name):
                try:
                    result = self.parser.extract_specific_field(test_text, field_name)
                    self.assertIsInstance(result, dict)
                    
                    if expected_contains:
                        # Should contain the field name as key
                        self.assertIn(field_name, result)
                    
                except Exception as e:
                    self.fail(f"Field extraction failed for '{field_name}': {e}")

class TestVendorManagerEdgeCases(unittest.TestCase):
    """Test edge cases for vendor management"""
    
    def setUp(self):
        from tools.vendor_manager import VendorManager
        self.vendor_manager = VendorManager()
    
    def test_vendor_name_normalization(self):
        """Test vendor name normalization edge cases"""
        test_cases = [
            ("Tech Corp Inc.", "tech corp"),  
            ("ABC Ltd", "abc"),  
            ("XYZ Co.", "xyz"), 
            ("Test LLC", "test"),
            ("Multi-Word & Co., Ltd.", "multiword co"), 
            ("", ""),  
        ]
        
        for input_name, expected_normalized in test_cases:
            with self.subTest(name=input_name):
                normalized = self.vendor_manager._normalize_name(input_name)
                self.assertEqual(normalized, expected_normalized)
    
    def test_vendor_search_edge_cases(self):
        """Test vendor search with edge cases"""
        edge_cases = [
            "",  # Empty search
            "   ",  # Whitespace only
            "NonexistentVendor123",  # Doesn't exist
        ]
        
        for search_term in edge_cases:
            with self.subTest(term=search_term):
                try:
                    result = self.vendor_manager.search_vendor(search_term)
                    # Should return None for non-existent vendors
                    self.assertIsNone(result)
                    
                except Exception as e:
                    self.fail(f"Vendor search should handle '{search_term}' gracefully: {e}")

if __name__ == '__main__':
    unittest.main()
