# Build Troubleshooting Guide for CampusSchedPro with Supabase

This document provides solutions for common build issues that may occur when integrating Supabase with CampusSchedPro.

## Common Build Errors

### 1. React Scripts Build Failures

**Symptoms:**
- Error when running `npm run build`
- Build process starts but fails without clear error message

**Solutions:**
1. **Clear node_modules and reinstall:**
   ```bash
   rm -rf node_modules
   npm cache clean --force
   npm install
   ```

2. **Update React Scripts:**
   ```bash
   npm install react-scripts@latest
   ```

3. **Specify Node Version:**
   Create a `.nvmrc` file with content:
   ```
   16.14.0
   ```
   Then run:
   ```bash
   nvm use  # If you use nvm
   npm install
   npm run build
   ```

### 2. Environment Variable Issues

**Symptoms:**
- Build fails after adding Supabase environment variables
- "process is not defined" errors in console

**Solutions:**
1. **Ensure env variables are correctly formatted:**
   - All variables must start with `REACT_APP_` for Create React App projects
   - No spaces around the `=` sign in .env file

2. **Check .env file placement:**
   - Make sure .env file is in the project root (not in src/ or other subdirectories)
   
3. **Use cross-env for Windows compatibility:**
   ```bash
   npm install cross-env --save-dev
   ```
   Then update scripts in package.json:
   ```json
   "scripts": {
     "build": "cross-env NODE_ENV=production react-scripts build"
   }
   ```

### 3. Import/Export Errors

**Symptoms:**
- "Unexpected token 'export'" errors
- "Cannot use import statement outside a module"
- "require() not defined" errors

**Solutions:**
1. **Check file extensions:**
   - Ensure all JavaScript files use `.js` extensions
   - If using TypeScript, ensure proper `.ts`/`.tsx` extensions

2. **Verify module type:**
   - For modern ESM syntax, your package.json should not specify `"type": "commonjs"`
   - Or update imports to use require() syntax

3. **Fix specific Supabase client issues:**
   If using CommonJS modules:
   ```javascript
   // Change this:
   import { createClient } from '@supabase/supabase-js';
   
   // To this:
   const { createClient } = require('@supabase/supabase-js');
   ```

### 4. Missing Dependencies

**Symptoms:**
- "Module not found" errors
- References to Supabase not resolving

**Solutions:**
1. **Install all required dependencies:**
   ```bash
   npm install @supabase/supabase-js dotenv
   ```

2. **Check for peer dependency issues:**
   ```bash
   npm ls @supabase/supabase-js
   ```
   
   Install any missing peer dependencies:
   ```bash
   npm install missing-dependency@version
   ```

### 5. TypeScript Errors

**Symptoms:**
- Type-related errors when building
- "Cannot find module '@supabase/supabase-js' or its corresponding type declarations"

**Solutions:**
1. **Install TypeScript definitions:**
   ```bash
   npm install @types/supabase__supabase-js --save-dev
   ```

2. **Create type declaration file:**
   Create a `supabase.d.ts` file in your `src` directory:
   ```typescript
   declare module '@supabase/supabase-js';
   ```

### 6. Memory Issues During Build

**Symptoms:**
- Build process terminates with "FATAL ERROR: Ineffective mark-compacts" or similar
- Out of memory errors

**Solutions:**
1. **Increase Node memory limit:**
   ```bash
   export NODE_OPTIONS=--max_old_space_size=4096
   npm run build
   ```
   
   Or add to package.json:
   ```json
   "scripts": {
     "build": "node --max_old_space_size=4096 node_modules/.bin/react-scripts build"
   }
   ```

## Build Process Diagnostics

To better understand build failures:

1. **Enable verbose output:**
   ```bash
   npm run build -- --verbose
   ```

2. **Check for linting errors:**
   ```bash
   npm run lint
   ```

3. **Run build without minification:**
   ```bash
   GENERATE_SOURCEMAP=true npm run build
   ```

## File-Specific Issues

### Supabase Client Issues

If the build fails specifically due to the Supabase client:

1. **Simplify the client temporarily:**
   Create a minimal version of `supabaseClient.js` to test:
   ```javascript
   import { createClient } from '@supabase/supabase-js';

   const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
   const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';

   export const supabase = createClient(supabaseUrl, supabaseAnonKey);
   ```

2. **Add explicit checks for environment variables:**
   ```javascript
   if (!process.env.REACT_APP_SUPABASE_URL || !process.env.REACT_APP_SUPABASE_ANON_KEY) {
     console.warn('Missing Supabase environment variables');
   }
   ```

## Create React App Specific Issues

For projects created with Create React App:

1. **Eject and inspect webpack config:**
   ```bash
   npm run eject
   ```
   (Note: This is a one-way operation!)

2. **Use React App Rewired:**
   ```bash
   npm install react-app-rewired --save-dev
   ```
   
   Create a `config-overrides.js` file to modify webpack config without ejecting.

## After Fixing Build Issues

Once your build is working:

1. **Test Supabase connectivity** with the connection tester
2. **Start with small integrations** before replacing all localStorage functionality
3. **Use the feature flag** to easily toggle between localStorage and Supabase

## Still Having Issues?

If you continue to experience build problems:

1. Share the exact error message
2. Check your Node.js and npm versions
3. Try building a minimal test project with just Supabase integration
4. Review your webpack and babel configurations for conflicts
