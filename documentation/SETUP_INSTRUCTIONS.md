# MediRouteX Setup Instructions

## Prerequisites Installation

### 1. Install Docker Desktop (Required for Backend)
Download and install Docker Desktop for macOS from:
https://www.docker.com/products/docker-desktop

After installation:
```bash
docker --version
docker compose version
```

## Quick Start Guide

### Step 1: Start Database Services
```bash
cd "/Users/aayus/Desktop/Medi temp plan"
docker compose up -d postgres redis
```

Wait for services to be healthy (30-60 seconds):
```bash
docker compose ps
```

### Step 2: Initialize Database
```bash
# Connect to PostgreSQL container
docker exec -it mediroutex-postgres psql -U mediroutex -d mediroutex_db

# Run schema (copy-paste from backend/database/schema.sql)
# Or run it directly:
docker exec -i mediroutex-postgres psql -U mediroutex -d mediroutex_db < backend/database/schema.sql
```

### Step 3: Start Emergency Service
```bash
cd backend/services/emergency-service
npm run dev
```

The service will start on http://localhost:5001

### Step 4: Start Frontend (Already Running)
```bash
cd "/Users/aayus/Desktop/Medi temp plan"
npm run dev
```

Frontend runs on http://localhost:3000

## API Testing

### Health Check
```bash
curl http://localhost:5001/health
```

Expected response:
```json
{
  "success": true,
  "service": "emergency-service",
  "status": "healthy",
  "timestamp": "2026-03-03T...",
  "uptime": 123.45,
  "version": "v1"
}
```

### Create Emergency (Public Endpoint - No Auth Required)
```bash
curl -X POST http://localhost:5001/api/v1/emergency/create \
  -H "Content-Type: application/json" \
  -d '{
    "patientName": "John Doe",
    "patientAge": "45",
    "patientGender": "Male",
    "contactNumber": "+1234567890",
    "type": "Medical",
    "severity": "Critical",
    "description": "Chest pain, difficulty breathing",
    "location": {
      "address": "123 Main St, City",
      "lat": 40.7128,
      "lng": -74.0060
    }
  }'
```

### Get Active Emergencies (Requires Auth)
```bash
# First, you need a JWT token (will be available after User Service is built)
curl http://localhost:5001/api/v1/emergency/active \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Get Emergency Statistics
```bash
curl http://localhost:5001/api/v1/emergency/stats \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Environment Configuration

Create `.env` file in `backend/services/emergency-service/`:
```bash
cp backend/services/emergency-service/.env.example backend/services/emergency-service/.env
```

Edit `.env` with your settings:
```env
# Server
NODE_ENV=development
PORT=5001
API_VERSION=v1

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=mediroutex_db
DB_USER=mediroutex
DB_PASSWORD=mediroutex_password

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT (for when auth service is ready)
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# CORS
CORS_ORIGIN=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# Service URLs (will be configured as services are built)
AMBULANCE_SERVICE_URL=http://localhost:5002
HOSPITAL_SERVICE_URL=http://localhost:5003
USER_SERVICE_URL=http://localhost:5004
ROUTING_SERVICE_URL=http://localhost:5005
```

## Troubleshooting

### PostgreSQL Connection Issues
```bash
# Check if PostgreSQL is running
docker compose ps postgres

# Check logs
docker compose logs postgres

# Restart PostgreSQL
docker compose restart postgres
```

### Redis Connection Issues
```bash
# Check Redis status
docker compose ps redis

# Test Redis connection
docker exec -it mediroutex-redis redis-cli ping
# Should return: PONG
```

### Port Already in Use
```bash
# Find process using port 5001
lsof -i :5001

# Kill the process
kill -9 PID
```

### Database Schema Not Loaded
```bash
# Verify tables exist
docker exec -it mediroutex-postgres psql -U mediroutex -d mediroutex_db -c "\\dt"

# Reload schema if needed
docker exec -i mediroutex-postgres psql -U mediroutex -d mediroutex_db < backend/database/schema.sql
```

## Architecture Overview

### Completed Services ✅
1. **Emergency Service** (Port 5001)
   - Complete CRUD API for emergency management
   - Real-time WebSocket support (Socket.io)
   - Caching with Redis
   - Auto-assignment for critical cases
   - Geospatial queries for nearest resources

2. **Frontend** (Port 3000)
   - React 18 + TypeScript + Vite
   - Dark mode theme
   - Mobile responsive
   - Mock data (ready for API integration)

3. **Database Infrastructure**
   - PostgreSQL 15 with PostGIS
   - Complete schema with 12 tables
   - Spatial indexes and functions
   - Audit logging and triggers

### In Progress 🔨
- Integration between frontend and Emergency Service backend

### Pending Services ⏳
1. **Ambulance Service** (Port 5002)
   - Real-time GPS tracking
   - Status management
   - Assignment logic

2. **Hospital Service** (Port 5003)
   - Bed availability tracking
   - Capacity management
   - Real-time updates

