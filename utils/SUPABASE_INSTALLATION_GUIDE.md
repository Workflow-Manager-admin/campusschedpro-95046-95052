# CampusSchedPro Supabase Installation Guide

This guide provides step-by-step instructions for setting up and integrating Supabase with CampusSchedPro.

## Prerequisites

- Node.js (version 14 or later)
- npm or yarn
- Git (for version control)
- A Supabase account

## 1. Environment Setup

### Install Required Dependencies

```bash
cd /path/to/campusschedpro-95046-95052/main_container_for_campus_sched_pro
npm install @supabase/supabase-js
```

### Create Environment Variables

Create a `.env` file in the main_container_for_campus_sched_pro directory:

```
REACT_APP_SUPABASE_URL=your-project-url
REACT_APP_SUPABASE_ANON_KEY=your-anon-key
```

Replace the placeholders with your actual Supabase project values.

## 2. Supabase Project Setup

### Create a New Supabase Project

1. Sign up or log in at [supabase.com](https://supabase.com)
2. Create a new project and note your project URL and anon/public key
3. Go to the SQL Editor in your Supabase dashboard

### Initialize Database Schema

1. Copy the contents of `utils/supabase_schema.sql`
2. Paste and execute in the SQL Editor
3. Verify that all tables have been created successfully

### Insert Default Data

1. Copy the contents of `utils/supabase_default_data.sql`
2. Paste and execute in the SQL Editor
3. Verify that sample data has been inserted properly

## 3. Client Integration

### Copy Supabase Client Files

1. Copy `utils/supabaseClient.js` to `main_container_for_campus_sched_pro/src/utils/`
2. Ensure it's configured to use environment variables:

```javascript
// main_container_for_campus_sched_pro/src/utils/supabaseClient.js
// Make sure these lines exist and are correct:
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
```

### Implement Supabase Context

1. Either:
   - Replace `src/context/ScheduleContext.js` with `utils/SupabaseScheduleContext.js`
   - OR implement a feature flag system to toggle between localStorage and Supabase

2. Update imports in any files that use the context

## 4. Testing the Integration

### Verify Connection

Run the test script to verify connectivity:

```bash
cd main_container_for_campus_sched_pro
node ../utils/testSupabaseConnection.js
```

### Start the Application

```bash
npm start
```

## 5. Troubleshooting

### Common Issues

1. **"Failed to connect to Supabase"**:
   - Check that your environment variables are set correctly
   - Verify that your Supabase project is active
   - Ensure your IP address isn't blocked by Supabase

2. **Build errors**:
   - Make sure all dependencies are installed: `npm install`
   - Clear cache and node modules if needed:
     ```bash
     rm -rf node_modules
     npm cache clean --force
     npm install
     ```

3. **Data not loading**:
   - Check browser console for specific errors
   - Verify that SQL scripts executed successfully in Supabase
   - Check network tab for API call failures

### Getting Help

If you encounter issues not covered in this guide, please:

1. Check the [Supabase documentation](https://supabase.io/docs)
2. Review the integration guides in the utils directory
3. Contact the development team for assistance

## 6. Next Steps

After successful installation:

1. Explore the example components to understand how to use Supabase in your code
2. Gradually migrate components from localStorage to Supabase
3. Set up proper authentication if needed for multi-user scenarios
4. Consider implementing row-level security policies in Supabase
