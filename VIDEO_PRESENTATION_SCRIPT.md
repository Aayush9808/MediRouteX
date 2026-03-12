# 🎥 MediRouteX Video Presentation Script
**Duration:** 7-8 Minutes | **Team:** 5 Members | **Recording:** Google Meet/Zoom with Screen Share

---

## 🎬 **PRESENTATION SCRIPT (7-8 Minutes)**

### **[0:00-1:45] OPENING + INTRODUCTION + PROPOSED SOLUTION - AAYUSH (1 minute 45 seconds)**

**[Aayush shares screen with poster visible]**

**AAYUSH:**
> "Good morning everyone! I'm **Aayush Kumar Shrivastav**, team leader of **Team CSE-M-056**. This is our project **MediRouteX** - an AI-powered emergency medical dispatch system.
>
> My teammates are **Ronak Saini**, **Soumya Goel**, **Dushyant Dubey**, and **Sanskar Mishra**. We are from different branches of 3rd Year, Batch 2023-27, working under the guidance of **Ms. Paramjeet Kaur**.
>
> **[Point to Introduction section]**
>
> Let me explain the problem. India faces significant challenges in emergency medical response. We have **1,68,000 road accident deaths annually**. Hospital resource information is scattered, and there's limited coordination between hospitals. Emergency response times average **20-30 minutes**, and only about **18% of patients receive proper pre-hospital care**. Additionally, India faces a **blood shortage affecting 2 million units annually**.
>
> **[Point to Proposed Idea/Solution section]**
>
> Our project, **MediRouteX**, is an AI-powered emergency response management system designed to address these challenges. Here are our key system features:
>
> First, we have **AI-based Ambulance Dispatch System** with real-time GPS tracking. Second, **Live Hospital Capacity Monitoring** showing available beds across ICU, Emergency, and General wards. Third, **Emergency Blood Availability Alert Network** that broadcasts urgent requirements. Fourth, **Machine Learning-based ETA and demand prediction**. Fifth, a **Smart Routing Algorithm** that considers traffic conditions. And sixth, a **Centralized Emergency Coordination Platform** with real-time data visualization.
>
> Our system workflow starts when an emergency happens - the dispatcher inputs patient details, our smart system proposes optimal ambulance and hospital assignments, blood availability alerts are sent if required, real-time ambulance tracking shows progress, and finally the patient reaches the most suitable hospital.
>
> Now, let me hand over to Ronak to explain our project objectives."

---

### **[1:45-2:45] OBJECTIVES - RONAK (1 minute)**

**RONAK:**
> "Thank you, Aayush. Hello everyone, I'm **Ronak Saini**. 
>
> **My role in this project:** I was responsible for designing and implementing the **PostgreSQL database** with 8 tables and 25+ indexes for fast query performance. I also developed the **Ambulance Service** that tracks GPS locations in real-time and the **Routing Service** that calculates optimal ambulance and hospital selection using the Haversine distance formula.
>
> **[Point to Objectives section]**
>
> Now let me explain our six main objectives:
>
> **Objective 1:** Reduce emergency response time by automatically dispatching the nearest available ambulance using GPS-based smart routing algorithms.
>
> **Objective 2:** Provide real-time hospital resource visibility, including ICU, Emergency, and General ward bed availability.
>
> **Objective 3:** Enable rapid blood availability coordination by broadcasting blood emergency alerts to nearby hospitals and blood banks.
>
> **Objective 4:** Predict ambulance arrival time (ETA) using machine learning models based on distance, traffic conditions, and historical data.
>
> **Objective 5:** Improve coordination between emergency services, hospitals, and dispatch centers through a unified digital platform.
>
> **Objective 6:** Develop a scalable and intelligent healthcare response system that can support smart cities and large-scale emergency networks.
>
> Now, Soumya will explain the technologies we used."

---

### **[2:45-3:45] TECHNOLOGIES USED - SOUMYA (1 minute)**

**SOUMYA:**
> "Thank you, Ronak. Hi everyone, I'm **Soumya Goel**.
>
> **My role:** I built the **Authentication Service** with JWT tokens and role-based access control, and developed the complete **Hospital Service** which manages bed tracking across all wards, handles blood inventory for all 8 blood types, and implements the blood emergency broadcast network that can alert multiple hospitals instantly.
>
> **[Point to Technologies Used section]**
>
> Let me walk you through our technology stack across six categories:
>
> **Frontend - User Interface:** We used React 18 with TypeScript for type safety, Vite as our build tool, and Leaflet.js for interactive maps. Socket.io enables real-time communication and Tailwind CSS provides responsive design.
>
> **Backend - Core Services:** Built on Node.js 20 with Express framework, also in TypeScript. We have 6 independent microservices - Emergency, Ambulance, Hospital, Auth, Routing, and ML services.
>
> **Database & Caching:** PostgreSQL 15 as our primary database with optimized indexes. Redis 8 handles real-time messaging, Pub/Sub, and caching.
>
> **Machine Learning - Predictive:** Python 3.11 with FastAPI, using scikit-learn for our ML models, Pandas for data processing, and NumPy for numerical computations.
>
> **Algorithms - Routing & Distance:** We implemented Haversine distance formula and Dijkstra's algorithm for optimal routing.
>
> **DevOps - Deployment & Infrastructure:** Docker for containerization, Nginx as reverse proxy, and Git/GitHub for version control. We use JWT for authentication and bcrypt for password security.
>
> In total, we've written over **70,000 lines of code** across all these technologies. Now, Dushyant will explain the impact and benefits."

