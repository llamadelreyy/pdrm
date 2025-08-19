from sqlalchemy import create_engine, Column, Integer, String, DateTime, Text, Boolean, ForeignKey, Float
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./pdrm_reports.db")

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    full_name = Column(String)
    ic_number = Column(String, unique=True)
    phone_number = Column(String)
    address = Column(Text)
    user_type = Column(String)  # 'citizen', 'pdrm', 'insurance'
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    reports = relationship("AccidentReport", back_populates="user")
    pdrm_statements = relationship("PDRMStatement", back_populates="officer")

class AccidentReport(Base):
    __tablename__ = "accident_reports"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    
    # Accident Details
    accident_date = Column(DateTime)
    accident_location = Column(Text)
    weather_condition = Column(String)
    road_condition = Column(String)
    traffic_condition = Column(String)
    
    # Vehicle Details
    vehicle_make = Column(String)
    vehicle_model = Column(String)
    vehicle_year = Column(Integer)
    vehicle_plate = Column(String)
    vehicle_color = Column(String)
    
    # Incident Description
    incident_description = Column(Text)
    damage_description = Column(Text)
    injuries_description = Column(Text)
    
    # Other Party Details (if any)
    other_party_name = Column(String)
    other_party_ic = Column(String)
    other_party_phone = Column(String)
    other_party_vehicle = Column(String)
    
    # Status and Timestamps
    status = Column(String, default="submitted")  # submitted, under_review, completed
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="reports")
    photos = relationship("AccidentPhoto", back_populates="report")
    pdrm_statement = relationship("PDRMStatement", back_populates="accident_report", uselist=False)
    insurance_analysis = relationship("InsuranceAnalysis", back_populates="accident_report", uselist=False)

class AccidentPhoto(Base):
    __tablename__ = "accident_photos"
    
    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(Integer, ForeignKey("accident_reports.id"))
    filename = Column(String)
    file_path = Column(String)
    description = Column(String)
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    report = relationship("AccidentReport", back_populates="photos")

class PDRMStatement(Base):
    __tablename__ = "pdrm_statements"
    
    id = Column(Integer, primary_key=True, index=True)
    accident_report_id = Column(Integer, ForeignKey("accident_reports.id"))
    officer_id = Column(Integer, ForeignKey("users.id"))
    
    # PDRM Assessment
    officer_findings = Column(Text)
    fault_determination = Column(String)
    recommended_action = Column(String)
    case_number = Column(String, unique=True)
    
    # Status and Timestamps
    status = Column(String, default="draft")  # draft, submitted, finalized
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    accident_report = relationship("AccidentReport", back_populates="pdrm_statement")
    officer = relationship("User", back_populates="pdrm_statements")

class InsuranceAnalysis(Base):
    __tablename__ = "insurance_analysis"
    
    id = Column(Integer, primary_key=True, index=True)
    accident_report_id = Column(Integer, ForeignKey("accident_reports.id"))
    
    # VLM Analysis Results
    vlm_photo_analysis = Column(Text)
    damage_assessment = Column(Text)
    consistency_score = Column(Float)  # 0-1 score of consistency between photos and description
    
    # LLM Discrepancy Analysis Results
    llm_confidence_score = Column(Float)  # 0-1 confidence score from LLM analysis
    discrepancy_analysis = Column(Text)  # Detailed discrepancy analysis
    key_discrepancies = Column(Text)  # JSON array of key discrepancies
    consistency_assessment = Column(Text)  # Overall consistency assessment
    risk_factors = Column(Text)  # JSON array of risk factors
    supporting_evidence = Column(Text)  # JSON array of supporting evidence
    llm_recommendation = Column(String)  # approve, investigate, deny
    
    # Insurance Decision
    claim_status = Column(String)  # approved, denied, pending_investigation
    claim_amount = Column(Float)
    notes = Column(Text)
    
    # Timestamps
    analyzed_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    accident_report = relationship("AccidentReport", back_populates="insurance_analysis")

def create_tables():
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()