-- Hospital Management System Database Schema
-- PostgreSQL

-- Drop existing tables if they exist
DROP TABLE IF EXISTS prescriptions CASCADE;
DROP TABLE IF EXISTS bills CASCADE;
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS doctors CASCADE;
DROP TABLE IF EXISTS patients CASCADE;

-- Create patients table
-- Create patients table
CREATE TABLE patients (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(11) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender VARCHAR(10) NOT NULL,
    blood_group VARCHAR(5),
    address TEXT,
    emergency_contact VARCHAR(20),
    cnic VARCHAR(20),
    medical_history TEXT,
    allergies TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE
);

-- Create doctors table
CREATE TABLE doctors (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20) NOT NULL,
    specialization VARCHAR(100) NOT NULL,
    qualification VARCHAR(255),
    experience_years INTEGER DEFAULT 0,
    consultation_fee DECIMAL(10,2) DEFAULT 0.00,
    available_days VARCHAR(100),
    available_time_start VARCHAR(10),
    available_time_end VARCHAR(10),
    bio TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE
);

-- Create appointments table
CREATE TABLE appointments (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id INTEGER NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    appointment_date DATE NOT NULL,
    appointment_time VARCHAR(10) NOT NULL,
    status VARCHAR(20) DEFAULT 'scheduled',
    reason TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE
);

-- Create bills table
CREATE TABLE bills (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    bill_date DATE NOT NULL,
    consultation_fee DECIMAL(10,2) DEFAULT 0.00,
    medicine_cost DECIMAL(10,2) DEFAULT 0.00,
    lab_test_cost DECIMAL(10,2) DEFAULT 0.00,
    other_charges DECIMAL(10,2) DEFAULT 0.00,
    discount DECIMAL(10,2) DEFAULT 0.00,
    total_amount DECIMAL(10,2) NOT NULL,
    paid_amount DECIMAL(10,2) DEFAULT 0.00,
    payment_status VARCHAR(20) DEFAULT 'pending',
    payment_method VARCHAR(20),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE
);

