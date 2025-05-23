# Importing CampusSchedPro SQL into Supabase

This guide provides step-by-step instructions for importing the CampusSchedPro SQL schema and data into your Supabase project.

## Prerequisites

- A Supabase account (free tier works fine)
- A new or existing Supabase project
- The SQL files from this repository:
  - `supabase_schema.sql`
  - `supabase_default_data.sql`

## Step 1: Access your Supabase Project

1. Log in to the [Supabase Dashboard](https://app.supabase.io/)
2. Select your project (or create a new one)

## Step 2: Open the SQL Editor

1. In the left sidebar, click on "SQL Editor"
2. Click "New Query" to create a new SQL query

## Step 3: Import and Execute the Schema SQL

1. Open the `supabase_schema.sql` file in a text editor
2. Copy all the contents (Ctrl+A, then Ctrl+C)
3. Paste the contents into the Supabase SQL Editor
4. Click the "Run" button to execute the schema creation queries

If any errors occur:
- Check the error message for details
- Most common issue: Tables already exist. You may need to drop existing tables first

## Step 4: Verify Schema Creation

1. In the left sidebar, click on "Table Editor"
2. Verify that all the following tables have been created:
   - departments
   - buildings
   - equipment_types
   - rooms
   - room_equipment
   - faculty
   - faculty_expertise
   - academic_years
   - courses
   - course_equipment
   - time_slots
   - schedule
   - conflicts

## Step 5: Import and Execute the Data SQL

1. In the left sidebar, click on "SQL Editor" again
2. Click "New Query" to create another new SQL query
3. Open the `supabase_default_data.sql` file in a text editor
4. Copy all the contents (Ctrl+A, then Ctrl+C)
5. Paste the contents into the new Supabase SQL Editor query
6. Click the "Run" button to execute the data insertion queries

If any errors occur:
- Check for foreign key constraint errors
- Check for unique constraint violations (data may already exist)

## Step 6: Verify Data Insertion

1. In the left sidebar, click on "Table Editor"
2. Click through each table to verify data was inserted:
   - Departments (5 records)
   - Faculty (15 records)
   - Rooms (12 records)
   - Courses (17 records)
   - Schedule (22 records)

## Step 7: Test a Query

To verify everything is working properly, try running this query in a new SQL query window:

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

This should display a weekly schedule with all the courses, rooms, and faculty.

## Step 8: Connect your Application

1. Go to your Supabase project dashboard
2. Click on the "Settings" icon (gear) in the sidebar
3. Click on "API" in the Settings menu
4. Note your:
   - Project URL
   - Project API Key (anon, public)
5. Update your application's environment variables:
   ```
   REACT_APP_SUPABASE_URL=your_project_url
   REACT_APP_SUPABASE_ANON_KEY=your_project_api_key
   ```

## Troubleshooting Common Issues

### Issue: "Relation already exists"
Solution: Either drop the existing tables first or skip the schema creation step if your tables are already set up correctly.

### Issue: "Foreign key constraint violation"
Solution: Make sure you're running the SQL files in the correct order (schema first, then data). Check that referenced records exist.

### Issue: "Unique constraint violation"
Solution: The data might already exist in the table. Clear the table first or use the "ON CONFLICT" clause to handle duplicate entries.

### Issue: "Permission denied"
Solution: Ensure you're using the correct Supabase connection credentials and that your policies allow the operations you're attempting.

## Next Steps

After successfully importing the schema and data:

1. Explore the database structure in the Table Editor
2. Test queries using the SQL Editor
3. Connect your frontend application
4. Set up Row Level Security policies if needed for multi-user access

The database is now ready to support your CampusSchedPro application!
