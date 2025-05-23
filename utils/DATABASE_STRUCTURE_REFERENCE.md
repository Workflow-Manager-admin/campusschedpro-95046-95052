# CampusSchedPro Database Structure Reference

This document serves as a quick reference guide for the CampusSchedPro database schema implemented in Supabase.

## Database Tables & Relationships

### Core Entities

#### departments
- `id` (UUID, PK): Unique identifier
- `name` (TEXT): Department name
- `created_at` (TIMESTAMP): Record creation time
- `updated_at` (TIMESTAMP): Record update time

#### buildings
- `id` (UUID, PK): Unique identifier
- `name` (TEXT): Building name
- `location` (TEXT): Campus location description
- `created_at` (TIMESTAMP): Record creation time
- `updated_at` (TIMESTAMP): Record update time

#### rooms
- `id` (UUID, PK): Unique identifier
- `name` (TEXT): Room name/number
- `type` (TEXT): Room type (e.g., "Lecture Hall", "Lab")
- `capacity` (INTEGER): Maximum number of students
- `building_id` (UUID, FK): Reference to buildings.id
- `floor` (TEXT): Floor designation
- `created_at` (TIMESTAMP): Record creation time
- `updated_at` (TIMESTAMP): Record update time

#### equipment_types
- `id` (UUID, PK): Unique identifier
- `name` (TEXT): Equipment name
- `created_at` (TIMESTAMP): Record creation time
- `updated_at` (TIMESTAMP): Record update time

#### academic_years
- `id` (UUID, PK): Unique identifier
- `name` (TEXT): Year name (e.g., "First Year")
- `created_at` (TIMESTAMP): Record creation time
- `updated_at` (TIMESTAMP): Record update time

#### faculty
- `id` (UUID, PK): Unique identifier
- `name` (TEXT): Faculty member's name
- `department_id` (UUID, FK): Reference to departments.id
- `email` (TEXT): Email address
- `status` (TEXT): Availability status
- `created_at` (TIMESTAMP): Record creation time
- `updated_at` (TIMESTAMP): Record update time

#### courses
- `id` (UUID, PK): Unique identifier
- `name` (TEXT): Course name
- `code` (TEXT): Course code (unique)
- `credits` (INTEGER): Number of credits
- `department_id` (UUID, FK): Reference to departments.id
- `academic_year_id` (UUID, FK): Reference to academic_years.id
- `expected_enrollment` (INTEGER): Expected number of students
- `requires_lab` (BOOLEAN): Whether course requires lab
- `created_at` (TIMESTAMP): Record creation time
- `updated_at` (TIMESTAMP): Record update time

#### time_slots
- `id` (UUID, PK): Unique identifier
- `day` (TEXT): Day of week
- `time` (TEXT): Time of day
- `created_at` (TIMESTAMP): Record creation time
- `UNIQUE` constraint on combination of (day, time)

### Junction Tables

#### room_equipment (Many-to-Many)
- `room_id` (UUID, FK): Reference to rooms.id
- `equipment_id` (UUID, FK): Reference to equipment_types.id
- Primary key is the combination of (room_id, equipment_id)

#### faculty_expertise (Many-to-Many)
- `faculty_id` (UUID, FK): Reference to faculty.id
- `expertise` (TEXT): Area of expertise
- Primary key is the combination of (faculty_id, expertise)

#### course_equipment (Many-to-Many)
- `course_id` (UUID, FK): Reference to courses.id
- `equipment_id` (UUID, FK): Reference to equipment_types.id
- Primary key is the combination of (course_id, equipment_id)

### Scheduling Tables

#### schedule
- `id` (UUID, PK): Unique identifier
- `course_id` (UUID, FK): Reference to courses.id
- `faculty_id` (UUID, FK): Reference to faculty.id
- `room_id` (UUID, FK): Reference to rooms.id
- `time_slot_id` (UUID, FK): Reference to time_slots.id
- `created_at` (TIMESTAMP): Record creation time
- `updated_at` (TIMESTAMP): Record update time
- `UNIQUE` constraint on combination of (faculty_id, time_slot_id)
- `UNIQUE` constraint on combination of (room_id, time_slot_id)

#### conflicts
- `id` (UUID, PK): Unique identifier
- `schedule_id_1` (UUID, FK): Reference to first schedule entry
- `schedule_id_2` (UUID, FK): Reference to second schedule entry
- `conflict_type` (TEXT): Type of conflict (e.g., "instructor", "room")
- `resolved` (BOOLEAN): Whether conflict has been resolved
- `created_at` (TIMESTAMP): Record creation time
- `updated_at` (TIMESTAMP): Record update time

## Database Views

### course_schedule_view
This view joins together courses, faculty, rooms, buildings, and time slots to provide a unified view of the schedule.

### faculty_teaching_load_view
This view calculates teaching loads for faculty members, including total courses, credits, and hours per week.

## Entity Relationship Diagram (ERD)

```
departments 1----* faculty
departments 1----* courses
buildings 1----* rooms
rooms *----* equipment_types (via room_equipment)
courses *----* equipment_types (via course_equipment)
academic_years 1----* courses
time_slots 1----* schedule
courses 1----* schedule
faculty 1----* schedule
rooms 1----* schedule
schedule 1----* conflicts
```

## Data Flow

1. Departments, buildings, equipment_types, and academic_years serve as reference tables
2. Faculty and rooms are configured with their properties and relationships
3. Courses are defined with requirements and academic year
4. Schedule entries connect courses with faculty, rooms, and time slots
5. Conflicts table helps track and resolve scheduling issues

## Performance Considerations

- Indexes are automatically created for primary keys and foreign keys
- The `time_slots` table has a unique constraint on (day, time)
- The `schedule` table ensures no double-booking via unique constraints
- Views help optimize common queries and reduce code complexity

## Note on UUID Generation

The schema uses PostgreSQL's uuid-ossp extension to generate UUIDs for primary keys. New records should use the `uuid_generate_v4()` function as the default value for ID fields.
