-- Default Data Schema for CampusSchedPro
-- (Excludes room_id, building_id, and non-existent fields following recent bugfixes)
-- Designed for Supabase or a standard SQL database.

-- Table: departments
CREATE TABLE departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL
);

-- Table: academic_years
CREATE TABLE academic_years (
    id SERIAL PRIMARY KEY,
    year VARCHAR(16) NOT NULL
);

-- Table: faculty
CREATE TABLE faculty (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    department VARCHAR(255) NOT NULL, -- stored as department name or code
    email VARCHAR(255) NOT NULL UNIQUE,
    expertise VARCHAR(255),
    status VARCHAR(64) -- e.g. "active", "on leave", etc.
);

-- Table: courses
CREATE TABLE courses (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(64) NOT NULL UNIQUE,
    credits INTEGER NOT NULL DEFAULT 3,
    department_id INTEGER NOT NULL,
    academic_year_id INTEGER NOT NULL,
    expected_enrollment INTEGER,
    requires_lab BOOLEAN DEFAULT FALSE,
    CONSTRAINT fk_courses_department
        FOREIGN KEY (department_id)
        REFERENCES departments(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_courses_academic_year
        FOREIGN KEY (academic_year_id)
        REFERENCES academic_years(id)
        ON DELETE CASCADE
);

-- Table: rooms
CREATE TABLE rooms (
    id SERIAL PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    capacity INTEGER NOT NULL,
    type VARCHAR(64) -- e.g. "lab", "lecture", "seminar"
);

-- Table: time_slots
CREATE TABLE time_slots (
    id SERIAL PRIMARY KEY,
    day VARCHAR(16) NOT NULL,  -- e.g. "Monday"
    time VARCHAR(32) NOT NULL  -- e.g. "10:00-11:00"
);

-- Table: schedule
CREATE TABLE schedule (
    id SERIAL PRIMARY KEY,
    course_id INTEGER NOT NULL,
    faculty_id INTEGER NOT NULL,
    room_id INTEGER NOT NULL,
    time_slot_id INTEGER NOT NULL,
    CONSTRAINT fk_schedule_course
        FOREIGN KEY (course_id)
        REFERENCES courses(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_schedule_faculty
        FOREIGN KEY (faculty_id)
        REFERENCES faculty(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_schedule_room
        FOREIGN KEY (room_id)
        REFERENCES rooms(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_schedule_time_slot
        FOREIGN KEY (time_slot_id)
        REFERENCES time_slots(id)
        ON DELETE CASCADE
);

-- Indexes (Optional, for improved query performance)
CREATE INDEX idx_courses_department ON courses (department_id);
CREATE INDEX idx_courses_academic_year ON courses (academic_year_id);
CREATE INDEX idx_faculty_department ON faculty (department);
CREATE INDEX idx_schedule_course ON schedule (course_id);
CREATE INDEX idx_schedule_faculty ON schedule (faculty_id);
CREATE INDEX idx_schedule_room ON schedule (room_id);
CREATE INDEX idx_schedule_timeslot ON schedule (time_slot_id);
