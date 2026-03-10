#!/bin/bash

# MediRouteX - Local Development Startup Script
# This script starts all services needed to run the system locally

set -e

echo "🚀 Starting MediRouteX Local Development Environment..."
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if PostgreSQL and Redis are running
echo -e "${BLUE}📊 Checking services...${NC}"

if ! brew services list | grep -q "postgresql@15.*started"; then
    echo -e "${YELLOW}Starting PostgreSQL...${NC}"
    brew services start postgresql@15
    sleep 3
fi

if ! brew services list | grep -q "redis.*started"; then
    echo -e "${YELLOW}Starting Redis...${NC}"
    brew services start redis
    sleep 2
fi

echo -e "${GREEN}✅ PostgreSQL and Redis are running${NC}"
echo ""

# Check database
echo -e "${BLUE}🗄️  Checking database...${NC}"
export PATH="/opt/homebrew/opt/postgresql@15/bin:$PATH"

if ! psql -lqt | cut -d \| -f 1 | grep -qw mediroutex; then
    echo -e "${YELLOW}Creating database...${NC}"
    createdb mediroutex
fi

# Load schema if needed
echo -e "${YELLOW}Loading database schema...${NC}"
psql -d mediroutex -f "backend/database/schema-simple.sql" > /dev/null 2>&1 || true

echo -e "${GREEN}✅ Database ready${NC}"
echo ""

# Display service status
echo -e "${BLUE}📋 Service Status:${NC}"
echo "  • PostgreSQL: http://localhost:5432 (database: mediroutex)"
echo "  • Redis: http://localhost:6379"
echo ""

echo -e "${BLUE}🎯 Starting Frontend...${NC}"
echo "  Frontend will be available at: ${GREEN}http://localhost:3000${NC}"
echo ""
echo -e "${YELLOW}💡 Login credentials:${NC}"
echo "  Email: admin@mediroutex.com"
echo "  Password: admin1234"
echo ""
echo -e "${YELLOW}⚠️  Note: Backend services need to be started separately${NC}"
echo "  You can start them individually or use Docker Compose"
echo ""
echo -e "${GREEN}✨ Starting development server...${NC}"
echo ""

# Start frontend
npm run dev
