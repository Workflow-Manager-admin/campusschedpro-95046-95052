-- Supabase SQL Schema for CampusSchedPro

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create departments table
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create buildings table
CREATE TABLE buildings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    location TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create equipment types table
CREATE TABLE equipment_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create rooms table
CREATE TABLE rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    capacity INTEGER NOT NULL DEFAULT 0,
    building_id UUID REFERENCES buildings(id) ON DELETE SET NULL,
    floor TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_capacity CHECK (capacity >= 0)
);

-- Create room_equipment table for many-to-many relationship
CREATE TABLE room_equipment (
    room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
    equipment_id UUID REFERENCES equipment_types(id) ON DELETE CASCADE,
    PRIMARY KEY (room_id, equipment_id)
);

-- Create faculty table
CREATE TABLE faculty (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    email TEXT NOT NULL UNIQUE,
    status TEXT DEFAULT 'Available',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create faculty_expertise table for many-to-many relationship
CREATE TABLE faculty_expertise (
    faculty_id UUID REFERENCES faculty(id) ON DELETE CASCADE,
    expertise TEXT NOT NULL,
    PRIMARY KEY (faculty_id, expertise)
);

-- Create academic_years table
CREATE TABLE academic_years (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create courses table
CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    credits INTEGER NOT NULL DEFAULT 3,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    academic_year_id UUID REFERENCES academic_years(id) ON DELETE SET NULL,
    expected_enrollment INTEGER NOT NULL DEFAULT 0,
    requires_lab BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_credits CHECK (credits > 0),
    CONSTRAINT valid_enrollment CHECK (expected_enrollment >= 0)
);

-- Create course_equipment table for required equipment
CREATE TABLE course_equipment (
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    equipment_id UUID REFERENCES equipment_types(id) ON DELETE CASCADE,
    PRIMARY KEY (course_id, equipment_id)
);

-- Create time_slots table
CREATE TABLE time_slots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    day TEXT NOT NULL,
    time TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (day, time)
);

-- Create schedule table
CREATE TABLE schedule (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    faculty_id UUID REFERENCES faculty(id) ON DELETE SET NULL,
    room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
    time_slot_id UUID REFERENCES time_slots(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure no faculty is teaching more than one course in a time slot
    UNIQUE (faculty_id, time_slot_id),
    -- Ensure no room is used for more than one course in a time slot
    UNIQUE (room_id, time_slot_id)
);

-- Create conflicts table
CREATE TABLE conflicts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    schedule_id_1 UUID REFERENCES schedule(id) ON DELETE CASCADE,
    schedule_id_2 UUID REFERENCES schedule(id) ON DELETE CASCADE,
    conflict_type TEXT NOT NULL, -- 'instructor', 'room', etc.
    resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to update timestamps
CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON departments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_buildings_updated_at BEFORE UPDATE ON buildings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_equipment_types_updated_at BEFORE UPDATE ON equipment_types FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rooms_updated_at BEFORE UPDATE ON rooms FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_faculty_updated_at BEFORE UPDATE ON faculty FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_academic_years_updated_at BEFORE UPDATE ON academic_years FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_schedule_updated_at BEFORE UPDATE ON schedule FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_conflicts_updated_at BEFORE UPDATE ON conflicts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Views for easier queries
CREATE VIEW course_schedule_view AS
SELECT 
    s.id AS schedule_id,
    c.id AS course_id,
    c.code AS course_code,
    c.name AS course_name,
    c.credits AS course_credits,
    f.id AS faculty_id,
    f.name AS faculty_name,
    r.id AS room_id,
    r.name AS room_name,
    b.name AS building_name,
    ts.day,
    ts.time
FROM schedule s
JOIN courses c ON s.course_id = c.id
LEFT JOIN faculty f ON s.faculty_id = f.id
LEFT JOIN rooms r ON s.room_id = r.id
LEFT JOIN buildings b ON r.building_id = b.id
JOIN time_slots ts ON s.time_slot_id = ts.id;

CREATE VIEW faculty_teaching_load_view AS
SELECT 
    f.id AS faculty_id,
    f.name AS faculty_name,
    COUNT(DISTINCT s.course_id) AS total_courses,
    SUM(c.credits) AS total_credits,
    COUNT(DISTINCT s.course_id) * 3 AS hours_per_week
FROM faculty f
LEFT JOIN schedule s ON f.id = s.faculty_id
LEFT JOIN courses c ON s.course_id = c.id
GROUP BY f.id, f.name;
