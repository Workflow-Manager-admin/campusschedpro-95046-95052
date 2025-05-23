-- Default Data for CampusSchedPro

-- Insert departments
INSERT INTO departments (name) VALUES 
('IT'),
('Computer Science'),
('Engineering'),
('Mathematics'),
('Business');

-- Insert buildings
INSERT INTO buildings (name, location) VALUES 
('Science Building', 'North Campus'),
('Engineering Building', 'East Campus'),
('Humanities Building', 'West Campus'),
('Business Building', 'South Campus'),
('Library', 'Central Campus');

-- Insert equipment types
INSERT INTO equipment_types (name) VALUES 
('Projector'),
('Whiteboard'),
('Smart Board'),
('Computers'),
('Audio System'),
('Video Conference'),
('Database Server'),
('Network Equipment'),
('Web Servers'),
('Software Tools'),
('Document Camera');

-- Insert academic years
INSERT INTO academic_years (name) VALUES 
('First Year'),
('Second Year'),
('Third Year'),
('Fourth Year');

-- Insert time slots
INSERT INTO time_slots (day, time) VALUES 
('Monday', '9:00 AM'),
('Monday', '10:00 AM'),
('Monday', '11:00 AM'),
('Monday', '12:00 PM'),
('Monday', '1:00 PM'),
('Monday', '2:00 PM'),
('Monday', '3:00 PM'),
('Monday', '4:00 PM'),
('Tuesday', '9:00 AM'),
('Tuesday', '10:00 AM'),
('Tuesday', '11:00 AM'),
('Tuesday', '12:00 PM'),
('Tuesday', '1:00 PM'),
('Tuesday', '2:00 PM'),
('Tuesday', '3:00 PM'),
('Tuesday', '4:00 PM'),
('Wednesday', '9:00 AM'),
('Wednesday', '10:00 AM'),
('Wednesday', '11:00 AM'),
('Wednesday', '12:00 PM'),
('Wednesday', '1:00 PM'),
('Wednesday', '2:00 PM'),
('Wednesday', '3:00 PM'),
('Wednesday', '4:00 PM'),
('Thursday', '9:00 AM'),
('Thursday', '10:00 AM'),
('Thursday', '11:00 AM'),
('Thursday', '12:00 PM'),
('Thursday', '1:00 PM'),
('Thursday', '2:00 PM'),
('Thursday', '3:00 PM'),
('Thursday', '4:00 PM'),
('Friday', '9:00 AM'),
('Friday', '10:00 AM'),
('Friday', '11:00 AM'),
('Friday', '12:00 PM'),
('Friday', '1:00 PM'),
('Friday', '2:00 PM'),
('Friday', '3:00 PM'),
('Friday', '4:00 PM');

-- Insert faculty members (15 records)
INSERT INTO faculty (name, department_id, email, status) VALUES 
('Dr. Sarah Johnson', (SELECT id FROM departments WHERE name = 'IT'), 'sarah.johnson@university.edu', 'Available'),
('Prof. Michael Chen', (SELECT id FROM departments WHERE name = 'Computer Science'), 'michael.chen@university.edu', 'Available'),
('Dr. Jennifer Lee', (SELECT id FROM departments WHERE name = 'IT'), 'jennifer.lee@university.edu', 'Available'),
('Prof. Robert Chen', (SELECT id FROM departments WHERE name = 'IT'), 'robert.chen@university.edu', 'Available'),
('Dr. Emily Wilson', (SELECT id FROM departments WHERE name = 'IT'), 'emily.wilson@university.edu', 'Available'),
('Prof. David Miller', (SELECT id FROM departments WHERE name = 'IT'), 'david.miller@university.edu', 'Available'),
('Prof. Amanda Davis', (SELECT id FROM departments WHERE name = 'IT'), 'amanda.davis@university.edu', 'Available'),
('Dr. Michael Robinson', (SELECT id FROM departments WHERE name = 'IT'), 'michael.robinson@university.edu', 'Available'),
('Dr. Laura Morgan', (SELECT id FROM departments WHERE name = 'IT'), 'laura.morgan@university.edu', 'Available'),
('Prof. James Wilson', (SELECT id FROM departments WHERE name = 'IT'), 'james.wilson@university.edu', 'Available'),
('Dr. Jessica Thompson', (SELECT id FROM departments WHERE name = 'Computer Science'), 'jessica.thompson@university.edu', 'Available'),
('Prof. Daniel Clark', (SELECT id FROM departments WHERE name = 'Computer Science'), 'daniel.clark@university.edu', 'Available'),
('Dr. Rebecca Martinez', (SELECT id FROM departments WHERE name = 'IT'), 'rebecca.martinez@university.edu', 'Available'),
('Prof. Thomas Anderson', (SELECT id FROM departments WHERE name = 'IT'), 'thomas.anderson@university.edu', 'Available'),
('Dr. Sophia Garcia', (SELECT id FROM departments WHERE name = 'IT'), 'sophia.garcia@university.edu', 'Available');

