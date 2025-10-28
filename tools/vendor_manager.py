import json
import os
import re
import uuid
from datetime import datetime
from typing import Optional, List
from config import Config
from models import Vendor

class VendorManager:
    """Tool for managing vendor master data"""
    
    def __init__(self):
        Config.validate()
        self.db_path = Config.VENDOR_DB_PATH
        self.vendors = self._load_vendors()
    
    def search_vendor(self, name: str) -> Optional[Vendor]:
        """
        Search for vendor by name (case-insensitive, fuzzy)
        
        Args:
            name: Vendor name to search
            
        Returns:
            Vendor object if found, None otherwise
        """
        if not name:
            return None
        
        normalized_query = self._normalize_name(name)
        print(f"[SEARCH] Searching for vendor: '{name}' (normalized: '{normalized_query}')")
        
        # If normalized query is empty, return None
        if not normalized_query:
            print(f"[ERROR] No vendor found for: '{name}' (empty query after normalization)")
            return None
        
        # Exact match first
        for vendor in self.vendors:
            if vendor.normalized_name == normalized_query:
                print(f"[SUCCESS] Found exact match: {vendor.name} (ID: {vendor.vendor_id})")
                return vendor
        
        # Fuzzy match (contains) - but only if query is not empty
        for vendor in self.vendors:
            if normalized_query in vendor.normalized_name or vendor.normalized_name in normalized_query:
                print(f"[SUCCESS] Found fuzzy match: {vendor.name} (ID: {vendor.vendor_id})")
                return vendor
        
        print(f"[ERROR] No vendor found for: '{name}'")
        return None
    
    def create_vendor(
        self,
        name: str,
        address: Optional[str] = None,
        tax_id: Optional[str] = None,
        contact_email: Optional[str] = None,
        contact_phone: Optional[str] = None
    ) -> Vendor:
        """
        Create new vendor in the system
        
        Args:
            name: Vendor name
            address: Vendor address
            tax_id: Tax identification number
            contact_email: Contact email
            contact_phone: Contact phone
            
        Returns:
            Newly created Vendor object
        """
        print(f"[ADD] Creating new vendor: {name}")
        
        # Check if vendor already exists
        existing = self.search_vendor(name)
        if existing:
            print(f"[WARNING] Vendor already exists: {existing.name} (ID: {existing.vendor_id})")
            return existing
        
        # Create new vendor
        vendor = Vendor(
            vendor_id=self._generate_vendor_id(),
            name=name,
            normalized_name=self._normalize_name(name),
            address=address,
            tax_id=tax_id,
            contact_email=contact_email,
            contact_phone=contact_phone,
            created_at=datetime.now().isoformat()
        )
        
        self.vendors.append(vendor)
        self._save_vendors()
        
        print(f"[SUCCESS] Vendor created: {vendor.name} (ID: {vendor.vendor_id})")
        return vendor
    
    def list_vendors(self) -> List[Vendor]:
        """
        List all vendors
        
        Returns:
            List of all vendors
        """
        return self.vendors
    
    def get_or_create_vendor(
        self,
        name: str,
        address: Optional[str] = None,
        tax_id: Optional[str] = None
    ) -> Vendor:
        """
        Get existing vendor or create new one
        
        Args:
            name: Vendor name
            address: Vendor address (used if creating)
            tax_id: Tax ID (used if creating)
            
        Returns:
            Vendor object
        """
        vendor = self.search_vendor(name)
        if vendor:
            return vendor
        
        return self.create_vendor(
            name=name,
            address=address,
            tax_id=tax_id
        )
    
    def _normalize_name(self, name: str) -> str:
        """
        Normalize vendor name for matching
        - Lowercase
        - Remove punctuation
        - Remove extra spaces
        - Remove common suffixes (Inc, Ltd, LLC, etc.)
        """
        if not name:
            return ""
        normalized = name.lower()
        suffixes = [
            r'\binc\.?$', r'\bincorporated$', r'\bcorp\.?$', r'\bcorporation$',
            r'\bltd\.?$', r'\blimited$', r'\bllc\.?$', r'\bllp\.?$',
            r'\bco\.?$', r'\bcompany$', r'\bplc\.?$'
        ]
        for suffix in suffixes:
            normalized = re.sub(suffix, '', normalized)
        # Preserve whitespace when removing punctuation
        normalized = re.sub(r'[^\w\s]', '', normalized)
        normalized = ' '.join(normalized.split())
        return normalized.strip()
    
    def _generate_vendor_id(self) -> str:
        """Generate unique vendor ID"""
        return f"VEN-{uuid.uuid4().hex[:8].upper()}"
    
    def _load_vendors(self) -> List[Vendor]:
        """Load vendors from JSON file"""
        if not os.path.exists(self.db_path):
            return []
        
        try:
            with open(self.db_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                return [Vendor(**v) for v in data]
        except Exception as e:
            print(f"[WARNING] Error loading vendors: {e}")
            return []
    
    def _save_vendors(self):
        """Save vendors to JSON file"""
        try:
            with open(self.db_path, 'w', encoding='utf-8') as f:
                data = [v.model_dump() for v in self.vendors]
                json.dump(data, f, indent=2, ensure_ascii=False)
        except Exception as e:
            print(f"[ERROR] Error saving vendors: {e}")
            raise