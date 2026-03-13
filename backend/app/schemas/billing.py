from pydantic import BaseModel
from datetime import date, datetime
from typing import Optional

# Bill Schemas
class BillBase(BaseModel):
    patient_id: int
    bill_date: date
    consultation_fee: Optional[float] = 0.0
    medicine_cost: Optional[float] = 0.0
    lab_test_cost: Optional[float] = 0.0
    other_charges: Optional[float] = 0.0
    discount: Optional[float] = 0.0
    total_amount: float
    paid_amount: Optional[float] = 0.0
    payment_status: Optional[str] = "pending"
    payment_method: Optional[str] = None
    notes: Optional[str] = None

class BillCreate(BillBase):
    pass

class BillUpdate(BaseModel):
    patient_id: Optional[int] = None
    bill_date: Optional[date] = None
    consultation_fee: Optional[float] = None
    medicine_cost: Optional[float] = None
    lab_test_cost: Optional[float] = None
    other_charges: Optional[float] = None
    discount: Optional[float] = None
    total_amount: Optional[float] = None
    paid_amount: Optional[float] = None
    payment_status: Optional[str] = None
    payment_method: Optional[str] = None
    notes: Optional[str] = None

class BillResponse(BillBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Prescription Schemas
class PrescriptionBase(BaseModel):
    patient_id: int
    doctor_id: int
    prescription_date: date
    diagnosis: Optional[str] = None
    symptoms: Optional[str] = None
    medications: Optional[str] = None
    instructions: Optional[str] = None
    follow_up_date: Optional[date] = None

class PrescriptionCreate(PrescriptionBase):
    pass

class PrescriptionUpdate(BaseModel):
    patient_id: Optional[int] = None
    doctor_id: Optional[int] = None
    prescription_date: Optional[date] = None
    diagnosis: Optional[str] = None
    symptoms: Optional[str] = None
    medications: Optional[str] = None
    instructions: Optional[str] = None
    follow_up_date: Optional[date] = None

class PrescriptionResponse(PrescriptionBase):
    id: int
    patient_name: Optional[str] = None
    doctor_name: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
