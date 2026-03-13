from sqlalchemy import Column, Integer, String, Text, DateTime, Float, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import Base

class Specialization:
    CARDIOLOGY = "Cardiology"
    DERMATOLOGY = "Dermatology"
    NEUROLOGY = "Neurology"
    ORTHOPEDICS = "Orthopedics"
    PEDIATRICS = "Pediatrics"
    PSYCHIATRY = "Psychiatry"
    GENERAL_MEDICINE = "General Medicine"
    SURGERY = "Surgery"
    GYNECOLOGY = "Gynecology"
    ENT = "ENT"

class Doctor(Base):
    __tablename__ = "doctors"

    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, index=True)
    phone = Column(String(11), nullable=False)  # Pakistani format: 03001234567
    specialization = Column(String(100), nullable=False)
    qualification = Column(String(255))
    experience_years = Column(Integer, default=0)
    consultation_fee = Column(Float, default=0.0)
    available_days = Column(String(100))  # e.g., "Mon,Tue,Wed,Thu,Fri"
    available_time_start = Column(String(10))  # e.g., "09:00"
    available_time_end = Column(String(10))  # e.g., "17:00"
    bio = Column(Text)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    appointments = relationship("Appointment", back_populates="doctor")
    prescriptions = relationship("Prescription", back_populates="doctor")
