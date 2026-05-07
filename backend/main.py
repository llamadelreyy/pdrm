from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List, Optional
import os
import shutil
import json
import logging
from datetime import datetime, timedelta
import uuid

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

from database import get_db, create_tables, User, AccidentReport, AccidentPhoto, PDRMStatement, InsuranceAnalysis
from schemas import (
    UserCreate, UserLogin, User as UserSchema, Token,
    AccidentReportCreate, AccidentReport as AccidentReportSchema,
    AccidentReportWithDetails, PDRMStatementCreate, PDRMStatementUpdate,
    InsuranceAnalysisCreate, MessageResponse, VLMAnalysisRequest, VLMAnalysisResponse,
    LLMAnalysisRequest, LLMAnalysisResponse, ImageAnalysisResponse
)
from auth import (
    authenticate_user, create_access_token, get_current_active_user,
    get_current_citizen, get_password_hash
)
from vlm_service import vlm_service
from llm_service import llm_service

# Create FastAPI app
app = FastAPI(
    title="PDRM Accident Reporting System",
    description="Royal Malaysian Police Accident Reporting System",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3015",
        "http://localhost:5173",
        "http://192.168.0.155:3015",
    ],  # React frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create uploads directory
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Mount static files
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# Create database tables on startup
@app.on_event("startup")
def startup_event():
    create_tables()

# Authentication endpoints
@app.post("/auth/register", response_model=UserSchema)
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    """Register a new user."""
    # Check if user already exists
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )
    
    # Check if IC number already exists
    db_user_ic = db.query(User).filter(User.ic_number == user.ic_number).first()
    if db_user_ic:
        raise HTTPException(
            status_code=400,
            detail="IC number already registered"
        )
    
    # Create new user
    hashed_password = get_password_hash(user.password)
    db_user = User(
        email=user.email,
        hashed_password=hashed_password,
        full_name=user.full_name,
        ic_number=user.ic_number,
        phone_number=user.phone_number,
        address=user.address,
        user_type=user.user_type
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    return db_user

@app.post("/auth/login", response_model=Token)
def login_user(user_credentials: UserLogin, db: Session = Depends(get_db)):
    """Login user and return access token."""
    user = authenticate_user(db, user_credentials.email, user_credentials.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=30)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/auth/me", response_model=UserSchema)
def get_current_user_info(current_user: User = Depends(get_current_active_user)):
    """Get current user information."""
    return current_user

# Chat endpoint
from pydantic import BaseModel
from typing import List, Optional

class ChatRequest(BaseModel):
    message: str
    conversation_history: Optional[List[dict]] = None

class ChatResponse(BaseModel):
    response: str

@app.post("/chat")
async def chat_with_ai(
    request: ChatRequest,
    current_user: User = Depends(get_current_active_user)
):
    """Chat with AI assistant for accident report related questions. Supports streaming."""
    return StreamingResponse(
        llm_service.chat_stream(request.message, request.conversation_history),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        }
    )

# Accident Report endpoints
@app.post("/reports", response_model=AccidentReportSchema)
def create_accident_report(
    report: AccidentReportCreate,
    current_user: User = Depends(get_current_citizen),
    db: Session = Depends(get_db)
):
    """Create a new accident report."""
    db_report = AccidentReport(
        user_id=current_user.id,
        **report.dict()
    )
    
    db.add(db_report)
    db.commit()
    db.refresh(db_report)
    
    return db_report