-- Insert faculty expertise
INSERT INTO faculty_expertise (faculty_id, expertise) VALUES 
((SELECT id FROM faculty WHERE name = 'Dr. Sarah Johnson'), 'Algorithms'),
((SELECT id FROM faculty WHERE name = 'Dr. Sarah Johnson'), 'Data Structures'),
((SELECT id FROM faculty WHERE name = 'Dr. Sarah Johnson'), 'Machine Learning'),
((SELECT id FROM faculty WHERE name = 'Prof. Michael Chen'), 'Database Systems'),
((SELECT id FROM faculty WHERE name = 'Prof. Michael Chen'), 'Web Development'),
((SELECT id FROM faculty WHERE name = 'Dr. Jennifer Lee'), 'Data Structures'),
((SELECT id FROM faculty WHERE name = 'Dr. Jennifer Lee'), 'Programming Languages'),
((SELECT id FROM faculty WHERE name = 'Prof. Robert Chen'), 'Computer Networks'),
((SELECT id FROM faculty WHERE name = 'Prof. Robert Chen'), 'Network Security'),
((SELECT id FROM faculty WHERE name = 'Dr. Emily Wilson'), 'IT Fundamentals'),
((SELECT id FROM faculty WHERE name = 'Dr. Emily Wilson'), 'Information Systems'),
((SELECT id FROM faculty WHERE name = 'Prof. David Miller'), 'Programming'),
((SELECT id FROM faculty WHERE name = 'Prof. David Miller'), 'Mobile Development'),
((SELECT id FROM faculty WHERE name = 'Prof. Amanda Davis'), 'Web Development'),
((SELECT id FROM faculty WHERE name = 'Prof. Amanda Davis'), 'Frontend Technologies'),
((SELECT id FROM faculty WHERE name = 'Dr. Michael Robinson'), 'Database Management'),
((SELECT id FROM faculty WHERE name = 'Dr. Michael Robinson'), 'Data Warehousing'),
((SELECT id FROM faculty WHERE name = 'Dr. Laura Morgan'), 'Software Engineering'),
((SELECT id FROM faculty WHERE name = 'Dr. Laura Morgan'), 'Software Architecture'),
((SELECT id FROM faculty WHERE name = 'Prof. James Wilson'), 'Project Management'),
((SELECT id FROM faculty WHERE name = 'Prof. James Wilson'), 'Agile Development'),
((SELECT id FROM faculty WHERE name = 'Dr. Jessica Thompson'), 'Artificial Intelligence'),
((SELECT id FROM faculty WHERE name = 'Dr. Jessica Thompson'), 'Machine Learning'),
((SELECT id FROM faculty WHERE name = 'Prof. Daniel Clark'), 'Operating Systems'),
((SELECT id FROM faculty WHERE name = 'Prof. Daniel Clark'), 'Distributed Systems'),
((SELECT id FROM faculty WHERE name = 'Dr. Rebecca Martinez'), 'Cloud Computing'),
((SELECT id FROM faculty WHERE name = 'Dr. Rebecca Martinez'), 'Virtualization'),
((SELECT id FROM faculty WHERE name = 'Prof. Thomas Anderson'), 'Cybersecurity'),
((SELECT id FROM faculty WHERE name = 'Prof. Thomas Anderson'), 'Network Security'),
((SELECT id FROM faculty WHERE name = 'Dr. Sophia Garcia'), 'Data Science'),
((SELECT id FROM faculty WHERE name = 'Dr. Sophia Garcia'), 'Big Data');

