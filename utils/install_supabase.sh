#!/bin/bash

# Colors for terminal output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print header
echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}= CampusSchedPro Supabase Setup =${NC}"
echo -e "${BLUE}================================${NC}"

# Check if we're in the right directory
if [ ! -f "./package.json" ]; then
  echo -e "${RED}Error: package.json not found${NC}"
  echo -e "${YELLOW}Please run this script from your project's root directory${NC}"
  exit 1
fi

# Check for required commands
command -v node >/dev/null 2>&1 || { 
  echo -e "${RED}Error: Node.js is required but not installed${NC}"
  exit 1
}

command -v npm >/dev/null 2>&1 || { 
  echo -e "${RED}Error: npm is required but not installed${NC}"
  exit 1
}

# Install required dependencies
echo -e "\n${GREEN}Installing Supabase dependencies...${NC}"
npm install --save @supabase/supabase-js dotenv

# Create directories if they don't exist
echo -e "\n${GREEN}Creating directories...${NC}"
mkdir -p src/utils
mkdir -p sql
mkdir -p docs

# Copy files to appropriate locations
echo -e "\n${GREEN}Copying Supabase integration files...${NC}"

# Copy client utilities
if [ -f "./utils/supabaseClient.js" ]; then
  cp ./utils/supabaseClient.js ./src/utils/
  echo -e "${GREEN}✓${NC} Copied supabaseClient.js to src/utils/"
else
  echo -e "${YELLOW}⚠ Warning: supabaseClient.js not found${NC}"
fi

# Copy Supabase context
if [ -f "./utils/SupabaseScheduleContext.js" ]; then
  cp ./utils/SupabaseScheduleContext.js ./src/utils/
  echo -e "${GREEN}✓${NC} Copied SupabaseScheduleContext.js to src/utils/"
else
  echo -e "${YELLOW}⚠ Warning: SupabaseScheduleContext.js not found${NC}"
fi

# Copy SQL scripts
if [ -f "./utils/supabase_schema.sql" ]; then
  cp ./utils/supabase_schema.sql ./sql/schema.sql
  echo -e "${GREEN}✓${NC} Copied schema SQL to sql/schema.sql"
else
  echo -e "${YELLOW}⚠ Warning: supabase_schema.sql not found${NC}"
fi

if [ -f "./utils/supabase_default_data.sql" ]; then
  cp ./utils/supabase_default_data.sql ./sql/default_data.sql
  echo -e "${GREEN}✓${NC} Copied default data SQL to sql/default_data.sql"
else
  echo -e "${YELLOW}⚠ Warning: supabase_default_data.sql not found${NC}"
fi

# Copy migration utility
if [ -f "./utils/migrateLocalStorageToSupabase.js" ]; then
  cp ./utils/migrateLocalStorageToSupabase.js ./src/utils/
  echo -e "${GREEN}✓${NC} Copied migration utility to src/utils/"
else
  echo -e "${YELLOW}⚠ Warning: migrateLocalStorageToSupabase.js not found${NC}"
fi

# Copy test connection script
if [ -f "./utils/testSupabaseConnection.js" ]; then
  cp ./utils/testSupabaseConnection.js ./
  echo -e "${GREEN}✓${NC} Copied connection test script to project root"
else
  echo -e "${YELLOW}⚠ Warning: testSupabaseConnection.js not found${NC}"
fi

# Copy documentation
if [ -f "./utils/INSTALLATION_GUIDE.md" ]; then
  cp ./utils/INSTALLATION_GUIDE.md ./docs/
  echo -e "${GREEN}✓${NC} Copied installation guide to docs/"
else
  echo -e "${YELLOW}⚠ Warning: INSTALLATION_GUIDE.md not found${NC}"
fi

if [ -f "./utils/supabase_integration_guide.md" ]; then
  cp ./utils/supabase_integration_guide.md ./docs/
  echo -e "${GREEN}✓${NC} Copied integration guide to docs/"
else
  echo -e "${YELLOW}⚠ Warning: supabase_integration_guide.md not found${NC}"
fi

if [ -f "./utils/component_migration_guide.md" ]; then
  cp ./utils/component_migration_guide.md ./docs/
  echo -e "${GREEN}✓${NC} Copied component migration guide to docs/"
else
  echo -e "${YELLOW}⚠ Warning: component_migration_guide.md not found${NC}"
fi

# Create .env file if it doesn't exist
if [ ! -f "./.env" ]; then
  echo -e "\n${GREEN}Creating .env file...${NC}"
  cat > ./.env << EOL
# Supabase Configuration
REACT_APP_SUPABASE_URL=https://your-project-id.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key-goes-here

# Feature Flag - Set to 'true' to use Supabase, 'false' to use localStorage
REACT_APP_USE_SUPABASE=false
EOL
  echo -e "${GREEN}✓${NC} Created .env file (please update with your Supabase credentials)"
else
  echo -e "\n${YELLOW}⚠ .env file already exists${NC}"
  echo -e "${YELLOW}Please ensure it contains the following variables:${NC}"
  echo -e "  REACT_APP_SUPABASE_URL"
  echo -e "  REACT_APP_SUPABASE_ANON_KEY"
  echo -e "  REACT_APP_USE_SUPABASE"
fi

# Success message
echo -e "\n${GREEN}=== Supabase integration files installed successfully ===${NC}"
echo -e "\n${BLUE}Next steps:${NC}"
echo -e "1. Create a Supabase project at https://supabase.com"
echo -e "2. Update the .env file with your Supabase credentials"
echo -e "3. Run the SQL scripts in the Supabase SQL Editor"
echo -e "4. Test your connection with: node -r dotenv/config testSupabaseConnection.js"
echo -e "5. Follow the integration guide in docs/supabase_integration_guide.md"
echo -e "\n${BLUE}For more information, see:${NC}"
echo -e "docs/INSTALLATION_GUIDE.md"
echo -e "docs/component_migration_guide.md"
echo -e "\n${GREEN}Happy coding!${NC}"
