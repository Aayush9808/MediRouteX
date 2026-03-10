-- MediRouteX Database Schema
-- Production-ready PostgreSQL schema with PostGIS for geospatial data

-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================
-- USERS TABLE
-- ==============================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'dispatcher', 'driver', 'hospital_staff', 'user')),
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- ==============================================
-- EMERGENCIES TABLE
-- ==============================================
CREATE TABLE emergencies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    emergency_number VARCHAR(50) UNIQUE NOT NULL, -- E-2024-xxxx format
    user_id UUID REFERENCES users(id),
    
    -- Patient Information
    patient_name VARCHAR(255) NOT NULL,
    patient_age VARCHAR(10) NOT NULL,
    patient_gender VARCHAR(20) NOT NULL,
    patient_phone VARCHAR(20),
    
    -- Emergency Details
    type VARCHAR(50) NOT NULL CHECK (type IN ('Medical', 'Accident', 'Fire', 'Natural Disaster', 'Other')),
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('Critical', 'High', 'Medium', 'Low')),
    description TEXT,
    
    -- Location (PostGIS Point)
    location GEOMETRY(Point, 4326) NOT NULL,
    location_address TEXT,
    location_lat DECIMAL(10, 8) NOT NULL,
    location_lng DECIMAL(11, 8) NOT NULL,
    
    -- Status Tracking
    status VARCHAR(50) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Dispatched', 'En Route', 'Arrived', 'Completed', 'Cancelled')),
    priority_score INTEGER DEFAULT 5, -- 1-10, calculated based on severity and other factors
    
    -- Assignments
    assigned_ambulance_id UUID REFERENCES ambulances(id),
    assigned_hospital_id UUID REFERENCES hospitals(id),
    assigned_dispatcher_id UUID REFERENCES users(id),
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    dispatched_at TIMESTAMP,
    arrived_at TIMESTAMP,
    completed_at TIMESTAMP,
    
    -- Response Time Tracking
    response_time_seconds INTEGER, -- Time taken from request to ambulance dispatch
    arrival_time_seconds INTEGER,  -- Time taken from dispatch to arrival
    total_time_seconds INTEGER     -- Total time from request to completion
);

CREATE INDEX idx_emergencies_status ON emergencies(status);
CREATE INDEX idx_emergencies_created_at ON emergencies(created_at DESC);
CREATE INDEX idx_emergencies_location ON emergencies USING GIST(location);
CREATE INDEX idx_emergencies_ambulance ON emergencies(assigned_ambulance_id);
CREATE INDEX idx_emergencies_hospital ON emergencies(assigned_hospital_id);

-- ==============================================
-- AMBULANCES TABLE
-- ==============================================
CREATE TABLE ambulances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    registration_number VARCHAR(50) UNIQUE NOT NULL,
    
    -- Driver Information
    driver_id UUID REFERENCES users(id),
    driver_name VARCHAR(255),
    driver_phone VARCHAR(20),
    driver_photo_url TEXT,
    
    -- Ambulance Details
    type VARCHAR(50) NOT NULL CHECK (type IN ('Basic', 'Advanced', 'ICU')),
    status VARCHAR(50) NOT NULL DEFAULT 'Offline' CHECK (status IN ('Available', 'Busy', 'Offline', 'Maintenance')),
    
    -- Current Location (PostGIS Point)
    current_location GEOMETRY(Point, 4326),
    current_location_lat DECIMAL(10, 8),
    current_location_lng DECIMAL(11, 8),
    current_location_address TEXT,
    
    -- Real-time Tracking
    current_speed DECIMAL(5, 2), -- km/h
    bearing DECIMAL(5, 2),        -- degrees (0-360)
    last_location_update TIMESTAMP,
    
    -- Assignment
    assigned_emergency_id UUID REFERENCES emergencies(id),
    
    -- Equipment
    equipment JSONB, -- {"oxygen": true, "defibrillator": true, "ventilator": false}
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_service_date DATE,
    next_service_date DATE
);

CREATE INDEX idx_ambulances_status ON ambulances(status);
CREATE INDEX idx_ambulances_location ON ambulances USING GIST(current_location);
CREATE INDEX idx_ambulances_driver ON ambulances(driver_id);

