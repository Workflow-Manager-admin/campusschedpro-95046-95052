-- ===============================================================
-- SQL SCRIPT FOR CAMPUSSCHEDPRO: TABLES & VIEW CREATION
-- ===============================================================
-- Safe to run in Supabase; uses "IF NOT EXISTS" and "CREATE OR REPLACE VIEW"
-- ---------------------------------------------------------------
-- PART 1: COURSE_EQUIPMENT JOIN TABLE (Many-to-Many)
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS course_equipment (
    id BIGSERIAL PRIMARY KEY,
    course_id BIGINT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    equipment_id BIGINT NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
    UNIQUE (course_id, equipment_id)
);

-- ---------------------------------------------------------------
-- PART 2: ADDITIONAL RELATIONSHIP CONSTRAINTS
-- Add other missing foreign keys or indices if referenced in UI/code
-- (None specified here, only course_equipment is mandated)
-- ---------------------------------------------------------------

-- ---------------------------------------------------------------
-- PART 3: COMPREHENSIVE COURSE SCHEDULE VIEW
-- 
-- Fields: course, faculty, room, day, time, and any other relevant
-- (Strictly use actual columns present in the DB)
-- ---------------------------------------------------------------

CREATE OR REPLACE VIEW course_schedule_view AS
SELECT
    c.id AS course_id,
    c.code AS course_code,
    c.name AS course_name,
    c.semester,
    c.year,
    -- Faculty details
    f.id AS faculty_id,
    f.name AS faculty_name,
    f.email AS faculty_email,
    -- Room details
    r.id AS room_id,
    r.room_number,
    r.building,
    r.capacity AS room_capacity,
    r.type AS room_type,
    -- Schedule
    s.id AS schedule_id,
    s.day_of_week,
    s.start_time,
    s.end_time,
    s.slot_label,
    -- Links
    s.room_id AS scheduled_room_id,
    s.faculty_id AS scheduled_faculty_id,
    s.course_id AS scheduled_course_id
FROM
    schedules s
    INNER JOIN courses c ON s.course_id = c.id
    LEFT JOIN faculty f ON s.faculty_id = f.id
    LEFT JOIN rooms r ON s.room_id = r.id
ORDER BY
    s.day_of_week,
    s.start_time,
    c.name;

-- For equipment per course, join course_equipment and equipment tables
-- (You can use a separate view or use lateral join/array_agg if needed in the future)

-- ===============================================================
-- END OF SQL
-- ===============================================================
