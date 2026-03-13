from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models.billing import Bill, Prescription
from ..models.patient import Patient
from ..models.doctor import Doctor
from ..schemas.billing import (
    BillCreate, BillUpdate, BillResponse,
    PrescriptionCreate, PrescriptionUpdate, PrescriptionResponse
)
from ..models.user import User
from ..auth import get_current_user, get_admin_or_receptionist, get_current_doctor

router = APIRouter(prefix="/billing", tags=["Billing & Prescriptions"])

def attach_prescription_details(prescription: Prescription):
    prescription.patient_name = f"{prescription.patient.first_name} {prescription.patient.last_name}" if prescription.patient else None
    prescription.doctor_name = f"Dr. {prescription.doctor.first_name} {prescription.doctor.last_name}" if prescription.doctor else None
    return prescription

# ============ BILLS ============

@router.get("/bills", response_model=List[BillResponse])
def get_all_bills(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_admin_or_receptionist),
    db: Session = Depends(get_db)
):
    """Get all bills with pagination"""
    bills = db.query(Bill).offset(skip).limit(limit).all()
    return bills

@router.get("/bills/patient/{patient_id}", response_model=List[BillResponse])
def get_patient_bills(
    patient_id: int,
    current_user: User = Depends(get_admin_or_receptionist),
    db: Session = Depends(get_db)
):
    """Get all bills for a specific patient"""
    bills = db.query(Bill).filter(Bill.patient_id == patient_id).all()
    return bills

@router.get("/bills/status/{status}", response_model=List[BillResponse])
def get_bills_by_status(
    status: str,
    current_user: User = Depends(get_admin_or_receptionist),
    db: Session = Depends(get_db)
):
    """Get bills by payment status"""
    bills = db.query(Bill).filter(Bill.payment_status == status).all()
    return bills

@router.get("/bills/pending", response_model=List[BillResponse])
def get_pending_bills(
    current_user: User = Depends(get_admin_or_receptionist),
    db: Session = Depends(get_db)
):
    """Get all pending bills"""
    bills = db.query(Bill).filter(Bill.payment_status == "pending").all()
    return bills

@router.get("/bills/{bill_id}", response_model=BillResponse)
def get_bill(
    bill_id: int,
    current_user: User = Depends(get_admin_or_receptionist),
    db: Session = Depends(get_db)
):
    """Get a specific bill by ID"""
    bill = db.query(Bill).filter(Bill.id == bill_id).first()
    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")
    return bill

@router.post("/bills", response_model=BillResponse, status_code=status.HTTP_201_CREATED)
def create_bill(
    bill: BillCreate,
    current_user: User = Depends(get_admin_or_receptionist),
    db: Session = Depends(get_db)
):
    """Create a new bill"""
    # Verify patient exists
    patient = db.query(Patient).filter(Patient.id == bill.patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    db_bill = Bill(**bill.model_dump())
    db.add(db_bill)
    db.commit()
    db.refresh(db_bill)
    return db_bill

@router.put("/bills/{bill_id}", response_model=BillResponse)
def update_bill(
    bill_id: int,
    bill: BillUpdate,
    current_user: User = Depends(get_admin_or_receptionist),
    db: Session = Depends(get_db)
):
    """Update an existing bill"""
    db_bill = db.query(Bill).filter(Bill.id == bill_id).first()
    if not db_bill:
        raise HTTPException(status_code=404, detail="Bill not found")

    if db_bill.payment_status == "paid":
        raise HTTPException(status_code=400, detail="Paid bills cannot be edited")
    
    update_data = bill.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_bill, field, value)
    
    db.commit()
    db.refresh(db_bill)
    return db_bill

@router.put("/bills/{bill_id}/pay", response_model=BillResponse)
def pay_bill(
    bill_id: int,
    amount: float,
    payment_method: str,
    current_user: User = Depends(get_admin_or_receptionist),
    db: Session = Depends(get_db)
):
    """Record payment for a bill"""
    db_bill = db.query(Bill).filter(Bill.id == bill_id).first()
    if not db_bill:
        raise HTTPException(status_code=404, detail="Bill not found")

    if db_bill.payment_status == "paid":
        raise HTTPException(status_code=400, detail="Bill is already fully paid")

    if amount <= 0:
        raise HTTPException(status_code=400, detail="Payment amount must be greater than 0")

    remaining = db_bill.total_amount - db_bill.paid_amount
    if amount > remaining:
        raise HTTPException(status_code=400, detail="Payment amount cannot exceed remaining balance")

    db_bill.paid_amount += amount
    db_bill.payment_method = payment_method

    if db_bill.paid_amount >= db_bill.total_amount:
        db_bill.paid_amount = db_bill.total_amount
        db_bill.payment_status = "paid"
    elif db_bill.paid_amount > 0:
        db_bill.payment_status = "partial"
    
    db.commit()
    db.refresh(db_bill)
    return db_bill

