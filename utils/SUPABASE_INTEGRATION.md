# CampusSchedPro Supabase Integration

This folder contains all the necessary files and instructions for integrating CampusSchedPro with Supabase for database persistence.

## Overview

The integration includes:

1. SQL schema definitions for all database tables
2. Default data for IT courses, faculty, rooms, and other entities
3. JavaScript client library for interacting with Supabase
4. Supabase-integrated React context to replace localStorage
5. Example component implementations
6. Step-by-step integration guide

## Files Included

- `supabase_schema.sql` - Database schema definitions
- `supabase_default_data.sql` - Default data insert statements
- `supabaseClient.js` - Client library for Supabase interaction
- `SupabaseScheduleContext.js` - React context using Supabase
- `AppWithSupabase.js` - Example App.js with Supabase integration
- `SupabaseExampleComponent.js` - Example component using Supabase directly
- `supabase_integration_guide.md` - Step-by-step integration guide
- `package_updates.json` - Required npm dependencies

## Integration Steps

1. **Install Dependencies**

   ```bash
   npm install @supabase/supabase-js
   ```

2. **Create Supabase Project**

   Visit [Supabase](https://supabase.com) to create a new project.

3. **Set Environment Variables**

   Create a `.env` file in the project root:

   ```
   REACT_APP_SUPABASE_URL=your_supabase_url
   REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Initialize Database**

   Use the SQL Editor in your Supabase dashboard to run:
   - `supabase_schema.sql` - Creates all required tables
   - `supabase_default_data.sql` - Inserts default data

5. **Integrate Supabase Client**

   Copy `supabaseClient.js` to your src/utils/ directory.

6. **Replace ScheduleContext**

   Either:
   - Replace the existing ScheduleContext.js with SupabaseScheduleContext.js
   - Or implement a feature toggle to switch between localStorage and Supabase

7. **Update App.js**

   Use `AppWithSupabase.js` as a reference to update your main App component.

## Data Model

The Supabase implementation includes the following tables:

- **departments** - Academic departments
- **buildings** - Campus buildings
- **equipment_types** - Available equipment types
- **rooms** - Classrooms, labs, and lecture halls
- **room_equipment** - Equipment assigned to rooms (many-to-many)
- **faculty** - Faculty members
- **faculty_expertise** - Areas of expertise for faculty (many-to-many)
- **academic_years** - Academic year classifications
- **courses** - Course definitions
- **course_equipment** - Equipment required for courses (many-to-many)
- **time_slots** - Defined time slots for scheduling
- **schedule** - Course scheduling assignments
- **conflicts** - Detected scheduling conflicts

## API Reference

The `supabaseClient.js` file provides the following functions:

### Faculty Management
- `getAllFaculty()` - Fetch all faculty members
- `getFacultyAssignments(facultyId)` - Get courses assigned to faculty
- `saveFaculty(faculty)` - Create or update faculty
- `deleteFaculty(facultyId)` - Delete faculty

### Course Management
- `getAllCourses()` - Fetch all courses
- `getCourseAssignments(courseIds)` - Get faculty/room assignments
- `saveCourse(course)` - Create or update course
- `deleteCourse(courseId)` - Delete course

### Room Management
- `getAllRooms()` - Fetch all rooms
- `saveRoom(room)` - Create or update room
- `deleteRoom(roomId)` - Delete room

### Schedule Management
- `getSchedule()` - Fetch complete schedule
- `scheduleCourse(courseId, facultyId, roomId, timeSlotId)` - Schedule course
- `unscheduleCourse(courseId, timeSlotId)` - Remove course from schedule

## Benefits of Supabase Integration

1. **Real-time Data Sync** - Multiple users can work simultaneously
2. **Data Persistence** - Data stored securely in the cloud
3. **Improved Reliability** - No reliance on browser localStorage
4. **Scalability** - Easily expand with more courses, faculty, and rooms
5. **Access Control** - Role-based permissions (future enhancement)
