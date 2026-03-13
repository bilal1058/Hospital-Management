from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date
from ..database import get_db
from ..models.appointment import Appointment
from ..models.patient import Patient
from ..models.doctor import Doctor
from ..models.user import User
from ..schemas.appointment import (
    AppointmentCreate, AppointmentUpdate, AppointmentResponse, 
    AppointmentWithDetails, AppointmentStatusUpdate
)
from ..auth import get_current_user, get_admin_or_receptionist

router = APIRouter(prefix="/appointments", tags=["Appointments"])

def attach_appointment_details(appointment: Appointment):
    appointment.patient_name = f"{appointment.patient.first_name} {appointment.patient.last_name}" if appointment.patient else None
    appointment.doctor_name = f"Dr. {appointment.doctor.first_name} {appointment.doctor.last_name}" if appointment.doctor else None
    return appointment

def check_appointment_access(user: User, appointment: Appointment) -> bool:
    """Check if user can access this appointment"""
    if user.role in ["admin", "receptionist"]:
        return True
    if user.role == "doctor":
        return user.doctor_id == appointment.doctor_id
    return False

@router.get("/", response_model=List[AppointmentResponse])
def get_all_appointments(
    skip: int = 0, 
    limit: int = 100, 
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get appointments based on user role:
    - Admin/Receptionist: All appointments
    - Doctor: Only their own appointments
    """
    query = db.query(Appointment)
    
    # Doctors can only see their own appointments
    if current_user.role == "doctor":
        if not current_user.doctor_id:
            raise HTTPException(status_code=403, detail="Doctor profile not linked")
        query = query.filter(Appointment.doctor_id == current_user.doctor_id)
    
    appointments = query.offset(skip).limit(limit).all()
    return [attach_appointment_details(appointment) for appointment in appointments]

@router.get("/today", response_model=List[AppointmentResponse])
def get_today_appointments(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get today's appointments (filtered by role)"""
    today = date.today()
    query = db.query(Appointment).filter(Appointment.appointment_date == today)
    
    if current_user.role == "doctor":
        query = query.filter(Appointment.doctor_id == current_user.doctor_id)
    
    return [attach_appointment_details(appointment) for appointment in query.all()]

@router.get("/my-appointments", response_model=List[AppointmentResponse])
def get_my_appointments(
    status_filter: Optional[str] = Query(None, description="Filter by status"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get appointments for the logged-in doctor"""
    if current_user.role != "doctor":
        raise HTTPException(
            status_code=403, 
            detail="This endpoint is only for doctors"
        )
    
    query = db.query(Appointment).filter(
        Appointment.doctor_id == current_user.doctor_id
    )
    
    if status_filter:
        query = query.filter(Appointment.status == status_filter)
    
    return [attach_appointment_details(appointment) for appointment in query.order_by(Appointment.appointment_date.desc()).all()]

@router.get("/patient/{patient_id}", response_model=List[AppointmentResponse])
def get_patient_appointments(
    patient_id: int, 
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all appointments for a specific patient"""
    query = db.query(Appointment).filter(Appointment.patient_id == patient_id)
    
    # Doctors can only see appointments where they are the assigned doctor
    if current_user.role == "doctor":
        query = query.filter(Appointment.doctor_id == current_user.doctor_id)
    
    return [attach_appointment_details(appointment) for appointment in query.all()]

@router.get("/doctor/{doctor_id}", response_model=List[AppointmentResponse])
def get_doctor_appointments(
    doctor_id: int, 
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all appointments for a specific doctor"""
    # Doctors can only view their own appointments
    if current_user.role == "doctor" and current_user.doctor_id != doctor_id:
        raise HTTPException(
            status_code=403, 
            detail="You can only view your own appointments"
        )
    
    appointments = db.query(Appointment).filter(
        Appointment.doctor_id == doctor_id
    ).all()
    return [attach_appointment_details(appointment) for appointment in appointments]

@router.get("/status/{status}", response_model=List[AppointmentResponse])
def get_appointments_by_status(
    status: str, 
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get appointments by status (filtered by role)"""
    query = db.query(Appointment).filter(Appointment.status == status)
    
    if current_user.role == "doctor":
        query = query.filter(Appointment.doctor_id == current_user.doctor_id)
    
    return [attach_appointment_details(appointment) for appointment in query.all()]

@router.get("/{appointment_id}", response_model=AppointmentResponse)
def get_appointment(
    appointment_id: int, 
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific appointment by ID"""
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    # Check access
    if not check_appointment_access(current_user, appointment):
        raise HTTPException(
            status_code=403, 
            detail="You don't have access to this appointment"
        )
    
    return attach_appointment_details(appointment)

@router.post("/", response_model=AppointmentResponse, status_code=status.HTTP_201_CREATED)
def create_appointment(
    appointment: AppointmentCreate, 
    current_user: User = Depends(get_admin_or_receptionist),  # Only admin/receptionist can create
    db: Session = Depends(get_db)
):
    """Create a new appointment (Admin/Receptionist only)"""
    # Verify patient exists
    patient = db.query(Patient).filter(Patient.id == appointment.patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Verify doctor exists and is active
    doctor = db.query(Doctor).filter(Doctor.id == appointment.doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    if not doctor.is_active:
        raise HTTPException(status_code=400, detail="Doctor is not active")
    
    # Check for scheduling conflicts - no double booking
    existing = db.query(Appointment).filter(
        Appointment.doctor_id == appointment.doctor_id,
        Appointment.appointment_date == appointment.appointment_date,
        Appointment.appointment_time == appointment.appointment_time,
        Appointment.status.notin_(["cancelled", "no-show"])
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=400, 
            detail=f"Doctor already has an appointment at {appointment.appointment_time} on {appointment.appointment_date}"
        )
    
    # Check patient doesn't have overlapping appointment
    patient_conflict = db.query(Appointment).filter(
        Appointment.patient_id == appointment.patient_id,
        Appointment.appointment_date == appointment.appointment_date,
        Appointment.appointment_time == appointment.appointment_time,
        Appointment.status.notin_(["cancelled", "no-show"])
    ).first()
    
    if patient_conflict:
        raise HTTPException(
            status_code=400,
            detail="Patient already has an appointment at this time"
        )
    
    db_appointment = Appointment(**appointment.model_dump())
    db.add(db_appointment)
    db.commit()
    db.refresh(db_appointment)
    return attach_appointment_details(db_appointment)

@router.put("/{appointment_id}", response_model=AppointmentResponse)
def update_appointment(
    appointment_id: int, 
    appointment: AppointmentUpdate, 
    current_user: User = Depends(get_admin_or_receptionist),  # Only admin/receptionist can fully update
    db: Session = Depends(get_db)
):
    """Update an existing appointment (Admin/Receptionist only)"""
    db_appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not db_appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    # If changing time/date, check for conflicts
    update_data = appointment.model_dump(exclude_unset=True)
    
    new_date = update_data.get('appointment_date', db_appointment.appointment_date)
    new_time = update_data.get('appointment_time', db_appointment.appointment_time)
    new_doctor_id = update_data.get('doctor_id', db_appointment.doctor_id)
    
    if new_date != db_appointment.appointment_date or \
       new_time != db_appointment.appointment_time or \
       new_doctor_id != db_appointment.doctor_id:
        # Check for conflicts
        existing = db.query(Appointment).filter(
            Appointment.id != appointment_id,
            Appointment.doctor_id == new_doctor_id,
            Appointment.appointment_date == new_date,
            Appointment.appointment_time == new_time,
            Appointment.status.notin_(["cancelled", "no-show"])
        ).first()
        
        if existing:
            raise HTTPException(status_code=400, detail="Time slot not available")
    
    for field, value in update_data.items():
        setattr(db_appointment, field, value)
    
    db.commit()
    db.refresh(db_appointment)
    return attach_appointment_details(db_appointment)

@router.put("/{appointment_id}/status", response_model=AppointmentResponse)
def update_appointment_status(
    appointment_id: int, 
    status_update: AppointmentStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update appointment status:
    - Doctors can only update their own appointments
    - Admin/Receptionist can update any appointment
    """
    db_appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not db_appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    # Check access
    if current_user.role == "doctor":
        if current_user.doctor_id != db_appointment.doctor_id:
            raise HTTPException(
                status_code=403, 
                detail="You can only update your own appointments"
            )
    
    db_appointment.status = status_update.status
    if status_update.notes:
        db_appointment.notes = status_update.notes
    
    db.commit()
    db.refresh(db_appointment)
    return attach_appointment_details(db_appointment)

@router.put("/{appointment_id}/cancel", response_model=AppointmentResponse)
def cancel_appointment(
    appointment_id: int, 
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Cancel an appointment"""
    db_appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not db_appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    if not check_appointment_access(current_user, db_appointment):
        raise HTTPException(status_code=403, detail="Access denied")
    
    if db_appointment.status == "completed":
        raise HTTPException(status_code=400, detail="Cannot cancel a completed appointment")
    
    db_appointment.status = "cancelled"
    db.commit()
    db.refresh(db_appointment)
    return attach_appointment_details(db_appointment)

@router.put("/{appointment_id}/complete", response_model=AppointmentResponse)
def complete_appointment(
    appointment_id: int, 
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark an appointment as completed (Doctor only for their own appointments)"""
    db_appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not db_appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    # Only the assigned doctor can complete the appointment
    if current_user.role == "doctor":
        if current_user.doctor_id != db_appointment.doctor_id:
            raise HTTPException(
                status_code=403, 
                detail="Only the assigned doctor can mark this appointment as completed"
            )
    elif current_user.role not in ["admin"]:
        raise HTTPException(
            status_code=403,
            detail="Only doctors can complete appointments"
        )
    
    if db_appointment.status == "cancelled":
        raise HTTPException(status_code=400, detail="Cannot complete a cancelled appointment")
    
    db_appointment.status = "completed"
    db.commit()
    db.refresh(db_appointment)
    return attach_appointment_details(db_appointment)

@router.delete("/{appointment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_appointment(
    appointment_id: int, 
    current_user: User = Depends(get_admin_or_receptionist),  # Only admin/receptionist can delete
    db: Session = Depends(get_db)
):
    """Delete an appointment (Admin/Receptionist only)"""
    db_appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not db_appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    db.delete(db_appointment)
    db.commit()
    return None
