# Using CampusSchedPro SQL Files with Supabase

These instructions explain how to use the SQL schema and data files with Supabase, independent of the React application build process.

## Prerequisites

- A Supabase account with a new or existing project
- Access to the Supabase SQL Editor

## Files Included

1. `supabase_schema.sql` - Contains all CREATE TABLE statements for the database structure
2. `supabase_default_data.sql` - Contains INSERT statements for sample data
3. `validate_sql.js` - A Node.js script to validate SQL syntax locally

## Validating SQL Files Locally

Before uploading to Supabase, you can validate the basic SQL syntax:

1. Navigate to the `utils` directory:
   ```bash
   cd /path/to/campusschedpro-95046-95052/utils
   ```

2. Run the validation script:
   ```bash
   node validate_sql.js
   ```

3. Review any reported issues and fix them if necessary.

## Setting Up the Database in Supabase

### Step 1: Execute the Schema File

1. Log into your Supabase dashboard
2. Open the SQL Editor
3. Create a new query or open a blank query
4. Copy and paste the contents of `supabase_schema.sql` into the editor
5. Run the query to create all database tables and structures

### Step 2: Load Sample Data

1. Open a new query in the SQL Editor
2. Copy and paste the contents of `supabase_default_data.sql` into the editor
3. Run the query to insert all sample data

### Step 3: Verify the Setup

1. In the Supabase dashboard, go to the "Table Editor"
2. You should see all the tables created by the schema:
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

3. Check that the tables contain the sample data by clicking on them

## Connecting Your Application to Supabase

Update your application's environment variables with your Supabase credentials:

```
REACT_APP_SUPABASE_URL=your_project_url
REACT_APP_SUPABASE_ANON_KEY=your_public_anon_key
```

## Troubleshooting Common Issues

### Error: Relation already exists

If you see errors about relations already existing, the tables have already been created. You can either:
- Drop all existing tables before running the schema file again, or
- Comment out the CREATE TABLE statements for tables that already exist

### Error: Duplicate key value violates unique constraint

If inserting sample data fails with unique constraint violations:
- The data may already exist in the tables
- Check the data for duplicate primary keys or unique values
- Clear the affected table before re-inserting data

### Error: Insert or update violates foreign key constraint

If foreign key constraints are violated:
- Ensure you run the INSERT statements in the correct order
- Check that referenced values exist in parent tables
- Verify that the IDs match between parent and child tables

## Help and Support

If you encounter issues with the SQL files or database setup, check:
- The SQL syntax using the validation script
- The Supabase documentation on SQL compatibility
- PostgreSQL-specific syntax requirements

Remember that the SQL files are designed to work with PostgreSQL (which Supabase uses) and follow standard SQL conventions.
