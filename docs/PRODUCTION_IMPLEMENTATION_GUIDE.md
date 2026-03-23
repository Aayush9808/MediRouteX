# MediRouteX Production Implementation Guide

This guide documents the current industry-ready implementation path for MediRouteX and can be used as the engineering handover for production rollout.

## 1) System Scope (End-to-End)

MediRouteX coordinates emergency response across:
- Patients
- Normal users (citizens)
- Ambulance drivers
- Hospitals
- Blood banks
- Admin/dispatchers

Core workflows implemented:
1. Emergency creation -> nearest ambulance assignment -> route + ETA -> hospital coordination
2. Hospital bed visibility and updates
3. Blood emergency alert broadcast and response workflow
4. Role-based login and role-specific dashboard experience
5. Real-time status updates and map visualization

---

## 2) Target Architecture

### Frontend
- React 18 + TypeScript + Vite
- Tailwind-based UI
- Leaflet map for geospatial visualization
- Context-based state management for `Auth`, `Emergency`, and `Blood`

### Backend (Microservices)
- Node.js + Express services:
  - `emergency-service` (5001)
  - `ambulance-service` (5002)
  - `hospital-service` (5003)
  - `auth-service` (5004)
  - `routing-service` (5005)
  - `user-service` (available in repo)
- Python FastAPI ML service (`ml-service`, 5006/8000 depending environment)

### Data Layer
- PostgreSQL (source of truth)
- Redis (cache, pub/sub, fast transient state)

### Infrastructure
- Docker Compose (dev and prod stacks available)
- Vercel deployment for frontend
- API services containerizable for cloud VM/Kubernetes deployment

---

## 3) Current Folder Structure

```text
Medi temp plan/
├── src/
│   ├── components/
│   │   ├── PatientDashboard.tsx
│   │   ├── NormalUserDashboard.tsx
│   │   ├── DriverDashboard.tsx
│   │   ├── HospitalDashboard.tsx
│   │   ├── BloodBankDashboard.tsx
│   │   ├── RealMapView.tsx
│   │   ├── BloodBankPanel.tsx
│   │   └── EmergencyModal.tsx
│   ├── contexts/
│   │   ├── AuthContext.tsx
│   │   └── BloodContext.tsx
│   ├── context/
│   │   └── EmergencyContext.tsx
│   ├── services/
│   │   └── authService.ts
│   └── App.tsx
├── backend/
│   ├── database/
│   │   ├── schema.sql
│   │   └── schema-simple.sql
│   └── services/
│       ├── auth-service/
│       ├── emergency-service/
│       ├── ambulance-service/
│       ├── hospital-service/
│       ├── routing-service/
│       ├── ml-service/
│       └── user-service/
├── config/
│   ├── docker-compose.yml
│   └── docker-compose.prod.yml
└── docs/
    └── PRODUCTION_IMPLEMENTATION_GUIDE.md
```

---

## 4) Database Design (PostgreSQL)

Primary schema: `backend/database/schema-simple.sql`

### Core Tables
1. `users`
   - Identity, role, status, auth details
2. `emergencies`
   - Emergency metadata, geo location, severity, assignment
3. `ambulances`
   - Vehicle status, driver mapping, location, equipment
4. `hospitals`
   - Hospital profile, geo location, specialization, capacity
5. `routes`
   - Calculated route snapshots and ETA context
6. `blood_inventory`
   - Blood stock per hospital per blood type
7. `blood_emergency_alerts`
   - Active/finalized blood emergency events
8. `blood_alert_responses`
   - Responding hospital offers and ETA

### Indexing
- Role/email indexes on `users`
- Status/severity indexes on `emergencies`
- Status/type indexes on `ambulances`
- Status and relation indexes for blood alert flows

---

## 5) API Surface (Current)

### Auth Service (`/auth`)
- `POST /register`
- `POST /login`
- `POST /refresh`
- `POST /password-reset/request`
- `POST /password-reset/verify`
- `GET /me`
- `PATCH /me`
- `POST /logout`
- `POST /logout-all`
- Admin endpoints: `GET /users`, `GET /stats`, `GET/PUT/DELETE /users/:id`