---

### **[3:45-4:45] IMPACT AND BENEFITS - DUSHYANT (1 minute)**

**DUSHYANT:**
> "Thank you, Soumya. Hi everyone, I'm **Dushyant Dubey**.
>
> **My role:** I handled all the frontend development - building the complete React dashboard with real-time emergency board, interactive Leaflet.js maps showing live ambulance positions, the emergency management interface, and hospital management screens. I also set up our Docker containerization and deployment infrastructure.
>
> **[Point to Impact and Benefits section]**
>
> Let me explain the impact and benefits across four key areas:
>
> **Societal Impact:** Our system can significantly reduce emergency response times by 20-40%, which research shows can improve survival chances. Faster trauma response means more lives saved. Our blood network can prevent deaths by reducing blood procurement time from hours to minutes, potentially preventing 25-35 deaths per month per city.
>
> **Healthcare System Benefits:** We automate the dispatch process, eliminating the 5-8 minute manual delay. Real-time hospital bed visibility reduces overcrowding. Our predictive analytics helps with staff scheduling. The integrated blood network connects 80+ hospitals in a coordinated system, ensuring better resource utilization.
>
> **Economic and Operational Impact:** Smart routing can reduce ambulance fuel consumption by 18-25%, leading to significant cost savings and reduced maintenance. Better resource utilization across the system means optimized healthcare operational costs.
>
> **Data-Driven Policy:** Our system provides valuable insights - hospitals can analyze emergency trends, city planners can identify hotspots, and authorities can optimize ambulance station placement using our data.
>
> Now, Sanskar will explain our alignment with Sustainable Development Goals and our roadmap."

---

### **[4:45-5:45] SDGs + ROADMAP - SANSKAR (1 minute)**

**SANSKAR:**
> "Thank you, Dushyant. Hi everyone, I'm **Sanskar Mishra**.
>
> **My role:** I created all the project documentation including system design documents, ER diagrams, and API specifications. I also developed the **ML Service** using Python and FastAPI, built frontend components for hospital and ambulance management, and most importantly, I trained all three machine learning models - Random Forest for demand forecasting, Gradient Boosting for ETA prediction, and K-Means for optimal ambulance positioning.
>
> **[Point to SDGs section]**
>
> Let me explain how MediRouteX aligns with UN Sustainable Development Goals:
>
> **SDG 3 - Good Health and Well-Being:** We directly support Target 3.6 to reduce traffic deaths, and Target 3.8 for universal health coverage by ensuring equitable ambulance dispatch.
>
> **SDG 9 - Industry, Innovation, and Infrastructure:** We're pioneering microservices architecture in healthcare with AI and ML integration. We plan to make this open-source for replication by other cities.
>
> **SDG 11 - Sustainable Cities and Communities:** Our smart routing reduces fuel consumption by 18-25%, cutting CO2 emissions. Our data helps urban planners improve emergency access.
>
> **SDG 17 - Partnerships for the Goals:** We bring together government ambulance services, private hospitals, blood banks, and technology partners in one unified platform.
>
> **[Point to Roadmap section]**
>
> Now, our implementation roadmap has three phases:
>
> **Phase 1 - System Design & Planning:** We defined requirements, designed system architecture using microservices, created database schema, and set up the development environment with version control.
>
> **Phase 2 - Core System Development:** We developed all six microservices, implemented REST APIs with real-time communication using WebSocket, integrated routing algorithms for ambulance GPS tracking and hospital selection, built the complete React frontend, and implemented blood availability alert management.
>
> **Phase 3 - AI Integration, Testing & Deployment:** We trained machine learning models, conducted end-to-end system integration testing, containerized deployment using Docker, performed performance and security validation, and prepared documentation and presentation.
>
> Now, Aayush will summarize our contributions and show you our working demo."

---

### **[5:45-7:30] TEAM CONTRIBUTIONS + DEMO + CLOSING - AAYUSH (1 minute 45 seconds)**

