from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional, List
from enum import Enum

class UserType(str, Enum):
    CITIZEN = "citizen"
    PDRM = "pdrm"
    INSURANCE = "insurance"

class ReportStatus(str, Enum):
    SUBMITTED = "submitted"
    UNDER_REVIEW = "under_review"
    COMPLETED = "completed"

class StatementStatus(str, Enum):
    DRAFT = "draft"
    SUBMITTED = "submitted"
    FINALIZED = "finalized"

class ClaimStatus(str, Enum):
    APPROVED = "approved"
    DENIED = "denied"
    PENDING_INVESTIGATION = "pending_investigation"

# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    ic_number: str
    phone_number: str
    address: str
    user_type: UserType

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(UserBase):
    id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

# Accident Photo Schemas
class AccidentPhotoBase(BaseModel):
    description: Optional[str] = None

class AccidentPhotoCreate(AccidentPhotoBase):
    pass

class AccidentPhoto(AccidentPhotoBase):
    id: int
    filename: str
    file_path: str
    uploaded_at: datetime

    class Config:
        from_attributes = True

# Accident Report Schemas
class AccidentReportBase(BaseModel):
    accident_date: datetime
    accident_location: str
    weather_condition: str
    road_condition: str
    traffic_condition: str
    vehicle_make: str
    vehicle_model: str
    vehicle_year: int
    vehicle_plate: str
    vehicle_color: str
    incident_description: str
    damage_description: str
    injuries_description: Optional[str] = None
    other_party_name: Optional[str] = None
    other_party_ic: Optional[str] = None
    other_party_phone: Optional[str] = None
    other_party_vehicle: Optional[str] = None

class AccidentReportCreate(AccidentReportBase):
    pass

class AccidentReport(AccidentReportBase):
    id: int
    user_id: int
    status: ReportStatus
    created_at: datetime
    updated_at: datetime
    photos: List[AccidentPhoto] = []

    class Config:
        from_attributes = True

# PDRM Statement Schemas
class PDRMStatementBase(BaseModel):
    officer_findings: str
    fault_determination: str
    recommended_action: str
    case_number: str

class PDRMStatementCreate(PDRMStatementBase):
    accident_report_id: int

class PDRMStatementUpdate(BaseModel):
    officer_findings: Optional[str] = None
    fault_determination: Optional[str] = None
    recommended_action: Optional[str] = None
    status: Optional[StatementStatus] = None

class PDRMStatement(PDRMStatementBase):
    id: int
    accident_report_id: int
    officer_id: int
    status: StatementStatus
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Insurance Analysis Schemas
class InsuranceAnalysisBase(BaseModel):
    vlm_photo_analysis: str
    damage_assessment: str
    consistency_score: float
    llm_confidence_score: Optional[float] = None
    discrepancy_analysis: Optional[str] = None
    key_discrepancies: Optional[str] = None  # JSON string
    consistency_assessment: Optional[str] = None
    risk_factors: Optional[str] = None  # JSON string
    supporting_evidence: Optional[str] = None  # JSON string
    llm_recommendation: Optional[str] = None
    claim_status: ClaimStatus
    claim_amount: Optional[float] = None
    notes: Optional[str] = None

class InsuranceAnalysisCreate(InsuranceAnalysisBase):
    accident_report_id: int

class InsuranceAnalysis(InsuranceAnalysisBase):
    id: int
    accident_report_id: int
    analyzed_at: datetime

    class Config:
        from_attributes = True

# Combined Report View (for PDRM and Insurance)
class AccidentReportWithDetails(AccidentReport):
    user: User
    pdrm_statement: Optional[PDRMStatement] = None
    insurance_analysis: Optional[InsuranceAnalysis] = None

# Token Schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

# Response Schemas
class MessageResponse(BaseModel):
    message: str

class VLMAnalysisRequest(BaseModel):
    photo_urls: List[str]
    damage_description: str
    incident_description: str

class VLMAnalysisResponse(BaseModel):
    analysis: str
    consistency_score: float
    damage_assessment: str

# LLM Analysis Schemas
class LLMAnalysisRequest(BaseModel):
    accident_report_id: int

class LLMAnalysisResponse(BaseModel):
    confidence_score: float
    discrepancy_analysis: str
    key_discrepancies: List[str]
    consistency_assessment: str
    recommendation: str
    risk_factors: List[str]
    supporting_evidence: List[str]