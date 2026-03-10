#!/bin/bash

# MediRouteX - Start All Services
# This script starts all backend services and frontend

set -e

cd "/Users/aayus/Desktop/Medi temp plan"

echo "🚀 Starting MediRouteX Complete System..."
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check PostgreSQL and Redis
echo -e "${BLUE}📊 Checking infrastructure...${NC}"
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

echo -e "${GREEN}✅ PostgreSQL and Redis running${NC}"
echo ""

# Install dependencies for all Node services
echo -e "${BLUE}📦 Installing Node.js dependencies...${NC}"

services=("auth-service" "emergency-service" "ambulance-service" "hospital-service" "routing-service")

for service in "${services[@]}"; do
    service_path="backend/services/$service"
    if [ -d "$service_path" ]; then
        echo -e "${YELLOW}Installing $service...${NC}"
        cd "$service_path"
        npm install --silent 2>/dev/null || true
        cd "/Users/aayus/Desktop/Medi temp plan"
    fi
done

echo -e "${GREEN}✅ Dependencies installed${NC}"
echo ""

# Start services in background
echo -e "${BLUE}🎯 Starting backend services...${NC}"

# Create logs directory
mkdir -p logs

# Start Auth Service (Port 5004)
echo -e "${YELLOW}Starting Auth Service (Port 5004)...${NC}"
cd backend/services/auth-service
npm start > "../../../logs/auth-service.log" 2>&1 &
AUTH_PID=$!
echo $AUTH_PID > "../../../logs/auth-service.pid"
cd "/Users/aayus/Desktop/Medi temp plan"
sleep 2

# Start Emergency Service (Port 5001)
echo -e "${YELLOW}Starting Emergency Service (Port 5001)...${NC}"
cd backend/services/emergency-service
npm start > "../../../logs/emergency-service.log" 2>&1 &
EMERGENCY_PID=$!
echo $EMERGENCY_PID > "../../../logs/emergency-service.pid"
cd "/Users/aayus/Desktop/Medi temp plan"
sleep 2

# Start Ambulance Service (Port 5002)
echo -e "${YELLOW}Starting Ambulance Service (Port 5002)...${NC}"
cd backend/services/ambulance-service
npm start > "../../../logs/ambulance-service.log" 2>&1 &
AMBULANCE_PID=$!
echo $AMBULANCE_PID > "../../../logs/ambulance-service.pid"
cd "/Users/aayus/Desktop/Medi temp plan"
sleep 2

# Start Hospital Service (Port 5003)
echo -e "${YELLOW}Starting Hospital Service (Port 5003)...${NC}"
cd backend/services/hospital-service
npm start > "../../../logs/hospital-service.log" 2>&1 &
HOSPITAL_PID=$!
echo $HOSPITAL_PID > "../../../logs/hospital-service.pid"
cd "/Users/aayus/Desktop/Medi temp plan"
sleep 2

# Start Routing Service (Port 5005)
echo -e "${YELLOW}Starting Routing Service (Port 5005)...${NC}"
cd backend/services/routing-service
npm start > "../../../logs/routing-service.log" 2>&1 &
ROUTING_PID=$!
echo $ROUTING_PID > "../../../logs/routing-service.pid"
cd "/Users/aayus/Desktop/Medi temp plan"
sleep 2

# Start ML Service (Port 5006)
echo -e "${YELLOW}Starting ML Service (Port 5006)...${NC}"
cd backend/services/ml-service
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
fi
source venv/bin/activate
pip install -r requirements.txt --quiet 2>/dev/null || true
python app/main.py > "../../../logs/ml-service.log" 2>&1 &
ML_PID=$!
echo $ML_PID > "../../../logs/ml-service.pid"
deactivate
cd "/Users/aayus/Desktop/Medi temp plan"
sleep 3

echo -e "${GREEN}✅ All backend services started${NC}"
echo ""

# Check services health
echo -e "${BLUE}🏥 Checking service health...${NC}"
sleep 5

check_service() {
    local port=$1
    local name=$2
    if lsof -i :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "${GREEN}✅ $name (Port $port) - Running${NC}"
        return 0
    else
        echo -e "${RED}❌ $name (Port $port) - Not responding${NC}"
        return 1
    fi
}

check_service 5004 "Auth Service"
check_service 5001 "Emergency Service"
check_service 5002 "Ambulance Service"
check_service 5003 "Hospital Service"
check_service 5005 "Routing Service"
check_service 5006 "ML Service"

echo ""
echo -e "${BLUE}🌐 Starting Frontend (Port 3000)...${NC}"
cd "/Users/aayus/Desktop/Medi temp plan"
npm run dev > logs/frontend.log 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > logs/frontend.pid

sleep 3

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🎉 MediRouteX System is RUNNING!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}🌐 Frontend:${NC} http://localhost:3000"
echo ""
echo -e "${BLUE}🔧 Backend Services:${NC}"
echo "  • Auth Service:      http://localhost:5004"
echo "  • Emergency Service: http://localhost:5001"
echo "  • Ambulance Service: http://localhost:5002"
echo "  • Hospital Service:  http://localhost:5003"
echo "  • Routing Service:   http://localhost:5005"
echo "  • ML Service:        http://localhost:5006"
echo ""
echo -e "${BLUE}🔑 Login Credentials:${NC}"
echo "  Email:    admin@mediroutex.com"
echo "  Password: admin1234"
echo ""
echo -e "${BLUE}📊 Infrastructure:${NC}"
echo "  • PostgreSQL: localhost:5432 (database: mediroutex)"
echo "  • Redis:      localhost:6379"
echo ""
echo -e "${YELLOW}📝 Logs Location:${NC} logs/"
echo -e "${YELLOW}🛑 To stop all services:${NC} ./stop-all-services.sh"
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Keep script running and show logs
echo ""
echo -e "${BLUE}Tailing logs... (Press Ctrl+C to stop viewing)${NC}"
echo ""
tail -f logs/*.log
