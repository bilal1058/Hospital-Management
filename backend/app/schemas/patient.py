from pydantic import BaseModel, EmailStr, field_validator, Field
from datetime import date, datetime
from typing import Optional
import re

# Valid options
VALID_GENDERS = ["male", "female", "other"]
VALID_BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]

class PatientBase(BaseModel):
    first_name: str = Field(..., min_length=2, max_length=50, description="First name (2-50 characters)")
    last_name: str = Field(..., min_length=2, max_length=50, description="Last name (2-50 characters)")
    email: Optional[EmailStr] = None
    phone: str = Field(..., description="Phone number (11 digits, e.g., 03001234567)")
    date_of_birth: date
    gender: str = Field(..., description="Gender: male, female, or other")
    blood_group: Optional[str] = Field(None, description="Blood group: A+, A-, B+, B-, AB+, AB-, O+, O-")
    address: Optional[str] = Field(None, max_length=500)
    emergency_contact: Optional[str] = Field(None, description="Emergency contact (11 digits)")
    cnic: Optional[str] = Field(None, description="CNIC (13 digits without dashes)")
    medical_history: Optional[str] = None
    allergies: Optional[str] = None

    @field_validator('phone')
    @classmethod
    def validate_phone(cls, v):
        if not v:
            raise ValueError('Phone number is required')
        # Remove any spaces or dashes
        v = re.sub(r'[\s\-]', '', v)
        if not re.match(r'^03\d{9}$', v):
            raise ValueError('Phone must be 11 digits starting with 03 (e.g., 03001234567)')
        return v

    @field_validator('emergency_contact')
    @classmethod
    def validate_emergency_contact(cls, v):
        if v:
            v = re.sub(r'[\s\-]', '', v)
            if not re.match(r'^03\d{9}$', v):
                raise ValueError('Emergency contact must be 11 digits starting with 03')
        return v

    @field_validator('cnic')
    @classmethod
    def validate_cnic(cls, v):
        if v:
            v = re.sub(r'[\s\-]', '', v)
            if not re.match(r'^\d{13}$', v):
                raise ValueError('CNIC must be exactly 13 digits (without dashes)')
        return v

    @field_validator('gender')
    @classmethod
    def validate_gender(cls, v):
        if v.lower() not in VALID_GENDERS:
            raise ValueError(f'Gender must be one of: {", ".join(VALID_GENDERS)}')
        return v.lower()

    @field_validator('blood_group')
    @classmethod
    def validate_blood_group(cls, v):
        if v and v.upper() not in VALID_BLOOD_GROUPS:
            raise ValueError(f'Blood group must be one of: {", ".join(VALID_BLOOD_GROUPS)}')
        return v.upper() if v else None

    @field_validator('date_of_birth')
    @classmethod
    def validate_dob(cls, v):
        today = date.today()
        if v > today:
            raise ValueError('Date of birth cannot be in the future')
        age = (today - v).days // 365
        if age > 150:
            raise ValueError('Please enter a valid date of birth')
        return v

    @field_validator('first_name', 'last_name')
    @classmethod
    def validate_name(cls, v):
        if not re.match(r'^[a-zA-Z\s]+$', v):
            raise ValueError('Name should only contain letters and spaces')
        return v.strip().title()

class PatientCreate(PatientBase):
    pass

class PatientUpdate(BaseModel):
    first_name: Optional[str] = Field(None, min_length=2, max_length=50)
    last_name: Optional[str] = Field(None, min_length=2, max_length=50)
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    blood_group: Optional[str] = None
    address: Optional[str] = Field(None, max_length=500)
    emergency_contact: Optional[str] = None
    cnic: Optional[str] = None
    medical_history: Optional[str] = None
    allergies: Optional[str] = None

    @field_validator('phone')
    @classmethod
    def validate_phone(cls, v):
        if v:
            v = re.sub(r'[\s\-]', '', v)
            if not re.match(r'^03\d{9}$', v):
                raise ValueError('Phone must be 11 digits starting with 03 (e.g., 03001234567)')
        return v

    @field_validator('emergency_contact')
    @classmethod
    def validate_emergency_contact(cls, v):
        if v:
            v = re.sub(r'[\s\-]', '', v)
            if not re.match(r'^03\d{9}$', v):
                raise ValueError('Emergency contact must be 11 digits starting with 03')
        return v

    @field_validator('cnic')
    @classmethod
    def validate_cnic(cls, v):
        if v:
            v = re.sub(r'[\s\-]', '', v)
            if not re.match(r'^\d{13}$', v):
                raise ValueError('CNIC must be exactly 13 digits')
        return v

    @field_validator('gender')
    @classmethod
    def validate_gender(cls, v):
        if v and v.lower() not in VALID_GENDERS:
            raise ValueError(f'Gender must be one of: {", ".join(VALID_GENDERS)}')
        return v.lower() if v else None

    @field_validator('blood_group')
    @classmethod
    def validate_blood_group(cls, v):
        if v and v.upper() not in VALID_BLOOD_GROUPS:
            raise ValueError(f'Blood group must be one of: {", ".join(VALID_BLOOD_GROUPS)}')
        return v.upper() if v else None

    @field_validator('first_name', 'last_name')
    @classmethod
    def validate_name(cls, v):
        if v and not re.match(r'^[a-zA-Z\s]+$', v):
            raise ValueError('Name should only contain letters and spaces')
        return v.strip().title() if v else None

class PatientResponse(BaseModel):
    id: int
    first_name: str
    last_name: str
    email: Optional[EmailStr] = None
    phone: str
    date_of_birth: date
    gender: str
    blood_group: Optional[str] = None
    address: Optional[str] = None
    emergency_contact: Optional[str] = None
    cnic: Optional[str] = None
    medical_history: Optional[str] = None
    allergies: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
