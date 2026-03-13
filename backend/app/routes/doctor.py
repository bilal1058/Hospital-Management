from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models.doctor import Doctor
from ..schemas.doctor import DoctorCreate, DoctorUpdate, DoctorResponse

router = APIRouter(prefix="/doctors", tags=["Doctors"])

@router.get("/", response_model=List[DoctorResponse])
def get_all_doctors(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get all doctors with pagination"""
    doctors = db.query(Doctor).offset(skip).limit(limit).all()
    return doctors

@router.get("/active", response_model=List[DoctorResponse])
def get_active_doctors(db: Session = Depends(get_db)):
    """Get only active doctors"""
    doctors = db.query(Doctor).filter(Doctor.is_active == True).all()
    return doctors

@router.get("/specialization/{specialization}", response_model=List[DoctorResponse])
def get_doctors_by_specialization(specialization: str, db: Session = Depends(get_db)):
    """Get doctors by specialization"""
    doctors = db.query(Doctor).filter(
        Doctor.specialization.ilike(f"%{specialization}%")
    ).all()
    return doctors

@router.get("/{doctor_id}", response_model=DoctorResponse)
def get_doctor(doctor_id: int, db: Session = Depends(get_db)):
    """Get a specific doctor by ID"""
    doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    return doctor

@router.post("/", response_model=DoctorResponse, status_code=status.HTTP_201_CREATED)
def create_doctor(doctor: DoctorCreate, db: Session = Depends(get_db)):
    """Create a new doctor"""
    if doctor.email:
        existing = db.query(Doctor).filter(Doctor.email == doctor.email).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email already registered")
    
    db_doctor = Doctor(**doctor.model_dump())
    db.add(db_doctor)
    db.commit()
    db.refresh(db_doctor)
    return db_doctor

@router.put("/{doctor_id}", response_model=DoctorResponse)
def update_doctor(doctor_id: int, doctor: DoctorUpdate, db: Session = Depends(get_db)):
    """Update an existing doctor"""
    db_doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
    if not db_doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    
    update_data = doctor.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_doctor, field, value)
    
    db.commit()
    db.refresh(db_doctor)
    return db_doctor

@router.delete("/{doctor_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_doctor(doctor_id: int, db: Session = Depends(get_db)):
    """Delete a doctor"""
    db_doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
    if not db_doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    
    db.delete(db_doctor)
    db.commit()
    return None

@router.get("/specializations/list", response_model=List[str])
def get_specializations():
    """Get list of available specializations"""
    return [
        "Cardiology",
        "Dermatology",
        "Neurology",
        "Orthopedics",
        "Pediatrics",
        "Psychiatry",
        "General Medicine",
        "Surgery",
        "Gynecology",
        "ENT"
    ]
