import os
import shutil
import uuid
import io
from typing import Optional, List
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel
from invoice_agent import InvoiceAgent
from PyPDF2 import PdfReader, PdfWriter

app = FastAPI(title="IDP AI Agent API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://frontend-seven-lovat-86.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

agent = InvoiceAgent()

UPLOAD_DIR = "temp_uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_TYPES = {
    "application/pdf": ".pdf",
    "image/webp": ".webp",
    "image/png": ".png",
    "image/jpeg": ".jpg",
}

# Track the current uploaded file path
current_file_path: Optional[str] = None
# Track per-page results for multi-page PDFs
page_results: List[dict] = []


class CorrectionRequest(BaseModel):
    query: str
    page_index: Optional[int] = None  # which page to correct (0-based)

class ExtractionRequest(BaseModel):
    field_name: str
    context: Optional[str] = None


def split_pdf_pages(pdf_path: str) -> List[str]:
    """Split a multi-page PDF into individual single-page PDF files."""
    reader = PdfReader(pdf_path)
    page_paths = []
    for i, page in enumerate(reader.pages):
        writer = PdfWriter()
        writer.add_page(page)
        page_path = os.path.join(UPLOAD_DIR, f"page_{i}_{uuid.uuid4().hex[:6]}.pdf")
        with open(page_path, "wb") as f:
            writer.write(f)
        page_paths.append(page_path)
    return page_paths


