# Supabase Integration Installation Guide for CampusSchedPro

This guide provides step-by-step instructions for installing and configuring the Supabase integration for CampusSchedPro.

## Prerequisites

Before proceeding, ensure you have:

1. Node.js 14+ and npm installed
2. Access to a Supabase account (free tier works fine)

## Installation Steps

### 1. Install Required Dependencies

Run the following command in your project's root directory:

```bash
npm install @supabase/supabase-js dotenv
```

### 2. Create a Supabase Project

1. Sign up or log in at [supabase.com](https://supabase.com)
2. Create a new project
3. Note your project URL and anon/public key (found in Settings → API)

### 3. Set Up Environment Variables

Create a `.env` file in your project's root directory:

```
REACT_APP_SUPABASE_URL=your-supabase-url
REACT_APP_SUPABASE_ANON_KEY=your-anon-key
REACT_APP_USE_SUPABASE=false  # Set to 'true' when ready to use Supabase
```

### 4. Create SQL Directory

Create a directory to store the SQL scripts:

```bash
mkdir -p sql
```

### 5. Initialize Supabase Database

1. Copy the SQL schema to `sql/schema.sql`:
   - Use file from `utils/supabase_schema.sql`

2. Copy the default data to `sql/default_data.sql`:
   - Use file from `utils/supabase_default_data.sql`

3. In the Supabase dashboard, navigate to the SQL Editor
4. Run the schema SQL script first
5. Then run the default data SQL script

### 6. Add Supabase Client to Your Project

Copy the client utility file to your project:

```bash
mkdir -p src/utils
cp utils/supabaseClient.js src/utils/
```

### 7. Add Supabase Schedule Context

Copy the context provider to your project:

```bash
cp utils/SupabaseScheduleContext.js src/utils/
```

### 8. Test the Connection

Create a simple test script to verify the connection:

```bash
cp utils/testSupabaseConnection.js ./
```

Run the test script:

```bash
node -r dotenv/config testSupabaseConnection.js
```

### 9. Implement the Integration

Follow these steps to integrate Supabase into your application:

1. **Replace localStorage Context**: 
   - Modify `src/context/ScheduleContext.js` to use Supabase
   - OR use `SupabaseScheduleContext.js` as a direct replacement

2. **Enable Feature Flag**:
   - When ready, set `REACT_APP_USE_SUPABASE=true` in your `.env` file

3. **Migrate Existing Data**:
   - If needed, use the data migration utility to transfer localStorage data to Supabase
   - Copy `utils/migrateLocalStorageToSupabase.js` to `src/utils/`
   - Implement the migration component in your app

## Troubleshooting Common Issues

### Build Errors

If you encounter build errors after implementing Supabase:

1. **Check Environment Variables**: 
   - Ensure environment variables are correctly set
   - For Create React App, variables must start with `REACT_APP_`

2. **Dependency Issues**:
   - Make sure all dependencies are installed correctly
   - Run `npm install` to update dependencies

3. **React Scripts**:
   - Ensure react-scripts is installed and up to date
   - Run `npm install react-scripts@latest` if needed

### Runtime Errors

1. **CORS Issues**:
   - Check Supabase project settings to allow your application origin
   - Navigate to Authentication → URL Configuration in Supabase dashboard

2. **Connection Errors**:
   - Verify Supabase URL and anon key are correct
   - Check network connectivity

3. **Database Errors**:
   - Ensure SQL scripts were executed successfully
   - Check for schema mismatches

## Testing the Integration

Before deploying to production:

1. Test all CRUD operations
2. Verify data synchronization between clients
3. Test with a large dataset to evaluate performance
4. Check error handling and recovery

## Need Help?

If you encounter any issues with the Supabase integration:

1. Review the documentation files in the `utils/` directory
2. Check the Supabase documentation at [supabase.com/docs](https://supabase.com/docs)
3. Test your connection with the connection tester HTML file

## Next Steps

After successful installation:

1. Explore authentication options in Supabase
2. Set up row-level security for multi-user environments
3. Consider implementing real-time subscriptions for live updates
4. Set up regular database backups
