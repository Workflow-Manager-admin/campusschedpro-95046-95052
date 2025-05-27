-- CampusSchedPro: Comprehensive SQL for Courses, Scheduling, and Resources
-- This script creates the full schema, sample records, and required view for a new Supabase project.
-- Suitable for direct execution in Supabase SQL Editor.

-- =====================
-- 1. TABLES
-- =====================

-- Departments (e.g., IT/Computer Science, Electronics)
CREATE TABLE departments (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE
);

-- Academic years/semesters
CREATE TABLE academic_years (
    id BIGSERIAL PRIMARY KEY,
    year_label TEXT NOT NULL, -- e.g. "2023-2024"
    semester TEXT NOT NULL,    -- e.g. "Fall", "Spring", "Summer"
    UNIQUE (year_label, semester)
);

-- Faculty (instructors)
CREATE TABLE faculty (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    department_id BIGINT REFERENCES departments(id),
    is_active BOOLEAN DEFAULT TRUE
);

-- Rooms (for classes or labs)
CREATE TABLE rooms (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,           -- e.g. 'Lab A', 'Classroom 101'
    capacity INTEGER NOT NULL CHECK (capacity > 0),
    department_id BIGINT REFERENCES departments(id),
    room_type TEXT NOT NULL,             -- e.g. "Classroom", "Lab"
    location TEXT
);

-- Equipment (e.g., Projectors, Lab Kits)
CREATE TABLE equipment (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT
);

-- Courses
CREATE TABLE courses (
    id BIGSERIAL PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,     -- e.g. 'CS101'
    name TEXT NOT NULL,
    department_id BIGINT REFERENCES departments(id),
    credits INTEGER NOT NULL CHECK (credits > 0),
    required_room_type TEXT,       -- e.g. "Lab", "Classroom"
    remarks TEXT
);

-- Which equipment is required for which course
CREATE TABLE course_equipment (
    id BIGSERIAL PRIMARY KEY,
    course_id BIGINT REFERENCES courses(id) ON DELETE CASCADE,
    equipment_id BIGINT REFERENCES equipment(id) ON DELETE CASCADE,
    required_quantity INTEGER DEFAULT 1 CHECK (required_quantity > 0),
    UNIQUE (course_id, equipment_id)
);

-- Standard timeslots for the timetable
CREATE TABLE time_slots (
    id BIGSERIAL PRIMARY KEY,
    label TEXT NOT NULL,           -- e.g. "Mon 9:00-10:00"
    day_of_week TEXT NOT NULL,     -- "Monday", "Tuesday", etc.
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    UNIQUE(day_of_week, start_time, end_time)
);

