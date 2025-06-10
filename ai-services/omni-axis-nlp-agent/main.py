from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, List, Optional
import os
import logging
from datetime import datetime
import tempfile
import shutil

import spacy
import pdfplumber
import pytesseract
from PIL import Image
import cv2
import numpy as np
import re

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Omni Axis NLP Agent",
    description="Document processing and entity extraction for asset tokenization",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()

# Load spaCy models
try:
    nlp_en = spacy.load("en_core_web_sm")
    logger.info("English NLP model loaded")
except OSError:
    logger.warning("English NLP model not found, using blank model")
    nlp_en = spacy.blank("en")

# Pydantic models
class ExtractedEntities(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    asset_type: Optional[str] = None
    certificate_id: Optional[str] = None
    date: Optional[str] = None
    amount: Optional[str] = None
    location: Optional[str] = None
    confidence: float

class ExtractionResponse(BaseModel):
    entities: ExtractedEntities
    raw_text: str
    processing_time: float
    timestamp: datetime

class HealthResponse(BaseModel):
    status: str
    timestamp: datetime

# Authentication dependency
async def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials"
        )
    return credentials.credentials

def extract_text_from_pdf(file_path: str) -> str:
    """Extract text from PDF file"""
    try:
        text = ""
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
        return text
    except Exception as e:
        logger.error(f"Error extracting text from PDF: {e}")
        return ""

def extract_text_from_image(file_path: str) -> str:
    """Extract text from image using OCR"""
    try:
        # Load image
        image = cv2.imread(file_path)
        
        # Preprocess image for better OCR
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # Apply denoising
        denoised = cv2.fastNlMeansDenoising(gray)
        
        # Apply threshold to get binary image
        _, thresh = cv2.threshold(denoised, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        
        # Extract text using Tesseract
        text = pytesseract.image_to_string(thresh, config='--psm 6')
        
        return text
    except Exception as e:
        logger.error(f"Error extracting text from image: {e}")
        return ""

def extract_entities_from_text(text: str) -> ExtractedEntities:
    """Extract entities from text using NLP and regex patterns"""
    try:
        # Process with spaCy
        doc = nlp_en(text)
        
        # Initialize extracted data
        entities = {
            "name": None,
            "address": None,
            "asset_type": None,
            "certificate_id": None,
            "date": None,
            "amount": None,
            "location": None,
            "confidence": 0.0
        }
        
        # Extract named entities
        names = []
        locations = []
        dates = []
        
        for ent in doc.ents:
            if ent.label_ == "PERSON":
                names.append(ent.text)
            elif ent.label_ in ["GPE", "LOC"]:
                locations.append(ent.text)
            elif ent.label_ == "DATE":
                dates.append(ent.text)
        
        # Use regex patterns for specific extractions
        
        # Certificate/ID patterns
        cert_patterns = [
            r'(?:certificate|cert|id|number|no\.?)\s*:?\s*([A-Z0-9\-]+)',
            r'([A-Z]{2,}\d{4,})',
            r'(\d{4,}[A-Z]{2,})'
        ]
        
        for pattern in cert_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match and not entities["certificate_id"]:
                entities["certificate_id"] = match.group(1)
                break
        
        # Amount patterns (currency)
        amount_patterns = [
            r'(?:USD|EUR|GBP|\$|€|£)\s*([0-9,]+(?:\.[0-9]{2})?)',
            r'([0-9,]+(?:\.[0-9]{2})?)\s*(?:USD|EUR|GBP|dollars?|euros?|pounds?)'
        ]
        
        for pattern in amount_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match and not entities["amount"]:
                entities["amount"] = match.group(1)
                break
        
        # Asset type patterns
        asset_types = [
            "real estate", "property", "land", "building", "house", "apartment",
            "art", "painting", "sculpture", "artwork", "collectible",
            "gold", "silver", "commodity", "oil", "gas",
            "watch", "jewelry", "luxury", "vintage"
        ]
        
        text_lower = text.lower()
        for asset_type in asset_types:
            if asset_type in text_lower and not entities["asset_type"]:
                entities["asset_type"] = asset_type
                break
        
        # Address pattern (simple)
        address_pattern = r'(\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln)[^,\n]*(?:,\s*[A-Za-z\s]+)*)'
        address_match = re.search(address_pattern, text, re.IGNORECASE)
        if address_match:
            entities["address"] = address_match.group(1).strip()
        
        # Assign extracted entities
        if names and not entities["name"]:
            entities["name"] = names[0]
        
        if locations and not entities["location"]:
            entities["location"] = locations[0]
        
        if dates and not entities["date"]:
            entities["date"] = dates[0]
        
        # Calculate confidence based on number of extracted entities
        extracted_count = sum(1 for v in entities.values() if v is not None and v != "")
        entities["confidence"] = min(extracted_count / 6.0, 1.0)  # 6 main fields
        
        return ExtractedEntities(**entities)
        
    except Exception as e:
        logger.error(f"Error extracting entities: {e}")
        return ExtractedEntities(confidence=0.0)

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return HealthResponse(
        status="healthy",
        timestamp=datetime.now()
    )

@app.post("/extract", response_model=ExtractionResponse)
async def extract_document(
    file: UploadFile = File(...),
    token: str = Depends(verify_token)
):
    """
    Extract entities from uploaded document (PDF or image)
    """
    start_time = datetime.now()
    
    try:
        logger.info(f"Processing document: {file.filename}")
        
        # Validate file type
        allowed_types = [
            "application/pdf",
            "image/jpeg",
            "image/png",
            "image/tiff",
            "image/bmp"
        ]
        
        if file.content_type not in allowed_types:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported file type: {file.content_type}"
            )
        
        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.filename)[1]) as tmp_file:
            shutil.copyfileobj(file.file, tmp_file)
            tmp_file_path = tmp_file.name
        
        try:
            # Extract text based on file type
            if file.content_type == "application/pdf":
                raw_text = extract_text_from_pdf(tmp_file_path)
            else:
                raw_text = extract_text_from_image(tmp_file_path)
            
            if not raw_text.strip():
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail="No text could be extracted from the document"
                )
            
            # Extract entities
            entities = extract_entities_from_text(raw_text)
            
            processing_time = (datetime.now() - start_time).total_seconds()
            
            logger.info(f"Document processed successfully in {processing_time:.2f}s")
            
            return ExtractionResponse(
                entities=entities,
                raw_text=raw_text[:1000],  # Limit raw text length
                processing_time=processing_time,
                timestamp=datetime.now()
            )
            
        finally:
            # Clean up temporary file
            os.unlink(tmp_file_path)
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing document: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process document"
        )

@app.post("/extract-text")
async def extract_text_only(
    file: UploadFile = File(...),
    token: str = Depends(verify_token)
):
    """
    Extract raw text from document without entity extraction
    """
    try:
        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.filename)[1]) as tmp_file:
            shutil.copyfileobj(file.file, tmp_file)
            tmp_file_path = tmp_file.name
        
        try:
            # Extract text based on file type
            if file.content_type == "application/pdf":
                raw_text = extract_text_from_pdf(tmp_file_path)
            else:
                raw_text = extract_text_from_image(tmp_file_path)
            
            return {"text": raw_text, "timestamp": datetime.now()}
            
        finally:
            os.unlink(tmp_file_path)
            
    except Exception as e:
        logger.error(f"Error extracting text: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to extract text"
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)