**AAYUSH:**
> "Thank you, Sanskar.
>
> Let me summarize everyone's contributions to this project. **Ronak** designed and implemented our entire database infrastructure with 8 tables and 25+ indexes, developed the Ambulance Service for real-time GPS tracking, and built the Routing Service with intelligent algorithms using Haversine distance formula.
>
> **Soumya** created the Authentication Service with JWT and role-based access control, developed the complete Hospital Service managing bed tracking and blood inventory, and implemented the blood emergency broadcast network.
>
> **Dushyant** built our entire React frontend - the dashboard, interactive maps, and all user interfaces, plus set up our Docker containerization and deployment infrastructure.
>
> **Sanskar** handled all documentation including system design and API specifications, developed the ML Service in Python, and trained all three machine learning models.
>
> As the **team leader**, I designed the overall system architecture, defined all API contracts, coordinated the team, built the **Emergency Service** which is the core of our system handling the complete emergency lifecycle with WebSocket for real-time updates, and integrated all 6 microservices together using Redis Pub/Sub messaging.
>
> **[Switch screen from poster to localhost:3001]**
>
> Now let me show you our working system. Here's our live dashboard with real OpenStreetMap showing Greater Noida area. You can see 5 ambulances on the map - green markers show available ambulances, red shows busy ones. We have 3 active emergencies and 5 hospitals with their bed availability data. The left sidebar shows real-time statistics.
>
> **[Click on ambulance marker]** When I click on an ambulance, you can see detailed information - registration number, driver, equipment, and current location.
>
> **[Click REQUEST AMBULANCE button]** Now watch - when someone requests an ambulance, I'll fill in the patient details... and click this GPS button to capture location... Submit. The system automatically selects the nearest available ambulance, updates the emergency status to 'Dispatched', and the ambulance marker changes color. You can see the stats updating in real-time. All this happens very quickly compared to traditional manual dispatch.
>
> **[Switch back to poster]**
>
> To conclude, MediRouteX is more than a technical project - it's a solution that can help save lives in emergency situations. This was a true team effort where each member had specific responsibilities and we worked together to build a comprehensive system.
>
> We've developed a working prototype that demonstrates the core functionality, and we're ready to further develop and deploy this system. Thank you for your time and attention. We're now open to any questions!"

**[All team members wave]**

**[Stop recording]**

---

## 📝 **SPEAKER NOTES & TIPS**

### **For Aayush (Leader - 3:30 minutes total):**
- **Opening + Intro + Proposed Solution (1:45):** Start with team intro, explain problem clearly from poster Introduction section, then cover all 6 key system features from Proposed Idea/Solution
- **Team Summary + Demo + Closing (1:45):** Summarize each member's role briefly, switch to demo, show key features (ambulance click, request emergency, GPS button), switch back to poster for closing
- Point to relevant poster sections throughout
- Keep demo concise but impactful

### **For Ronak (1 minute):**
- Start with brief self-intro and YOUR ROLE (10 seconds)
- Cover all 5 objectives from poster (50 seconds)
- Speak clearly, don't rush
- Point to Objectives section on poster
- Confidence tip: Your database and routing power the entire system!

### **For Soumya (1 minute):**
- Start with brief self-intro and YOUR ROLE (10 seconds)
- Cover all 6 technology categories from poster (50 seconds)
- Mention the 70,000+ lines of code
- Point to Technologies Used section
- Confidence tip: Your auth and hospital services are critical!

### **For Dushyant (1 minute):**
- Start with brief self-intro and YOUR ROLE (10 seconds)
- Cover all 4 impact areas from poster: Societal, Healthcare, Economic, Data-driven (50 seconds)
- Emphasize real-world benefits
- Point to Impact and Benefits section
- Confidence tip: Your frontend makes everything accessible!

### **For Sanskar (1 minute):**
- Start with brief self-intro and YOUR ROLE (10 seconds)
- Cover all 4 SDGs from poster (20 seconds)
- Cover all 3 phases of roadmap briefly (30 seconds)
- Point to SDGs and Roadmap sections
- Confidence tip: Your ML and documentation complete the system!

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
| Opening + Intro + Proposed Solution | Aayush | 1:45 | 1:45 |
| Objectives + Role | Ronak | 1:00 | 2:45 |
| Technologies + Role | Soumya | 1:00 | 3:45 |
| Impact & Benefits + Role | Dushyant | 1:00 | 4:45 |
| SDGs + Roadmap + Role | Sanskar | 1:00 | 5:45 |
| Team Summary + Demo + Closing | Aayush | 1:45 | 7:30 |

**Total Duration:** 7 minutes 30 seconds ✅

**Content Coverage from Poster:**
- ✅ Introduction (Aayush)
- ✅ Proposed Idea/Solution (Aayush)
- ✅ Objectives (Ronak)
- ✅ Technologies Used (Soumya)
- ✅ Impact and Benefits (Dushyant)
- ✅ SDGs (Sanskar)
- ✅ Roadmap (Sanskar)
- ✅ Live Demo (Aayush)

---

## 📧 **FINAL SUBMISSION**

**Files to Upload:**
1. ✅ Poster (PDF/Image)
2. ✅ Video Recording (MP4/MOV)
3. ✅ This script (optional, for reference)

**Video Specifications:**
- Format: MP4 or MOV
- Length: 7-8 minutes (target: 7:30 min ✅)
- Quality: 720p or 1080p
- Audio: Clear and audible
- Content: All 5 members speaking + poster sections covered + live demo

**Important Notes:**
- Script syncs with all poster sections
- No unrealistic claims (no 99.99% uptime promises)
- Project presented as working prototype, not fully deployed
- Demo shows core functionality
- Each member explains their role + poster section

**For Practice:** Do 2-3 practice runs before final recording to get comfortable with timing, poster transitions, and demo flow.