-- Insert rooms (12 records)
INSERT INTO rooms (name, type, capacity, building_id, floor) VALUES 
('Lecture Hall A', 'Lecture Hall', 120, (SELECT id FROM buildings WHERE name = 'Science Building'), '1st Floor'),
('Computer Lab 101', 'Computer Lab', 60, (SELECT id FROM buildings WHERE name = 'Engineering Building'), '1st Floor'),
('Computer Lab 102', 'Computer Lab', 40, (SELECT id FROM buildings WHERE name = 'Engineering Building'), '1st Floor'),
('Computer Lab 201', 'Computer Lab', 50, (SELECT id FROM buildings WHERE name = 'Engineering Building'), '2nd Floor'),
('Seminar Room 101', 'Seminar Room', 30, (SELECT id FROM buildings WHERE name = 'Humanities Building'), '1st Floor'),
('Classroom 101', 'Classroom', 45, (SELECT id FROM buildings WHERE name = 'Science Building'), '1st Floor'),
('Classroom 102', 'Classroom', 45, (SELECT id FROM buildings WHERE name = 'Science Building'), '1st Floor'),
('Conference Room A', 'Conference Room', 20, (SELECT id FROM buildings WHERE name = 'Business Building'), '2nd Floor'),
('Lecture Hall B', 'Lecture Hall', 100, (SELECT id FROM buildings WHERE name = 'Science Building'), '2nd Floor'),
('Classroom 201', 'Classroom', 35, (SELECT id FROM buildings WHERE name = 'Science Building'), '2nd Floor'),
('Computer Lab 301', 'Computer Lab', 45, (SELECT id FROM buildings WHERE name = 'Engineering Building'), '3rd Floor'),
('Classroom 301', 'Classroom', 40, (SELECT id FROM buildings WHERE name = 'Humanities Building'), '3rd Floor');

