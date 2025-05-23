# Troubleshooting Build Issues with Supabase Integration

This guide addresses common issues that may arise when building a React application integrated with Supabase.

## Common Build Errors

### 1. Environment Variables Missing

**Symptoms:**
- Build fails with references to undefined variables
- Console errors mentioning Supabase URL or key being undefined

**Solution:**
1. Ensure your `.env` file exists in the project root
2. Verify it contains the required variables:
   ```
   REACT_APP_SUPABASE_URL=your-project-url
   REACT_APP_SUPABASE_ANON_KEY=your-anon-key
   ```
3. Make sure the `.env` file is in the correct directory (main_container_for_campus_sched_pro)
4. Remember that you need to restart the development server after changing environment variables

### 2. Missing Dependencies

**Symptoms:**
- Build errors referencing undefined imports from Supabase
- Module not found errors

**Solution:**
1. Install the required dependencies:
   ```bash
   npm install @supabase/supabase-js
   ```
2. If using TypeScript, also install types:
   ```bash
   npm install --save-dev @types/supabase__supabase-js
   ```
3. Check for peer dependency warnings and install any missing packages

### 3. Import Path Issues

**Symptoms:**
- Cannot find module errors
- Incorrect file path errors

**Solution:**
1. Verify import paths in your components:
   ```javascript
   // Correct
   import { supabase } from '../utils/supabase/supabaseClient';
   
   // Incorrect
   import { supabase } from './supabaseClient';
   ```
2. Check that the supabaseClient.js file is in the correct location
3. Consider using path aliases in your project configuration

### 4. Context Provider Issues

**Symptoms:**
- Errors about React hooks being used outside of a Provider component
- Missing context errors

**Solution:**
1. Ensure your app is wrapped with the correct context providers:
   ```jsx
   import { SupabaseProvider } from './context/SupabaseContext';
   
   function App() {
     return (
       <SupabaseProvider>
         {/* app components */}
       </SupabaseProvider>
     );
   }
   ```
2. Check that context hooks are only used within components that are children of the provider

### 5. Build Process Timeouts

**Symptoms:**
- Build process hangs or times out
- No specific error message, just stops

**Solution:**
1. Increase memory limit for Node.js:
   ```bash
   export NODE_OPTIONS=--max_old_space_size=4096
   ```
2. Try a clean build:
   ```bash
   rm -rf node_modules/.cache
   npm run build
   ```

### 6. Supabase Client Initialization Issues

**Symptoms:**
- Runtime errors about Supabase not being initialized
- "Cannot read property 'from' of undefined" errors

**Solution:**
1. Ensure the supabaseClient.js file properly initializes the client:
   ```javascript
   import { createClient } from '@supabase/supabase-js';

   const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
   const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

   if (!supabaseUrl || !supabaseKey) {
     console.error('Supabase credentials missing!');
   }

   export const supabase = createClient(supabaseUrl, supabaseKey);
   ```
2. Verify that the client is properly exported and imported

## Development Environment Issues

### Using Development Environment Variables

For local development, create a `.env.development.local` file for development-specific variables:

```
REACT_APP_SUPABASE_URL=your-dev-project-url
REACT_APP_SUPABASE_ANON_KEY=your-dev-anon-key
```

### Debugging Supabase API Calls

1. Enable detailed Supabase logging:
   ```javascript
   const options = {
     auth: {
       autoRefreshToken: true,
       persistSession: true,
       detectSessionInUrl: true
     },
     debug: process.env.NODE_ENV !== 'production'
   };
   
   export const supabase = createClient(supabaseUrl, supabaseKey, options);
   ```

2. Use browser developer tools network tab to inspect API calls

## Production Build Considerations

### Environment Variables in Production

1. In CI/CD environments, set environment variables through the platform's configuration
2. For hosting platforms like Netlify or Vercel, use their environment variable settings
3. Never commit sensitive keys to version control

### Optimizing Bundle Size

If build size is an issue:

1. Consider using tree-shaking with ESM imports:
   ```javascript
   import { createClient } from '@supabase/supabase-js/dist/module/index.js';
   ```

2. Only import the specific modules you need

## Last Resort Solutions

If all else fails:

1. Create a completely fresh project and migrate your code gradually:
   ```bash
   npx create-react-app new-project
   cd new-project
   npm install @supabase/supabase-js
   ```
   
2. Try an alternative build tool like Vite:
   ```bash
   npm create vite@latest my-app -- --template react
   ```

3. Set up a minimal reproduction of the issue to isolate the problem

## Getting Help

If you're still experiencing issues:

1. Check the [Supabase documentation](https://supabase.io/docs)
2. Search the [Supabase GitHub issues](https://github.com/supabase/supabase/issues)
3. Ask for help in the [Supabase Discord community](https://discord.supabase.com/)
