#!/bin/bash

# MediRouteX - Stop All Services

cd "/Users/aayus/Desktop/Medi temp plan"

echo "🛑 Stopping MediRouteX Services..."

# Kill services by PID files
if [ -f "logs/auth-service.pid" ]; then
    kill $(cat logs/auth-service.pid) 2>/dev/null || true
    rm logs/auth-service.pid
    echo "✅ Stopped Auth Service"
fi

if [ -f "logs/emergency-service.pid" ]; then
    kill $(cat logs/emergency-service.pid) 2>/dev/null || true
    rm logs/emergency-service.pid
    echo "✅ Stopped Emergency Service"
fi

if [ -f "logs/ambulance-service.pid" ]; then
    kill $(cat logs/ambulance-service.pid) 2>/dev/null || true
    rm logs/ambulance-service.pid
    echo "✅ Stopped Ambulance Service"
fi

if [ -f "logs/hospital-service.pid" ]; then
    kill $(cat logs/hospital-service.pid) 2>/dev/null || true
    rm logs/hospital-service.pid
    echo "✅ Stopped Hospital Service"
fi

if [ -f "logs/routing-service.pid" ]; then
    kill $(cat logs/routing-service.pid) 2>/dev/null || true
    rm logs/routing-service.pid
    echo "✅ Stopped Routing Service"
fi

if [ -f "logs/ml-service.pid" ]; then
    kill $(cat logs/ml-service.pid) 2>/dev/null || true
    rm logs/ml-service.pid
    echo "✅ Stopped ML Service"
fi

if [ -f "logs/frontend.pid" ]; then
    kill $(cat logs/frontend.pid) 2>/dev/null || true
    rm logs/frontend.pid
    echo "✅ Stopped Frontend"
fi

# Kill by port as backup
lsof -ti:5001 | xargs kill -9 2>/dev/null || true
lsof -ti:5002 | xargs kill -9 2>/dev/null || true
lsof -ti:5003 | xargs kill -9 2>/dev/null || true
lsof -ti:5004 | xargs kill -9 2>/dev/null || true
lsof -ti:5005 | xargs kill -9 2>/dev/null || true
lsof -ti:5006 | xargs kill -9 2>/dev/null || true
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

echo ""
echo "✅ All services stopped"