-- Insert room equipment
INSERT INTO room_equipment (room_id, equipment_id) VALUES 
((SELECT id FROM rooms WHERE name = 'Lecture Hall A'), (SELECT id FROM equipment_types WHERE name = 'Projector')),
((SELECT id FROM rooms WHERE name = 'Lecture Hall A'), (SELECT id FROM equipment_types WHERE name = 'Smart Board')),
((SELECT id FROM rooms WHERE name = 'Lecture Hall A'), (SELECT id FROM equipment_types WHERE name = 'Audio System')),
((SELECT id FROM rooms WHERE name = 'Computer Lab 101'), (SELECT id FROM equipment_types WHERE name = 'Computers')),
((SELECT id FROM rooms WHERE name = 'Computer Lab 101'), (SELECT id FROM equipment_types WHERE name = 'Projector')),
((SELECT id FROM rooms WHERE name = 'Computer Lab 101'), (SELECT id FROM equipment_types WHERE name = 'Database Server')),
((SELECT id FROM rooms WHERE name = 'Computer Lab 102'), (SELECT id FROM equipment_types WHERE name = 'Computers')),
((SELECT id FROM rooms WHERE name = 'Computer Lab 102'), (SELECT id FROM equipment_types WHERE name = 'Projector')),
((SELECT id FROM rooms WHERE name = 'Computer Lab 201'), (SELECT id FROM equipment_types WHERE name = 'Computers')),
((SELECT id FROM rooms WHERE name = 'Computer Lab 201'), (SELECT id FROM equipment_types WHERE name = 'Projector')),
((SELECT id FROM rooms WHERE name = 'Computer Lab 201'), (SELECT id FROM equipment_types WHERE name = 'Network Equipment')),
((SELECT id FROM rooms WHERE name = 'Seminar Room 101'), (SELECT id FROM equipment_types WHERE name = 'Projector')),
((SELECT id FROM rooms WHERE name = 'Seminar Room 101'), (SELECT id FROM equipment_types WHERE name = 'Whiteboard')),
((SELECT id FROM rooms WHERE name = 'Classroom 101'), (SELECT id FROM equipment_types WHERE name = 'Projector')),
((SELECT id FROM rooms WHERE name = 'Classroom 101'), (SELECT id FROM equipment_types WHERE name = 'Whiteboard')),
((SELECT id FROM rooms WHERE name = 'Classroom 102'), (SELECT id FROM equipment_types WHERE name = 'Projector')),
((SELECT id FROM rooms WHERE name = 'Classroom 102'), (SELECT id FROM equipment_types WHERE name = 'Whiteboard')),
((SELECT id FROM rooms WHERE name = 'Conference Room A'), (SELECT id FROM equipment_types WHERE name = 'Projector')),
((SELECT id FROM rooms WHERE name = 'Conference Room A'), (SELECT id FROM equipment_types WHERE name = 'Video Conference')),
((SELECT id FROM rooms WHERE name = 'Lecture Hall B'), (SELECT id FROM equipment_types WHERE name = 'Projector')),
((SELECT id FROM rooms WHERE name = 'Lecture Hall B'), (SELECT id FROM equipment_types WHERE name = 'Smart Board')),
((SELECT id FROM rooms WHERE name = 'Lecture Hall B'), (SELECT id FROM equipment_types WHERE name = 'Audio System')),
((SELECT id FROM rooms WHERE name = 'Classroom 201'), (SELECT id FROM equipment_types WHERE name = 'Projector')),
((SELECT id FROM rooms WHERE name = 'Classroom 201'), (SELECT id FROM equipment_types WHERE name = 'Whiteboard')),
((SELECT id FROM rooms WHERE name = 'Computer Lab 301'), (SELECT id FROM equipment_types WHERE name = 'Computers')),
((SELECT id FROM rooms WHERE name = 'Computer Lab 301'), (SELECT id FROM equipment_types WHERE name = 'Projector')),
((SELECT id FROM rooms WHERE name = 'Computer Lab 301'), (SELECT id FROM equipment_types WHERE name = 'Web Servers')),
((SELECT id FROM rooms WHERE name = 'Classroom 301'), (SELECT id FROM equipment_types WHERE name = 'Projector')),
((SELECT id FROM rooms WHERE name = 'Classroom 301'), (SELECT id FROM equipment_types WHERE name = 'Whiteboard'));

-- Insert IT department courses
INSERT INTO courses (name, code, credits, department_id, academic_year_id, expected_enrollment, requires_lab) VALUES 
-- First Year IT Courses
('IT Fundamentals', 'IT101', 3, 
  (SELECT id FROM departments WHERE name = 'IT'), 
  (SELECT id FROM academic_years WHERE name = 'First Year'), 
  80, true),
('Introduction to Programming', 'IT102', 4, 
  (SELECT id FROM departments WHERE name = 'IT'), 
  (SELECT id FROM academic_years WHERE name = 'First Year'), 
  75, true),
('Computer Hardware Essentials', 'IT103', 3, 
  (SELECT id FROM departments WHERE name = 'IT'), 
  (SELECT id FROM academic_years WHERE name = 'First Year'), 
  65, true),
('Information Technology Ethics', 'IT104', 2, 
  (SELECT id FROM departments WHERE name = 'IT'), 
  (SELECT id FROM academic_years WHERE name = 'First Year'), 
  70, false),

-- Second Year IT Courses
('Data Structures', 'IT201', 4, 
  (SELECT id FROM departments WHERE name = 'IT'), 
  (SELECT id FROM academic_years WHERE name = 'Second Year'), 
  65, true),
