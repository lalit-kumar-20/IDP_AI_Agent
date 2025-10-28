# Invoice Intelligence Agent - Backend

A professional AI-powered backend system for extracting, indexing, and managing invoice data with support for conversational corrections and vendor master data management.

## 🌟 Features

- **PDF Text Extraction**: Extract text from invoice PDFs using Google Gemini AI
- **Vector Indexing**: Index extracted text with ChromaDB for efficient querying
- **Structured Data Extraction**: Parse invoices into structured JSON (metadata + line items)
- **Re-prompting Support**: Apply corrections without re-processing entire documents
- **Vendor Management**: Search and create vendors with fuzzy matching
- **Delta Operations**: Corrections update only changed fields, preserving existing data
- **CLI Interface**: Interactive command-line interface for easy testing

## 📁 Project Structure

```
invoice-intelligence-agent/
├── config.py                 # Central configuration
├── models.py                 # Pydantic data models
├── invoice_agent.py          # Main orchestrator
├── main.py                   # CLI interface
├── tools/
│   ├── pdf_extractor.py     # PDF text extraction
│   ├── vector_indexer.py    # Vector database indexing
│   ├── invoice_parser.py    # Invoice parsing & re-prompting
│   └── vendor_manager.py    # Vendor master data management
├── tests/
│   ├── test_invoice_parser.py
│   └── __init__.py
├── requirements.txt
└── .env                     # API keys (create this)
```

## 🚀 Setup

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Configure API Key

Create a `.env` file in the project root:

```env
GOOGLE_API_KEY=your_gemini_api_key_here
```

Get your free API key from [Google AI Studio](https://makersuite.google.com/app/apikey)

### 3. Create Required Directories

The application will auto-create these, but you can create them manually:

```bash
mkdir -p extracted_texts vector_db
```

## 💻 Usage

### Interactive Mode

Run the CLI in interactive mode:

```bash
python main.py
```

Available commands:
- `process <pdf_path> <document_id>` - Process a new invoice
- `correct <correction_text>` - Apply correction to current invoice
- `extract <field_name>` - Extract specific field
- `show` - Display current invoice data
- `save <output_file>` - Save data to JSON
- `vendors` - List all vendors
- `help` - Show detailed help
- `exit` - Exit application

### Command Line Mode

Process an invoice directly:

```bash
python main.py process sample.pdf INV-2024-001
```

### Example Workflow

```bash
# Start interactive mode
python main.py

# Process invoice
> process sample.pdf INV001

# View extracted data
> show

# Apply correction if needed
> correct The PO number is PO-12345, not missing

# Extract specific field
> extract payment_terms

# Save to file
> save invoice_INV001.json

# List all vendors
> vendors

# Exit
> exit
```

## 🔧 Architecture

### 1. PDF Extraction (`pdf_extractor.py`)
- Uses Google Gemini 2.5 Flash model
- Preserves layout and formatting
- Saves extracted text to file

### 2. Vector Indexing (`vector_indexer.py`)
- Uses ChromaDB for embeddings
- Chunks text for efficient retrieval
- Supports document-specific queries

### 3. Invoice Parsing (`invoice_parser.py`)
- **Initial Extraction**: Converts text to structured JSON
- **Re-prompting**: Applies delta corrections without full re-processing
- **Field Extraction**: Extracts specific fields on demand
- **Structured Output**: Returns data in consistent format

### 4. Vendor Management (`vendor_manager.py`)
- **Search**: Case-insensitive, punctuation-agnostic matching
- **Fuzzy Matching**: Handles business suffix variations (Inc., Ltd., LLC, etc.)
- **Create**: Auto-generates vendor IDs
- **Persistence**: Stores vendors in JSON file

### 5. Main Orchestrator (`invoice_agent.py`)
- Coordinates all tools in proper sequence
- Maintains session state
- Handles vendor search/create workflow
- Uses vector retrieval for efficient field extraction

## 📊 Data Models

### Invoice Data Structure

```json
{
  "document_id": "INV001",
  "invoice_data": {
    "metadata": {
      "invoice_number": "INV-2024-001",
      "invoice_date": "2024-01-15",
      "due_date": "2024-02-15",
      "vendor_name": "TechSupply Inc.",
      "vendor_address": "456 Vendor Ave",
      "vendor_tax_id": "12-3456789",
      "customer_name": "Acme Corporation",
      "customer_address": "123 Business St",
      "po_number": "PO-12345",
      "currency": "USD",
      "subtotal": 2525.00,
      "tax_total": 252.50,
      "total_amount": 2777.50,
      "payment_terms": "Net 30"
    },
    "line_items": [
      {
        "description": "Laptop Computer",
        "quantity": 2,
        "unit_price": 1200.00,
        "amount": 2400.00,
        "tax_rate": 10.0,
        "tax_amount": 240.00
      },
      {
        "description": "Mouse Pad",
        "quantity": 1,
        "unit_price": 25.00,
        "amount": 25.00,
        "tax_rate": 10.0,
        "tax_amount": 2.50
      }
    ]
  }
}
```

### Vendor Data Structure

```json
{
  "vendor_id": "VEN-A1B2C3D4",
  "name": "TechSupply Inc.",
  "normalized_name": "techsupply",
  "address": "456 Vendor Ave, Suite 100",
  "tax_id": "12-3456789",
  "contact_email": "sales@techsupply.com",
  "contact_phone": "+1-555-0123",
  "created_at": "2024-01-15T10:30:00"
}
```

## 🧪 Testing

Run the test suite:

```bash
python -m pytest tests/ -v
```

The test suite includes:
- Edge case handling for malformed invoice text
- JSON extraction robustness
- Vendor name normalization
- Vendor search edge cases
- Field extraction validation

## 🎯 Key Features Explained

### 1. Vector-Based Efficient Retrieval
Instead of sending entire documents to Gemini for each correction, the system uses ChromaDB to:
- Index invoices in semantic chunks
- Retrieve only relevant chunks for specific fields
- Reduce API costs by 70-90%
- Speed up corrections with focused context

### 2. Semantic Query Mapping
Field extraction uses intelligent query mapping:
- `po_number` → "purchase order number P.O. PO"
- `invoice_date` → "invoice date issue date billed date"
- Better semantic search matches
- Higher precision for targeted extractions

### 3. Delta Operations
Corrections preserve existing data:
- Only changed fields are updated
- No data loss during corrections
- Efficient re-prompting without full document re-analysis

### 4. Intelligent Vendor Management
- Normalizes business names (removes Inc., Ltd., LLC, etc.)
- Case-insensitive fuzzy matching
- Automatic duplicate prevention
- Creates vendors with structured data on-demand

## 🔒 Environment Variables

Required in `.env` file:
- `GOOGLE_API_KEY` - Your Gemini API key from Google AI Studio
