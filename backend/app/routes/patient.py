from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models.patient import Patient
from ..schemas.patient import PatientCreate, PatientUpdate, PatientResponse
from ..models.user import User
from ..auth import get_admin_or_receptionist

router = APIRouter(prefix="/patients", tags=["Patients"])

@router.get("/", response_model=List[PatientResponse])
def get_all_patients(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_admin_or_receptionist),
    db: Session = Depends(get_db)
):
    """Get all patients with pagination"""
    patients = db.query(Patient).offset(skip).limit(limit).all()
    return patients

@router.get("/{patient_id}", response_model=PatientResponse)
def get_patient(
    patient_id: int,
    current_user: User = Depends(get_admin_or_receptionist),
    db: Session = Depends(get_db)
):
    """Get a specific patient by ID"""
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient

@router.post("/", response_model=PatientResponse, status_code=status.HTTP_201_CREATED)
def create_patient(
    patient: PatientCreate,
    current_user: User = Depends(get_admin_or_receptionist),
    db: Session = Depends(get_db)
):
    """Create a new patient"""
    # Check if email already exists
    if patient.email:
        existing = db.query(Patient).filter(Patient.email == patient.email).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email already registered")
    
    db_patient = Patient(**patient.model_dump())
    db.add(db_patient)
    db.commit()
    db.refresh(db_patient)
    return db_patient

@router.put("/{patient_id}", response_model=PatientResponse)
def update_patient(
    patient_id: int,
    patient: PatientUpdate,
    current_user: User = Depends(get_admin_or_receptionist),
    db: Session = Depends(get_db)
):
    """Update an existing patient"""
    db_patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not db_patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    update_data = patient.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_patient, field, value)
    
    db.commit()
    db.refresh(db_patient)
    return db_patient

@router.delete("/{patient_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_patient(
    patient_id: int,
    current_user: User = Depends(get_admin_or_receptionist),
    db: Session = Depends(get_db)
):
    """Delete a patient"""
    db_patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not db_patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    db.delete(db_patient)
    db.commit()
    return None

@router.get("/search/{query}", response_model=List[PatientResponse])
def search_patients(
    query: str,
    current_user: User = Depends(get_admin_or_receptionist),
    db: Session = Depends(get_db)
):
    """Search patients by name or email"""
    patients = db.query(Patient).filter(
        (Patient.first_name.ilike(f"%{query}%")) |
        (Patient.last_name.ilike(f"%{query}%")) |
        (Patient.email.ilike(f"%{query}%"))
    ).all()
    return patients