-- Main Schedule (One scheduled session per row)
CREATE TABLE schedule (
    id BIGSERIAL PRIMARY KEY,
    course_id BIGINT REFERENCES courses(id) ON DELETE CASCADE,
    faculty_id BIGINT REFERENCES faculty(id) ON DELETE SET NULL,
    academic_year_id BIGINT REFERENCES academic_years(id) ON DELETE CASCADE,
    room_id BIGINT REFERENCES rooms(id) ON DELETE SET NULL,
    time_slot_id BIGINT REFERENCES time_slots(id) ON DELETE CASCADE,
    scheduled_date DATE,  -- Optional, if specific dates needed
    remarks TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Equipment assigned to a scheduled session
CREATE TABLE schedule_equipment (
    id BIGSERIAL PRIMARY KEY,
    schedule_id BIGINT REFERENCES schedule(id) ON DELETE CASCADE,
    equipment_id BIGINT REFERENCES equipment(id) ON DELETE CASCADE,
    quantity_assigned INTEGER DEFAULT 1 CHECK (quantity_assigned > 0),
    UNIQUE(schedule_id, equipment_id)
);

-- =====================
-- 2. INDEXES
-- =====================

-- Improve lookup/query performance
CREATE INDEX idx_faculty_department ON faculty(department_id);
CREATE INDEX idx_rooms_department ON rooms(department_id);
CREATE INDEX idx_courses_department ON courses(department_id);
CREATE INDEX idx_schedule_faculty ON schedule(faculty_id);
CREATE INDEX idx_schedule_time_slot ON schedule(time_slot_id);
CREATE INDEX idx_schedule_room ON schedule(room_id);
CREATE INDEX idx_schedule_ay ON schedule(academic_year_id);

-- =====================
-- 3. SCHEDULE VIEW
-- =====================

-- Main schedule view for easy querying and reporting
CREATE OR REPLACE VIEW course_schedule_view AS
SELECT
    sch.id AS schedule_id,
    ay.year_label,
    ay.semester,
    c.code AS course_code,
    c.name AS course_name,
    d.name AS department,
    f.name AS faculty_name,
    f.email AS faculty_email,
    r.name AS room_name,
    r.room_type,
    r.location AS room_location,
    ts.day_of_week,
    ts.label AS slot_label,
    ts.start_time,
    ts.end_time,
    sch.scheduled_date,
    COALESCE(string_agg(DISTINCT eq.name, ', ' ORDER BY eq.name), '') AS equipment_assigned,
    sch.remarks
FROM schedule sch
JOIN courses c ON sch.course_id = c.id
LEFT JOIN faculty f ON sch.faculty_id = f.id
LEFT JOIN departments d ON c.department_id = d.id
LEFT JOIN academic_years ay ON sch.academic_year_id = ay.id
LEFT JOIN rooms r ON sch.room_id = r.id
LEFT JOIN time_slots ts ON sch.time_slot_id = ts.id
LEFT JOIN schedule_equipment se ON sch.id = se.schedule_id
LEFT JOIN equipment eq ON se.equipment_id = eq.id
GROUP BY
    sch.id, ay.year_label, ay.semester, c.code, c.name,
    d.name, f.name, f.email, r.name, r.room_type,
    r.location, ts.day_of_week, ts.label, ts.start_time, ts.end_time, sch.scheduled_date, sch.remarks;

-- =====================
-- 4. SAMPLE DATA: Departments, Academic Years, Faculty, Rooms, Equipment, Courses, Time Slots
-- =====================

-- Departments
INSERT INTO departments (name) VALUES 
    ('Information Technology'),
    ('Electronics Engineering'),
    ('Mathematics');

-- Academic Years
INSERT INTO academic_years (year_label, semester) VALUES
    ('2023-2024', 'Fall'),
    ('2023-2024', 'Spring');

-- Faculty
INSERT INTO faculty (name, email, department_id) VALUES
    ('Dr. Alice Smith', 'alice.smith@campus.edu', 1),
    ('Prof. Bob Johnson', 'bob.johnson@campus.edu', 1),
    ('Dr. Carol Lee', 'carol.lee@campus.edu', 2);

-- Rooms
INSERT INTO rooms (name, capacity, department_id, room_type, location) VALUES
    ('Main Lab A', 40, 1, 'Lab', 'Block 1 - 2nd Floor'),
    ('Classroom 101', 60, 1, 'Classroom', 'Block 1 - 1st Floor'),
    ('Electronics Lab', 30, 2, 'Lab', 'Block 2 - Ground Floor');

-- Equipment
INSERT INTO equipment (name, description) VALUES
    ('Projector', 'Full HD projector'),
    ('Lab Workstation', 'PC workstation for programming assignments'),
    ('Oscilloscope', 'Digital oscilloscope for electronics labs');

-- Courses
INSERT INTO courses (code, name, department_id, credits, required_room_type, remarks) VALUES
    ('CS101', 'Intro to Programming', 1, 3, 'Lab', 'Uses C/C++'),
    ('CS202', 'Web Technologies', 1, 3, 'Lab', 'Web programming fundamentals'),
    ('EE301', 'Circuit Analysis', 2, 4, 'Lab', 'Lab-based electronics course'),
    ('MATH201', 'Discrete Mathematics', 3, 3, 'Classroom', '');

-- Course Equipment requirements
INSERT INTO course_equipment (course_id, equipment_id, required_quantity) VALUES
    (1, 2, 25),   -- CS101 needs 25 Lab Workstations
    (1, 1, 1),    -- CS101 needs 1 Projector
    (2, 2, 30),   -- CS202 needs 30 Lab Workstations
    (2, 1, 1),    -- CS202 needs 1 Projector
    (3, 3, 10);   -- EE301 needs 10 Oscilloscopes

-- Time Slots
INSERT INTO time_slots (label, day_of_week, start_time, end_time) VALUES
    ('Mon 9:00-10:00', 'Monday', '09:00', '10:00'),
    ('Mon 10:00-11:00', 'Monday', '10:00', '11:00'),
    ('Wed 9:00-10:00', 'Wednesday', '09:00', '10:00'),
    ('Wed 10:00-11:00', 'Wednesday', '10:00', '11:00'),
    ('Fri 13:00-14:00', 'Friday', '13:00', '14:00');

-- =====================
-- 5. SAMPLE DATA: Main schedule + schedule_equipment
-- =====================

-- Main schedule: Assign courses, faculty, rooms, slots to sample teaching sessions
INSERT INTO schedule (course_id, faculty_id, academic_year_id, room_id, time_slot_id, scheduled_date, remarks) VALUES
-- CS101 by Alice Smith, Main Lab A, Monday 9:00-10:00 (Fall)
    (1, 1, 1, 1, 1, '2023-09-04', ''),
-- CS202 by Bob Johnson, Main Lab A, Monday 10:00-11:00 (Fall)
    (2, 2, 1, 1, 2, '2023-09-04', ''),
-- EE301 by Carol Lee, Electronics Lab, Wednesday 9:00-10:00 (Fall)
    (3, 3, 1, 3, 3, '2023-09-06', 'Lab session 1'),
-- MATH201 by Bob Johnson, Classroom 101, Friday 13:00-14:00 (Fall)
    (4, 2, 1, 2, 5, '2023-09-08', '');

-- Equipment for scheduled sessions (see above for schedule_id relationship, which autoincrements from 1)
-- Map based on the order inserted above; schedule_id 1 == first scheduled session, etc.
INSERT INTO schedule_equipment (schedule_id, equipment_id, quantity_assigned) VALUES
    (1, 2, 25),  -- Lab Workstations for CS101 session
    (1, 1, 1),   -- Projector for CS101 session
    (2, 2, 30),  -- Lab Workstations for CS202 session
    (2, 1, 1),   -- Projector for CS202 session
    (3, 3, 10);  -- Oscilloscopes for EE301 session

-- =====================
-- 6. DEMO QUERIES (comment/uncomment as needed)
-- =====================
-- -- Show full course schedule with all joins
-- SELECT * FROM course_schedule_view;

-- -- Show courses and their equipment needs
-- SELECT c.code, c.name, eq.name as equipment, ce.required_quantity
-- FROM courses c
-- JOIN course_equipment ce ON c.id = ce.course_id
-- JOIN equipment eq ON ce.equipment_id = eq.id;

-- =====================
-- End of SQL
-- =====================