('Computer Networks', 'IT202', 3, 
  (SELECT id FROM departments WHERE name = 'IT'), 
  (SELECT id FROM academic_years WHERE name = 'Second Year'), 
  60, true),
('Operating Systems', 'IT203', 4, 
  (SELECT id FROM departments WHERE name = 'IT'), 
  (SELECT id FROM academic_years WHERE name = 'Second Year'), 
  55, true),
('Database Design', 'IT204', 3, 
  (SELECT id FROM departments WHERE name = 'IT'), 
  (SELECT id FROM academic_years WHERE name = 'Second Year'), 
  60, true),

-- Third Year IT Courses
('Web Development', 'IT301', 3, 
  (SELECT id FROM departments WHERE name = 'IT'), 
  (SELECT id FROM academic_years WHERE name = 'Third Year'), 
  55, true),
('Database Management', 'IT302', 4, 
  (SELECT id FROM departments WHERE name = 'IT'), 
  (SELECT id FROM academic_years WHERE name = 'Third Year'), 
  50, true),
('System Analysis and Design', 'IT303', 3, 
  (SELECT id FROM departments WHERE name = 'IT'), 
  (SELECT id FROM academic_years WHERE name = 'Third Year'), 
  45, false),
('Mobile Applications Development', 'IT304', 4, 
  (SELECT id FROM departments WHERE name = 'IT'), 
  (SELECT id FROM academic_years WHERE name = 'Third Year'), 
  50, true),

-- Fourth Year IT Courses
('Software Engineering', 'IT401', 4, 
  (SELECT id FROM departments WHERE name = 'IT'), 
  (SELECT id FROM academic_years WHERE name = 'Fourth Year'), 
  45, true),
('IT Project Management', 'IT402', 3, 
  (SELECT id FROM departments WHERE name = 'IT'), 
  (SELECT id FROM academic_years WHERE name = 'Fourth Year'), 
  40, false),
('Cloud Computing', 'IT403', 3, 
  (SELECT id FROM departments WHERE name = 'IT'), 
  (SELECT id FROM academic_years WHERE name = 'Fourth Year'), 
  35, true),
('Cybersecurity', 'IT404', 4, 
  (SELECT id FROM departments WHERE name = 'IT'), 
  (SELECT id FROM academic_years WHERE name = 'Fourth Year'), 
  40, true),
('Data Science for IT', 'IT405', 3, 
  (SELECT id FROM departments WHERE name = 'IT'), 
  (SELECT id FROM academic_years WHERE name = 'Fourth Year'), 
  30, true);

-- Insert course required equipment
INSERT INTO course_equipment (course_id, equipment_id) VALUES 
-- IT101 - IT Fundamentals
((SELECT id FROM courses WHERE code = 'IT101'), (SELECT id FROM equipment_types WHERE name = 'Computers')),
((SELECT id FROM courses WHERE code = 'IT101'), (SELECT id FROM equipment_types WHERE name = 'Projector')),

-- IT102 - Introduction to Programming
((SELECT id FROM courses WHERE code = 'IT102'), (SELECT id FROM equipment_types WHERE name = 'Computers')),
((SELECT id FROM courses WHERE code = 'IT102'), (SELECT id FROM equipment_types WHERE name = 'Projector')),

-- IT103 - Computer Hardware Essentials
((SELECT id FROM courses WHERE code = 'IT103'), (SELECT id FROM equipment_types WHERE name = 'Computers')),

-- IT201 - Data Structures
((SELECT id FROM courses WHERE code = 'IT201'), (SELECT id FROM equipment_types WHERE name = 'Computers')),

-- IT202 - Computer Networks
((SELECT id FROM courses WHERE code = 'IT202'), (SELECT id FROM equipment_types WHERE name = 'Computers')),
((SELECT id FROM courses WHERE code = 'IT202'), (SELECT id FROM equipment_types WHERE name = 'Network Equipment')),

