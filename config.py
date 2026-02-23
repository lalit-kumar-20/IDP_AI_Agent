import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    """Central configuration for the Invoice Intelligence Agent"""
    
    # API Keys
    GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
    
    # Model Configuration
    GEMINI_MODEL = "gemini-2.5-flash"
    
    # Storage Paths
    EXTRACTED_TEXT_DIR = os.getenv("EXTRACTED_TEXT_DIR", "extracted_texts")
    VECTOR_DB_DIR = os.getenv("VECTOR_DB_DIR", "vector_db")
    VENDOR_DB_PATH = os.getenv("VENDOR_DB_PATH", "vendor_database.json")
    
    # Embedding Configuration
    COLLECTION_NAME = "invoice_documents"
    
    @classmethod
    def validate(cls):
        """Validate required configuration"""
        if not cls.GOOGLE_API_KEY:
            raise ValueError("GOOGLE_API_KEY not found in environment variables")
        
        # Create directories if they don't exist
        os.makedirs(cls.EXTRACTED_TEXT_DIR, exist_ok=True)
        os.makedirs(cls.VECTOR_DB_DIR, exist_ok=True)