@router.delete("/bills/{bill_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_bill(
    bill_id: int,
    current_user: User = Depends(get_admin_or_receptionist),
    db: Session = Depends(get_db)
):
    """Delete a bill"""
    db_bill = db.query(Bill).filter(Bill.id == bill_id).first()
    if not db_bill:
        raise HTTPException(status_code=404, detail="Bill not found")

    if db_bill.payment_status == "paid":
        raise HTTPException(status_code=400, detail="Paid bills cannot be deleted")
    
    db.delete(db_bill)
    db.commit()
    return None

# ============ PRESCRIPTIONS ============

@router.get("/prescriptions", response_model=List[PrescriptionResponse])
def get_all_prescriptions(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all prescriptions with pagination"""
    query = db.query(Prescription)
    if current_user.role == "doctor":
        query = query.filter(Prescription.doctor_id == current_user.doctor_id)
    prescriptions = query.offset(skip).limit(limit).all()
    return [attach_prescription_details(prescription) for prescription in prescriptions]

@router.get("/prescriptions/patient/{patient_id}", response_model=List[PrescriptionResponse])
def get_patient_prescriptions(
    patient_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all prescriptions for a specific patient"""
    query = db.query(Prescription).filter(Prescription.patient_id == patient_id)
    if current_user.role == "doctor":
        query = query.filter(Prescription.doctor_id == current_user.doctor_id)
    prescriptions = query.all()
    return [attach_prescription_details(prescription) for prescription in prescriptions]

@router.get("/prescriptions/doctor/{doctor_id}", response_model=List[PrescriptionResponse])
def get_doctor_prescriptions(
    doctor_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all prescriptions by a specific doctor"""
    if current_user.role == "doctor" and current_user.doctor_id != doctor_id:
        raise HTTPException(status_code=403, detail="You can only view your own prescriptions")

    prescriptions = db.query(Prescription).filter(Prescription.doctor_id == doctor_id).all()
    return [attach_prescription_details(prescription) for prescription in prescriptions]

@router.get("/prescriptions/{prescription_id}", response_model=PrescriptionResponse)
def get_prescription(
    prescription_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific prescription by ID"""
    prescription = db.query(Prescription).filter(Prescription.id == prescription_id).first()
    if not prescription:
        raise HTTPException(status_code=404, detail="Prescription not found")

    if current_user.role == "doctor" and prescription.doctor_id != current_user.doctor_id:
        raise HTTPException(status_code=403, detail="You can only view your own prescriptions")
    return attach_prescription_details(prescription)

@router.post("/prescriptions", response_model=PrescriptionResponse, status_code=status.HTTP_201_CREATED)
def create_prescription(
    prescription: PrescriptionCreate,
    current_user: User = Depends(get_current_doctor),
    db: Session = Depends(get_db)
):
    """Create a new prescription"""
    if prescription.doctor_id != current_user.doctor_id:
        raise HTTPException(status_code=403, detail="You can only create prescriptions for your own doctor profile")

    # Verify patient exists
    patient = db.query(Patient).filter(Patient.id == prescription.patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Verify doctor exists
    doctor = db.query(Doctor).filter(Doctor.id == prescription.doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    
    db_prescription = Prescription(**prescription.model_dump())
    db.add(db_prescription)
    db.commit()
    db.refresh(db_prescription)
    return attach_prescription_details(db_prescription)

@router.put("/prescriptions/{prescription_id}", response_model=PrescriptionResponse)
def update_prescription(
    prescription_id: int,
    prescription: PrescriptionUpdate,
    current_user: User = Depends(get_current_doctor),
    db: Session = Depends(get_db)
):
    """Update an existing prescription"""
    db_prescription = db.query(Prescription).filter(Prescription.id == prescription_id).first()
    if not db_prescription:
        raise HTTPException(status_code=404, detail="Prescription not found")

    if db_prescription.doctor_id != current_user.doctor_id:
        raise HTTPException(status_code=403, detail="You can only edit your own prescriptions")

    if prescription.doctor_id and prescription.doctor_id != current_user.doctor_id:
        raise HTTPException(status_code=403, detail="You cannot reassign prescription to another doctor")
    
    update_data = prescription.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_prescription, field, value)
    
    db.commit()
    db.refresh(db_prescription)
    return attach_prescription_details(db_prescription)

@router.delete("/prescriptions/{prescription_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_prescription(
    prescription_id: int,
    current_user: User = Depends(get_current_doctor),
    db: Session = Depends(get_db)
):
    """Delete a prescription"""
    db_prescription = db.query(Prescription).filter(Prescription.id == prescription_id).first()
    if not db_prescription:
        raise HTTPException(status_code=404, detail="Prescription not found")

    if db_prescription.doctor_id != current_user.doctor_id:
        raise HTTPException(status_code=403, detail="You can only delete your own prescriptions")
    
    db.delete(db_prescription)
    db.commit()
    return None
