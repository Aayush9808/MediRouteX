# 🚀 MediRouteX - Running Locally

## ✅ System Status

Your MediRouteX system is now running locally!

### Services Running:
- ✅ **PostgreSQL** - Port 5432 (Database: mediroutex)
- ✅ **Redis** - Port 6379
- ✅ **Frontend** - http://localhost:3000

### Database:
- ✅ Schema loaded
- ✅ Demo data inserted:
  - 1 admin user
  - 3 hospitals
  - 3 ambulances

---

## 🎯 Access the Application

### Open Your Browser
```
http://localhost:3000
```

### Login Credentials
```
Email: admin@mediroutex.com
Password: admin1234
```

---

## 📝 What's Available Right Now

### ✅ Working Features:
1. **Frontend UI** - Complete React dashboard
2. **Database** - PostgreSQL with demo data
3. **Mock Data** - Frontend displays mock emergencies, ambulances, hospitals
4. **Map View** - Interactive map with markers
5. **Dashboard** - Statistics and metrics

### ⚠️ Backend Services (Not Started)
The backend API services need to be started to enable:
- Real emergency reporting
- Live ambulance tracking
- Hospital bed updates
- Route calculation
- ML predictions

---

## 🔧 Starting Backend Services

### Option 1: Individual Services (for development)

Each service needs to be started in a separate terminal:

#### Terminal 1 - Emergency Service
```bash
cd backend/services/emergency-service
npm install
npm start
# Runs on http://localhost:5001
```

#### Terminal 2 - Ambulance Service
```bash
cd backend/services/ambulance-service
npm install
npm start
# Runs on http://localhost:5002
```

#### Terminal 3 - Hospital Service
```bash
cd backend/services/hospital-service
npm install
npm start
# Runs on http://localhost:5003
```

#### Terminal 4 - Auth Service
```bash
cd backend/services/auth-service
npm install
npm start
# Runs on http://localhost:5004
```

#### Terminal 5 - Routing Service
```bash
cd backend/services/routing-service
npm install
npm start
# Runs on http://localhost:5005
```

#### Terminal 6 - ML Service
```bash
cd backend/services/ml-service
/opt/homebrew/bin/python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python app/main.py
# Runs on http://localhost:5006
```

### Option 2: Docker Compose (recommended)

Install Docker Desktop, then:
```bash
docker-compose up -d
```

---

## 🧪 Testing the System

### Frontend Only (Current State)
- ✅ View dashboard with mock data
- ✅ Browse ambulances and hospitals
- ✅ See map with markers
- ✅ Navigate UI components

### With Backend Services Running
Once you start the backend services:
- ✅ **Login** with real authentication
- ✅ **Report Emergency** - Creates actual emergency in database
- ✅ **Live Tracking** - WebSocket updates for ambulances
- ✅ **Route Calculation** - Real-time route optimization
- ✅ **ML Predictions** - Demand forecasting and heatmaps

---

## 📊 Service Health Checks

Once backend services are running, check their health:

```bash
# Emergency Service
curl http://localhost:5001/health

# Ambulance Service
curl http://localhost:5002/health

# Hospital Service
curl http://localhost:5003/health

# Auth Service
curl http://localhost:5004/health

# Routing Service
curl http://localhost:5005/health

# ML Service
curl http://localhost:5006/health
```

All should return: `{"status": "healthy"}`

---

## 🛑 Stopping Services

### Stop Frontend
Press `Ctrl+C` in the terminal running `npm run dev`

### Stop Database Services
```bash
brew services stop postgresql@15
brew services stop redis
```

### Stop Backend Services
Press `Ctrl+C` in each terminal running a service

---

## 🔄 Restart Everything

Use the convenient startup script:
```bash
./start-local.sh
```

This will:
1. Start PostgreSQL and Redis
2. Check database schema
3. Start frontend on port 3000

---

## 📂 Project Structure

```
Medi temp plan/
├── backend/
│   ├── database/
│   │   └── schema-simple.sql  ✅ Loaded
│   └── services/
│       ├── emergency-service/  ⏳ Not started
│       ├── ambulance-service/  ⏳ Not started
│       ├── hospital-service/   ⏳ Not started
│       ├── auth-service/       ⏳ Not started
│       ├── routing-service/    ⏳ Not started
│       └── ml-service/         ⏳ Not started
├── src/                        ✅ Frontend running
│   ├── services/              ✅ API layer ready
│   ├── components/            ✅ UI components
│   └── contexts/              ✅ State management
└── start-local.sh             ✅ Startup script

```

---

## 💡 Development Tips

### Quick Restarts
- Frontend auto-reloads on file changes
- Backend services need manual restart (Ctrl+C, then restart)

### Database Management
```bash
# Access PostgreSQL
export PATH="/opt/homebrew/opt/postgresql@15/bin:$PATH"
psql -d mediroutex

# Common queries
SELECT * FROM users;
SELECT * FROM hospitals;
SELECT * FROM ambulances;
```

### Redis Management
```bash
# Access Redis CLI
redis-cli

# Check keys
KEYS *

# Clear all caches
FLUSHALL
```

---

## 🐛 Troubleshooting

### Frontend won't start
```bash
cd "/Users/aayus/Desktop/Medi temp plan"
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Database connection errors
```bash
# Restart PostgreSQL
brew services restart postgresql@15

# Check it's running
brew services list | grep postgresql
```

### Port already in use
```bash
# Find process using port 3000
lsof -i :3000

# Kill it
kill -9 <PID>
```

---

## 🎉 You're All Set!

Your MediRouteX system is running locally with:
- ✅ Frontend on http://localhost:3000
- ✅ PostgreSQL database with demo data
- ✅ Redis cache ready
- ⏳ Backend services ready to start

**Open http://localhost:3000 and start exploring!** 🚀

---

## 📞 Next Steps

1. **Test the frontend** - Browse the UI and explore features
2. **Start backend services** - Follow instructions above
3. **Test integration** - Login and create an emergency
4. **Check real-time features** - Watch ambulance tracking
5. **Test ML predictions** - View demand forecasts

---

Made with ❤️ for emergency response