@app.post("/reports/{report_id}/photos")
async def upload_accident_photos(
    report_id: int,
    files: List[UploadFile] = File(...),
    descriptions: List[str] = Form([]),
    current_user: User = Depends(get_current_citizen),
    db: Session = Depends(get_db)
):
    """Upload photos for an accident report."""
    # Verify report belongs to current user
    report = db.query(AccidentReport).filter(
        AccidentReport.id == report_id,
        AccidentReport.user_id == current_user.id
    ).first()
    
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    # Limit to 8 photos
    if len(files) > 8:
        raise HTTPException(status_code=400, detail="Maximum 8 photos allowed")
    
    uploaded_photos = []
    
    for i, file in enumerate(files):
        if file.content_type not in ["image/jpeg", "image/png", "image/jpg"]:
            raise HTTPException(status_code=400, detail="Only JPEG and PNG images allowed")
        
        # Generate unique filename
        file_extension = file.filename.split(".")[-1]
        unique_filename = f"{uuid.uuid4()}.{file_extension}"
        file_path = os.path.join(UPLOAD_DIR, unique_filename)
        
        # Save file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Create photo record
        description = descriptions[i] if i < len(descriptions) else ""
        db_photo = AccidentPhoto(
            report_id=report_id,
            filename=unique_filename,
            file_path=file_path,
            description=description
        )
        
        db.add(db_photo)
        uploaded_photos.append(db_photo)
    
    db.commit()
    
    return {"message": f"Successfully uploaded {len(files)} photos", "photos": uploaded_photos}