-- ==============================================
-- HOSPITALS TABLE
-- ==============================================
CREATE TABLE hospitals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    
    -- Contact Information
    phone VARCHAR(20),
    email VARCHAR(255),
    emergency_contact VARCHAR(20),
    
    -- Location (PostGIS Point)
    location GEOMETRY(Point, 4326) NOT NULL,
    location_lat DECIMAL(10, 8) NOT NULL,
    location_lng DECIMAL(11, 8) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(20),
    
    -- Capacity Information
    icu_beds_total INTEGER DEFAULT 0,
    icu_beds_available INTEGER DEFAULT 0,
    emergency_beds_total INTEGER DEFAULT 0,
    emergency_beds_available INTEGER DEFAULT 0,
    general_beds_total INTEGER DEFAULT 0,
    general_beds_available INTEGER DEFAULT 0,
    ventilators_total INTEGER DEFAULT 0,
    ventilators_available INTEGER DEFAULT 0,
    oxygen_cylinders_available INTEGER DEFAULT 0,
    
    -- Facilities
    facilities JSONB, -- ["ICU", "Trauma Center", "Burn Unit", "Cardiac Care"]
    specialties JSONB, -- ["Cardiology", "Neurology", "Orthopedics"]
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    accepts_emergency BOOLEAN DEFAULT true,
    
    -- Ratings
    rating DECIMAL(2, 1) DEFAULT 0.0,
    total_reviews INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_capacity_update TIMESTAMP
);

CREATE INDEX idx_hospitals_location ON hospitals USING GIST(location);
CREATE INDEX idx_hospitals_active ON hospitals(is_active, accepts_emergency);

-- ==============================================
-- ROUTES TABLE (Route History & Analytics)
-- ==============================================
CREATE TABLE routes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    emergency_id UUID REFERENCES emergencies(id),
    ambulance_id UUID REFERENCES ambulances(id),
    
    -- Route Details
    start_location GEOMETRY(Point, 4326) NOT NULL,
    end_location GEOMETRY(Point, 4326) NOT NULL,
    route_path GEOMETRY(LineString, 4326), -- Actual path taken
    
    -- Metrics
    planned_distance_km DECIMAL(8, 2),
    actual_distance_km DECIMAL(8, 2),
    planned_time_minutes INTEGER,
    actual_time_minutes INTEGER,
    average_speed_kmh DECIMAL(5, 2),
    
    -- Traffic
    traffic_level VARCHAR(20), -- Low, Medium, High, Severe
    traffic_delay_minutes INTEGER DEFAULT 0,
    
    -- Timestamps
    started_at TIMESTAMP NOT NULL,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_routes_emergency ON routes(emergency_id);
CREATE INDEX idx_routes_ambulance ON routes(ambulance_id);
CREATE INDEX idx_routes_started_at ON routes(started_at DESC);

-- ==============================================
-- NOTIFICATIONS TABLE
-- ==============================================
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    
    -- Notification Content
    type VARCHAR(50) NOT NULL CHECK (type IN ('emergency', 'ambulance', 'hospital', 'system', 'alert')),
    title VARCHAR(255),
    message TEXT NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('info', 'warning', 'success', 'error')),
    
    -- Related Entities
    emergency_id UUID REFERENCES emergencies(id),
    ambulance_id UUID REFERENCES ambulances(id),
    hospital_id UUID REFERENCES hospitals(id),
    
    -- Status
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP,
    
    -- Delivery
    channels JSONB, -- ["in_app", "email", "sms", "push"]
    sent_via JSONB, -- Track which channels were successfully sent
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP
);

CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_emergency ON notifications(emergency_id);

-- ==============================================
-- ANALYTICS TABLE (System Metrics)
-- ==============================================
CREATE TABLE analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Metrics
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(12, 2),
    metric_unit VARCHAR(50),
    
    -- Dimensions
    date DATE NOT NULL,
    hour INTEGER,
    day_of_week INTEGER,
    
    -- Location
    city VARCHAR(100),
    region VARCHAR(100),
    
    -- Categories
    category VARCHAR(50), -- emergency_response, ambulance_utilization, hospital_capacity
    sub_category VARCHAR(50),
    
    -- Additional Data
    metadata JSONB,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_analytics_date ON analytics(date DESC);
CREATE INDEX idx_analytics_metric ON analytics(metric_name, date);
CREATE INDEX idx_analytics_category ON analytics(category, date);

-- ==============================================
-- AUDIT_LOGS TABLE (System Audit Trail)
-- ==============================================
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Actor
    user_id UUID REFERENCES users(id),
    user_email VARCHAR(255),
    user_role VARCHAR(50),
    
    -- Action
    action VARCHAR(100) NOT NULL, -- CREATE, UPDATE, DELETE, LOGIN, LOGOUT
    entity_type VARCHAR(50) NOT NULL, -- emergency, ambulance, hospital, user
    entity_id UUID,
    
    -- Details
    description TEXT,
    old_values JSONB,
    new_values JSONB,
    
    -- Request Info
    ip_address INET,
    user_agent TEXT,
    request_id UUID,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- ==============================================