-- Create prescriptions table
CREATE TABLE prescriptions (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id INTEGER NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    prescription_date DATE NOT NULL,
    diagnosis TEXT,
    symptoms TEXT,
    medications TEXT,
    instructions TEXT,
    follow_up_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX idx_patients_email ON patients(email);
CREATE INDEX idx_doctors_email ON doctors(email);
CREATE INDEX idx_doctors_specialization ON doctors(specialization);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_appointments_patient ON appointments(patient_id);
CREATE INDEX idx_appointments_doctor ON appointments(doctor_id);
CREATE INDEX idx_bills_patient ON bills(patient_id);
CREATE INDEX idx_bills_status ON bills(payment_status);
CREATE INDEX idx_prescriptions_patient ON prescriptions(patient_id);
CREATE INDEX idx_prescriptions_doctor ON prescriptions(doctor_id);

-- Insert sample data
-- Sample Doctors
INSERT INTO doctors (first_name,last_name,email,phone,specialization,qualification,experience_years,consultation_fee,available_days,available_time_start,available_time_end,bio,is_active) VALUES
('Muhammad','Bilal','bilal786@gmail.com','03125550101','Cardiology','MD, DM Cardiology',15,150.00,'Mon,Tue,Wed,Thu,Fri','09:00','17:00','Experienced cardiologist specializing in heart diseases and interventional cardiology.',true),
('Ali','Khan','ali.khan@gmail.com','03124567891','Dermatology','MBBS, FCPS Dermatology',10,120.00,'Mon,Tue,Wed,Thu','10:00','16:00','Dermatologist focused on skin allergies and cosmetic dermatology.',true),
('Sara','Ahmed','sara.ahmed@gmail.com','03011234567','Gynecology','MBBS, FCPS Gynecology',12,140.00,'Mon,Wed,Fri','09:00','15:00','Specialist in women health and prenatal care.',true),
('Usman','Raza','usman.raza@gmail.com','03219876543','Orthopedics','MBBS, MS Orthopedics',14,160.00,'Tue,Wed,Thu,Sat','11:00','18:00','Orthopedic surgeon treating bone fractures and joint problems.',true),
('Fatima','Malik','fatima.malik@gmail.com','03334561234','Pediatrics','MBBS, FCPS Pediatrics',9,110.00,'Mon,Tue,Thu,Fri','08:30','14:30','Pediatrician dedicated to child health and vaccinations.',true),
('Hassan','Qureshi','hassan.qureshi@gmail.com','03055667788','Neurology','MBBS, FCPS Neurology',18,180.00,'Mon,Tue,Wed,Thu,Fri','10:00','17:30','Neurologist treating brain and nervous system disorders.',true),
('Ayesha','Siddiqui','ayesha.siddiqui@gmail.com','03112223344','Ophthalmology','MBBS, FCPS Ophthalmology',11,130.00,'Mon,Wed,Thu,Sat','09:30','15:30','Eye specialist focusing on vision care and cataract surgery.',true),
('Imran','Shah','imran.shah@gmail.com','03456789012','General Medicine','MBBS, FCPS Medicine',16,100.00,'Mon,Tue,Wed,Thu,Fri,Sat','09:00','18:00','General physician handling routine health issues and chronic diseases.',true),
('Zainab','Farooq','zainab.farooq@gmail.com','03099887766','ENT','MBBS, FCPS ENT',8,115.00,'Tue,Wed,Thu,Fri','10:00','16:00','ENT specialist treating ear, nose, and throat conditions.',true),
('Omar','Yousaf','omar.yousaf@gmail.com','03133445566','Psychiatry','MBBS, FCPS Psychiatry',13,150.00,'Mon,Wed,Thu,Fri','11:00','17:00','Psychiatrist focusing on mental health and behavioral therapy.',true),
('Nadia','Iqbal','nadia.iqbal@gmail.com','03224446688','Endocrinology','MBBS, FCPS Endocrinology',17,170.00,'Mon,Tue,Thu,Fri','09:30','16:30','Endocrinologist treating diabetes and hormonal disorders.',true);

-- Sample Patients
INSERT INTO patients (first_name,last_name,email,phone,date_of_birth,gender,blood_group,address,emergency_contact,medical_history,allergies) VALUES
('Ahmed','Raza','ahmed.raza@email.com','03111111111','1985-04-12','male','A+','Street 10 Rawalpindi','03112222222','Hypertension','None'),
('Aisha','Khan','aisha.khan@email.com','03223334444','1992-07-19','female','B+','G-11 Islamabad','03224445555','None','Penicillin'),
('Bilal','Sheikh','bilal.sheikh@email.com','03335556666','1988-01-25','male','O+','Faisal Town Lahore','03336667777','Asthma','Dust'),
('Hina','Ali','hina.ali@email.com','03001234567','1995-10-03','female','AB+','Satellite Town Rawalpindi','03007654321','Migraine','None'),
('Usman','Malik','usman.malik@email.com','03135558888','1979-06-18','male','O-','Bahria Town Phase 4','03136669999','Diabetes','None');

-- Sample Appointments
INSERT INTO appointments (patient_id,doctor_id,appointment_date,appointment_time,status,reason,notes) VALUES
(1,1,CURRENT_DATE,'10:00','scheduled','Heart checkup','Follow up visit'),
(2,2,CURRENT_DATE,'11:00','scheduled','Skin rash','Allergy symptoms'),
(3,5,CURRENT_DATE+1,'09:30','scheduled','Child fever','Routine pediatric check'),
(4,4,CURRENT_DATE+1,'14:00','scheduled','Bone pain','Possible fracture'),
(5,3,CURRENT_DATE+2,'10:30','scheduled','Pregnancy consultation','First visit');

-- Sample Bills
INSERT INTO bills (patient_id,bill_date,consultation_fee,medicine_cost,lab_test_cost,other_charges,discount,total_amount,paid_amount,payment_status,payment_method,notes) VALUES
(1,CURRENT_DATE-7,150.00,70.00,200.00,0.00,20.00,400.00,400.00,'paid','card','Heart test and consultation'),
(2,CURRENT_DATE-3,120.00,50.00,0.00,0.00,0.00,170.00,170.00,'paid','cash','Dermatology consultation'),
(3,CURRENT_DATE-1,110.00,90.00,120.00,0.00,30.00,290.00,150.00,'partial','card','Partial payment'),
(4,CURRENT_DATE,160.00,60.00,0.00,0.00,0.00,220.00,0.00,'pending',NULL,'New patient bill'),
(5,CURRENT_DATE-14,140.00,0.00,250.00,50.00,0.00,440.00,440.00,'paid','insurance','Lab tests and consultation');

-- Sample Prescriptions
INSERT INTO prescriptions (patient_id,doctor_id,prescription_date,diagnosis,symptoms,medications,instructions,follow_up_date) VALUES
(1,1,CURRENT_DATE-7,'Mild Hypertension','Headache','[{"name":"Amlodipine","dosage":"5mg","frequency":"Once daily"}]','Take daily and reduce salt',CURRENT_DATE+20),
(2,2,CURRENT_DATE-3,'Skin Allergy','Red rash','[{"name":"Cetirizine","dosage":"10mg","frequency":"Once daily"}]','Avoid allergen exposure',CURRENT_DATE+14),
(3,5,CURRENT_DATE-1,'Child Fever','High temperature','[{"name":"Paracetamol","dosage":"250mg","frequency":"Three times daily"}]','Maintain hydration',CURRENT_DATE+7),
(4,4,CURRENT_DATE,'Muscle strain','Pain in leg','[{"name":"Ibuprofen","dosage":"400mg","frequency":"Twice daily"}]','Rest affected area',CURRENT_DATE+10),
(5,3,CURRENT_DATE-14,'Pregnancy checkup','Routine visit','[{"name":"Folic Acid","dosage":"5mg","frequency":"Once daily"}]','Healthy diet recommended',CURRENT_DATE+30);


-- Display table counts
SELECT 'Database initialized successfully!' as status;
SELECT 'Patients' as table_name, COUNT(*) as count FROM patients
UNION ALL
SELECT 'Doctors', COUNT(*) FROM doctors
UNION ALL
SELECT 'Appointments', COUNT(*) FROM appointments
UNION ALL
SELECT 'Bills', COUNT(*) FROM bills
UNION ALL
SELECT 'Prescriptions', COUNT(*) FROM prescriptions;
