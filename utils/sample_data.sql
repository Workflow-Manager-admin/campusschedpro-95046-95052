-- Sample Data for CampusSchedPro Main Entities
-- Ensures all foreign key relationships are valid and simulates realistic application data.

-- 1. Departments
INSERT INTO departments (id, name) VALUES
  (1, 'Computer Science'),
  (2, 'Information Technology'),
  (3, 'Electronics and Communication');

-- 2. Academic Years
INSERT INTO academic_years (id, year) VALUES
  (1, '2023-24'),
  (2, '2024-25');

-- 3. Faculty
INSERT INTO faculty (id, name, department, email, expertise, status) VALUES
  (1, 'Dr. Alan Turing', 'Computer Science', 'aturing@college.edu', 'Algorithms', 'active'),
  (2, 'Prof. Grace Hopper', 'Information Technology', 'ghopper@college.edu', 'Software Engineering', 'active'),
  (3, 'Dr. Ada Lovelace', 'Electronics and Communication', 'alovelace@college.edu', 'Embedded Systems', 'on leave'),
  (4, 'Prof. Tim Berners-Lee', 'Computer Science', 'tbl@college.edu', 'Web Technologies', 'active');

-- 4. Courses
INSERT INTO courses (id, name, code, credits, department_id, academic_year_id, expected_enrollment, requires_lab) VALUES
  (1, 'Data Structures', 'CS201', 3, 1, 1, 60, FALSE),
  (2, 'Database Systems', 'CS301', 4, 1, 1, 55, TRUE),
  (3, 'Operating Systems', 'CS302', 4, 1, 1, 50, TRUE),
  (4, 'Computer Networks', 'IT202', 3, 2, 1, 45, FALSE),
  (5, 'Digital Signal Processing', 'EC303', 3, 3, 1, 40, FALSE);

-- 5. Rooms
INSERT INTO rooms (id, name, capacity, type) VALUES
  (1, 'Room 101', 60, 'lecture'),
  (2, 'Lab A', 30, 'lab'),
  (3, 'Room 202', 45, 'lecture'),
  (4, 'Lab B', 35, 'lab'),
  (5, 'Seminar Hall', 100, 'seminar');

-- 6. Time Slots
INSERT INTO time_slots (id, day, time) VALUES
  (1, 'Monday', '10:00-11:00'),
  (2, 'Tuesday', '11:00-12:00'),
  (3, 'Wednesday', '14:00-15:00'),
  (4, 'Thursday', '09:00-10:00'),
  (5, 'Friday', '13:00-14:00');

-- 7. Schedule (Relates all core entities with valid FK references)
INSERT INTO schedule (id, course_id, faculty_id, room_id, time_slot_id) VALUES
  (1, 1, 1, 1, 1),     -- Data Structures, Dr. Turing, Room 101, Mon 10-11
  (2, 2, 2, 2, 2),     -- Database Systems, Prof. Hopper, Lab A, Tue 11-12
  (3, 3, 1, 4, 3),     -- Operating Systems, Dr. Turing, Lab B, Wed 14-15
  (4, 4, 2, 3, 4),     -- Computer Networks, Prof. Hopper, Room 202, Thu 09-10
  (5, 5, 3, 5, 5);     -- DSP, Dr. Lovelace, Seminar Hall, Fri 13-14

-- (Optional: You may update sequence values in your DB after import to avoid collision with manual SERIAL/identity generation.)