-- TRAFFIC_DATA TABLE (Real-time Traffic)
-- ==============================================
CREATE TABLE traffic_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Location
    road_segment_id VARCHAR(100),
    location GEOMETRY(LineString, 4326),
    start_point GEOMETRY(Point, 4326),
    end_point GEOMETRY(Point, 4326),
    
    -- Traffic Information
    congestion_level INTEGER CHECK (congestion_level BETWEEN 1 AND 10), -- 1=free flow, 10=standstill
    average_speed_kmh DECIMAL(5, 2),
    typical_speed_kmh DECIMAL(5, 2),
    travel_time_seconds INTEGER,
    
    -- Metadata
    road_name VARCHAR(255),
    road_type VARCHAR(50), -- highway, main_road, local_road
    
    -- Timestamps
    timestamp TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP -- Data validity period
);

CREATE INDEX idx_traffic_location ON traffic_data USING GIST(location);
CREATE INDEX idx_traffic_timestamp ON traffic_data(timestamp DESC);

-- ==============================================
-- ML_PREDICTIONS TABLE (AI Predictions)
-- ==============================================
CREATE TABLE ml_predictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Prediction Details
    prediction_type VARCHAR(50) NOT NULL, -- hotspot, demand, response_time
    
    -- Hotspot Predictions
    location GEOMETRY(Point, 4326),
    location_lat DECIMAL(10, 8),
    location_lng DECIMAL(11, 8),
    risk_score DECIMAL(5, 4), -- 0.0 to 1.0
    predicted_emergency_type VARCHAR(50),
    
    -- Time Window
    prediction_time TIMESTAMP NOT NULL, -- When this prediction is for
    valid_from TIMESTAMP NOT NULL,
    valid_until TIMESTAMP NOT NULL,
    
    -- Model Info
    model_version VARCHAR(50),
    confidence_score DECIMAL(5, 4),
    
    -- Features Used
    features JSONB,
    
    -- Validation
    actual_outcome BOOLEAN, -- Did an emergency occur?
    accuracy DECIMAL(5, 4),
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ml_predictions_location ON ml_predictions USING GIST(location);
CREATE INDEX idx_ml_predictions_time ON ml_predictions(prediction_time);
CREATE INDEX idx_ml_predictions_type ON ml_predictions(prediction_type, prediction_time);

-- ==============================================
-- SYSTEM_CONFIG TABLE (System Configuration)
-- ==============================================
CREATE TABLE system_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    config_key VARCHAR(100) UNIQUE NOT NULL,
    config_value JSONB NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default configurations
INSERT INTO system_config (config_key, config_value, description) VALUES
('max_ambulance_assignment_distance_km', '50', 'Maximum distance to consider for ambulance assignment'),
('emergency_response_target_minutes', '8', 'Target response time for emergencies'),
('traffic_data_refresh_seconds', '300', 'How often to refresh traffic data'),
('ml_prediction_update_hours', '1', 'How often to update ML predictions'),
('max_concurrent_emergencies_per_ambulance', '1', 'Maximum emergencies one ambulance can handle'),
('notification_channels', '["in_app", "email", "sms"]', 'Enabled notification channels'),
('high_priority_severity_levels', '["Critical", "High"]', 'Severity levels considered high priority');

-- ==============================================
-- FUNCTIONS AND TRIGGERS
-- ==============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_emergencies_updated_at BEFORE UPDATE ON emergencies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ambulances_updated_at BEFORE UPDATE ON ambulances FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_hospitals_updated_at BEFORE UPDATE ON hospitals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate distance between two points (in kilometers)
CREATE OR REPLACE FUNCTION calculate_distance(
    lat1 DECIMAL,
    lon1 DECIMAL,
    lat2 DECIMAL,
    lon2 DECIMAL
)
RETURNS DECIMAL AS $$
BEGIN
    RETURN ST_Distance(
        ST_MakePoint(lon1, lat1)::geography,
        ST_MakePoint(lon2, lat2)::geography
    ) / 1000; -- Convert meters to kilometers
END;
$$ LANGUAGE plpgsql;

