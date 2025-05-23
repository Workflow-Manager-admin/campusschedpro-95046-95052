# Deploying CampusSchedPro with Supabase

This guide outlines the steps to deploy the CampusSchedPro application with Supabase integration to production environments.

## Prerequisites

1. A Supabase account with a project set up
2. A web hosting service (Vercel, Netlify, GitHub Pages, etc.)
3. Domain name (optional)

## Step 1: Prepare Supabase Database

### 1.1 Run Schema Scripts

1. Navigate to the SQL Editor in your Supabase dashboard
2. Run the schema creation script from `utils/supabase_schema.sql`
3. Run the default data script from `utils/supabase_default_data.sql`
4. Verify tables are created with initial data

### 1.2 Configure Database Permissions

1. Go to Authentication > Policies in your Supabase dashboard
2. By default, only authenticated users can modify data
3. For public access (development only):
   - Add a policy for each table with SQL condition `true`
   - Enable both read and write operations
4. For restricted access (recommended for production):
   - Set up user roles and appropriate policies
   - See the "Security Configuration" section below

### 1.3 Set Up API Keys

1. Go to Project Settings > API in your Supabase dashboard
2. Note your project URL and anon/public key for the React app
3. Keep your service key secure and never expose it in client code

## Step 2: Build React Application

### 2.1 Configure Environment Variables

Create a `.env.production` file with:

```
REACT_APP_SUPABASE_URL=your_production_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_production_anon_key
REACT_APP_USE_SUPABASE=true
```

### 2.2 Build the Application

```bash
npm run build
```

This creates a `build` directory with optimized production files.

## Step 3: Deploy to Hosting Provider

### 3.1 Deploying to Vercel

1. Install Vercel CLI: `npm i -g vercel`
2. Configure environment variables in Vercel dashboard
3. Deploy: `vercel --prod`

### 3.2 Deploying to Netlify

1. Install Netlify CLI: `npm i -g netlify-cli`
2. Configure environment variables in Netlify dashboard
3. Deploy: `netlify deploy --prod`

### 3.3 Deploying to GitHub Pages

1. Install gh-pages: `npm i -g gh-pages`
2. Add to package.json:
   ```json
   "homepage": "https://yourusername.github.io/campusschedpro",
   "scripts": {
     "predeploy": "npm run build",
     "deploy": "gh-pages -d build"
   }
   ```
3. Deploy: `npm run deploy`

## Step 4: Security Configuration

### 4.1 Authentication (Optional)

To add user authentication:

1. Configure authentication providers in Supabase dashboard
2. Add login/signup screens to your application
3. Update database policies for user-based access control

### 4.2 Row-Level Security

For multi-tenant usage:

```sql
-- Example policy for courses table
CREATE POLICY "Users can only access their organization's courses"
ON courses
FOR ALL
USING (organization_id = auth.jwt() -> 'organization_id');
```

### 4.3 API Security

1. Rate limiting (Supabase handles this automatically)
2. Consider implementing a server-side proxy for sensitive operations
3. Use environment variables for all sensitive information

## Step 5: Monitoring and Maintenance

### 5.1 Database Monitoring

1. Set up database monitoring in Supabase dashboard
2. Configure alerts for unusual activity
3. Regularly review performance metrics

### 5.2 Backups

1. Set up routine database backups
2. Test backup restoration process periodically
3. Consider point-in-time recovery options

### 5.3 Updates and Migrations

For database schema updates:

1. Develop migration scripts for schema changes
2. Test migrations in development environment
3. Schedule maintenance windows for production updates

## Troubleshooting

### Common Deployment Issues

1. **CORS Issues**
   - Ensure Supabase project has correct origins set in API settings

2. **Authentication Errors**
   - Check that environment variables are correctly set
   - Verify JWT expiration and refresh token settings

3. **Database Connection Issues**
   - Check network connectivity from hosting provider to Supabase
   - Verify IP allowlist settings if applicable

### Support Resources

1. [Supabase Documentation](https://supabase.io/docs)
2. [React Deployment Guide](https://create-react-app.dev/docs/deployment/)
3. CampusSchedPro support team

## Performance Optimization

### Caching

1. Implement localStorage caching for frequently accessed data
2. Set up CDN caching for static assets
3. Configure appropriate Supabase query caching settings

### Query Optimization

1. Use indexing for frequently queried columns
2. Limit returned columns in queries to essential data
3. Implement pagination for large datasets

## Scaling Considerations

As your CampusSchedPro deployment grows:

1. Consider upgrading your Supabase plan for more resources
2. Implement connection pooling for high-traffic applications
3. Set up read replicas for intensive reporting workloads
4. Consider database partitioning for multi-campus deployments

## Conclusion

Your CampusSchedPro application with Supabase integration should now be successfully deployed. Regular monitoring and maintenance will ensure its continued performance and reliability.
