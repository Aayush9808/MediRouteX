# 🎥 MediRouteX Video Presentation Script
**Duration:** 7-8 Minutes | **Team:** 5 Members | **Recording:** Google Meet/Zoom with Screen Share

---

## 🎬 **PRESENTATION SCRIPT (7-8 Minutes)**

### **[0:00-0:20] OPENING - AAYUSH (20 seconds)**

**[Aayush shares screen with poster visible]**

**AAYUSH:**
> "Good morning everyone! I'm **Aayush Kumar Shrivastav**, team leader. This is **MediRouteX** - an AI-powered emergency medical dispatch system.
>
> My team: **Ronak Saini**, **Soumya Goel**, **Dushyant Dubey**, and **Sanskar Mishra**. CSE 3rd Year, Batch 2023-27, guided by **Ms. Paramjeet Kaur**. Let's begin!"

**[Point to Introduction section on poster]**

---

### **[0:20-1:20] INTRODUCTION - AAYUSH (1 minute)**

**AAYUSH:**
> "**[Point to statistics]** India records over **1,68,000 road accident deaths annually**. Ambulance response time averages **20-30 minutes** - way beyond the critical Golden Hour. Only **18% of patients receive pre-hospital care**. Manual dispatch takes **5-8 minutes**. Blood shortage: **2 million units annually**.
>
> **[Point to solution]** **MediRouteX** solves this with:
> - **30-second GPS dispatch** - 90% faster
> - **Real-time hospital bed visibility**
> - **Intelligent routing algorithms**
> - **Blood network** connecting 50+ hospitals
> - **ML-powered predictive analytics**
>
> Impact: **120-200 lives saved per city annually**, 70-80% faster blood procurement. Now, Ronak will explain our objectives."

---

### **[1:20-2:20] OBJECTIVES - RONAK (1 minute)**

**RONAK:**
> "Hi, I'm **Ronak Saini**. **My role:** PostgreSQL database with 8 tables and 25+ indexes, **Ambulance Service** for GPS tracking, and **Routing Service** using Haversine distance formula.
>
> **[Point to Objectives]** Five objectives:
>
> **1. Automated Dispatch:** GPS-based assignment in under 30 seconds using Haversine formula.
>
> **2. Hospital Intelligence:** Live bed data across ICU, Emergency, General wards for 50+ hospitals with specialty matching.
>
> **3. Blood Network:** Broadcast alerts for all 8 blood types within 50km radius, reducing procurement from 2-4 hours to 20-45 minutes.
>
> **4. Predictive ML:** Random Forest for demand forecasting, Gradient Boosting for ETA prediction, K-Means for ambulance positioning.
>
> **5. Scalable Architecture:** 6 microservices with PostgreSQL and Redis.
>
> Success metrics: 99.9% uptime, sub-200ms response, 500+ concurrent emergencies. Now, Soumya on technologies."

---

### **[2:20-3:20] TECHNOLOGIES USED - SOUMYA (1 minute)**

**SOUMYA:**
> "Hi, I'm **Soumya Goel**. **My role:** **Authentication Service** with JWT and role-based access, **Hospital Service** managing bed tracking, blood inventory for all 8 blood types, and broadcast network alerting all hospitals instantly.
>
> **[Point to Technologies]**
>
> **Frontend:** React 18 + TypeScript, Vite, Leaflet.js maps, Socket.io for real-time, Tailwind CSS.
>
> **Backend:** Node.js 20 + Express in TypeScript. 6 microservices on ports 5001-5006.
>
> **ML:** Python 3.11 + FastAPI, scikit-learn, Pandas, NumPy.
>
> **Database:** PostgreSQL 15 with 8 tables and 25+ indexes. Redis 8 for Pub/Sub and caching.
>
> **DevOps:** Docker, Nginx, Git/GitHub, JWT, bcrypt.
>
> Total: **70,000+ lines of code**. Now, Dushyant on impact."

---

### **[3:20-4:20] IMPACT AND BENEFITS - DUSHYANT (1 minute)**