-- Function to find nearest ambulances
CREATE OR REPLACE FUNCTION find_nearest_ambulances(
    emergency_lat DECIMAL,
    emergency_lng DECIMAL,
    max_distance_km DECIMAL DEFAULT 50,
    max_results INTEGER DEFAULT 10
)
RETURNS TABLE (
    ambulance_id UUID,
    registration_number VARCHAR,
    driver_name VARCHAR,
    type VARCHAR,
    distance_km DECIMAL,
    estimated_time_minutes INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id,
        a.registration_number,
        a.driver_name,
        a.type,
        ROUND(
            ST_Distance(
                a.current_location::geography,
                ST_MakePoint(emergency_lng, emergency_lat)::geography
            ) / 1000,
            2
        ) AS distance_km,
        ROUND(
            (ST_Distance(
                a.current_location::geography,
                ST_MakePoint(emergency_lng, emergency_lat)::geography
            ) / 1000) / 40 * 60 -- Assuming 40 km/h average speed
        )::INTEGER AS estimated_time_minutes
    FROM ambulances a
    WHERE 
        a.status = 'Available'
        AND a.current_location IS NOT NULL
        AND ST_DWithin(
            a.current_location::geography,
            ST_MakePoint(emergency_lng, emergency_lat)::geography,
            max_distance_km * 1000 -- Convert km to meters
        )
    ORDER BY distance_km ASC
    LIMIT max_results;
END;
$$ LANGUAGE plpgsql;

-- Function to find nearest hospitals with beds
CREATE OR REPLACE FUNCTION find_nearest_hospitals_with_beds(
    emergency_lat DECIMAL,
    emergency_lng DECIMAL,
    max_distance_km DECIMAL DEFAULT 30,
    max_results INTEGER DEFAULT 10
)
RETURNS TABLE (
    hospital_id UUID,
    hospital_name VARCHAR,
    distance_km DECIMAL,
    icu_beds_available INTEGER,
    emergency_beds_available INTEGER,
    total_available INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        h.id,
        h.name,
        ROUND(
            ST_Distance(
                h.location::geography,
                ST_MakePoint(emergency_lng, emergency_lat)::geography
            ) / 1000,
            2
        ) AS distance_km,
        h.icu_beds_available,
        h.emergency_beds_available,
        (h.icu_beds_available + h.emergency_beds_available + h.general_beds_available) AS total_available
    FROM hospitals h
    WHERE 
        h.is_active = true
        AND h.accepts_emergency = true
        AND (h.icu_beds_available > 0 OR h.emergency_beds_available > 0)
        AND ST_DWithin(
            h.location::geography,
            ST_MakePoint(emergency_lng, emergency_lat)::geography,
            max_distance_km * 1000
        )
    ORDER BY distance_km ASC
    LIMIT max_results;
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- VIEWS FOR COMMON QUERIES
-- ==============================================

-- Active Emergencies View
CREATE OR REPLACE VIEW active_emergencies_view AS
SELECT 
    e.*,
    a.registration_number as ambulance_registration,
    a.driver_name as ambulance_driver,
    a.current_location_lat as ambulance_lat,
    a.current_location_lng as ambulance_lng,
    h.name as hospital_name,
    h.address as hospital_address,
    u.full_name as dispatcher_name
FROM emergencies e
LEFT JOIN ambulances a ON e.assigned_ambulance_id = a.id
LEFT JOIN hospitals h ON e.assigned_hospital_id = h.id
LEFT JOIN users u ON e.assigned_dispatcher_id = u.id
WHERE e.status NOT IN ('Completed', 'Cancelled');

-- Ambulance Availability View
CREATE OR REPLACE VIEW ambulance_availability_view AS
SELECT 
    status,
    type,
    COUNT(*) as count
FROM ambulances
WHERE is_active = true
GROUP BY status, type;

-- Hospital Capacity View
CREATE OR REPLACE VIEW hospital_capacity_summary AS
SELECT 
    id,
    name,
    city,
    icu_beds_available,
    icu_beds_total,
    emergency_beds_available,
    emergency_beds_total,
    general_beds_available,
    general_beds_total,
    ROUND(
        (icu_beds_available::DECIMAL / NULLIF(icu_beds_total, 0)) * 100,
        2
    ) as icu_availability_percent,
    last_capacity_update
FROM hospitals
WHERE is_active = true AND accepts_emergency = true;

-- ==============================================
-- INDEXES FOR PERFORMANCE
-- ==============================================

-- Additional composite indexes for common queries
CREATE INDEX idx_emergencies_status_created ON emergencies(status, created_at DESC);
CREATE INDEX idx_ambulances_status_type ON ambulances(status, type);
CREATE INDEX idx_hospitals_beds_location ON hospitals(icu_beds_available, emergency_beds_available) WHERE is_active = true;

-- ==============================================
-- SEED DATA (Optional - for testing)
-- ==============================================

-- Create admin user (password: Admin@123)
INSERT INTO users (email, password_hash, full_name, phone, role, is_active, is_verified)
VALUES (
    'admin@mediroutex.com',
    '$2b$10$YourHashedPasswordHere', -- Replace with actual bcrypt hash
    'System Administrator',
    '+1234567890',
    'admin',
    true,
    true
);

COMMENT ON DATABASE mediroutex IS 'MediRouteX - AI-Powered Emergency Response Optimization Platform';
