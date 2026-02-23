import chromadb
from chromadb.config import Settings
from config import Config
import uuid

class VectorIndexer:
    """Tool for indexing and embedding extracted text"""
    
    def __init__(self):
        Config.validate()
        
        # Initialize ChromaDB client
        self.client = chromadb.PersistentClient(
            path=Config.VECTOR_DB_DIR,
            settings=Settings(anonymized_telemetry=False)
        )
        
        # Get or create collection
        self.collection = self.client.get_or_create_collection(
            name=Config.COLLECTION_NAME,
            metadata={"description": "Invoice document embeddings"}
        )
    
    def index_document(self, document_id: str, text_content: str) -> str:
        """
        Index document text into vector database
        
        Args:
            document_id: Unique identifier for the document
            text_content: Extracted text content
            
        Returns:
            Document ID that was indexed
        """
        print(f"[INDEX] Indexing document: {document_id}")
        
        # Split text into chunks for better embedding
        chunks = self._chunk_text(text_content)
        
        # Prepare data for indexing
        chunk_ids = [f"{document_id}_chunk_{i}" for i in range(len(chunks))]
        metadatas = [
            {
                "document_id": document_id,
                "chunk_index": i,
                "chunk_count": len(chunks)
            }
            for i in range(len(chunks))
        ]
        
        print("**********",chunks)
        print("**********",metadatas)
        print("**********",chunk_ids)
        # Add to collection
        self.collection.add(
            documents=chunks,
            metadatas=metadatas,
            ids=chunk_ids
        )
        
        print(f"[SUCCESS] Indexed {len(chunks)} chunks for document {document_id}")
        return document_id
    
    def query_document(self, document_id: str, query: str, n_results: int = 5) -> list:
        """
        Query specific document for relevant chunks
        
        Args:
            document_id: Document to query
            query: Search query
            n_results: Number of results to return
            
        Returns:
            List of relevant text chunks
        """
        results = self.collection.query(
            query_texts=[query],
            n_results=n_results,
            where={"document_id": document_id}
        )
        
        if results and results['documents']:
            return results['documents'][0]
        return []
    
    def get_full_document(self, document_id: str) -> str:
        """
        Retrieve full document text from chunks
        
        Args:
            document_id: Document ID to retrieve
            
        Returns:
            Full reconstructed text
        """
        # Get all chunks for this document
        results = self.collection.get(
            where={"document_id": document_id}
        )
        
        if not results or not results['documents']:
            return ""
        
        # Sort by chunk index and reconstruct
        chunks_with_index = list(zip(
            results['documents'],
            results['metadatas']
        ))
        chunks_with_index.sort(key=lambda x: x[1]['chunk_index'])
        
        return "\n".join([chunk[0] for chunk in chunks_with_index])
    
    def _chunk_text(self, text: str, chunk_size: int = 1000, overlap: int = 200) -> list:
        """
        Split text into overlapping chunks
        
        Args:
            text: Text to chunk
            chunk_size: Size of each chunk in characters
            overlap: Overlap between chunks
            
        Returns:
            List of text chunks
        """
        if len(text) <= chunk_size:
            return [text]
        
        chunks = []
        start = 0
        
        while start < len(text):
            end = start + chunk_size
            chunk = text[start:end]
            
            # Try to break at sentence or word boundary
            if end < len(text):
                last_period = chunk.rfind('.')
                last_newline = chunk.rfind('\n')
                last_space = chunk.rfind(' ')
                
                break_point = max(last_period, last_newline, last_space)
                if break_point > chunk_size * 0.7:  # Only if reasonable
                    chunk = text[start:start + break_point + 1]
                    end = start + break_point + 1
            
            chunks.append(chunk)
            start = end - overlap
        
        return chunks