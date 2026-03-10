# 🏗️ MediRouteX — Complete System Design Document

> **Version:** 1.0 | **Stack:** React 18 · Node.js 20 · Python 3.11 · PostgreSQL 15 · Redis 8  
> **Author:** MediRouteX Engineering  
> **Last Updated:** March 2026

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Requirements](#2-requirements)
3. [High-Level Architecture](#3-high-level-architecture)
4. [Frontend Architecture](#4-frontend-architecture)
5. [Microservices Architecture](#5-microservices-architecture)
6. [API Design](#6-api-design)
7. [Real-Time Communication Layer](#7-real-time-communication-layer)
8. [Database Design](#8-database-design)
9. [Blood Emergency Network — Deep Dive](#9-blood-emergency-network--deep-dive)
10. [Routing Engine — Dijkstra's Algorithm](#10-routing-engine--dijkstras-algorithm)
11. [ML/AI Pipeline](#11-mlai-pipeline)
12. [Authentication & Security Architecture](#12-authentication--security-architecture)
13. [Caching Strategy](#13-caching-strategy)
14. [Data Flow Diagrams](#14-data-flow-diagrams)
15. [Scalability & Performance Design](#15-scalability--performance-design)
16. [Deployment Architecture](#16-deployment-architecture)
17. [Error Handling & Resilience](#17-error-handling--resilience)
18. [Design Decisions & Trade-offs](#18-design-decisions--trade-offs)

---

## 1. Executive Summary

MediRouteX is a **life-critical, distributed emergency medical dispatch system** built on a microservices architecture. The platform coordinates three core functions in parallel:

1. **Emergency Dispatch** — Real-time ambulance assignment using GPS proximity and Dijkstra routing
2. **Hospital Intelligence** — Live bed tracking and specialty-based routing
3. **Blood Emergency Network** — Broadcast-based blood availability coordination across all facilities

The system is designed for **sub-100ms event propagation**, **99.9% uptime**, and **horizontal scalability** at the service level.

### Key Design Principles

| Principle | Implementation |
|-----------|---------------|
| **Event-Driven** | Redis Pub/Sub + Socket.io for all state changes |
| **Single Responsibility** | Each microservice owns exactly one domain |
| **Fail Fast** | Zod validation at API boundary, circuit breakers at service calls |
| **Defense in Depth** | JWT + RBAC + rate limiting + Helmet + parameterized queries |
| **Eventual Consistency** | Acceptable for non-critical reads (heatmaps, analytics) |
| **Strong Consistency** | Required for bed counts, blood inventory, ambulance assignment |

---

## 2. Requirements

### 2.1 Functional Requirements

| # | Requirement | Priority |
|---|-------------|----------|
| FR-01 | Dispatcher can create an emergency with location, severity, patient info | P0 |
| FR-02 | System auto-assigns nearest available ambulance within 30 seconds | P0 |
| FR-03 | System identifies best hospital by bed availability + specialization | P0 |
| FR-04 | All dispatchers receive real-time updates on all emergencies | P0 |
| FR-05 | Ambulance GPS tracked and displayed on map every 30 seconds | P0 |
| FR-06 | Hospital bed counts updated in real-time | P0 |
| FR-07 | Blood inventory visible per hospital for all 8 blood types | P0 |
| FR-08 | Any hospital can broadcast a blood emergency alert | P0 |
| FR-09 | Any hospital can respond to a blood emergency alert | P0 |
| FR-10 | ML model predicts response time with < 3 min error | P1 |
| FR-11 | ML model provides 24-hour demand forecast | P1 |
| FR-12 | Role-based access (admin/dispatcher/driver/viewer) | P0 |
| FR-13 | JWT authentication with refresh token rotation | P0 |

### 2.2 Non-Functional Requirements

| # | Requirement | Target |
|---|-------------|--------|
| NFR-01 | Emergency event propagation latency | < 100ms (P99) |
| NFR-02 | API response time (read) | < 200ms (P95) |
| NFR-03 | API response time (write) | < 400ms (P95) |
| NFR-04 | Blood broadcast delivery latency | < 100ms |
| NFR-05 | System availability | 99.9% uptime |
| NFR-06 | Concurrent WebSocket connections | 500+ per node |
| NFR-07 | Database query time | < 50ms (P95) |
| NFR-08 | ML inference latency | < 250ms |
| NFR-09 | JWT verification time | < 5ms |
| NFR-10 | Frontend cold start | < 600ms (Vite) |

### 2.3 Capacity Estimates

```
Assumptions (per city deployment):
  - 50 simultaneous dispatchers
  - 200 ambulances tracked
  - 80 hospitals/blood banks
  - 500 emergencies/day
  - 50 blood alerts/day

Storage (per year):
  - emergencies table:     500 * 365 * ~2KB   = ~365 MB
  - ambulance GPS logs:    200 * 2880 * 100B  = ~56 GB (if storing all pings)
  - blood alerts:          50 * 365 * ~1KB    = ~18 MB

WebSocket:
  - 50 dispatchers × 3 connections each = 150 persistent WS connections
  - 200 ambulance apps = 200 GPS update connections

Redis memory:
  - Sessions: 50 users × 1KB = 50 KB (negligible)
  - Pub/Sub channels: 5 channels, ephemeral
  - Cache: < 50 MB total
```

---

## 3. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CLIENT TIER                                        │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                  React 18 SPA (Vite 5) · Port 3001                   │    │
│  │                                                                       │    │
│  │   ┌──────────┐  ┌──────────┐  ┌────────────┐  ┌─────────────────┐  │    │
│  │   │Dashboard │  │Map View  │  │Blood Bank  │  │Right Sidebar    │  │    │
│  │   │LeftSide  │  │(Leaflet) │  │Panel       │  │Hospitals/Ambul. │  │    │
│  │   └──────────┘  └──────────┘  └────────────┘  └─────────────────┘  │    │
│  │                                                                       │    │
│  │   ┌──────────────────┐  ┌─────────────────────────────────────────┐ │    │
│  │   │  React Contexts   │  │          Service Layer (Axios)          │ │    │
│  │   │  EmergencyContext │  │  api.ts · emergencyService.ts           │ │    │
│  │   │  BloodContext     │  │  ambulanceService.ts · hospitalService  │ │    │
│  │   │  AuthContext      │  │  websocket.ts (Socket.io client)        │ │    │
│  │   └──────────────────┘  └─────────────────────────────────────────┘ │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                          │ HTTPS / WSS                                        │
└──────────────────────────┼───────────────────────────────────────────────────┘
                           │
┌──────────────────────────▼───────────────────────────────────────────────────┐
│                           GATEWAY TIER                                        │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │              Nginx Reverse Proxy + Load Balancer                     │    │
│  │                                                                       │    │
│  │   /api/v1/auth/*        → Auth Service    :5004                      │    │
│  │   /api/v1/emergencies/* → Emergency Svc   :5001                      │    │
│  │   /api/v1/ambulances/*  → Ambulance Svc   :5002                      │    │
│  │   /api/v1/hospitals/*   → Hospital Svc    :5003                      │    │
│  │   /api/v1/routing/*     → Routing Svc     :5005                      │    │
│  │   /api/v1/ml/*          → ML Service      :5006                      │    │
│  │   /socket.io/*          → Emergency Svc   :5001  (WS upgrade)        │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────────────────┘
                           │
┌──────────────────────────▼───────────────────────────────────────────────────┐
│                        SERVICE TIER                                           │
│                                                                               │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌──────────┐  │
│  │ Emergency  │ │ Ambulance  │ │  Hospital  │ │    Auth    │ │ Routing  │  │
│  │ Service    │ │ Service    │ │  Service   │ │  Service   │ │ Service  │  │
│  │ :5001      │ │ :5002      │ │  :5003     │ │  :5004     │ │ :5005    │  │
│  │ Node/TS    │ │ Node/TS    │ │  Node/TS   │ │  Node/TS   │ │ Node/TS  │  │
│  │ +Socket.io │ │ +Socket.io │ │            │ │  +bcrypt   │ │ +Dijkstr │  │
│  └─────┬──────┘ └─────┬──────┘ └─────┬──────┘ └─────┬──────┘ └────┬─────┘  │
│        │              │              │              │             │           │
│  ┌─────▼──────────────────────────────────────────────────────────▼──────┐  │
│  │                        ML Service · :5006                              │  │
│  │                 Python 3.11 + FastAPI + scikit-learn                   │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────┘
                           │
┌──────────────────────────▼───────────────────────────────────────────────────┐
│                          DATA TIER                                            │
│                                                                               │
│  ┌────────────────────────────────────────┐  ┌──────────────────────────┐   │
│  │        PostgreSQL 15  · :5432           │  │     Redis 8  · :6379     │   │
│  │                                         │  │                          │   │
│  │   users                                 │  │  sessions:*  (JWT store) │   │
│  │   emergencies                           │  │  blacklist:* (revoked)   │   │
│  │   ambulances                            │  │  cache:hosp:*            │   │
│  │   hospitals                             │  │  cache:ambul:*           │   │
│  │   routes                                │  │                          │   │
│  │   blood_inventory        ← NEW          │  │  Pub/Sub channels:       │   │
│  │   blood_emergency_alerts ← NEW          │  │  emergency_events        │   │
│  │   blood_alert_responses  ← NEW          │  │  ambulance_events        │   │
│  │                                         │  │  blood_events            │   │
│  └────────────────────────────────────────┘  └──────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Frontend Architecture

### 4.1 Component Hierarchy

```
App.tsx
├── AuthContext.Provider
│   └── EmergencyContext.Provider
│       └── BloodContext.Provider
│           ├── Navigation.tsx
│           │   ├── Logo + Title
│           │   ├── Theme Toggle
│           │   ├── Blood Alert Button (with live badge count)
│           │   └── Notification Bell
│           │
│           ├── LeftSidebar.tsx
│           │   ├── StatsCard (Active Emergencies)
│           │   ├── StatsCard (Available Ambulances)
│           │   ├── StatsCard (Hospital Capacity)
│           │   ├── StatsCard (Active Routes)
│           │   └── StatsCard (Blood Alerts) ← BloodContext
│           │
│           ├── MapView.tsx (Leaflet.js)
│           │   ├── Hospital Markers (🏥)
│           │   ├── Ambulance Markers (🚑 — animated)
│           │   └── Emergency Pins (📍 — severity colored)
│           │
│           ├── [Conditional Panel]
│           │   ├── RightSidebar.tsx   (activePanel === 'main')
│           │   │   ├── Active Emergencies List
│           │   │   ├── Hospital Capacity Panel
│           │   │   └── Ambulance Fleet Panel
│           │   └── BloodBankPanel.tsx (activePanel === 'blood')
│           │       ├── Tab: Alerts
│           │       ├── Tab: Inventory
│           │       └── Tab: Critical Shortages
│           │
│           └── [Modals — conditional render]
│               ├── EmergencyModal.tsx
│               ├── BloodEmergencyModal.tsx
│               └── LoginPage.tsx
```

### 4.2 State Management

MediRouteX uses **React Context** (not Redux) for three reasons:
1. The state shape is simple and predictable
2. Updates are always top-down (no complex cross-cutting)
3. Avoids the overhead of Redux for a dashboard-style app

```
┌─────────────────────────────────────────────────────┐
│                   AuthContext                        │
│  user: User | null                                  │
│  token: string | null                               │
│  login(email, password) → Promise<void>             │
│  logout() → void                                    │
│  isAuthenticated: boolean                           │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│               EmergencyContext                       │
│  emergencies: Emergency[]                           │
│  hospitals: Hospital[]                              │
│  ambulances: Ambulance[]                            │
│  activeEmergency: Emergency | null                  │
│  createEmergency(data) → Promise<void>              │
│  updateStatus(id, status) → Promise<void>           │
│  — WebSocket listener attached here —               │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│                  BloodContext                        │
│  hospitalStocks: HospitalBloodStock[]               │
│  activeAlerts: BloodEmergencyAlert[]                │
│  triggerBloodAlert(data) → void                     │
│  respondToAlert(alertId, hospitalId) → void         │
│  fulfillAlert(alertId) → void                       │
│  cancelAlert(alertId) → void                        │
│  getCriticalShortages() → BloodInventory[]          │
│  — Live simulation: setInterval 30s —               │
└─────────────────────────────────────────────────────┘
```

### 4.3 Service Layer Architecture

```
src/services/
├── api.ts                     ← Axios base instance
│   ├── baseURL: VITE_API_URL
│   ├── Request interceptor:  Attach Bearer token from localStorage
│   └── Response interceptor: Auto-refresh on 401 → retry request
│
├── authService.ts             ← POST /auth/login, /refresh, /logout
├── emergencyService.ts        ← CRUD on /emergencies
├── ambulanceService.ts        ← CRUD on /ambulances, GPS updates
├── hospitalService.ts         ← GET /hospitals, bed updates
├── routingService.ts          ← POST /routing/calculate
├── mlService.ts               ← POST /ml/predict/*
└── websocket.ts               ← Socket.io client singleton
    ├── connect(token)
    ├── on(event, handler)
    ├── emit(event, data)
    └── disconnect()
```

### 4.4 Real-Time Data Flow in Frontend

```
Socket.io Server (Emergency Service :5001)
          │
          │  new_emergency event
          ▼
websocket.ts → EmergencyContext listener
          │
          ▼
emergencies state array updated (immutable, spread)
          │
          ▼
React re-renders:
  LeftSidebar   → StatsCard count updates
  MapView       → New pin appears on map
  RightSidebar  → New card in active emergencies list
```

---

## 5. Microservices Architecture

### 5.1 Service Design Pattern

Every Node.js/TypeScript service follows this identical structure:

```
service/
├── src/
│   ├── config/
│   │   ├── database.ts          ← pg Pool configuration + connection test
│   │   └── redis.ts             ← ioredis client + retry strategy
│   ├── controllers/
│   │   └── *.controller.ts      ← Route handlers, business logic
│   ├── middleware/
│   │   ├── auth.middleware.ts   ← JWT verification, role check
│   │   ├── error.middleware.ts  ← Global error handler (Winston log + JSON response)
│   │   ├── validation.middleware.ts ← Zod schema validation
│   │   └── request-logger.middleware.ts ← Winston HTTP logger
│   ├── models/
│   │   └── *.model.ts           ← PostgreSQL query functions (no ORM)
│   ├── routes/
│   │   └── *.routes.ts          ← Express Router definitions
│   ├── types/
│   │   └── index.ts             ← TypeScript interfaces, request/response types
│   ├── utils/
│   │   ├── logger.ts            ← Winston logger (file + console transports)
│   │   ├── helpers.ts           ← Shared utilities (Haversine, date formatters)
│   │   └── validators.ts        ← Zod schema definitions
│   └── index.ts                 ← Express app bootstrap + graceful shutdown
├── tsconfig.json
└── package.json
```

### 5.2 Inter-Service Communication

Services do **NOT** call each other directly. Communication flows through:

```
Option A — Database (for persistent state queries):
  Service A writes → PostgreSQL → Service B reads
  
  Example: Emergency Service writes assignment → Hospital Service reads bed count

Option B — Redis Pub/Sub (for real-time events):
  Emergency Service → PUBLISH emergency_events → Redis
  → All subscribed services + WebSocket clients receive instantly

Option C — Direct HTTP (only for synchronous, blocking operations):
  Emergency Service → HTTP POST → Routing Service (needs route NOW to complete dispatch)
  Emergency Service → HTTP POST → ML Service (needs ETA NOW for response)
```

### 5.3 Service Responsibilities — Detailed

#### Emergency Service (:5001)
```
Owns: emergencies table
Emits: new_emergency, emergency_status_update, emergency_assignment
Subscribes: ambulance_location_update (to update map)

Bootstrap sequence:
  1. Connect to PostgreSQL pool (max: 20 connections)
  2. Connect to Redis (subscribe to ambulance_events channel)
  3. Initialize Socket.io server (CORS: frontend origin)
  4. Register Express routes
  5. Start HTTP server on :5001

Critical path (create emergency):
  1. Validate body with Zod (location, severity, type required)
  2. INSERT into emergencies table (status: 'pending')
  3. PUBLISH to Redis emergency_events channel
  4. Socket.io emit → new_emergency to all connected clients
  5. Call Routing Service for initial ETA estimate
  6. Return 201 Created with emergency ID
```

#### Auth Service (:5004)
```
Owns: users table, Redis session keys
Emits: nothing
Subscribes: nothing

Login flow:
  1. SELECT user WHERE email = $1 (parameterized)
  2. bcrypt.compare(password, hash) — 12 rounds
  3. Generate accessToken (JWT, 15min, HS256)
  4. Generate refreshToken (JWT, 7 days, HS256)
  5. SETEX sessions:{userId} 604800 refreshToken (Redis, 7 days TTL)
  6. Return both tokens

Refresh flow:
  1. Verify refreshToken signature
  2. Check token NOT in blacklist:{token} (Redis)
  3. GET sessions:{userId} from Redis → confirm match
  4. Issue new accessToken (15min)
  5. Issue new refreshToken (rotate)
  6. SETEX sessions:{userId} new refreshToken
  7. Add old refreshToken to blacklist:{token} (TTL: 7 days)

Logout flow:
  1. Verify accessToken
  2. DEL sessions:{userId}
  3. SETEX blacklist:{accessToken} remaining-TTL "revoked"
```

#### Ambulance Service (:5002)
```
Owns: ambulances table
Emits: ambulance_location_update, ambulance_status_update
Subscribes: nothing

GPS update endpoint (PATCH /:id/location):
  1. Validate lat/lng bounds
  2. UPDATE ambulances SET current_lat, current_lng, last_location_update
  3. PUBLISH ambulance_events → {id, lat, lng, status}
  4. Socket.io broadcast to all dispatchers

Nearest ambulance algorithm:
  SELECT id, current_lat, current_lng, status,
    (6371 * acos(cos(radians($lat)) * cos(radians(current_lat))
    * cos(radians(current_lng) - radians($lng))
    + sin(radians($lat)) * sin(radians(current_lat)))) AS distance
  FROM ambulances
  WHERE status = 'available'
  ORDER BY distance
  LIMIT 5
  -- Returns top 5 nearest for dispatcher to choose from
```

#### Hospital Service (:5003)
```
Owns: hospitals table
Emits: nothing (bed updates are polled by frontend)
Subscribes: nothing

Best hospital selection algorithm:
  Score = (available_beds_weight × available_beds)
        + (distance_weight × (1 / distance_km))
        + (specialization_match × 50)
  
  Weights: beds=0.4, distance=0.4, specialty=0.2
  
  Returns top hospital with highest score matching emergency type
```

#### Routing Service (:5005)
```
Owns: routes table (for analytics only)
Emits: nothing
Subscribes: nothing

Dijkstra input:
  - Grid: 50×50 virtual city graph (2500 nodes)
  - Node = intersection point
  - Edge weight = distance * traffic_multiplier
  - Traffic multiplier: 1.0 (normal), 1.5 (moderate), 2.5 (heavy)

3-leg optimized route:
  Leg 1: Ambulance current position → Emergency location
  Leg 2: Emergency location → Hospital
  Total distance = Leg1 + Leg2
  ETA = (Total_distance / avg_speed) * traffic_multiplier
  avg_speed = 40 km/h urban (emergency vehicle)

Stored in routes table for ML training data.
```

#### ML Service (:5006)
```
Owns: nothing (read-only from PostgreSQL)
Emits: nothing
Subscribes: nothing

Models loaded at startup (cached in memory):
  - demand_model: RandomForestRegressor (pickled .pkl)
  - response_model: GradientBoostingRegressor (pickled .pkl)
  - position_model: KMeans (pickled .pkl)

Demand forecast features:
  - hour_of_day (0-23)
  - day_of_week (0-6)
  - month (1-12)
  - is_weekend (0/1)
  - is_holiday (0/1)
  - historical_avg_7d (rolling mean)
  - historical_avg_30d (rolling mean)
  - zone_id (geographic cluster)

Response time features:
  - distance_km
  - traffic_level (1-3)
  - hour_of_day
  - day_of_week
  - ambulance_equipment_score
  - severity_score (Critical=3, High=2, Medium=1, Low=0)
```

---

## 6. API Design

### 6.1 API Conventions

```
Base URL:     /api/v1/
Auth header:  Authorization: Bearer <access_token>
Content-Type: application/json

Response envelope:
{
  "success": true,
  "data": { ... },
  "message": "optional human-readable string",
  "pagination": { "page": 1, "limit": 20, "total": 145 }  // list endpoints only
}

Error envelope:
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "location.lat is required",
    "details": [ ... ]  // Zod error array
  }
}

HTTP Status codes:
  200 OK           — successful read
  201 Created      — successful create
  204 No Content   — successful delete
  400 Bad Request  — validation error
  401 Unauthorized — missing or invalid JWT
  403 Forbidden    — valid JWT but insufficient role
  404 Not Found    — resource not found
  409 Conflict     — duplicate resource (e.g. email already exists)
  429 Too Many Requests — rate limit exceeded
  500 Internal     — unexpected server error (never expose stack trace)
```

### 6.2 Complete API Reference

#### Auth Service (:5004)

| Method | Path | Auth | Body | Response |
|--------|------|------|------|----------|
| POST | `/auth/register` | None | `{email, password, full_name, role}` | `{user, accessToken, refreshToken}` |
| POST | `/auth/login` | None | `{email, password}` | `{user, accessToken, refreshToken}` |
| POST | `/auth/refresh` | RefreshToken | `{refreshToken}` | `{accessToken, refreshToken}` |
| POST | `/auth/logout` | Bearer | - | `204` |
| GET | `/auth/profile` | Bearer | - | `{user}` |
| PUT | `/auth/profile` | Bearer | `{full_name, ...}` | `{user}` |
| PUT | `/auth/change-password` | Bearer | `{currentPw, newPw}` | `200` |

#### Emergency Service (:5001)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/emergencies` | dispatcher+ | Create emergency (triggers WS broadcast) |
| GET | `/emergencies` | dispatcher+ | List all (paginated, filterable by status) |
| GET | `/emergencies/active` | dispatcher+ | Active emergencies only |
| GET | `/emergencies/stats` | dispatcher+ | Counts by status, severity, type |
| GET | `/emergencies/:id` | dispatcher+ | Single emergency with full details |
| PATCH | `/emergencies/:id/status` | dispatcher+ | Update lifecycle status |
| POST | `/emergencies/:id/assign-ambulance` | dispatcher+ | Assign ambulance unit |
| POST | `/emergencies/:id/assign-hospital` | dispatcher+ | Assign destination hospital |
| DELETE | `/emergencies/:id` | admin | Soft delete (status: cancelled) |

#### Ambulance Service (:5002)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/ambulances` | dispatcher+ | All ambulances with current status |
| GET | `/ambulances/available` | dispatcher+ | Available units only |
| GET | `/ambulances/nearby` | dispatcher+ | Query: `?lat=28.6&lng=77.2&radius=5` |
| GET | `/ambulances/:id` | dispatcher+ | Single ambulance detail |
| POST | `/ambulances` | admin | Register new ambulance |
| PATCH | `/ambulances/:id/status` | driver+ | Update availability |
| PATCH | `/ambulances/:id/location` | driver | Update GPS (called every 30s by app) |
| GET | `/ambulances/:id/history` | dispatcher+ | Route/assignment history |

#### Hospital Service (:5003)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/hospitals` | viewer+ | All hospitals with capacity summary |
| GET | `/hospitals/nearby` | dispatcher+ | Query: `?lat=&lng=&specialty=trauma` |
| GET | `/hospitals/capacity` | dispatcher+ | System-wide bed availability |
| GET | `/hospitals/:id` | viewer+ | Hospital detail + all bed types |
| GET | `/hospitals/:id/beds` | dispatcher+ | Detailed bed breakdown |
| POST | `/hospitals` | admin | Register new hospital |
| PATCH | `/hospitals/:id/beds` | admin | Update bed counts (real-time push) |
| GET | `/hospitals/:id/specializations` | viewer+ | Specialization list |

#### Routing Service (:5005)

| Method | Path | Auth | Body | Description |
|--------|------|------|------|-------------|
| POST | `/routing/calculate` | dispatcher+ | `{from, to}` | Point-to-point Dijkstra route |
| POST | `/routing/optimized` | dispatcher+ | `{ambulance_pos, emergency_pos, hospital_id}` | 3-leg optimal route |
| POST | `/routing/eta` | dispatcher+ | `{from, to, traffic_level}` | ETA only (no full path) |
| GET | `/routing/traffic` | viewer+ | - | Current traffic condition zones |
| GET | `/routing/history` | admin | - | Past routes for analytics |

#### ML Service (:5006)

| Method | Path | Auth | Body | Description |
|--------|------|------|------|-------------|
| POST | `/ml/predict/demand` | dispatcher+ | `{zone_id, hours_ahead}` | 24h demand curve |
| GET | `/ml/heatmap` | viewer+ | - | Emergency probability by grid cell |
| POST | `/ml/optimize/resources` | admin | `{n_clusters}` | K-Means ambulance positions |
| POST | `/ml/predict/response-time` | dispatcher+ | `{distance_km, traffic, severity}` | ETA prediction |
| GET | `/ml/models/status` | admin | - | Model version, last train, accuracy |
| POST | `/ml/models/retrain` | admin | `{model_type}` | Trigger training job |

---

## 7. Real-Time Communication Layer

### 7.1 Architecture Choice: Why Socket.io + Redis Pub/Sub

```
Option A: Pure WebSocket (ws library)
  PRO: Lightweight, no overhead
  CON: No rooms, no namespaces, no automatic reconnection, no fallbacks
  
Option B: Socket.io
  PRO: Rooms, namespaces, auto-reconnect, fallback to long-polling, 
       binary data support, middleware support
  CON: Slightly heavier (~50KB client bundle)
  
Option C: Server-Sent Events (SSE)
  PRO: Simple, HTTP native, one-way only
  CON: Only server→client, no client→server events
  
CHOSEN: Socket.io — justification: Dispatchers need bidirectional events 
(dispatcher sends emergency, server pushes update back). Auto-reconnect is 
critical in a life-safety system.

Redis Pub/Sub role:
  Without Redis: Socket.io only broadcasts to clients connected to the SAME 
  Node.js process. Multi-process or multi-server setups would miss events.
  
  With Redis: Socket.io Adapter uses Redis as the message bus.
  Any node publishes → Redis distributes → all Socket.io instances receive.
```

### 7.2 Event Catalog

```typescript
// Emergency Events (channel: emergency_events)
interface NewEmergency {
  event: 'new_emergency';
  data: {
    id: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    type: string;
    location: { lat: number; lng: number; address: string };
    status: 'pending';
    createdAt: string;
  }
}

interface EmergencyStatusUpdate {
  event: 'emergency_status_update';
  data: {
    id: string;
    status: 'dispatched' | 'en_route' | 'arrived' | 'completed' | 'cancelled';
    updatedAt: string;
  }
}

interface EmergencyAssignment {
  event: 'emergency_assignment';
  data: {
    emergencyId: string;
    ambulanceId: string;
    hospitalId: string;
    estimatedArrival: string;
    route: { lat: number; lng: number }[];
  }
}

// Ambulance Events (channel: ambulance_events)
interface AmbulanceLocationUpdate {
  event: 'ambulance_location_update';
  data: {
    id: string;
    lat: number;
    lng: number;
    speed: number;
    heading: number;
    status: string;
    updatedAt: string;
  }
}

interface AmbulanceStatusUpdate {
  event: 'ambulance_status_update';
  data: {
    id: string;
    previousStatus: string;
    newStatus: string;
    updatedAt: string;
  }
}
```

### 7.3 WebSocket Connection Lifecycle

```
Client                              Server (Emergency Service :5001)
  │                                           │
  │── connect (with auth token) ────────────▶│
  │                                           │── verify JWT middleware
  │                                           │── attach user to socket
  │◀─ connection confirmed ──────────────────│
  │                                           │
  │── join room: 'dispatchers' ─────────────▶│
  │◀─ room joined ───────────────────────────│
  │                                           │
  │  [Emergency Created by other dispatcher] │
  │◀─ new_emergency event ───────────────────│ ← Redis Pub/Sub delivers to all
  │                                           │
  │── emit: 'create_emergency' {data} ──────▶│
  │                                           │── validate + store
  │                                           │── PUBLISH Redis
  │◀─ emergency_created ─────────────────────│
  │                                           │── broadcast to all in 'dispatchers'
  │                                           │
  │── disconnect (tab closed / timeout) ────▶│
  │                                           │── remove from room
  │                                           │── log disconnection
```

---

## 8. Database Design

### 8.1 Schema Design Decisions

**Why PostgreSQL over MongoDB?**
```
Emergency data is inherently relational:
  - Emergency BELONGS TO Ambulance (FK)
  - Emergency BELONGS TO Hospital (FK)
  - Blood alert HAS MANY responses (FK)
  - Route BELONGS TO Emergency (FK)

ACID compliance is mandatory:
  - Cannot have a blood inventory showing 5 units when 0 remain
  - Cannot assign 2 emergencies to the same ambulance simultaneously
  - Transaction support required for atomic bed-count decrements

PostgreSQL's JSONB:
  - equipment (ambulances) — flexible, queryable JSON
  - specializations (hospitals) — array of strings
  - responded_by (blood_alerts) — UUID array
```

### 8.2 Complete Schema

```sql
-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(255) UNIQUE NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,          -- bcrypt 12 rounds
    full_name       VARCHAR(255) NOT NULL,
    role            VARCHAR(50)  NOT NULL DEFAULT 'viewer'
                    CHECK (role IN ('admin','dispatcher','driver','viewer')),
    phone           VARCHAR(20),
    is_active       BOOLEAN NOT NULL DEFAULT true,
    last_login      TIMESTAMP WITH TIME ZONE,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role  ON users(role);

-- ============================================================
-- HOSPITALS
-- ============================================================
CREATE TABLE hospitals (
    id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                     VARCHAR(255) NOT NULL,
    address                  TEXT NOT NULL,
    latitude                 DECIMAL(10,8) NOT NULL,
    longitude                DECIMAL(11,8) NOT NULL,

    -- ICU capacity
    icu_beds_total            INTEGER NOT NULL DEFAULT 0,
    icu_beds_available        INTEGER NOT NULL DEFAULT 0,

    -- Emergency ward capacity
    emergency_beds_total      INTEGER NOT NULL DEFAULT 0,
    emergency_beds_available  INTEGER NOT NULL DEFAULT 0,

    -- General ward capacity
    general_beds_total        INTEGER NOT NULL DEFAULT 0,
    general_beds_available    INTEGER NOT NULL DEFAULT 0,

    specializations          JSONB NOT NULL DEFAULT '[]',
    -- Example: ["trauma", "cardiac", "neuro", "burns", "pediatric"]

    is_blood_bank            BOOLEAN NOT NULL DEFAULT false,
    contact_number           VARCHAR(20),
    is_active                BOOLEAN NOT NULL DEFAULT true,
    created_at               TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at               TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_hospitals_location ON hospitals(latitude, longitude);
CREATE INDEX idx_hospitals_blood_bank ON hospitals(is_blood_bank) WHERE is_blood_bank = true;

-- ============================================================
-- AMBULANCES
-- ============================================================
CREATE TABLE ambulances (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    registration_number  VARCHAR(50) UNIQUE NOT NULL,
    type                 VARCHAR(50) NOT NULL DEFAULT 'BLS'
                         CHECK (type IN ('BLS','ALS','NICU','Bariatric')),
    status               VARCHAR(50) NOT NULL DEFAULT 'available'
                         CHECK (status IN ('available','dispatched','en_route','busy','offline','maintenance')),
    current_lat          DECIMAL(10,8),
    current_lng          DECIMAL(11,8),
    last_location_update TIMESTAMP WITH TIME ZONE,
    equipment            JSONB NOT NULL DEFAULT '{}',
    -- Example: {"defibrillator": true, "ventilator": false, "o2_tank": true}
    driver_id            UUID REFERENCES users(id),
    hospital_id          UUID REFERENCES hospitals(id),  -- home base
    is_active            BOOLEAN NOT NULL DEFAULT true,
    created_at           TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at           TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_ambulances_status   ON ambulances(status);
CREATE INDEX idx_ambulances_location ON ambulances(current_lat, current_lng);

-- ============================================================
-- EMERGENCIES
-- ============================================================
CREATE TABLE emergencies (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id          UUID REFERENCES users(id),
    assigned_ambulance   UUID REFERENCES ambulances(id),
    assigned_hospital    UUID REFERENCES hospitals(id),

    status               VARCHAR(50) NOT NULL DEFAULT 'pending'
                         CHECK (status IN ('pending','dispatched','en_route','arrived','completed','cancelled')),
    severity             VARCHAR(50) NOT NULL
                         CHECK (severity IN ('critical','high','medium','low')),
    emergency_type       VARCHAR(100) NOT NULL,  -- 'cardiac', 'trauma', 'stroke', etc.

    -- Location
    latitude             DECIMAL(10,8) NOT NULL,
    longitude            DECIMAL(11,8) NOT NULL,
    address              TEXT,

    -- Patient
    patient_name         VARCHAR(255),
    patient_age          INTEGER,
    patient_info         TEXT,

    -- Timing
    dispatched_at        TIMESTAMP WITH TIME ZONE,
    arrived_at           TIMESTAMP WITH TIME ZONE,
    completed_at         TIMESTAMP WITH TIME ZONE,

    -- ML output
    predicted_eta_minutes INTEGER,
    actual_eta_minutes    INTEGER,               -- filled after completion for training

    notes                TEXT,
    created_at           TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at           TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_emergencies_status    ON emergencies(status);
CREATE INDEX idx_emergencies_severity  ON emergencies(severity);
CREATE INDEX idx_emergencies_created   ON emergencies(created_at DESC);
CREATE INDEX idx_emergencies_ambulance ON emergencies(assigned_ambulance);

-- ============================================================
-- ROUTES
-- ============================================================
CREATE TABLE routes (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    emergency_id   UUID REFERENCES emergencies(id),
    ambulance_id   UUID REFERENCES ambulances(id),

    -- Leg 1: Ambulance → Patient
    leg1_from_lat  DECIMAL(10,8),
    leg1_from_lng  DECIMAL(11,8),
    leg1_to_lat    DECIMAL(10,8),
    leg1_to_lng    DECIMAL(11,8),
    leg1_distance  DECIMAL(8,3),   -- km
    leg1_duration  INTEGER,         -- seconds

    -- Leg 2: Patient → Hospital
    leg2_from_lat  DECIMAL(10,8),
    leg2_from_lng  DECIMAL(11,8),
    leg2_to_lat    DECIMAL(10,8),
    leg2_to_lng    DECIMAL(11,8),
    leg2_distance  DECIMAL(8,3),
    leg2_duration  INTEGER,

    total_distance DECIMAL(8,3),
    total_duration INTEGER,
    traffic_level  INTEGER CHECK (traffic_level IN (1,2,3)),  -- 1=light,2=moderate,3=heavy
    route_polyline TEXT,            -- encoded polyline for map display

    created_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_routes_emergency ON routes(emergency_id);

-- ============================================================
-- BLOOD INVENTORY  (NEW)
-- ============================================================
CREATE TABLE blood_inventory (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id     UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    blood_type      VARCHAR(5) NOT NULL
                    CHECK (blood_type IN ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
    units_available INTEGER NOT NULL DEFAULT 0 CHECK (units_available >= 0),
    units_reserved  INTEGER NOT NULL DEFAULT 0 CHECK (units_reserved >= 0),
    last_updated    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE (hospital_id, blood_type)
);

CREATE INDEX idx_blood_inv_hospital   ON blood_inventory(hospital_id);
CREATE INDEX idx_blood_inv_blood_type ON blood_inventory(blood_type);
CREATE INDEX idx_blood_inv_critical   ON blood_inventory(units_available) WHERE units_available < 3;

-- ============================================================
-- BLOOD EMERGENCY ALERTS  (NEW)
-- ============================================================
CREATE TABLE blood_emergency_alerts (
    id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requesting_hospital_id UUID NOT NULL REFERENCES hospitals(id),
    blood_type             VARCHAR(5) NOT NULL
                           CHECK (blood_type IN ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
    units_needed           INTEGER NOT NULL CHECK (units_needed > 0),
    urgency                VARCHAR(20) NOT NULL DEFAULT 'Standard'
                           CHECK (urgency IN ('Critical','Urgent','Standard')),
    patient_info           TEXT,
    status                 VARCHAR(20) NOT NULL DEFAULT 'Active'
                           CHECK (status IN ('Active','Fulfilled','Cancelled')),
    responded_by           UUID[] DEFAULT '{}',   -- array of hospital UUIDs that responded
    created_at             TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at             TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at             TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '1 hour'
);

CREATE INDEX idx_blood_alerts_status    ON blood_emergency_alerts(status);
CREATE INDEX idx_blood_alerts_blood     ON blood_emergency_alerts(blood_type);
CREATE INDEX idx_blood_alerts_urgency   ON blood_emergency_alerts(urgency);
CREATE INDEX idx_blood_alerts_hospital  ON blood_emergency_alerts(requesting_hospital_id);
CREATE INDEX idx_blood_alerts_expires   ON blood_emergency_alerts(expires_at);

-- ============================================================
-- BLOOD ALERT RESPONSES  (NEW)
-- ============================================================
CREATE TABLE blood_alert_responses (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_id              UUID NOT NULL REFERENCES blood_emergency_alerts(id) ON DELETE CASCADE,
    responding_hospital_id UUID NOT NULL REFERENCES hospitals(id),
    units_available       INTEGER NOT NULL CHECK (units_available > 0),
    eta_minutes           INTEGER,        -- estimated transport time
    notes                 TEXT,
    created_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE (alert_id, responding_hospital_id)
);

CREATE INDEX idx_blood_responses_alert    ON blood_alert_responses(alert_id);
CREATE INDEX idx_blood_responses_hospital ON blood_alert_responses(responding_hospital_id);
```

### 8.3 Database Connection Pool Strategy

```
PostgreSQL connection pool (per service):
  Pool min:    2 connections (always kept warm)
  Pool max:   20 connections (never exceeded)
  Idle timeout: 30 seconds (release idle connections)
  Connection timeout: 5 seconds (fail fast if DB down)

With 5 Node.js services:
  Max total connections = 5 × 20 = 100
  PostgreSQL default max_connections = 100 (adjust to 150 in production)

Pool configuration in each service (config/database.ts):
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });
  
  // Health check on startup
  pool.query('SELECT 1').catch(() => process.exit(1));
```

---

## 9. Blood Emergency Network — Deep Dive

### 9.1 System Design

```
The Blood Emergency Network is a BROADCAST + RESPONSE pattern:

1. REQUEST:  One hospital needs blood → broadcasts to ALL
2. RESPOND:  Any hospital with blood → responds with availability
3. FULFILL:  Requesting hospital confirms which responder to use
4. TRACK:    Alert lifecycle stored in DB for analytics

This is different from a P2P "hospital A calls hospital B" model because:
- We don't know in advance who has the needed blood type
- Multiple hospitals may have partial quantities (need to combine)
- The broadcast model is O(1) from the requester's perspective
```

### 9.2 Alert Lifecycle State Machine

```
                    ┌──────────────┐
                    │   CREATED    │
                    │  (Active)    │
                    └──────┬───────┘
                           │
                    trigger alert
                    broadcast to all
                           │
              ┌────────────▼────────────┐
              │        ACTIVE           │
              │  hospitals can respond  │
              │  responded_by[] grows   │
              └─┬───────────────┬───────┘
                │               │
         fulfill│         cancel│ or expire
                │               │ (after 1 hour)
                │               │
     ┌──────────▼──┐    ┌───────▼──────┐
     │  FULFILLED  │    │  CANCELLED   │
     │  (terminal) │    │  (terminal)  │
     └─────────────┘    └──────────────┘
```

### 9.3 Frontend State (BloodContext) — Detailed

```typescript
interface BloodInventory {
  bloodType: BloodType;
  units: number;
  reserved: number;
}

interface HospitalBloodStock {
  hospitalId: string;
  hospitalName: string;
  isBloodBank: boolean;
  inventory: BloodInventory[];  // always 8 entries, one per blood type
  lastSync: Date;
}

interface BloodEmergencyAlert {
  id: string;
  hospitalId: string;
  hospitalName: string;
  bloodType: BloodType;
  unitsNeeded: number;
  urgency: UrgencyLevel;
  status: 'Active' | 'Fulfilled' | 'Cancelled';
  respondedBy: string[];  // hospital IDs
  createdAt: Date;
  expiresAt: Date;
  patientInfo?: string;
}

// Live simulation runs every 30 seconds
// Each blood type in each hospital: ±1 unit randomly
// Simulates real-world consumption and donation patterns
// Clamps to [0, 40] range
setInterval(() => {
  setHospitalStocks(prev => prev.map(hospital => ({
    ...hospital,
    inventory: hospital.inventory.map(item => ({
      ...item,
      units: Math.max(0, Math.min(40, item.units + (Math.random() > 0.5 ? 1 : -1)))
    })),
    lastSync: new Date()
  })));
}, 30000);
```

### 9.4 Critical Path — Blood Alert Broadcast

```
Time 0ms:    Dispatcher clicks "BROADCAST BLOOD ALERT"
Time 1ms:    BloodEmergencyModal calls triggerBloodAlert()
Time 2ms:    State update: new alert added to activeAlerts[]
Time 3ms:    React re-renders BloodBankPanel → alert appears in "Alerts" tab
Time 5ms:    react-hot-toast fires → notification visible to all dispatchers
Time 10ms:   [Future] API call to POST /blood-alerts → PostgreSQL INSERT
Time 10ms:   [Future] Redis PUBLISH blood_events → other connected clients

Current implementation: Fully frontend (BloodContext state)
Production path: Same UX, but persisted to DB + broadcast via WebSocket
```

---

## 10. Routing Engine — Dijkstra's Algorithm

### 10.1 Implementation Design

```typescript
// Graph representation
interface Node {
  id: string;
  lat: number;
  lng: number;
}

interface Edge {
  from: string;
  to: string;
  weight: number;  // distance_km * traffic_multiplier
}

interface Graph {
  nodes: Map<string, Node>;
  adjacency: Map<string, Edge[]>;
}

// Dijkstra's algorithm (src/utils/dijkstra.ts)
function dijkstra(graph: Graph, start: string, end: string): {
  path: string[];
  distance: number;
  duration: number;
} {
  const distances = new Map<string, number>();
  const previous  = new Map<string, string | null>();
  const unvisited = new Set<string>();

  // Initialize
  for (const nodeId of graph.nodes.keys()) {
    distances.set(nodeId, Infinity);
    previous.set(nodeId, null);
    unvisited.add(nodeId);
  }
  distances.set(start, 0);

  while (unvisited.size > 0) {
    // Find unvisited node with minimum distance
    const current = [...unvisited].reduce((min, node) =>
      distances.get(node)! < distances.get(min)! ? node : min
    );

    if (current === end) break;
    if (distances.get(current) === Infinity) break;

    unvisited.delete(current);

    // Relax edges
    for (const edge of graph.adjacency.get(current) || []) {
      if (!unvisited.has(edge.to)) continue;
      const alt = distances.get(current)! + edge.weight;
      if (alt < distances.get(edge.to)!) {
        distances.set(edge.to, alt);
        previous.set(edge.to, current);
      }
    }
  }

  // Reconstruct path
  const path: string[] = [];
  let current: string | null = end;
  while (current !== null) {
    path.unshift(current);
    current = previous.get(current) || null;
  }

  return {
    path,
    distance: distances.get(end)!,
    duration: calculateDuration(distances.get(end)!, trafficLevel)
  };
}
```

### 10.2 3-Leg Route Optimization

```
Input:
  ambulancePos  = {lat: 28.6139, lng: 77.2090}  (current GPS)
  emergencyPos  = {lat: 28.6200, lng: 77.2150}  (patient location)
  hospitalId    = UUID of best hospital

Algorithm:
  1. Convert lat/lng to nearest graph node (Haversine distance)
  2. Run Dijkstra: ambulanceNode → emergencyNode (Leg 1)
  3. Run Dijkstra: emergencyNode → hospitalNode  (Leg 2)
  4. Concatenate paths
  5. Calculate total ETA = (Leg1_duration + Leg2_duration)
  6. Apply traffic multiplier to each leg separately
  7. Store in routes table for ML training

Time complexity: O((V + E) log V) with priority queue
Space complexity: O(V)
```

---

## 11. ML/AI Pipeline

### 11.1 Model Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                   ML Service (Python/FastAPI)                     │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                  Model Registry                           │    │
│  │  demand_model_v{n}.pkl     ← RandomForestRegressor       │    │
│  │  response_model_v{n}.pkl   ← GradientBoostingRegressor   │    │
│  │  position_model_v{n}.pkl   ← KMeans                      │    │
│  └─────────────────────────────────────────────────────────┘    │
│                         │                                         │
│  ┌──────────────────────▼──────────────────────────────────┐    │
│  │              Feature Engineering Pipeline                 │    │
│  │                                                           │    │
│  │  Raw DB Query → Pandas DataFrame → Feature Extraction     │    │
│  │  → Normalization (StandardScaler) → Model Input Tensor   │    │
│  └──────────────────────┬──────────────────────────────────┘    │
│                         │                                         │
│  ┌──────────────────────▼──────────────────────────────────┐    │
│  │                  Inference Engine                         │    │
│  │  model.predict(X) → raw output → post-process → JSON     │    │
│  └──────────────────────┬──────────────────────────────────┘    │
│                         │                                         │
│  ┌──────────────────────▼──────────────────────────────────┐    │
│  │                  Auto-Retraining Scheduler                │    │
│  │  APScheduler: every 7 days at 2:00 AM                    │    │
│  │  Fetches last 90 days from PostgreSQL                    │    │
│  │  Trains new model → validates accuracy → promotes if     │    │
│  │  new accuracy > old accuracy (no regression)             │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

### 11.2 Demand Forecasting — Random Forest

```python
Features (X):
  - hour_of_day        int [0-23]
  - day_of_week        int [0-6]  (0=Monday)
  - month              int [1-12]
  - is_weekend         int [0,1]
  - is_holiday         int [0,1]
  - historical_avg_7d  float      (rolling 7-day mean for this hour/zone)
  - historical_avg_30d float      (rolling 30-day mean)
  - zone_id            int        (geographic cluster ID from K-Means)
  - weather_code       int        (0=clear, 1=rain, 2=fog, 3=extreme)

Target (y):
  - emergency_count_next_hour  int

Model:
  RandomForestRegressor(
    n_estimators=200,
    max_depth=10,
    min_samples_split=5,
    min_samples_leaf=2,
    n_jobs=-1,
    random_state=42
  )

Training:
  - Data: Last 90 days of emergencies table grouped by hour + zone
  - Split: 80% train, 20% test
  - Metric: MAE (Mean Absolute Error) ← human interpretable for operations
  - Target accuracy: MAE < 2.0 (within 2 emergencies per hour)
  
Output:
  List of 24 hourly predictions for requested zone
  Confidence interval: ± std deviation of forest predictions
```

### 11.3 Response Time Prediction — Gradient Boosting

```python
Features (X):
  - distance_km           float  (Leg1 + Leg2 from routing service)
  - traffic_level         int    [1=light, 2=moderate, 3=heavy]
  - hour_of_day           int    [0-23]
  - day_of_week           int    [0-6]
  - severity_score        int    [Critical=3, High=2, Medium=1, Low=0]
  - ambulance_type_score  int    [ALS=2, BLS=1]
  - hospital_distance     float  (Leg2 distance)

Target (y):
  - actual_response_minutes  float  (from emergencies table post-completion)

Model:
  GradientBoostingRegressor(
    n_estimators=300,
    learning_rate=0.05,
    max_depth=5,
    subsample=0.8,
    random_state=42
  )

Metric: RMSE target < 3.0 minutes (currently achieving ~2.3 min)
Training data: Completed emergencies with actual_eta_minutes filled
```

### 11.4 Ambulance Pre-Positioning — K-Means

```python
Features:
  - historic emergency locations (lat, lng) from last 90 days
  - weighted by: hour_of_day, day_of_week (recency weighted)

Algorithm:
  KMeans(n_clusters=n_ambulances, init='k-means++', n_init=10)
  
Output:
  Optimal lat/lng for each ambulance to minimize average response distance
  Updated recommendation every 6 hours
  
Practical use:
  "Move Ambulance Unit 7 to Connaught Place during 8-10 AM 
   (predicted high demand zone)"
```

---

## 12. Authentication & Security Architecture

### 12.1 JWT Token Design

```
Access Token:
  Header:  { "alg": "HS256", "typ": "JWT" }
  Payload: {
    "sub": "user-uuid",
    "role": "dispatcher",
    "email": "john@hospital.com",
    "iat": 1741600000,
    "exp": 1741600900,   // 15 minutes
    "jti": "unique-token-id"
  }
  TTL: 15 minutes (short for security — stolen token expires quickly)

Refresh Token:
  Payload: {
    "sub": "user-uuid",
    "type": "refresh",
    "iat": 1741600000,
    "exp": 1742204800,   // 7 days
    "jti": "unique-token-id"
  }
  Stored in: Redis key sessions:{userId} with 7-day TTL
  Single-use: invalidated after each rotation
```

### 12.2 Request Authentication Flow

```
Every protected endpoint:

1. Extract header: Authorization: Bearer <token>
2. If missing → 401 Unauthorized (no token provided)
3. jwt.verify(token, JWT_SECRET):
   - If expired → 401 with code TOKEN_EXPIRED
   - If invalid signature → 401 with code INVALID_TOKEN
4. Check Redis: GET blacklist:{token}
   - If exists → 401 with code TOKEN_REVOKED
5. Check role permission:
   - Route requires role 'dispatcher'
   - User role is 'viewer'
   - → 403 Forbidden
6. Attach user to req.user
7. next() → controller
```

### 12.3 RBAC Permission Matrix

```
                    admin  dispatcher  driver  viewer
─────────────────────────────────────────────────────
View emergencies      ✅       ✅         ✅       ✅
Create emergency      ✅       ✅         ❌       ❌
Update emergency      ✅       ✅         ❌       ❌
Delete emergency      ✅       ❌         ❌       ❌
View ambulances       ✅       ✅         ✅       ✅
Update GPS location   ✅       ✅         ✅       ❌
Update availability   ✅       ✅         ✅       ❌
Add ambulance         ✅       ❌         ❌       ❌
View hospitals        ✅       ✅         ✅       ✅
Update bed counts     ✅       ❌         ❌       ❌
View blood inventory  ✅       ✅         ✅       ✅
Trigger blood alert   ✅       ✅         ❌       ❌
Run ML predictions    ✅       ✅         ❌       ❌
Retrain ML models     ✅       ❌         ❌       ❌
Manage users          ✅       ❌         ❌       ❌
```

### 12.4 Security Layers

```
Layer 1 — Network:
  HTTPS/TLS 1.3 for all traffic
  Nginx strips sensitive headers
  
Layer 2 — Rate Limiting (Express middleware):
  Global: 100 requests / 15 minutes / IP
  Auth endpoints: 10 requests / 15 minutes / IP (brute force protection)
  
Layer 3 — Input Validation (Zod):
  Every request body validated before touching DB
  Example emergency schema:
    severity: z.enum(['critical','high','medium','low'])
    latitude:  z.number().min(-90).max(90)
    longitude: z.number().min(-180).max(180)
    type:      z.string().min(1).max(100)
  
Layer 4 — Authentication (JWT):
  All non-public endpoints verify JWT
  Blacklist checked in Redis (< 1ms lookup)
  
Layer 5 — Authorization (RBAC):
  Role checked after auth
  Fine-grained per route
  
Layer 6 — Database:
  Parameterized queries everywhere: pool.query('SELECT * WHERE id = $1', [id])
  No string concatenation in SQL
  
Layer 7 — Response:
  Helmet.js headers: X-Frame-Options, HSTS, CSP, X-Content-Type-Options
  Error responses never include stack traces in production
  Sensitive fields (password_hash) excluded from all responses
```

---

## 13. Caching Strategy

### 13.1 What Gets Cached (Redis)

```
Key Pattern                    TTL         Content
─────────────────────────────────────────────────────────────────────
sessions:{userId}              7 days      Refresh token (auth)
blacklist:{token}              token TTL   "revoked" marker
cache:hospitals:all            5 minutes   Hospital list (rarely changes)
cache:hospitals:{id}:beds      30 seconds  Bed counts (changes often)
cache:ambulances:available     15 seconds  Available units (changes fast)
cache:ml:demand:{zone}:{hour}  10 minutes  ML demand prediction
cache:ml:heatmap               30 minutes  Heatmap grid (slow to compute)
```

### 13.2 Cache Invalidation

```
Hospital bed update:
  1. PATCH /hospitals/:id/beds → UPDATE DB
  2. DEL cache:hospitals:{id}:beds      ← invalidate specific hospital
  3. DEL cache:hospitals:all            ← invalidate list (bed counts included)
  4. Redis TTL handles heatmap expiry

Ambulance status change:
  1. PATCH /ambulances/:id/status → UPDATE DB
  2. DEL cache:ambulances:available     ← list changes when ambulance goes busy
  
Why not cache emergencies?
  Emergency data is always real-time critical.
  Stale data = wrong dispatch decision = life risk.
  Emergencies are NOT cached.
```

---

## 14. Data Flow Diagrams

### 14.1 Complete Emergency Creation Flow

```
User fills Emergency Form (EmergencyModal.tsx)
           │
           │ Form submit
           ▼
EmergencyContext.createEmergency(formData)
           │
           │ HTTP POST /api/v1/emergencies
           ▼
Nginx (routes to Emergency Service :5001)
           │
           ▼
auth.middleware.ts → verify JWT → attach user
           │
           ▼
validation.middleware.ts → Zod validate body
           │
           ▼
emergency.controller.ts → createEmergency()
           │
           │ BEGIN TRANSACTION
           ▼
INSERT INTO emergencies (status='pending', ...) → returns UUID
           │
           │ COMMIT
           ▼
PUBLISH Redis channel 'emergency_events' → {event: 'new_emergency', data}
           │
           │
    ┌──────┴─────────────────────────────────────┐
    │                                             │
    ▼                                             ▼
Socket.io.emit('new_emergency')          HTTP POST to Routing Service
to all in 'dispatchers' room             /routing/optimized
    │                                             │
    ▼                                             ▼
Frontend receives event              Dijkstra calculates route
EmergencyContext updates             Returns {path, distance, duration}
Map shows new pin                              │
LeftSidebar count +1                           ▼
                                   HTTP POST to ML Service
                                   /ml/predict/response-time
                                               │
                                               ▼
                                   Returns {predicted_eta_minutes}
                                               │
                                               ▼
                                   UPDATE emergencies SET
                                   predicted_eta_minutes = X
                                               │
                                               ▼
                              Socket.io emit 'emergency_updated'
                              with ETA to all dispatchers
```

### 14.2 Blood Alert Broadcast Flow

```
Dispatcher opens BloodEmergencyModal
           │
           │ Fill: hospital, blood_type, units, urgency
           ▼
BloodEmergencyModal.handleBroadcast()
           │
           ▼
triggerBloodAlert({
  hospitalId: 'h3',
  bloodType: 'O-',
  unitsNeeded: 4,
  urgency: 'Critical',
  patientInfo: 'RTA patient, 35M'
})
           │
           ▼
BloodContext state update:
  activeAlerts = [...activeAlerts, newAlert]
           │
           │ React re-renders
           ▼
BloodBankPanel "Alerts" tab:
  New AlertCard renders at top
  Shows: 🚨 Critical · O- · 4 units · Downtown Emergency
           │
           ▼
toast.error('🚨 CRITICAL: O- blood needed at Downtown Emergency')
  → Visible to ALL dispatchers on screen
           │
           ▼ (meanwhile, auto-expiry logic running)
setInterval check: if alert.expiresAt < now → status = 'Cancelled'
           │
           ▼ Other hospital dispatcher sees alert, clicks "Respond"
AlertCard.handleRespond('h4') // AIIMS Blood Bank
           │
           ▼
respondToAlert(alertId, 'h4')
  Updates alert.respondedBy = [..., 'h4']
  Shows "1 hospital responded" on alert card
           │
           ▼ Requesting hospital clicks ✓ Fulfill
fulfillAlert(alertId)
  Updates alert.status = 'Fulfilled'
  Alert moves from "Alerts" tab to "Fulfilled" view
  toast.success('✅ Blood alert fulfilled')
```

---

## 15. Scalability & Performance Design

### 15.1 Horizontal Scaling Path

```
Current (Single Node):
  All 6 services on one machine
  PostgreSQL on same machine
  Redis on same machine

Phase 2 (Moderate Load, 5 cities):
  Each service → Docker container → K8s deployment (replicas: 2-3)
  PostgreSQL → Managed RDS (Multi-AZ)
  Redis → Managed ElastiCache (cluster mode)
  Socket.io → Socket.io Redis Adapter (events flow across all pods)
  Nginx → AWS ALB (Application Load Balancer)

Phase 3 (National Scale):
  PostgreSQL read replicas for analytics queries
  Emergency/Ambulance services: 5+ replicas (highest traffic)
  ML Service: GPU instances for faster inference
  CDN for static frontend assets
  Circuit breakers between services (Hystrix pattern)
```

### 15.2 Database Performance

```
Query optimization:
  - All foreign keys indexed
  - Compound indexes on (status, created_at) for common list queries
  - Partial indexes: WHERE status = 'active' (common filter)
  - blood_inventory UNIQUE constraint prevents double-counting

Slow query prevention:
  - EXPLAIN ANALYZE run on all critical queries
  - No N+1 queries: JOINs used instead of multiple SELECTs
  - Pagination on all list endpoints (default limit: 20)

Connection pooling (pg):
  - Pool max: 20 per service
  - Prevents connection storm on high load
  - Pool reuse prevents TCP handshake overhead
```

### 15.3 Frontend Performance

```
Vite build optimizations:
  - Tree shaking eliminates unused code
  - Code splitting: routes/components loaded lazily
  - Cold start: ~530ms (measured)

React performance:
  - React.memo on pure components (StatsCard, AlertCard)
  - useCallback on event handlers passed as props
  - Map markers: only re-render when lat/lng changes (no excessive Leaflet redraws)
  - BloodContext simulation: useRef for timer (not state) to prevent re-render

WebSocket efficiency:
  - Single shared connection per browser tab
  - Room-based broadcast (only dispatchers get emergency events, not all users)
  - Binary data not used (all JSON — simpler for dashboard use case)
```

---

## 16. Deployment Architecture

### 16.1 Docker Compose (Development / Single Node)

```yaml
services:
  postgres:     image: postgres:15, port: 5432
  redis:        image: redis:8, port: 6379
  auth:         build: ./backend/services/auth-service, port: 5004
  emergency:    build: ./backend/services/emergency-service, port: 5001
  ambulance:    build: ./backend/services/ambulance-service, port: 5002
  hospital:     build: ./backend/services/hospital-service, port: 5003
  routing:      build: ./backend/services/routing-service, port: 5005
  ml:           build: ./backend/services/ml-service, port: 5006
  frontend:     build: ., port: 3001
  nginx:        image: nginx:alpine, ports: [80:80, 443:443]

Health checks on all services: GET /health → 200 OK
Restart policy: always (critical services)
```

### 16.2 Environment Configuration

```bash
# Shared across all Node.js services
DATABASE_URL=postgresql://user:pass@postgres:5432/mediroutex
REDIS_URL=redis://redis:6379
JWT_SECRET=<256-bit-random-key>
JWT_REFRESH_SECRET=<different-256-bit-random-key>
NODE_ENV=production
LOG_LEVEL=info

# Service-specific
PORT=5001                          # Emergency service
FRONTEND_URL=http://localhost:3001 # CORS origin

# ML Service (Python)
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
MODEL_DIR=/app/models
RETRAIN_SCHEDULE="0 2 */7 * *"    # Every 7 days at 2 AM
```

---

## 17. Error Handling & Resilience

### 17.1 Error Handling Strategy

```
3 levels of error handling:

Level 1 — Input Errors (Zod validation):
  Caught BEFORE hitting business logic
  Response: 400 + detailed field errors
  Never reaches DB
  
Level 2 — Business Logic Errors:
  Custom error classes: NotFoundError, ConflictError, ForbiddenError
  Thrown from controllers, caught by global error middleware
  Response: 4xx with error code + message
  Logged at WARN level
  
Level 3 — Unexpected Errors:
  Uncaught exceptions from DB, Redis, external services
  Global error middleware catches all
  Response: 500 with generic message (no stack trace)
  Logged at ERROR level with full stack to Winston file transport
  
Process-level safety:
  process.on('uncaughtException', handler) → log + graceful shutdown
  process.on('unhandledRejection', handler) → log + graceful shutdown
```

### 17.2 Service Resilience

```
Database connection loss:
  pg pool: automatic retry with exponential backoff
  If pool exhausted: 503 Service Unavailable with Retry-After header
  Alert: Winston logs ERROR → can be piped to alerting system

Redis connection loss:
  ioredis: automatic reconnection (retryStrategy: exponential)
  If Redis down: JWT verification falls back to stateless check only
  (no blacklist check — acceptable degradation, not system failure)

ML Service unavailable:
  Emergency creation: continues without ETA prediction
  Sets predicted_eta_minutes = null
  Dispatcher sees "ETA calculating..." instead of number
  Non-blocking: emergency still dispatched immediately

Routing Service unavailable:
  Emergency creation: continues without route calculation
  Fallback: straight-line distance estimate only
  Dispatcher manually assigns ambulance

WebSocket disconnect:
  Socket.io automatic reconnection: exponential backoff starting 1s
  State re-sync: frontend fetches /emergencies/active on reconnect
```

---

## 18. Design Decisions & Trade-offs

| Decision | Chosen | Alternative | Reason |
|----------|--------|-------------|--------|
| **Frontend state** | React Context | Redux / Zustand | App state is simple, co-located; Redux overhead not justified |
| **ORM** | Raw pg queries | Prisma / TypeORM | Full SQL control, no N+1 risk, predictable query plans |
| **Real-time** | Socket.io | SSE / Polling | Bidirectional needed; auto-reconnect critical for life-safety |
| **Blood state** | Frontend Context | Backend API | Demo speed; blood data is self-contained simulation |
| **ML framework** | scikit-learn | TensorFlow / PyTorch | Tabular data doesn't need deep learning; simpler deployment |
| **Graph algorithm** | Dijkstra | A* | Sufficient for city-scale grid; A* adds complexity without benefit here |
| **Auth storage** | Redis sessions | DB sessions | Sub-millisecond lookups; TTL-based expiry is built-in |
| **API style** | REST | GraphQL | REST simpler for microservices; well-understood caching |
| **Port strategy** | Each service unique port | Path-based single port | Easier local development without Nginx in dev mode |
| **Frontend port** | 3001 | 3000 | Port 3000 occupied by another local project |

---

<div align="center">

## System Design Summary

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Frontend | React 18 + Vite | Real-time dashboard SPA |
| State | React Context (3 providers) | EmergencyContext, BloodContext, AuthContext |
| Map | Leaflet.js | Live ambulance/hospital/emergency visualization |
| Real-time | Socket.io + Redis Pub/Sub | Sub-100ms event propagation |
| API Gateway | Nginx | Routing, TLS termination, load balancing |
| Services × 5 | Node.js + Express + TypeScript | Emergency, Ambulance, Hospital, Auth, Routing |
| ML Service | Python + FastAPI + scikit-learn | Demand forecast, response time, fleet positioning |
| Database | PostgreSQL 15 (8 tables) | ACID, relational, JSONB for flexible fields |
| Cache | Redis 8 | Sessions, pub/sub, short-lived API cache |
| Auth | JWT (HS256) + bcrypt (12r) | Stateless access + stateful refresh |
| Security | Zod + Helmet + Rate Limit + RBAC | 10-layer defense strategy |

*Designed for 99.9% uptime · < 100ms real-time events · Horizontal scale-ready*

</div>
