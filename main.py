from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
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
    LLMAnalysisRequest, LLMAnalysisResponse
)
from auth import (
    authenticate_user, create_access_token, get_current_active_user,
    get_current_citizen, get_current_pdrm_officer, get_current_insurance_agent,
    get_current_pdrm_or_insurance, get_password_hash
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
    allow_origins=["http://localhost:3015"],  # React frontend
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

# Accident Report endpoints
@app.post("/reports", response_model=AccidentReportSchema)
def create_accident_report(
    report: AccidentReportCreate,
    current_user: User = Depends(get_current_citizen),
    db: Session = Depends(get_db)
):
    """Create a new accident report (citizens only)."""
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
    query = db.query(AccidentReport).filter(AccidentReport.id == report_id)
    
    # Citizens can only see their own reports
    if current_user.user_type == "citizen":
        query = query.filter(AccidentReport.user_id == current_user.id)
    
    report = query.first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    return report

# PDRM endpoints
@app.get("/pdrm/reports", response_model=List[AccidentReportWithDetails])
def get_all_reports_for_pdrm(
    current_user: User = Depends(get_current_pdrm_officer),
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
    current_user: User = Depends(get_current_pdrm_officer),
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
    current_user: User = Depends(get_current_pdrm_officer),
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

# Insurance endpoints
@app.get("/insurance/reports", response_model=List[AccidentReportWithDetails])
def get_reports_for_insurance(
    current_user: User = Depends(get_current_insurance_agent),
    db: Session = Depends(get_db)
):
    """Get all reports with PDRM statements for insurance review."""
    try:
        logger.info(f"Insurance agent {current_user.email} requesting reports")
        reports = db.query(AccidentReport).filter(AccidentReport.status == "under_review").all()
        logger.info(f"Found {len(reports)} reports for insurance review")
        return reports
    except Exception as e:
        logger.error(f"Error in get_reports_for_insurance: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.post("/insurance/analyze", response_model=VLMAnalysisResponse)
async def analyze_accident_photos(
    request: VLMAnalysisRequest,
    current_user: User = Depends(get_current_insurance_agent),
    db: Session = Depends(get_db)
):
    """Analyze accident photos using VLM only (legacy endpoint)."""
    try:
        # Convert URLs to file paths (assuming they're local uploads)
        photo_paths = []
        for url in request.photo_urls:
            if url.startswith("/uploads/"):
                file_path = url.replace("/uploads/", f"{UPLOAD_DIR}/")
                photo_paths.append(file_path)
        
        # Call VLM service
        analysis_result = await vlm_service.analyze_accident_photos(
            photo_paths,
            request.damage_description,
            request.incident_description
        )
        
        return VLMAnalysisResponse(**analysis_result)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@app.post("/insurance/analyze-complete/{report_id}")
async def analyze_complete_report(
    report_id: int,
    current_user: User = Depends(get_current_insurance_agent),
    db: Session = Depends(get_db)
):
    """Complete analysis: VLM first, then LLM discrepancy analysis."""
    try:
        logger.info(f"Starting complete analysis for report {report_id}")
        
        # Get the accident report with all related data
        report = db.query(AccidentReport).filter(AccidentReport.id == report_id).first()
        if not report:
            raise HTTPException(status_code=404, detail="Accident report not found")
        
        # Get PDRM statement
        pdrm_statement = db.query(PDRMStatement).filter(
            PDRMStatement.accident_report_id == report_id
        ).first()
        
        if not pdrm_statement:
            raise HTTPException(status_code=400, detail="PDRM statement required for complete analysis")
        
        # Check if report has photos
        if not report.photos or len(report.photos) == 0:
            raise HTTPException(status_code=400, detail="Report must have photos for VLM analysis")
        
        # Step 1: VLM Analysis
        logger.info("Running VLM analysis...")
        photo_paths = []
        for photo in report.photos:
            photo_paths.append(photo.file_path)
        
        vlm_result = await vlm_service.analyze_accident_photos(
            photo_paths,
            report.damage_description,
            report.incident_description
        )
        
        logger.info(f"VLM analysis completed with confidence: {vlm_result.get('consistency_score', 'N/A')}")
        
        # Step 2: LLM Discrepancy Analysis
        logger.info("Running LLM discrepancy analysis...")
        
        # Prepare data for LLM analysis
        user_report_data = {
            "incident_description": report.incident_description,
            "damage_description": report.damage_description,
            "vehicle_year": report.vehicle_year,
            "vehicle_make": report.vehicle_make,
            "vehicle_model": report.vehicle_model,
            "accident_location": report.accident_location,
            "weather_condition": report.weather_condition,
            "road_condition": report.road_condition,
            "other_party_name": report.other_party_name
        }
        
        pdrm_data = {
            "officer_findings": pdrm_statement.officer_findings,
            "fault_determination": pdrm_statement.fault_determination,
            "recommended_action": pdrm_statement.recommended_action,
            "case_number": pdrm_statement.case_number
        }
        
        # Call LLM service for discrepancy analysis
        llm_result = await llm_service.analyze_report_discrepancies(
            user_report_data, pdrm_data, vlm_result
        )
        
        logger.info(f"LLM analysis completed with confidence: {llm_result.get('confidence_score', 'N/A')}")
        
        # Return combined results
        return {
            "vlm_analysis": vlm_result,
            "llm_analysis": llm_result,
            "report_id": report_id,
            "message": "Complete analysis finished successfully"
        }
        
    except Exception as e:
        logger.error(f"Complete analysis failed for report {report_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Complete analysis failed: {str(e)}")

@app.post("/insurance/llm-analyze", response_model=LLMAnalysisResponse)
async def analyze_report_discrepancies(
    request: LLMAnalysisRequest,
    current_user: User = Depends(get_current_insurance_agent),
    db: Session = Depends(get_db)
):
    """Analyze discrepancies between user report, PDRM statement, and VLM analysis using LLM."""
    try:
        # Get the accident report with all related data
        report = db.query(AccidentReport).filter(AccidentReport.id == request.accident_report_id).first()
        if not report:
            raise HTTPException(status_code=404, detail="Accident report not found")
        
        # Get PDRM statement
        pdrm_statement = db.query(PDRMStatement).filter(
            PDRMStatement.accident_report_id == request.accident_report_id
        ).first()
        
        if not pdrm_statement:
            raise HTTPException(status_code=400, detail="PDRM statement required for LLM analysis")
        
        # Get existing VLM analysis (if any)
        existing_analysis = db.query(InsuranceAnalysis).filter(
            InsuranceAnalysis.accident_report_id == request.accident_report_id
        ).first()
        
        vlm_analysis = {}
        if existing_analysis:
            vlm_analysis = {
                "analysis": existing_analysis.vlm_photo_analysis or "",
                "damage_assessment": existing_analysis.damage_assessment or "",
                "consistency_score": existing_analysis.consistency_score or 0.0
            }
        
        # Prepare data for LLM analysis
        user_report_data = {
            "incident_description": report.incident_description,
            "damage_description": report.damage_description,
            "vehicle_year": report.vehicle_year,
            "vehicle_make": report.vehicle_make,
            "vehicle_model": report.vehicle_model,
            "accident_location": report.accident_location,
            "weather_condition": report.weather_condition,
            "road_condition": report.road_condition,
            "other_party_name": report.other_party_name
        }
        
        pdrm_data = {
            "officer_findings": pdrm_statement.officer_findings,
            "fault_determination": pdrm_statement.fault_determination,
            "recommended_action": pdrm_statement.recommended_action,
            "case_number": pdrm_statement.case_number
        }
        
        # Call LLM service for discrepancy analysis
        llm_result = await llm_service.analyze_report_discrepancies(
            user_report_data, pdrm_data, vlm_analysis
        )
        
        return LLMAnalysisResponse(**llm_result)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM analysis failed: {str(e)}")

@app.post("/insurance/analysis", response_model=MessageResponse)
async def create_insurance_analysis(
    analysis: InsuranceAnalysisCreate,
    current_user: User = Depends(get_current_insurance_agent),
    db: Session = Depends(get_db)
):
    """Create insurance analysis for an accident report."""
    # Verify report exists
    report = db.query(AccidentReport).filter(AccidentReport.id == analysis.accident_report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Accident report not found")
    
    # Check if analysis already exists
    existing_analysis = db.query(InsuranceAnalysis).filter(
        InsuranceAnalysis.accident_report_id == analysis.accident_report_id
    ).first()
    
    if existing_analysis:
        raise HTTPException(status_code=400, detail="Analysis already exists for this report")
    
    # Convert list fields to JSON strings for database storage
    analysis_dict = analysis.dict()
    if analysis_dict.get('key_discrepancies') and isinstance(analysis_dict['key_discrepancies'], list):
        analysis_dict['key_discrepancies'] = json.dumps(analysis_dict['key_discrepancies'])
    if analysis_dict.get('risk_factors') and isinstance(analysis_dict['risk_factors'], list):
        analysis_dict['risk_factors'] = json.dumps(analysis_dict['risk_factors'])
    if analysis_dict.get('supporting_evidence') and isinstance(analysis_dict['supporting_evidence'], list):
        analysis_dict['supporting_evidence'] = json.dumps(analysis_dict['supporting_evidence'])
    
    db_analysis = InsuranceAnalysis(**analysis_dict)
    db.add(db_analysis)
    
    # Update report status
    report.status = "completed"
    
    db.commit()
    
    return {"message": "Insurance analysis created successfully"}

# Health check
@app.get("/health")
def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "timestamp": datetime.utcnow()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)