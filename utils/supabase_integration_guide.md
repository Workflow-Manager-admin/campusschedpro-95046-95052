# Supabase Integration Guide for CampusSchedPro

This guide explains how to set up and integrate Supabase with the CampusSchedPro application.

## Setup Steps

1. **Create a Supabase Project**

   - Sign up at [supabase.com](https://supabase.com)
   - Create a new project
   - Note your project URL and anon/public key

2. **Environment Variables**

   Create a `.env` file in the project root and add:

   ```
   REACT_APP_SUPABASE_URL=your-project-url
   REACT_APP_SUPABASE_ANON_KEY=your-anon-key
   ```

3. **Initialize Database**

   - Navigate to the SQL Editor in your Supabase dashboard
   - Run the SQL scripts from `utils/supabase_schema.sql` to create tables and relationships
   - Run the SQL scripts from `utils/supabase_default_data.sql` to populate initial data

4. **Install Required Packages**

   ```bash
   npm install @supabase/supabase-js
   ```

## Integration with Application

The `utils/supabaseClient.js` file provides all necessary functions to interact with the Supabase database. Import and use these functions in your components to replace the current local storage implementation.

### Key Functions

- **Faculty Management**
  - `getAllFaculty()` - Fetch all faculty members
  - `getFacultyAssignments(facultyId)` - Get courses assigned to a faculty member
  - `saveFaculty(faculty)` - Create or update faculty record
  - `deleteFaculty(facultyId)` - Delete a faculty member

- **Course Management**
  - `getAllCourses()` - Fetch all courses
  - `getCourseAssignments(courseIds)` - Get faculty and room assignments for courses
  - `saveCourse(course)` - Create or update course record
  - `deleteCourse(courseId)` - Delete a course

- **Room Management**
  - `getAllRooms()` - Fetch all rooms
  - `saveRoom(room)` - Create or update room record
  - `deleteRoom(roomId)` - Delete a room

- **Schedule Management**
  - `getSchedule()` - Fetch complete timetable schedule
  - `scheduleCourse(courseId, facultyId, roomId, timeSlotId)` - Schedule a course
  - `unscheduleCourse(courseId, timeSlotId)` - Remove a course from schedule

## Example Usage

```javascript
import { useEffect, useState } from 'react';
import { getAllFaculty } from '../utils/supabaseClient';

function FacultyList() {
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadFaculty() {
      setLoading(true);
      const data = await getAllFaculty();
      setFaculty(data);
      setLoading(false);
    }
    
    loadFaculty();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {faculty.map(person => (
        <div key={person.id}>{person.name}</div>
      ))}
    </div>
  );
}
```

## Converting Existing Components

To convert the application from localStorage to Supabase:

1. Replace localStorage load/save operations in the context with the appropriate Supabase client functions
2. Update state management to handle asynchronous operations
3. Add loading states where needed to handle API calls
4. Add error handling for network or database issues

## Data Model

The Supabase database schema follows the application's existing data model, with some improvements:

- Proper relationships between tables using foreign keys
- Many-to-many relationships using junction tables
- UUID primary keys for all entities
- Created/updated timestamps for tracking changes