@app.post("/reports/analyze-image", response_model=ImageAnalysisResponse)
async def analyze_accident_image(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_citizen),
    db: Session = Depends(get_db)
):
    """Analyze an accident image using VLM to extract vehicle, damage, and incident information."""
    try:
        # Save uploaded file temporarily
        temp_path = os.path.join(UPLOAD_DIR, f"temp_{uuid.uuid4()}_{file.filename}")
        with open(temp_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        # Call VLM service to analyze the image
        analysis_result = await vlm_service.analyze_accident_image(temp_path)
        
        # Clean up temp file
        if os.path.exists(temp_path):
            os.remove(temp_path)
        
        return ImageAnalysisResponse(
            vehicle_description=analysis_result.get("vehicle_description", ""),
            damage_description=analysis_result.get("damage_description", ""),
            incident_description=analysis_result.get("incident_description", ""),
            confidence_score=analysis_result.get("confidence_score", 0.8)
        )
    except Exception as e:
        logger.error(f"Error analyzing image: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to analyze image: {str(e)}")

@app.get("/reports", response_model=List[AccidentReportSchema])
def get_user_reports(
    current_user: User = Depends(get_current_citizen),
    db: Session = Depends(get_db)
):
    """Get all reports for the current user."""
    reports = db.query(AccidentReport).filter(AccidentReport.user_id == current_user.id).all()
    return reports

@app.get("/reports/{report_id}", response_model=AccidentReportSchema)
def get_report(
    report_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get a specific report."""
    report = db.query(AccidentReport).filter(AccidentReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    return report

# PDRM endpoints
@app.get("/pdrm/reports", response_model=List[AccidentReportWithDetails])
def get_all_reports_for_pdrm(
    current_user: User = Depends(get_current_citizen),
    db: Session = Depends(get_db)
):
    """Get all accident reports for PDRM review."""
    try:
        logger.info(f"PDRM officer {current_user.email} requesting all reports")
        reports = db.query(AccidentReport).all()
        logger.info(f"Found {len(reports)} reports for PDRM review")
        return reports
    except Exception as e:
        logger.error(f"Error in get_all_reports_for_pdrm: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.post("/pdrm/statements", response_model=MessageResponse)
def create_pdrm_statement(
    statement: PDRMStatementCreate,
    current_user: User = Depends(get_current_citizen),
    db: Session = Depends(get_db)
):
    """Create a PDRM statement for an accident report."""
    # Check if statement already exists
    existing_statement = db.query(PDRMStatement).filter(
        PDRMStatement.accident_report_id == statement.accident_report_id
    ).first()
    
    if existing_statement:
        raise HTTPException(status_code=400, detail="Statement already exists for this report")
    
    # Verify report exists
    report = db.query(AccidentReport).filter(AccidentReport.id == statement.accident_report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Accident report not found")
    
    db_statement = PDRMStatement(
        accident_report_id=statement.accident_report_id,
        officer_id=current_user.id,
        officer_findings=statement.officer_findings,
        fault_determination=statement.fault_determination,
        recommended_action=statement.recommended_action,
        case_number=statement.case_number
    )
    
    db.add(db_statement)
    
    # Update report status
    report.status = "under_review"
    
    db.commit()
    
    return {"message": "PDRM statement created successfully"}

@app.put("/pdrm/statements/{statement_id}", response_model=MessageResponse)
def update_pdrm_statement(
    statement_id: int,
    statement_update: PDRMStatementUpdate,
    current_user: User = Depends(get_current_citizen),
    db: Session = Depends(get_db)
):
    """Update a PDRM statement."""
    db_statement = db.query(PDRMStatement).filter(
        PDRMStatement.id == statement_id,
        PDRMStatement.officer_id == current_user.id
    ).first()
    
    if not db_statement:
        raise HTTPException(status_code=404, detail="Statement not found")
    
    # Update fields
    for field, value in statement_update.dict(exclude_unset=True).items():
        setattr(db_statement, field, value)
    
    db_statement.updated_at = datetime.utcnow()
    db.commit()
    
    return {"message": "PDRM statement updated successfully"}

# Semakan Saman - Traffic Fine Check endpoints
class PlateAnalysisRequest(BaseModel):
    plate_number: str

class PlateAnalysisResponse(BaseModel):
    plate_number: str
    vehicle_type: Optional[str] = None
    vehicle_color: Optional[str] = None
    registration_expiry: Optional[str] = None
    road_tax_status: Optional[str] = None
    confidence_score: float

@app.post("/semakan/analyze-plate", response_model=PlateAnalysisResponse)
async def analyze_plate_number(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Analyze a vehicle image to extract and verify plate number using VLM."""
    try:
        # Save uploaded file temporarily
        temp_path = os.path.join(UPLOAD_DIR, f"temp_plate_{uuid.uuid4()}_{file.filename}")
        with open(temp_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        # Call VLM service to analyze the image
        analysis_result = await vlm_service.analyze_plate_number(temp_path)
        
        # Clean up temp file
        if os.path.exists(temp_path):
            os.remove(temp_path)
        
        return PlateAnalysisResponse(
            plate_number=analysis_result.get("plate_number", ""),
            vehicle_type=analysis_result.get("vehicle_type"),
            vehicle_color=analysis_result.get("vehicle_color"),
            registration_expiry=analysis_result.get("registration_expiry"),
            road_tax_status=analysis_result.get("road_tax_status"),
            confidence_score=analysis_result.get("confidence_score", 0.8)
        )
    except Exception as e:
        logger.error(f"Error analyzing plate number: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to analyze plate number: {str(e)}")

class LicenseAnalysisResponse(BaseModel):
    name: str
    ic_number: str
    license_number: str
    address: str
    expiry_date: str
    nationality: str
    license_class: str

@app.post("/semakan/analyze-license", response_model=LicenseAnalysisResponse)
async def analyze_license(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Analyze a driver license image to extract driver information using VLM."""
    try:
        # Save uploaded file temporarily
        temp_path = os.path.join(UPLOAD_DIR, f"temp_license_{uuid.uuid4()}_{file.filename}")
        with open(temp_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        # Call VLM service to analyze the image
        analysis_result = await vlm_service.analyze_license(temp_path)
        
        # Clean up temp file
        if os.path.exists(temp_path):
            os.remove(temp_path)
        
        return LicenseAnalysisResponse(
            name=analysis_result.get("name", ""),
            ic_number=analysis_result.get("ic_number", ""),
            license_number=analysis_result.get("license_number", ""),
            address=analysis_result.get("address", ""),
            expiry_date=analysis_result.get("expiry_date", ""),
            nationality=analysis_result.get("nationality", ""),
            license_class=analysis_result.get("class", "")
        )
    except Exception as e:
        logger.error(f"Error analyzing license: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to analyze license: {str(e)}")

# Health check
@app.get("/health")
def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "timestamp": datetime.utcnow()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)