3. **User/Auth Service** (Port 5004)
   - JWT authentication
   - User management
   - Role-based access control

4. **Routing Service** (Port 5005)
   - Optimal route calculation
   - Traffic integration
   - ETA prediction

5. **ML Prediction Service** (Port 5006)
   - Demand prediction
   - Response time optimization
   - Resource allocation

## Next Steps

### Week 1: Core Services (Current)
- [x] Emergency Service complete
- [ ] Install Docker and start database
- [ ] Test Emergency Service endpoints
- [ ] Start Ambulance Service development
- [ ] Start Hospital Service development

### Week 2: Authentication & Integration
- [ ] Build User/Auth Service
- [ ] Integrate JWT auth into all services
- [ ] Connect frontend to real APIs
- [ ] Remove mock data from frontend

### Week 3: Advanced Features
- [ ] Build Routing Service
- [ ] Implement ML Prediction Service
- [ ] WebSocket real-time updates
- [ ] Traffic data integration

### Week 4: Testing & MVP
- [ ] End-to-end testing
- [ ] Load testing
- [ ] Security audit
- [ ] Performance optimization
- [ ] MVP deployment to AWS

## Project Structure

```
Medi temp plan/
├── frontend/ (React app - COMPLETED)
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   └── data/
│   └── package.json
├── backend/
│   ├── database/
│   │   └── schema.sql (COMPLETED)
│   └── services/
│       ├── emergency-service/ (COMPLETED ✅)
│       │   ├── src/
│       │   │   ├── controllers/
│       │   │   ├── routes/
│       │   │   ├── middleware/
│       │   │   ├── models/
│       │   │   ├── config/
│       │   │   └── utils/
│       │   ├── package.json
│       │   └── Dockerfile
│       ├── ambulance-service/ (TODO)
│       ├── hospital-service/ (TODO)
│       ├── user-service/ (TODO)
│       ├── routing-service/ (TODO)
│       └── ml-service/ (TODO)
├── docker-compose.yml
└── docs/
```

## Key Features Implemented

### Emergency Service API
- ✅ POST `/api/v1/emergency/create` - Create emergency
- ✅ GET `/api/v1/emergency/:id` - Get emergency details
- ✅ GET `/api/v1/emergency/active` - List active emergencies
- ✅ GET `/api/v1/emergency/stats` - Get statistics
- ✅ GET `/api/v1/emergency` - List with pagination/filters
- ✅ PUT `/api/v1/emergency/:id/status` - Update status
- ✅ PUT `/api/v1/emergency/:id/assign-ambulance` - Assign ambulance
- ✅ PUT `/api/v1/emergency/:id/assign-hospital` - Assign hospital
- ✅ DELETE `/api/v1/emergency/:id` - Cancel emergency

### Database Features
- ✅ PostGIS spatial functions
- ✅ Automatic emergency number generation (E-2024-XXXX)
- ✅ Priority scoring algorithm
- ✅ Response time tracking
- ✅ Audit logging
- ✅ Geospatial queries for nearest resources

### Infrastructure
- ✅ TypeScript strict mode
- ✅ Error handling middleware
- ✅ Request logging with Winston
- ✅ Input validation with Zod
- ✅ Redis caching
- ✅ Rate limiting
- ✅ CORS configuration
- ✅ Security headers (Helmet)
- ✅ WebSocket support (Socket.io)

## Development Workflow

### Adding New Features
1. Create feature branch
2. Update models if needed
3. Add validation schemas
4. Implement controller logic
5. Add routes
6. Write tests
7. Update documentation

### Code Quality
```bash
# Lint code
npm run lint

# Format code
npm run format

# Run tests
npm run test

# Check coverage
npm run test:coverage
```

## Support & Documentation

- Technical Documentation: See `docs/PROJECT_ROADMAP.md`
- API Reference: See `docs/API_DOCUMENTATION.md` (to be created)
- Architecture: See `README.md`
- Implementation Status: See `docs/IMPLEMENTATION_STATUS.md`

## Important Notes

⚠️ **CRITICAL: Life-Critical System**
- This is a healthcare emergency management system
- 99.99% uptime requirement
- <3 second response time target
- HIPAA compliance required
- Zero tolerance for data loss
- Comprehensive error handling mandatory

⚠️ **Security Requirements**
- All endpoints (except `/create`) require JWT authentication
- Role-based access control (RBAC)
- Input validation on all endpoints
- SQL injection protection (parameterized queries)
- XSS protection (sanitized outputs)
- Rate limiting to prevent abuse

⚠️ **Data Privacy**
- HIPAA compliance for patient data
- Encrypted data at rest and in transit
- Audit logs for all data access
- Data retention policies
- Secure data deletion procedures

## Contact

For issues or questions:
- Check documentation in `docs/` folder
- Review `PROJECT_ROADMAP.md` for detailed implementation plan
- Check `IMPLEMENTATION_STATUS.md` for current progress
