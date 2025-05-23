# CampusSchedPro Build Helper Utilities

This directory contains utilities to help troubleshoot and resolve build issues with CampusSchedPro, especially after integrating Supabase.

## Utility Files

1. **safe-build.js**: A build script with improved error handling and memory allocation
2. **BUILD_TROUBLESHOOTING.md**: Solutions for common build errors
3. **install_supabase.sh**: Shell script to install Supabase integration files
4. **reactInstaller.js**: Node.js script for installing Supabase in React projects

## Using the Safe Build Script

The safe-build.js script provides a more robust way to build your project with better error handling and debugging information.

To use it:

```bash
node utils/safe-build.js
```

This script:
1. Performs pre-build checks for required files and dependencies
2. Cleans the previous build directory
3. Runs the build with increased memory allocation
4. Verifies the build output
5. Provides troubleshooting guidance if the build fails

## Resolving Common Build Issues

If you're experiencing build errors, follow these steps:

### 1. Check for Missing Dependencies

```bash
npm install @supabase/supabase-js dotenv
```

### 2. Verify Environment Variables

Make sure your `.env` file exists and contains:

```
REACT_APP_SUPABASE_URL=your-supabase-url
REACT_APP_SUPABASE_ANON_KEY=your-supabase-anon-key
REACT_APP_USE_SUPABASE=false
```

### 3. Clean and Reinstall

Sometimes a clean reinstall resolves dependency issues:

```bash
rm -rf node_modules
npm cache clean --force
npm install
```

### 4. Increase Memory Limit

If you get memory-related errors:

```bash
export NODE_OPTIONS=--max_old_space_size=4096
npm run build
```

### 5. Run with Verbose Output

For more detailed error information:

```bash
npm run build -- --verbose
```

## Using the Installation Scripts

### Shell Script (Unix/Linux/Mac)

```bash
chmod +x utils/install_supabase.sh
./utils/install_supabase.sh
```

### Node.js Script (All Platforms)

```bash
node utils/reactInstaller.js
```

Both scripts will:
1. Install required dependencies
2. Copy Supabase integration files to the correct locations
3. Create necessary directories
4. Generate a default .env file if one doesn't exist

## Additional Resources

For more detailed information on fixing build errors, refer to:
- `utils/BUILD_TROUBLESHOOTING.md` for comprehensive solutions
- `utils/INSTALLATION_GUIDE.md` for proper Supabase setup instructions
- `utils/supabase_integration_guide.md` for integration guidance

## Need More Help?

If you continue to experience build issues:
1. Check the error message carefully for hints about the problem
2. Review any recent code changes that might have caused the issue
3. Verify that all Supabase files are correctly placed in their directories
4. Consider temporarily removing Supabase integration to isolate the issue
5. Try building a minimal test project with just Supabase integration
