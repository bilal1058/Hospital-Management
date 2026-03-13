from pydantic import BaseModel, EmailStr, field_validator, Field
from datetime import datetime
from typing import Optional
import re

# Valid specializations in a hospital
VALID_SPECIALIZATIONS = [
    "General Medicine", "Cardiology", "Dermatology", "Gynecology", "Orthopedics",
    "Pediatrics", "Neurology", "Ophthalmology", "ENT", "Psychiatry", "Endocrinology",
    "Gastroenterology", "Nephrology", "Pulmonology", "Oncology", "Urology",
    "Radiology", "Anesthesiology", "Emergency Medicine", "General Surgery"
]

VALID_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

class DoctorBase(BaseModel):
    first_name: str = Field(..., min_length=2, max_length=50)
    last_name: str = Field(..., min_length=2, max_length=50)
    email: Optional[EmailStr] = None
    phone: str = Field(..., description="Phone number (11 digits)")
    specialization: str = Field(..., description="Medical specialization")
    qualification: Optional[str] = Field(None, max_length=255)
    experience_years: Optional[int] = Field(0, ge=0, le=60, description="Years of experience (0-60)")
    consultation_fee: Optional[float] = Field(0.0, ge=0, le=50000, description="Consultation fee in PKR")
    available_days: Optional[str] = Field(None, description="Comma-separated days: Mon,Tue,Wed,Thu,Fri,Sat,Sun")
    available_time_start: Optional[str] = Field(None, description="Start time (HH:MM format)")
    available_time_end: Optional[str] = Field(None, description="End time (HH:MM format)")
    bio: Optional[str] = Field(None, max_length=1000)
    is_active: Optional[bool] = True

    @field_validator('phone')
    @classmethod
    def validate_phone(cls, v):
        if not v:
            raise ValueError('Phone number is required')
        v = re.sub(r'[\s\-]', '', v)
        if not re.match(r'^03\d{9}$', v):
            raise ValueError('Phone must be 11 digits starting with 03 (e.g., 03001234567)')
        return v

    @field_validator('first_name', 'last_name')
    @classmethod
    def validate_name(cls, v):
        if not re.match(r'^[a-zA-Z\s\.]+$', v):
            raise ValueError('Name should only contain letters, spaces, and dots')
        return v.strip().title()

    @field_validator('specialization')
    @classmethod
    def validate_specialization(cls, v):
        # Allow custom specializations but normalize case
        return v.strip().title()

    @field_validator('available_days')
    @classmethod
    def validate_days(cls, v):
        if v:
            days = [d.strip() for d in v.split(',')]
            for day in days:
                if day not in VALID_DAYS:
                    raise ValueError(f'Invalid day: {day}. Valid days are: {", ".join(VALID_DAYS)}')
            return ','.join(days)
        return v

    @field_validator('available_time_start', 'available_time_end')
    @classmethod
    def validate_time(cls, v):
        if v:
            if not re.match(r'^([01]?[0-9]|2[0-3]):[0-5][0-9]$', v):
                raise ValueError('Time must be in HH:MM format (e.g., 09:00, 17:30)')
        return v

class DoctorCreate(DoctorBase):
    pass

class DoctorUpdate(BaseModel):
    first_name: Optional[str] = Field(None, min_length=2, max_length=50)
    last_name: Optional[str] = Field(None, min_length=2, max_length=50)
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    specialization: Optional[str] = None
    qualification: Optional[str] = Field(None, max_length=255)
    experience_years: Optional[int] = Field(None, ge=0, le=60)
    consultation_fee: Optional[float] = Field(None, ge=0, le=50000)
    available_days: Optional[str] = None
    available_time_start: Optional[str] = None
    available_time_end: Optional[str] = None
    bio: Optional[str] = Field(None, max_length=1000)
    is_active: Optional[bool] = None

    @field_validator('phone')
    @classmethod
    def validate_phone(cls, v):
        if v:
            v = re.sub(r'[\s\-]', '', v)
            if not re.match(r'^03\d{9}$', v):
                raise ValueError('Phone must be 11 digits starting with 03')
        return v

    @field_validator('first_name', 'last_name')
    @classmethod
    def validate_name(cls, v):
        if v and not re.match(r'^[a-zA-Z\s\.]+$', v):
            raise ValueError('Name should only contain letters, spaces, and dots')
        return v.strip().title() if v else None

    @field_validator('available_days')
    @classmethod
    def validate_days(cls, v):
        if v:
            days = [d.strip() for d in v.split(',')]
            for day in days:
                if day not in VALID_DAYS:
                    raise ValueError(f'Invalid day: {day}')
            return ','.join(days)
        return v

    @field_validator('available_time_start', 'available_time_end')
    @classmethod
    def validate_time(cls, v):
        if v and not re.match(r'^([01]?[0-9]|2[0-3]):[0-5][0-9]$', v):
            raise ValueError('Time must be in HH:MM format')
        return v

class DoctorResponse(BaseModel):
    id: int
    first_name: str
    last_name: str
    email: Optional[EmailStr] = None
    phone: str
    specialization: str
    qualification: Optional[str] = None
    experience_years: Optional[int] = None
    consultation_fee: Optional[float] = None
    available_days: Optional[str] = None
    available_time_start: Optional[str] = None
    available_time_end: Optional[str] = None
    bio: Optional[str] = None
    is_active: Optional[bool] = True
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
