# CampusSchedPro SQL Schema and Default Data Guide

This guide provides information about the SQL schema and default data for CampusSchedPro's Supabase integration.

## Overview

CampusSchedPro uses a PostgreSQL database schema (through Supabase) with tables for departments, faculty, rooms, courses, schedules, and supporting entities. The schema is designed to support a comprehensive timetable management system for college IT departments.

## Files

- **`supabase_schema.sql`** - Contains all CREATE TABLE statements and database structure
- **`supabase_default_data.sql`** - Contains INSERT statements for sample data

## Database Schema

The database schema includes the following tables:

1. **departments** - Academic departments
2. **buildings** - Campus buildings
3. **equipment_types** - Types of equipment available
4. **rooms** - Classrooms, labs, and other spaces
5. **room_equipment** - Many-to-many relation for rooms and equipment
6. **faculty** - Teaching staff information
7. **faculty_expertise** - Faculty specializations
8. **academic_years** - Academic year classifications
9. **courses** - Course information and requirements
10. **course_equipment** - Equipment required for courses
11. **time_slots** - Available time slots for scheduling
12. **schedule** - Course scheduling information
13. **conflicts** - Scheduling conflicts tracking

## Default Data

The default data includes:

- **Departments**: 5 departments including IT, Computer Science, etc.
- **Faculty**: 15 faculty members with their expertise areas
- **Rooms**: 12 rooms across different buildings and types
- **Courses**: 17 IT courses spanning all four academic years
- **Schedule**: 22 sample schedule entries with lab sessions

## Usage with Supabase

### Setting Up with Supabase

1. Create a new Supabase project
2. Use the SQL Editor to execute `supabase_schema.sql` first
3. Then execute `supabase_default_data.sql` to populate tables with sample data

### Connection Setup

Make sure your environment variables are configured correctly:

```
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Data Relationships

The schema implements proper referential integrity with foreign keys connecting:

- Courses to departments and academic years
- Faculty to departments
- Rooms to buildings
- Schedules to courses, faculty, rooms, and time slots

## Database Views

Two views are defined for easier queries:

1. **course_schedule_view** - Comprehensive view of course schedules with room and faculty information
2. **faculty_teaching_load_view** - View for analyzing faculty teaching workload

## Customizing the Data

When adapting this schema for your specific institution:

1. Modify department names in the departments table
2. Adjust room types and capacities to match your facilities
3. Update course codes to match your curriculum
4. Customize the time slots based on your institution's schedule

## Generating Reports

Example query for generating a timetable report:

```sql
SELECT 
    ts.day, 
    ts.time, 
    c.code AS course_code, 
    c.name AS course_name,
    r.name AS room,
    f.name AS faculty
FROM schedule s
JOIN time_slots ts ON s.time_slot_id = ts.id
JOIN courses c ON s.course_id = c.id
JOIN rooms r ON s.room_id = r.id
JOIN faculty f ON s.faculty_id = f.id
ORDER BY 
    CASE 
        WHEN ts.day = 'Monday' THEN 1
        WHEN ts.day = 'Tuesday' THEN 2
        WHEN ts.day = 'Wednesday' THEN 3
        WHEN ts.day = 'Thursday' THEN 4
        WHEN ts.day = 'Friday' THEN 5
    END, 
    ts.time;
```

This guide covers the basic structure and usage of the SQL schema and default data files for CampusSchedPro. Adjust as needed for your specific requirements.
