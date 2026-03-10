-- Simplified MediRouteX Database Schema (without PostGIS for local dev)
-- PostgreSQL 15

-- Create database extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    role VARCHAR(50) NOT NULL DEFAULT 'patient',
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Emergencies table
CREATE TABLE IF NOT EXISTS emergencies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_name VARCHAR(255) NOT NULL,
    reporter_phone VARCHAR(50) NOT NULL,
    location_lat DECIMAL(10, 7) NOT NULL,
    location_lng DECIMAL(10, 7) NOT NULL,
    location_address TEXT,
    severity VARCHAR(50) NOT NULL,
    type VARCHAR(100) NOT NULL,
    description TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    assigned_ambulance_id UUID,
    assigned_hospital_id UUID,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_emergencies_status ON emergencies(status);
CREATE INDEX IF NOT EXISTS idx_emergencies_severity ON emergencies(severity);
CREATE INDEX IF NOT EXISTS idx_emergencies_ambulance ON emergencies(assigned_ambulance_id);
CREATE INDEX IF NOT EXISTS idx_emergencies_hospital ON emergencies(assigned_hospital_id);

-- Ambulances table
CREATE TABLE IF NOT EXISTS ambulances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    registration_number VARCHAR(50) UNIQUE NOT NULL,
    type VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'available',
    current_location_lat DECIMAL(10, 7),
    current_location_lng DECIMAL(10, 7),
    driver_id UUID,
    driver_name VARCHAR(255),
    equipment TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ambulances_status ON ambulances(status);
CREATE INDEX IF NOT EXISTS idx_ambulances_type ON ambulances(type);

-- Hospitals table
CREATE TABLE IF NOT EXISTS hospitals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    location_lat DECIMAL(10, 7) NOT NULL,
    location_lng DECIMAL(10, 7) NOT NULL,
    address TEXT NOT NULL,
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(255),
    specializations TEXT[],
    total_beds INTEGER NOT NULL DEFAULT 0,
    available_beds INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'operational',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hospitals_status ON hospitals(status);

-- Routes table
CREATE TABLE IF NOT EXISTS routes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    emergency_id UUID,
    ambulance_id UUID,
    start_lat DECIMAL(10, 7) NOT NULL,
    start_lng DECIMAL(10, 7) NOT NULL,
    end_lat DECIMAL(10, 7) NOT NULL,
    end_lng DECIMAL(10, 7) NOT NULL,
    distance_km DECIMAL(10, 2),
    duration_minutes DECIMAL(10, 2),
    traffic_level VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_routes_emergency ON routes(emergency_id);
CREATE INDEX IF NOT EXISTS idx_routes_ambulance ON routes(ambulance_id);

-- Blood Inventory table (per hospital, per blood type)
CREATE TABLE IF NOT EXISTS blood_inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    blood_type VARCHAR(5) NOT NULL CHECK (blood_type IN ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
    units_available INTEGER NOT NULL DEFAULT 0 CHECK (units_available >= 0),
    units_reserved INTEGER NOT NULL DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (hospital_id, blood_type)
);

CREATE INDEX IF NOT EXISTS idx_blood_inventory_hospital ON blood_inventory(hospital_id);
CREATE INDEX IF NOT EXISTS idx_blood_inventory_type ON blood_inventory(blood_type);
CREATE INDEX IF NOT EXISTS idx_blood_inventory_units ON blood_inventory(units_available);

-- Blood Emergency Alerts table
CREATE TABLE IF NOT EXISTS blood_emergency_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    requesting_hospital_id UUID NOT NULL REFERENCES hospitals(id),
    blood_type VARCHAR(5) NOT NULL CHECK (blood_type IN ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
    units_needed INTEGER NOT NULL CHECK (units_needed > 0),
    urgency VARCHAR(20) NOT NULL DEFAULT 'Urgent' CHECK (urgency IN ('Critical','Urgent','Standard')),
    patient_info TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active','Fulfilled','Cancelled')),
    responded_by UUID[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '1 hour')
);

CREATE INDEX IF NOT EXISTS idx_blood_alerts_status ON blood_emergency_alerts(status);
CREATE INDEX IF NOT EXISTS idx_blood_alerts_type ON blood_emergency_alerts(blood_type);
CREATE INDEX IF NOT EXISTS idx_blood_alerts_hospital ON blood_emergency_alerts(requesting_hospital_id);
CREATE INDEX IF NOT EXISTS idx_blood_alerts_urgency ON blood_emergency_alerts(urgency);

-- Blood Alert Responses table
CREATE TABLE IF NOT EXISTS blood_alert_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    alert_id UUID NOT NULL REFERENCES blood_emergency_alerts(id) ON DELETE CASCADE,
    responding_hospital_id UUID NOT NULL REFERENCES hospitals(id),
    units_available INTEGER NOT NULL,
    eta_minutes INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert demo admin user (password: admin1234)
INSERT INTO users (email, password_hash, name, phone, role, status)
VALUES (
    'admin@mediroutex.com',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5OU7oLT6xKXNe',
    'System Administrator',
    '+1234567890',
    'admin',
    'active'
) ON CONFLICT (email) DO NOTHING;

-- Insert demo hospitals
INSERT INTO hospitals (name, type, location_lat, location_lng, address, phone, specializations, total_beds, available_beds, status)
VALUES
    ('City General Hospital', 'general', 40.7128, -74.0060, '123 Main St, New York, NY', '+1234567001', ARRAY['Emergency', 'Surgery', 'ICU'], 200, 45, 'operational'),
    ('Metro Medical Center', 'specialized', 40.7589, -73.9851, '456 Park Ave, New York, NY', '+1234567002', ARRAY['Cardiology', 'Neurology', 'Trauma'], 150, 32, 'operational'),
    ('Downtown Emergency Hospital', 'emergency', 40.7484, -73.9857, '789 Broadway, New York, NY', '+1234567003', ARRAY['Emergency', 'Pediatrics', 'Trauma'], 180, 28, 'operational')
ON CONFLICT DO NOTHING;

-- Insert demo ambulances
INSERT INTO ambulances (registration_number, type, status, current_location_lat, current_location_lng, equipment, driver_name)
VALUES
    ('AMB-001', 'advanced', 'available', 40.7300, -73.9950, ARRAY['Defibrillator', 'Ventilator', 'IV Equipment'], 'John Smith'),
    ('AMB-002', 'basic', 'available', 40.7500, -74.0000, ARRAY['First Aid', 'Oxygen', 'Stretcher'], 'Jane Doe'),
    ('AMB-003', 'advanced', 'available', 40.7400, -73.9900, ARRAY['Defibrillator', 'Medications', 'Monitor'], 'Mike Johnson')
ON CONFLICT (registration_number) DO NOTHING;

SELECT 'Database initialized successfully!' AS status;