-- IT204 - Database Design
((SELECT id FROM courses WHERE code = 'IT204'), (SELECT id FROM equipment_types WHERE name = 'Computers')),
((SELECT id FROM courses WHERE code = 'IT204'), (SELECT id FROM equipment_types WHERE name = 'Database Server')),

-- IT301 - Web Development
((SELECT id FROM courses WHERE code = 'IT301'), (SELECT id FROM equipment_types WHERE name = 'Computers')),
((SELECT id FROM courses WHERE code = 'IT301'), (SELECT id FROM equipment_types WHERE name = 'Web Servers')),

-- IT302 - Database Management
((SELECT id FROM courses WHERE code = 'IT302'), (SELECT id FROM equipment_types WHERE name = 'Computers')),
((SELECT id FROM courses WHERE code = 'IT302'), (SELECT id FROM equipment_types WHERE name = 'Database Server')),

-- IT304 - Mobile Applications Development
((SELECT id FROM courses WHERE code = 'IT304'), (SELECT id FROM equipment_types WHERE name = 'Computers')),

-- IT401 - Software Engineering
((SELECT id FROM courses WHERE code = 'IT401'), (SELECT id FROM equipment_types WHERE name = 'Computers')),
((SELECT id FROM courses WHERE code = 'IT401'), (SELECT id FROM equipment_types WHERE name = 'Software Tools')),

-- IT403 - Cloud Computing
((SELECT id FROM courses WHERE code = 'IT403'), (SELECT id FROM equipment_types WHERE name = 'Computers')),
((SELECT id FROM courses WHERE code = 'IT403'), (SELECT id FROM equipment_types WHERE name = 'Web Servers')),

-- IT404 - Cybersecurity
((SELECT id FROM courses WHERE code = 'IT404'), (SELECT id FROM equipment_types WHERE name = 'Computers')),
((SELECT id FROM courses WHERE code = 'IT404'), (SELECT id FROM equipment_types WHERE name = 'Network Equipment')),

-- IT405 - Data Science for IT
((SELECT id FROM courses WHERE code = 'IT405'), (SELECT id FROM equipment_types WHERE name = 'Computers'));

-- Create comprehensive sample schedule entries
INSERT INTO schedule (course_id, faculty_id, room_id, time_slot_id) VALUES
-- First Year Courses Schedule
-- IT101 - IT Fundamentals with Dr. Emily Wilson in Lecture Hall A on Monday at 9:00 AM
(
    (SELECT id FROM courses WHERE code = 'IT101'),
    (SELECT id FROM faculty WHERE name = 'Dr. Emily Wilson'),
    (SELECT id FROM rooms WHERE name = 'Lecture Hall A'),
    (SELECT id FROM time_slots WHERE day = 'Monday' AND time = '9:00 AM')
),
-- IT101 Lab - Thursday at 10:00 AM
(
    (SELECT id FROM courses WHERE code = 'IT101'),
    (SELECT id FROM faculty WHERE name = 'Dr. Emily Wilson'),
    (SELECT id FROM rooms WHERE name = 'Computer Lab 101'),
    (SELECT id FROM time_slots WHERE day = 'Thursday' AND time = '10:00 AM')
),
-- IT102 - Introduction to Programming with Prof. David Miller in Computer Lab 101 on Monday at 1:00 PM
(
    (SELECT id FROM courses WHERE code = 'IT102'),
    (SELECT id FROM faculty WHERE name = 'Prof. David Miller'),
    (SELECT id FROM rooms WHERE name = 'Computer Lab 101'),
    (SELECT id FROM time_slots WHERE day = 'Monday' AND time = '1:00 PM')
),
-- IT102 Lab - Wednesday at 11:00 AM
(
    (SELECT id FROM courses WHERE code = 'IT102'),
    (SELECT id FROM faculty WHERE name = 'Prof. David Miller'),
    (SELECT id FROM rooms WHERE name = 'Computer Lab 102'),
    (SELECT id FROM time_slots WHERE day = 'Wednesday' AND time = '11:00 AM')
),
-- IT103 - Computer Hardware Essentials with Prof. Amanda Davis on Tuesday at 9:00 AM
(
    (SELECT id FROM courses WHERE code = 'IT103'),
    (SELECT id FROM faculty WHERE name = 'Prof. Amanda Davis'),
    (SELECT id FROM rooms WHERE name = 'Classroom 101'),
    (SELECT id FROM time_slots WHERE day = 'Tuesday' AND time = '9:00 AM')
),
-- IT104 - Information Technology Ethics with Prof. James Wilson on Wednesday at 9:00 AM
(
    (SELECT id FROM courses WHERE code = 'IT104'),
    (SELECT id FROM faculty WHERE name = 'Prof. James Wilson'),
    (SELECT id FROM rooms WHERE name = 'Classroom 201'),
    (SELECT id FROM time_slots WHERE day = 'Wednesday' AND time = '9:00 AM')
),