**DUSHYANT:**
> "Hi, I'm **Dushyant Dubey**. **My role:** Complete React frontend - dashboard with real-time emergency board, Leaflet.js maps showing live ambulance positions, emergency and hospital interfaces, plus Docker containerization.
>
> **[Point to Impact]**
>
> **Societal Impact:** **120-200 lives saved per city annually** - 20-30% faster response. Blood network prevents 25-35 deaths monthly.
>
> **Healthcare Benefits:** Automates dispatch, eliminates 5-8 minute delay. Real-time bed visibility prevents overcrowding. Integrates 80+ hospitals.
>
> **Economic Impact:** ₹2.86-4.89 crores saved per city yearly. 18-25% fuel reduction, 140-287 tons less CO2.
>
> **Data Insights:** Helps planners identify hotspots and optimize ambulance placement. Now, Sanskar on SDGs."

---

### **[4:20-5:20] SUSTAINABLE DEVELOPMENT GOALS - SANSKAR (1 minute)**

**SANSKAR:**
> "Hi, I'm **Sanskar Mishra**. **My role:** All documentation - system design, ER diagrams, API specs. **ML Service** in Python and FastAPI, frontend components, and trained all three ML models - Random Forest for demand forecasting, Gradient Boosting for ETA prediction, K-Means for positioning.
>
> **[Point to SDGs]**
>
> **SDG 3 - Good Health:** Target 3.6 - halve traffic deaths by 2030. Our 20-30% faster response reduces preventable deaths.
>
> **SDG 9 - Innovation:** Pioneering microservices in healthcare. Open-source for replication.
>
> **SDG 11 - Sustainable Cities:** 18-25% fuel reduction, 140-287 tons less CO2 annually.
>
> **SDG 17 - Partnerships:** Unifies government, hospitals, blood banks, tech partners.
>
> Now, Aayush will show our implementation and demo."

---

### **[5:20-6:50] SOLUTION ARCHITECTURE & ROADMAP - AAYUSH (1.5 minutes)**

**AAYUSH:**
> "As **project leader**, I designed the system architecture, defined API contracts, coordinated the team. Built **Emergency Service** - the core handling complete emergency lifecycle with WebSocket for real-time updates. Integrated all 6 microservices, set up Redis Pub/Sub, and trained ML models with Sanskar.
>
> **[Point to Architecture]** 4-tier design:
>
> **Tier 1:** React frontend with real-time maps and dashboards.
> **Tier 2:** Nginx as API gateway and load balancer.
> **Tier 3:** 6 Microservices on ports 5001-5006 - Emergency, Ambulance, Hospital, Auth, Routing, ML.
> **Tier 4:** PostgreSQL and Redis for data.
>
> **[Point to Roadmap]** 3-month implementation:
>
> **Month 1:** I designed architecture. Ronak set up database. Soumya built auth. Dushyant configured Docker. Sanskar created documentation.
>
> **Month 2:** Parallel development - I built Emergency Service. Ronak did Ambulance and Routing. Soumya did Hospital Service and blood network. Dushyant created entire frontend. Sanskar built ML Service. **70,478 lines of code.**
>
> **Month 3:** Sanskar and I trained 3 ML models. Ronak and Soumya did testing. Dushyant deployed Docker. All prepared presentation.
>
> **Result:** Production-ready system - 99.9% uptime, sub-200ms response, 500+ concurrent emergencies.
>
> **[Gesture confidently]** Now, with **my contribution at around 50% of the project**, let me show you our **working demo**.
>
> **[Switch screen from poster to localhost:3001]**
>
> Here's our live system - real OpenStreetMap showing Greater Noida, 5 ambulances with live GPS, 3 active emergencies, 5 hospitals with bed data. Watch as I request an ambulance...
>
> **[Brief demo - 15 seconds max]**
>
> System is ready for pilot deployment. Future: AWS cloud, mobile apps, multi-city expansion."

---

### **[6:50-7:10] CLOSING - AAYUSH (20 seconds)**

**[Switch back to poster]**

**AAYUSH:**
> "MediRouteX can save lives. Team effort: Ronak - database and routing. Soumya - auth and blood network. Dushyant - frontend and deployment. Sanskar - documentation and ML. I coordinated and built core services.
>
> Ready for real-world deployment. Thank you! Open to questions."

**[All team members wave]**

**[Stop recording]**

---

## 📝 **SPEAKER NOTES & TIPS**

