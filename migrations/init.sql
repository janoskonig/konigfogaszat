-- Enable pgcrypto extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Time Slots table
CREATE TABLE IF NOT EXISTS time_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    start_time TIMESTAMP NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('available', 'booked')),
    cim VARCHAR(255) DEFAULT '5600 Békéscsaba, Kolozsvári utca 3',
    dentist_name VARCHAR(255) DEFAULT 'dr. König János',
    dentist_email VARCHAR(255) DEFAULT 'drkonigjanos@gmail.com',
    user_email VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_time_slots_start_time ON time_slots(start_time);
CREATE INDEX IF NOT EXISTS idx_time_slots_status ON time_slots(status);

-- Patients table
CREATE TABLE IF NOT EXISTS patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nev VARCHAR(255),
    taj VARCHAR(20),
    email VARCHAR(255),
    telefonszam VARCHAR(50),
    szuletesi_datum DATE,
    nem VARCHAR(20) CHECK (nem IN ('ferfi', 'no', 'nem_ismert')),
    cim VARCHAR(255),
    varos VARCHAR(100),
    iranyitoszam VARCHAR(10),
    beutalo_orvos VARCHAR(255),
    beutalo_indokolas TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_patients_email ON patients(email);
CREATE INDEX IF NOT EXISTS idx_patients_taj ON patients(taj);

-- Appointments table
CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    time_slot_id UUID REFERENCES time_slots(id) ON DELETE CASCADE,
    start_time TIMESTAMP NOT NULL,
    patient_name VARCHAR(255),
    patient_taj VARCHAR(20),
    dentist_email VARCHAR(255) NOT NULL,
    dentist_name VARCHAR(255),
    appointment_status VARCHAR(50) CHECK (appointment_status IN ('cancelled_by_doctor', 'cancelled_by_patient', 'completed', 'no_show')),
    appointment_type VARCHAR(50) CHECK (appointment_type IN ('elso_konzultacio', 'munkafazis', 'kontroll')),
    approval_status VARCHAR(20) CHECK (approval_status IN ('pending', 'approved', 'rejected')),
    completion_notes TEXT,
    is_late BOOLEAN DEFAULT FALSE,
    cim VARCHAR(255),
    created_by VARCHAR(50),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_time_slot_id ON appointments(time_slot_id);
CREATE INDEX IF NOT EXISTS idx_appointments_start_time ON appointments(start_time);
CREATE INDEX IF NOT EXISTS idx_appointments_dentist_email ON appointments(dentist_email);

-- Patient Portal Tokens table
CREATE TABLE IF NOT EXISTS patient_portal_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token VARCHAR(255) UNIQUE NOT NULL,
    patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
    email VARCHAR(255) NOT NULL,
    taj VARCHAR(20) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_patient_portal_tokens_token ON patient_portal_tokens(token);
CREATE INDEX IF NOT EXISTS idx_patient_portal_tokens_email ON patient_portal_tokens(email);
CREATE INDEX IF NOT EXISTS idx_patient_portal_tokens_expires_at ON patient_portal_tokens(expires_at);

-- Patient Portal Sessions table
CREATE TABLE IF NOT EXISTS patient_portal_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id VARCHAR(255) UNIQUE NOT NULL,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_patient_portal_sessions_session_id ON patient_portal_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_patient_portal_sessions_patient_id ON patient_portal_sessions(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_portal_sessions_expires_at ON patient_portal_sessions(expires_at);

-- Settings table
CREATE TABLE IF NOT EXISTS settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(255) UNIQUE NOT NULL,
    value TEXT,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to automatically update updated_at
CREATE TRIGGER update_time_slots_updated_at BEFORE UPDATE ON time_slots
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON patients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