def process_image_as_invoice(image_path: str, document_id: str) -> dict:
    """Process a single image through the Gemini model as an invoice."""
    import google.generativeai as genai
    from config import Config

    Config.validate()
    genai.configure(api_key=Config.GOOGLE_API_KEY)
    model = genai.GenerativeModel(Config.GEMINI_MODEL)

    with open(image_path, "rb") as f:
        image_data = f.read()

    ext = os.path.splitext(image_path)[1].lower()
    mime_map = {".webp": "image/webp", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg"}
    mime = mime_map.get(ext, "image/png")

    prompt = """
    Extract all readable text from this invoice image.
    Preserve the layout, structure, and formatting as closely as possible.
    Include all headers, tables, line items, totals, and footer information.
    """

    response = model.generate_content([prompt, {"mime_type": mime, "data": image_data}])
    extracted_text = response.text

    # Save extracted text
    output_path = os.path.join(Config.EXTRACTED_TEXT_DIR, f"{document_id}_extracted.txt")
    os.makedirs(Config.EXTRACTED_TEXT_DIR, exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as out:
        out.write(extracted_text)

    # Now index + parse + vendor (reuse agent internals)
    agent.current_text = extracted_text
    agent.current_document_id = document_id
    agent.vector_indexer.index_document(document_id, extracted_text)
    agent.current_invoice_data = agent.invoice_parser.parse_invoice(extracted_text)
    vendor = agent._handle_vendor()

    return {
        "document_id": document_id,
        "invoice_data": agent.current_invoice_data.model_dump(),
        "vendor": vendor.model_dump() if vendor else None,
    }


@app.post("/process")
async def process_invoice(file: UploadFile = File(...)):
    """Upload and process a PDF or image invoice. Multi-page PDFs return per-page results."""
    global current_file_path, page_results

    content_type = file.content_type or ""
    filename = file.filename or ""
    ext_lower = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""

    # Determine file type
    is_pdf = content_type == "application/pdf" or ext_lower == "pdf"
    is_image = content_type in ("image/webp", "image/png", "image/jpeg") or ext_lower in ("webp", "png", "jpg", "jpeg")

    if not is_pdf and not is_image:
        raise HTTPException(status_code=400, detail="Supported formats: PDF, PNG, JPG, WebP")

    doc_base = f"DOC-{uuid.uuid4().hex[:8].upper()}"
    ext = ".pdf" if is_pdf else f".{ext_lower}"
    file_path = os.path.join(UPLOAD_DIR, f"{doc_base}{ext}")

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    current_file_path = file_path
    page_results = []

    try:
        if is_image:
            # Single image → single result
            result = process_image_as_invoice(file_path, doc_base)
            page_results = [result]
            return {"pages": page_results, "total_pages": 1}

        # PDF — check page count
        reader = PdfReader(file_path)
        num_pages = len(reader.pages)

        if num_pages == 1:
            result = agent.process_invoice(file_path, doc_base)
            page_results = [result]
            return {"pages": page_results, "total_pages": 1}

        # Multi-page: split and process each page
        page_paths = split_pdf_pages(file_path)
        for i, pp in enumerate(page_paths):
            page_id = f"{doc_base}-P{i+1}"
            try:
                result = agent.process_invoice(pp, page_id)
                result["page_number"] = i + 1
                page_results.append(result)
            except Exception as e:
                page_results.append({
                    "page_number": i + 1,
                    "document_id": page_id,
                    "error": str(e),
                    "invoice_data": None,
                    "vendor": None,
                })
            finally:
                # cleanup single-page temp file
                try: os.remove(pp)
                except: pass

        return {"pages": page_results, "total_pages": num_pages}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/process-sample")
async def process_sample(sample_name: str = Form("sample.pdf")):
    """Process a built-in sample PDF"""
    global current_file_path, page_results
    allowed = {"sample.pdf", "test.pdf"}
    if sample_name not in allowed:
        raise HTTPException(status_code=400, detail=f"Choose from: {allowed}")

    # Resolve path relative to this script's directory
    project_root = os.path.dirname(os.path.abspath(__file__))
    sample_path = os.path.join(project_root, sample_name)

    if not os.path.exists(sample_path):
        raise HTTPException(status_code=404, detail=f"{sample_name} not found at {sample_path}")

    doc_base = f"SAMPLE-{uuid.uuid4().hex[:6].upper()}"
    dest = os.path.join(UPLOAD_DIR, f"{doc_base}.pdf")
    shutil.copy2(sample_path, dest)
    current_file_path = dest
    page_results = []

    try:
        reader = PdfReader(dest)
        num_pages = len(reader.pages)

        if num_pages == 1:
            result = agent.process_invoice(dest, doc_base)
            page_results = [result]
            return {"pages": page_results, "total_pages": 1}

        page_paths = split_pdf_pages(dest)
        for i, pp in enumerate(page_paths):
            page_id = f"{doc_base}-P{i+1}"
            try:
                result = agent.process_invoice(pp, page_id)
                result["page_number"] = i + 1
                page_results.append(result)
            except Exception as e:
                page_results.append({"page_number": i+1, "document_id": page_id, "error": str(e), "invoice_data": None, "vendor": None})
            finally:
                try: os.remove(pp)
                except: pass

        return {"pages": page_results, "total_pages": num_pages}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/pdf")
async def get_current_pdf():
    """Serve the uploaded file for preview"""
    if not current_file_path or not os.path.exists(current_file_path):
        raise HTTPException(status_code=404, detail="No file currently loaded")
    ext = os.path.splitext(current_file_path)[1].lower()
    mime_map = {".pdf": "application/pdf", ".webp": "image/webp", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg"}
    return FileResponse(current_file_path, media_type=mime_map.get(ext, "application/octet-stream"))


@app.post("/correct")
async def apply_correction(request: CorrectionRequest):
    """Apply correction. If multi-page, optionally specify page_index."""
    try:
        # If there's a specific page, reload that page's context
        if request.page_index is not None and 0 <= request.page_index < len(page_results):
            pg = page_results[request.page_index]
            if pg.get("invoice_data"):
                from models import InvoiceData
                agent.current_document_id = pg["document_id"]
                agent.current_invoice_data = InvoiceData(**pg["invoice_data"])

        result = agent.apply_correction(request.query)

        # Update page_results too
        if request.page_index is not None and 0 <= request.page_index < len(page_results):
            page_results[request.page_index]["invoice_data"] = result.get("invoice_data")
            page_results[request.page_index]["vendor"] = result.get("vendor")

        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/extract")
async def extract_field(request: ExtractionRequest):
    try:
        result = agent.extract_field(request.field_name, request.context)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/current")
async def get_current():
    """Get current results (all pages)"""
    if not page_results:
        raise HTTPException(status_code=404, detail="No invoice currently loaded")
    return {"pages": page_results, "total_pages": len(page_results)}


@app.get("/vendors")
async def list_vendors():
    try:
        vendors = agent.vendor_manager.list_vendors()
        return [v.model_dump() for v in vendors]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/download")
async def download_json():
    if not page_results:
        raise HTTPException(status_code=404, detail="No invoice currently loaded")
    return JSONResponse(content={"pages": page_results}, headers={
        "Content-Disposition": "attachment; filename=invoice_data.json"
    })


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
