from pydantic import BaseModel, field_validator, Field
from datetime import date, datetime
from typing import Optional
import re

VALID_STATUSES = ["scheduled", "confirmed", "in-progress", "completed", "cancelled", "no-show"]

class AppointmentBase(BaseModel):
    patient_id: int = Field(..., gt=0, description="Patient ID")
    doctor_id: int = Field(..., gt=0, description="Doctor ID")
    appointment_date: date
    appointment_time: str = Field(..., description="Time in HH:MM format")
    status: Optional[str] = Field("scheduled", description="Status: scheduled, confirmed, in-progress, completed, cancelled, no-show")
    reason: Optional[str] = Field(None, max_length=500, description="Reason for visit")
    notes: Optional[str] = Field(None, max_length=1000)

    @field_validator('appointment_time')
    @classmethod
    def validate_time(cls, v):
        if not re.match(r'^([01]?[0-9]|2[0-3]):[0-5][0-9]$', v):
            raise ValueError('Time must be in HH:MM format (e.g., 09:00, 14:30)')
        return v

    @field_validator('status')
    @classmethod
    def validate_status(cls, v):
        if v and v.lower() not in VALID_STATUSES:
            raise ValueError(f'Status must be one of: {", ".join(VALID_STATUSES)}')
        return v.lower() if v else "scheduled"

    @field_validator('appointment_date')
    @classmethod
    def validate_date(cls, v):
        today = date.today()
        if v < today:
            raise ValueError('Appointment date cannot be in the past')
        # Don't allow appointments more than 6 months in advance
        from datetime import timedelta
        max_date = today + timedelta(days=180)
        if v > max_date:
            raise ValueError('Appointments can only be scheduled up to 6 months in advance')
        return v

class AppointmentCreate(AppointmentBase):
    pass

class AppointmentUpdate(BaseModel):
    patient_id: Optional[int] = Field(None, gt=0)
    doctor_id: Optional[int] = Field(None, gt=0)
    appointment_date: Optional[date] = None
    appointment_time: Optional[str] = None
    status: Optional[str] = None
    reason: Optional[str] = Field(None, max_length=500)
    notes: Optional[str] = Field(None, max_length=1000)

    @field_validator('appointment_time')
    @classmethod
    def validate_time(cls, v):
        if v and not re.match(r'^([01]?[0-9]|2[0-3]):[0-5][0-9]$', v):
            raise ValueError('Time must be in HH:MM format')
        return v

    @field_validator('status')
    @classmethod
    def validate_status(cls, v):
        if v and v.lower() not in VALID_STATUSES:
            raise ValueError(f'Status must be one of: {", ".join(VALID_STATUSES)}')
        return v.lower() if v else None

# For updating status only (used by doctors)
class AppointmentStatusUpdate(BaseModel):
    status: str
    notes: Optional[str] = Field(None, max_length=1000)

    @field_validator('status')
    @classmethod
    def validate_status(cls, v):
        if v.lower() not in VALID_STATUSES:
            raise ValueError(f'Status must be one of: {", ".join(VALID_STATUSES)}')
        return v.lower()

class AppointmentResponse(BaseModel):
    """Response schema - no date validation for existing records"""
    id: int
    patient_id: int
    doctor_id: int
    patient_name: Optional[str] = None
    doctor_name: Optional[str] = None
    appointment_date: date
    appointment_time: str
    status: Optional[str] = None
    reason: Optional[str] = None
    notes: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class AppointmentWithDetails(AppointmentResponse):
    patient_name: Optional[str] = None
    doctor_name: Optional[str] = None
    doctor_specialization: Optional[str] = None