### Emergency Service (`/api/v1/emergency`)
- `POST /create`
- `GET /active`
- `GET /stats`
- `GET /:id`
- `GET /`
- `PUT /:id/status`
- `PUT /:id/assign-ambulance`
- `PUT /:id/assign-hospital`
- `DELETE /:id`

### Ambulance Service (`/api/v1/ambulance`)
- `POST /create`
- `GET /available`
- `GET /nearby`
- `GET /stats`
- `GET /:id`
- `GET /`
- `PUT /:id/status`
- `PUT /:id/location`
- `PUT /:id/assign-driver`
- `DELETE /:id/driver`
- `DELETE /:id`

### Hospital Service (`/api/v1/hospitals`)
- `GET /nearby`
- `POST /`
- `GET /`
- `GET /stats/overview`
- `GET /:id`
- `PUT /:id`
- `DELETE /:id`
- Bed APIs: `POST /:id/beds`, `GET /:id/beds`, `PATCH /:id/beds/:bedType`
- Capacity stats: `GET /:id/stats/capacity`

### Routing Service (`/api/v1/routes`)
- `POST /calculate`
- `POST /optimize`
- `POST /alternatives`
- `POST /eta`
- `GET /:id`
- `GET /traffic`
- `POST /traffic`
- `GET /distance`
- `GET /stats`

---

## 6) Role-Based UX Mapping

Implemented role mappings in frontend app shell:
- `admin` -> full operations dashboard
- `patient` -> PatientDashboard
- `user` -> NormalUserDashboard
- `driver` -> DriverDashboard
- `hospital` -> HospitalDashboard
- `blood_bank` -> BloodBankDashboard

Demo role credentials (mock fallback) are implemented in `src/services/authService.ts`.

---

## 7) Security & Validation Controls

Current controls in services:
- JWT authentication middleware
- Role-based route guards (`authenticate(...)`, `authMiddleware(...)`)
- Request validation middleware and schemas
- Standardized error middleware
- Rate limiting and secure headers in service bootstrap

Production hardening checklist:
- Rotate JWT secrets and use vault/secret manager
- Enforce TLS end-to-end
- Add audit logging for privileged actions
- Add refresh token revocation store and device session list
- Add WAF/IP throttling in API gateway

---

## 8) Deployment Guide

### A) Frontend (already deployed)
- Build: `npm run build`
- Deploy: `npx vercel --prod --yes`
- Current production domain: `https://mediroutex.vercel.app`

### B) Full Stack via Docker Compose (recommended)
1. Prepare `.env` with DB/Redis/JWT secrets
2. Run:
   - Dev stack: `docker compose -f config/docker-compose.yml up --build`
   - Prod-like stack: `docker compose -f config/docker-compose.prod.yml up -d --build`
3. Verify health endpoints for each microservice
4. Point frontend env (`VITE_*_SERVICE_URL`) to deployed API gateway domain

### C) Cloud Production Layout
- Frontend: Vercel/CloudFront
- API services: ECS/Kubernetes/VM containers
- PostgreSQL: managed DB (RDS/Cloud SQL)
- Redis: managed Redis (Elasticache/MemoryStore)
- Observability: Grafana + Prometheus + centralized logs

---

## 9) Production Readiness Backlog (Next Engineering Sprints)

Sprint 1:
- API gateway + unified service discovery
- Full RBAC policy matrix with permissions table
- End-to-end integration tests for emergency lifecycle

Sprint 2:
- Background job queue for alerts/notifications
- Retry and circuit-breaker patterns for inter-service calls
- API versioning and OpenAPI docs generation

Sprint 3:
- SSO/OAuth2 + MFA for hospital/admin users
- Incident analytics and SLA dashboards
- Chaos/performance testing and load profile tuning

---

## 10) Definition of Done for Industry Deployment

A release is considered production-ready when:
- All critical workflows pass E2E automation
- Service uptime/error budgets are monitored
- Disaster recovery backup/restore validated
- Security checks (SAST/DAST/dependency scan) pass
- Blue/green or canary rollout plan is documented
- Runbooks and on-call escalation paths are available

This repository already contains the foundations to ship a working platform; this guide documents the complete path to convert the current build into a robust industry-grade deployment.