-- Second Year Courses Schedule
-- IT201 - Data Structures with Dr. Sarah Johnson in Computer Lab 102 on Tuesday at 10:00 AM
(
    (SELECT id FROM courses WHERE code = 'IT201'),
    (SELECT id FROM faculty WHERE name = 'Dr. Sarah Johnson'),
    (SELECT id FROM rooms WHERE name = 'Computer Lab 102'),
    (SELECT id FROM time_slots WHERE day = 'Tuesday' AND time = '10:00 AM')
),
-- IT201 Lab - Thursday at 11:00 AM
(
    (SELECT id FROM courses WHERE code = 'IT201'),
    (SELECT id FROM faculty WHERE name = 'Dr. Sarah Johnson'),
    (SELECT id FROM rooms WHERE name = 'Computer Lab 102'),
    (SELECT id FROM time_slots WHERE day = 'Thursday' AND time = '11:00 AM')
),
-- IT202 - Computer Networks with Prof. Robert Chen in Computer Lab 201 on Wednesday at 2:00 PM
(
    (SELECT id FROM courses WHERE code = 'IT202'),
    (SELECT id FROM faculty WHERE name = 'Prof. Robert Chen'),
    (SELECT id FROM rooms WHERE name = 'Computer Lab 201'),
    (SELECT id FROM time_slots WHERE day = 'Wednesday' AND time = '2:00 PM')
),
-- IT203 - Operating Systems with Prof. Daniel Clark on Thursday at 1:00 PM
(
    (SELECT id FROM courses WHERE code = 'IT203'),
    (SELECT id FROM faculty WHERE name = 'Prof. Daniel Clark'),
    (SELECT id FROM rooms WHERE name = 'Computer Lab 201'),
    (SELECT id FROM time_slots WHERE day = 'Thursday' AND time = '1:00 PM')
),
-- IT204 - Database Design with Dr. Michael Robinson on Monday at 11:00 AM
(
    (SELECT id FROM courses WHERE code = 'IT204'),
    (SELECT id FROM faculty WHERE name = 'Dr. Michael Robinson'),
    (SELECT id FROM rooms WHERE name = 'Computer Lab 101'),
    (SELECT id FROM time_slots WHERE day = 'Monday' AND time = '11:00 AM')
),
-- IT204 Lab - Friday at 10:00 AM
(
    (SELECT id FROM courses WHERE code = 'IT204'),
    (SELECT id FROM faculty WHERE name = 'Dr. Michael Robinson'),
    (SELECT id FROM rooms WHERE name = 'Computer Lab 301'),
    (SELECT id FROM time_slots WHERE day = 'Friday' AND time = '10:00 AM')
),

