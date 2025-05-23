#!/bin/bash

# Installation script for Supabase dependencies
# This script installs the required dependencies for the Supabase integration

# Text formatting
BLUE='\033[0;34m'
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== CampusSchedPro Supabase Integration Setup ===${NC}"
echo -e "${BLUE}This script will install the necessary dependencies for Supabase integration.${NC}"

# Check if we're in the right directory
if [ ! -f "supabase_schema.sql" ] || [ ! -f "supabase_default_data.sql" ]; then
  echo -e "${RED}Error: This script must be run from the utils directory.${NC}"
  echo -e "Please change to the utils directory and try again."
  exit 1
fi

echo -e "\n${BLUE}[1/4]${NC} Installing Supabase utilities dependencies..."
npm install || {
  echo -e "${RED}Failed to install dependencies in utils directory.${NC}"
  exit 1
}
echo -e "${GREEN}Utils dependencies installed successfully.${NC}"

echo -e "\n${BLUE}[2/4]${NC} Installing Supabase in the main application..."
cd ../main_container_for_campus_sched_pro || {
  echo -e "${RED}Error: Could not find main_container_for_campus_sched_pro directory.${NC}"
  exit 1
}

echo -e "\n${BLUE}Installing @supabase/supabase-js...${NC}"
npm install @supabase/supabase-js || {
  echo -e "${RED}Failed to install Supabase in main application.${NC}"
  exit 1
}
echo -e "${GREEN}Supabase installed successfully in main application.${NC}"

echo -e "\n${BLUE}[3/4]${NC} Setting up environment variables..."
if [ ! -f ".env" ]; then
  echo -e "${YELLOW}Creating sample .env file...${NC}"
  cat > .env << EOF
# Supabase Configuration
REACT_APP_SUPABASE_URL=your-supabase-project-url
REACT_APP_SUPABASE_ANON_KEY=your-supabase-anon-key

# For admin operations (optional)
# SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
EOF
  echo -e "${GREEN}.env file created.${NC}"
  echo -e "${YELLOW}Please edit the .env file with your Supabase credentials.${NC}"
else
  echo -e "${YELLOW}.env file already exists. Please make sure it contains Supabase credentials.${NC}"
fi

echo -e "\n${BLUE}[4/4]${NC} Creating Supabase utils directory..."
mkdir -p src/utils/supabase || true

echo -e "${BLUE}Copying Supabase client to application...${NC}"
cp ../utils/supabaseClient.js src/utils/supabase/ || {
  echo -e "${RED}Failed to copy supabaseClient.js${NC}"
}

echo -e "\n${GREEN}=== Installation Complete! ===${NC}"
echo -e "Next steps:"
echo -e "1. Edit ${YELLOW}.env${NC} with your Supabase credentials"
echo -e "2. Run ${YELLOW}cd ../utils && npm run initialize${NC} to set up your Supabase database"
echo -e "3. Run ${YELLOW}cd ../utils && npm run verify${NC} to test the connection"
echo -e "4. Integrate Supabase context into your application"
echo -e "\nSee ${YELLOW}../utils/SUPABASE_INSTALLATION_GUIDE.md${NC} for detailed instructions."

cd ../utils