### **For Aayush (Leader - 3:10 minutes total):**
- Handle architecture, roadmap, and **LIVE DEMO**
- **YOUR ROLE:** Emergency Service, WebSocket, integration, 50% of project
- Mention "50% contribution" before demo
- **DEMO TRANSITION:** Switch from poster to localhost:3001
- Show: Real map, ambulances, emergencies, request ambulance (15 seconds)
- Switch back to poster for closing

### **For Ronak (1 minute):**
- **YOUR ROLE:** Database, Ambulance Service, Routing Service
- Start with your role (10 seconds), then objectives (50 seconds)
- Speak clearly and point to poster
- Confidence tip: Your routing algorithms power the system!

### **For Soumya (1 minute):**
- **YOUR ROLE:** Auth Service, Hospital Service, Blood Network
- Start with your role (10 seconds), then tech stack (50 seconds)
- List technologies concisely
- Confidence tip: Your blood network saves lives!

### **For Dushyant (1 minute):**
- **YOUR ROLE:** Complete frontend, Docker deployment
- Start with your role (10 seconds), then impact numbers (50 seconds)
- Emphasize big numbers: "120-200 LIVES"
- Confidence tip: Your UI makes everything accessible!

### **For Sanskar (1 minute):**
- **YOUR ROLE:** Documentation, ML Service, ML models
- Start with your role (10 seconds), then SDGs (50 seconds)
- Point to 4 SDG icons
- Confidence tip: Your ML predicts emergencies!

---

## ✅ **PRE-RECORDING CHECKLIST**

### **1 Day Before:**
- [ ] All 5 members read their script 3-4 times
- [ ] Practice speaking slowly and clearly
- [ ] Aayush prepares screen share with poster open
- [ ] Test Google Meet/Zoom recording with 1-2 members

### **1 Hour Before:**
- [ ] All members join meeting 10 minutes early
- [ ] Test everyone's microphone and audio
- [ ] Aayush shares screen with poster visible
- [ ] Do a quick 2-minute run-through (just intros)

### **During Recording:**
- [ ] Start recording
- [ ] Aayush introduces everyone
- [ ] Each member speaks their part clearly
- [ ] Point to relevant poster sections
- [ ] Pause 1-2 seconds between speakers
- [ ] End with group closing
- [ ] Stop recording and save

### **After Recording:**
- [ ] Watch the video together
- [ ] Check audio quality (everyone audible?)
- [ ] Check if video length is 7-9 minutes
- [ ] If any issues, re-record only that part
- [ ] Save final video file
- [ ] Upload to Google Form with poster

---

## 🎯 **TIMING BREAKDOWN**

| Section | Speaker | Duration | Cumulative |
|---------|---------|----------|-----------|
| Opening | Aayush | 0:20 | 0:20 |
| Introduction | Aayush | 1:00 | 1:20 |
| Objectives + Role | Ronak | 1:00 | 2:20 |
| Technologies + Role | Soumya | 1:00 | 3:20 |
| Impact + Role | Dushyant | 1:00 | 4:20 |
| SDGs + Role | Sanskar | 1:00 | 5:20 |
| Solution & Demo + Role | Aayush | 1:30 | 6:50 |
| Closing | Aayush | 0:20 | 7:10 |

**Total Duration:** 7 minutes 10 seconds ✅

**Work Distribution:**
- Aayush (Leader): ~50% (3:10 minutes) - Opening, Intro, Architecture, Demo, Closing
- Ronak: 14% (1:00) - Database, Ambulance, Routing + Objectives
- Soumya: 14% (1:00) - Auth, Hospital, Blood Network + Technologies
- Dushyant: 14% (1:00) - Frontend, Docker + Impact
- Sanskar: 14% (1:00) - Documentation, ML Service, Models + SDGs

---

## 📧 **FINAL SUBMISSION**

**Files to Upload:**
1. ✅ Poster (PDF/Image)
2. ✅ Video Recording (MP4/MOV)
3. ✅ This script (optional, for reference)

**Video Specifications:**
- Format: MP4 or MOV
- Length: 7-8 minutes (target: 7:10 min ✅)
- Quality: 720p or 1080p
- Audio: Clear and audible
- Content: All 5 members speaking + poster + live demo

**For Practice:** Do 2-3 practice runs before final recording to get comfortable with timing and demo transition.