-- Third Year Courses Schedule
-- IT301 - Web Development with Prof. Amanda Davis in Computer Lab 101 on Thursday at 9:00 AM
(
    (SELECT id FROM courses WHERE code = 'IT301'),
    (SELECT id FROM faculty WHERE name = 'Prof. Amanda Davis'),
    (SELECT id FROM rooms WHERE name = 'Computer Lab 301'),
    (SELECT id FROM time_slots WHERE day = 'Monday' AND time = '10:00 AM')
),
-- IT301 Lab - Wednesday at 10:00 AM
(
    (SELECT id FROM courses WHERE code = 'IT301'),
    (SELECT id FROM faculty WHERE name = 'Prof. Amanda Davis'),
    (SELECT id FROM rooms WHERE name = 'Computer Lab 301'),
    (SELECT id FROM time_slots WHERE day = 'Wednesday' AND time = '10:00 AM')
),
-- IT302 - Database Management with Dr. Michael Robinson in Computer Lab 301 on Friday at 1:00 PM
(
    (SELECT id FROM courses WHERE code = 'IT302'),
    (SELECT id FROM faculty WHERE name = 'Dr. Michael Robinson'),
    (SELECT id FROM rooms WHERE name = 'Computer Lab 301'),
    (SELECT id FROM time_slots WHERE day = 'Friday' AND time = '1:00 PM')
),
-- IT303 - System Analysis and Design with Dr. Laura Morgan on Tuesday at 1:00 PM
(
    (SELECT id FROM courses WHERE code = 'IT303'),
    (SELECT id FROM faculty WHERE name = 'Dr. Laura Morgan'),
    (SELECT id FROM rooms WHERE name = 'Classroom 102'),
    (SELECT id FROM time_slots WHERE day = 'Tuesday' AND time = '1:00 PM')
),
-- IT304 - Mobile Applications Development with Prof. David Miller on Thursday at 2:00 PM
(
    (SELECT id FROM courses WHERE code = 'IT304'),
    (SELECT id FROM faculty WHERE name = 'Prof. David Miller'),
    (SELECT id FROM rooms WHERE name = 'Computer Lab 101'),
    (SELECT id FROM time_slots WHERE day = 'Thursday' AND time = '2:00 PM')
),

-- Fourth Year Courses Schedule
-- IT401 - Software Engineering with Dr. Laura Morgan on Monday at 2:00 PM
(
    (SELECT id FROM courses WHERE code = 'IT401'),
    (SELECT id FROM faculty WHERE name = 'Dr. Laura Morgan'),
    (SELECT id FROM rooms WHERE name = 'Computer Lab 301'),
    (SELECT id FROM time_slots WHERE day = 'Monday' AND time = '2:00 PM')
),
-- IT402 - IT Project Management with Prof. James Wilson on Friday at 9:00 AM
(
    (SELECT id FROM courses WHERE code = 'IT402'),
    (SELECT id FROM faculty WHERE name = 'Prof. James Wilson'),
    (SELECT id FROM rooms WHERE name = 'Classroom 201'),
    (SELECT id FROM time_slots WHERE day = 'Friday' AND time = '9:00 AM')
),
-- IT403 - Cloud Computing with Dr. Rebecca Martinez on Tuesday at 3:00 PM
(
    (SELECT id FROM courses WHERE code = 'IT403'),
    (SELECT id FROM faculty WHERE name = 'Dr. Rebecca Martinez'),
    (SELECT id FROM rooms WHERE name = 'Computer Lab 201'),
    (SELECT id FROM time_slots WHERE day = 'Tuesday' AND time = '3:00 PM')
),
-- IT404 - Cybersecurity with Prof. Thomas Anderson on Wednesday at 1:00 PM
(
    (SELECT id FROM courses WHERE code = 'IT404'),
    (SELECT id FROM faculty WHERE name = 'Prof. Thomas Anderson'),
    (SELECT id FROM rooms WHERE name = 'Computer Lab 201'),
    (SELECT id FROM time_slots WHERE day = 'Wednesday' AND time = '1:00 PM')
),
-- IT405 - Data Science for IT with Dr. Sophia Garcia on Friday at 11:00 AM
(
    (SELECT id FROM courses WHERE code = 'IT405'),
    (SELECT id FROM faculty WHERE name = 'Dr. Sophia Garcia'),
    (SELECT id FROM rooms WHERE name = 'Computer Lab 102'),
    (SELECT id FROM time_slots WHERE day = 'Friday' AND time = '11:00 AM')
);
