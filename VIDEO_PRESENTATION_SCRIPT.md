# 🎥 MediRouteX Video Presentation Script
**Duration:** 8-9 Minutes | **Team:** 5 Members | **Recording:** Google Meet/Zoom with Screen Share

---

## 📋 **PRESENTATION SETUP INSTRUCTIONS**

### **Before Recording:**
1. **Setup Meeting:**
   - Create Google Meet or Zoom meeting
   - All 5 members join with good internet and audio
   - Test microphones and ensure clear audio

2. **Screen Share Setup:**
   - Aayush (Leader) shares screen with poster open
   - Keep poster visible throughout entire presentation
   - Point to relevant sections while speaking

3. **Recording:**
   - Start recording at beginning
   - All members speak clearly and at moderate pace
   - Pause between speakers (1-2 seconds)
   - Save recording after completion

4. **Speaking Tips:**
   - Speak clearly and confidently
   - Don't rush - take your time
   - Look at camera when speaking
   - Smile and show enthusiasm

---

## 🎬 **PRESENTATION SCRIPT (8-9 Minutes)**

### **[0:00-0:30] OPENING - AAYUSH (30 seconds)**

**[Aayush shares screen with poster visible]**

**AAYUSH:**
> "Good morning/afternoon everyone! I'm **Aayush Kumar Shrivastav**, the team leader, and this is our final year project presentation for **MediRouteX** - an AI-powered emergency medical dispatch system.
>
> With me today are my team members: **Ronak Saini**, **Soumya Goel**, **Dushyant Dubey**, and **Sanskar Mishra**. We're from CSE 3rd Year, Batch 2023-27, under the guidance of **Ms. Paramjeet Kaur**.
>
> Our project addresses a critical problem in India's emergency healthcare system, and over the next 8 minutes, we'll walk you through our solution. Let's begin!"

**[Point to Introduction section on poster]**

---

### **[0:30-2:00] INTRODUCTION - AAYUSH (1.5 minutes)**

**AAYUSH:**
> "Let me start with the problem we're solving. 
>
> **[Point to statistics on poster]**
>
> India faces a serious emergency medical response crisis. According to the Ministry of Road Transport and Highways 2023 report, we record over **1,68,000 road accident deaths annually**. The ambulance response time in our cities averages **20-30 minutes**, which is way beyond the critical Golden Hour.
>
> **[Point to key statistics]**
>
> Only **18% of emergency patients receive pre-hospital care** - compared to over 90% in developed countries. Our traditional 108 ambulance service relies on manual dispatch, which takes **5-8 minutes** just for call handling and ambulance assignment.
>
> And there's more - India faces a blood shortage of **2 million units annually**. In emergencies, finding the required blood type across hospitals can take 2-4 hours, which is often fatal.
>
> **[Gesture to solution section]**
>
> This is where **MediRouteX** comes in. Our project is an AI-powered emergency medical dispatch system built on microservices architecture. We provide:
>
> - **Automated GPS dispatch in under 30 seconds** - that's 90% faster than manual dispatch
> - **Real-time hospital bed visibility** across all wards
> - **Intelligent routing algorithms** that consider traffic conditions
> - **Blood emergency broadcast network** connecting 50+ hospitals instantly
> - And **ML-powered predictive analytics** for demand forecasting
>
> Our conservative estimates show this can save **120-200 lives per city annually** and reduce blood procurement time by 70-80%. Now let me hand it over to Ronak to explain our objectives."

---

### **[2:00-3:00] OBJECTIVES - RONAK (1 minute)**

**[Ronak speaks, Aayush keeps poster visible on objectives section]**

**RONAK:**
> "Thank you, Aayush. Hi everyone, I'm **Ronak Saini**, and I'll explain our project objectives.
>
> **[Point to Objectives section]**
>
> We have five main objectives:
>
> **First - Automated Dispatch:** We eliminate the 5-8 minute manual delay by using GPS-based ambulance assignment. Our system selects the nearest available ambulance in under 30 seconds using the Haversine distance formula, with real-time fleet tracking updated every 30 seconds.
>
> **Second - Hospital Intelligence:** We provide live bed occupancy data across ICU, Emergency, and General wards for 50+ hospitals. Our system matches emergencies with the right specialty - whether it's Trauma, Cardiac, or Stroke - using an intelligent scoring algorithm.
>
> **Third - Blood Network:** We broadcast alerts for all 8 blood types to hospitals within a 50km radius. This reduces procurement time from 2-4 hours down to just 20-45 minutes through multi-hospital coordination.
>
> **Fourth - Predictive ML:** We use three machine learning models - Random Forest for 24-hour demand forecasting, Gradient Boosting for ETA prediction with ±3 minute accuracy, and K-Means for optimal ambulance positioning.
>
> **And Fifth - Scalable Architecture:** Our system uses 6 independent microservices with PostgreSQL and Redis, supporting multi-city deployment.
>
> Our success metrics are: 99.9% uptime, under 200 millisecond API response time, handling 500+ concurrent emergencies, and ultimately saving 120-200 lives per city per year.
>
> Now, Soumya will explain the technologies we used to build this."

---

### **[3:00-4:00] TECHNOLOGIES USED - SOUMYA (1 minute)**

**[Soumya speaks, poster on Technologies section]**

**SOUMYA:**
> "Hi everyone, I'm **Soumya Goel**, and I'll walk you through our technology stack.
>
> **[Point to Technologies section on poster]**
>
> For the **frontend**, we used **React 18** with **TypeScript** for type safety, **Vite** as our build tool for super-fast development, and **Leaflet.js** for interactive maps. We used **Socket.io** for real-time communication and **Tailwind CSS** for responsive design.
>
> **[Point to Backend icons]**
>
> Our **backend** runs on **Node.js 20** with **Express** framework, also in TypeScript. We have 6 microservices - Emergency, Ambulance, Hospital, Auth, Routing, and ML services. Each service runs independently on different ports from 5001 to 5006.
>
> **[Point to ML section]**
>
> For **Machine Learning**, we used **Python 3.11** with **FastAPI** framework. Our ML libraries include **scikit-learn** for the models, **Pandas** for data manipulation, and **NumPy** for numerical computing.
>
> **[Point to Database section]**
>
> For **databases**, we use **PostgreSQL 15** as our primary database with 8 tables and 25+ indexes for fast queries. **Redis 8** handles our real-time messaging with Pub/Sub, session storage, and caching.
>
> **[Point to DevOps section]**
>
> And for **deployment**, we use **Docker** for containerization, **Nginx** as reverse proxy, and **Git/GitHub** for version control. We implemented **JWT** for authentication and **bcrypt** for secure password hashing.
>
> In total, we wrote over **70,000 lines of code** across all technologies. Now, Dushyant will explain the impact and benefits."

---

### **[4:00-5:00] IMPACT AND BENEFITS - DUSHYANT (1 minute)**

**[Dushyant speaks, poster on Impact section]**

**DUSHYANT:**
> "Thank you, Soumya. Hi, I'm **Dushyant Dubey**, and I'll explain the impact and benefits of MediRouteX.
>
> **[Point to Societal Impact]**
>
> Starting with **Societal Impact**: Our system can save **120-200 lives per city annually** by reducing response times by 20-30%. This is based on verified research that shows every minute saved in emergency response improves survival rates by 1-2%.
>
> We improve survival chances through faster trauma response, and our blood network can prevent an additional 25-35 deaths per month per city by reducing blood procurement time from hours to minutes.
>
> **[Point to Healthcare System Benefits]**
>
> For **Healthcare System Benefits**: We automate the dispatch process, eliminating 5-8 minutes of manual delay. Our real-time bed visibility prevents overcrowding, and predictive models help with staff scheduling. The blood network integrates 80+ hospitals in a coordinated system.
>
> **[Point to Economic Impact]**
>
> The **Economic Impact** is significant: We save ₹2.86 to 4.89 crores per city per year through ambulance fuel savings, reduced maintenance, and optimized hospital operations. Smart routing reduces fuel consumption by 18-25%, which also cuts CO2 emissions by 140-287 tons annually.
>
> **[Point to Data-Driven Policy]**
>
> Finally, our system provides **data insights** that help city planners identify emergency hotspots, optimize ambulance station placement, and make informed healthcare infrastructure decisions.
>
> Now, Sanskar will explain how our project aligns with UN Sustainable Development Goals."

---

### **[5:00-6:00] SUSTAINABLE DEVELOPMENT GOALS - SANSKAR (1 minute)**

**[Sanskar speaks, poster on SDGs section]**

**SANSKAR:**
> "Hi everyone, I'm **Sanskar Mishra**, and I'll explain how MediRouteX aligns with the United Nations Sustainable Development Goals.
>
> **[Point to SDG 3 icon]**
>
> Our primary alignment is with **SDG 3 - Good Health and Well-Being**. We directly contribute to Target 3.6, which aims to halve road traffic deaths by 2030. Our 20-30% faster trauma response significantly reduces preventable deaths. We also support Target 3.8 for universal health coverage by ensuring equitable ambulance dispatch regardless of location.
>
> **[Point to SDG 9 icon]**
>
> We align with **SDG 9 - Industry, Innovation, and Infrastructure** by pioneering microservices architecture in healthcare. Our AI and ML integration demonstrates innovation in life-critical decision-making. We plan to release this as open-source, making it replicable by other cities and countries.
>
> **[Point to SDG 11 icon]**
>
> For **SDG 11 - Sustainable Cities and Communities**, our smart routing reduces ambulance fuel consumption by 18-25%, saving 52,000 to 1,08,000 liters of diesel per year per city. This cuts CO2 emissions by 140-287 tons annually. Our data also helps urban planners improve emergency access and traffic safety.
>
> **[Point to SDG 17 icon]**
>
> Finally, **SDG 17 - Partnerships for the Goals**. Our system brings together government ambulance services, private hospitals, blood banks, and technology partners in a unified platform. This multi-stakeholder collaboration is essential for effective emergency response.
>
> We track our impact using official UN indicators like 3.6.1 for traffic deaths and 3.8.1 for service coverage.
>
> Now, Aayush will explain our implementation roadmap and demonstrate the system."

---

### **[6:00-8:00] SOLUTION ARCHITECTURE & ROADMAP - AAYUSH (2 minutes)**

**[Aayush continues, moves to Solution and Roadmap sections]**

**AAYUSH:**
> "Thank you, Sanskar. Let me now explain our system architecture and how we built this in just 3 months.
>
> **[Point to Proposed Solution architecture diagram]**
>
> Our architecture follows a 4-tier microservices design:
>
> **Tier 1** is the **Client Layer** - our React frontend with real-time maps and dashboards.
>
> **Tier 2** is **Nginx** serving as our API gateway and load balancer.
>
> **Tier 3** is our **6 Microservices**:
> - Emergency Service on port 5001 handles the complete emergency lifecycle with WebSocket for real-time updates
> - Ambulance Service on 5002 tracks GPS locations every 30 seconds
> - Hospital Service on 5003 manages beds and blood inventory with broadcast alerts
> - Auth Service on 5004 handles JWT authentication and role-based access
> - Routing Service on 5005 runs our intelligent algorithms for ambulance and hospital selection
> - And ML Service on 5006 provides predictive analytics
>
> **Tier 4** is our **data layer** with PostgreSQL for persistent storage and Redis for real-time messaging.
>
> **[Point to Roadmap section]**
>
> Now, our implementation roadmap. With 5 team members, we completed this in 3 months:
>
> **Month 1** was Design and Setup. We divided the work - I handled architecture design and API contracts. Ronak set up the database schema. Soumya built the authentication service. Dushyant configured our development environment and Docker. And Sanskar created all our documentation and diagrams. By end of month 1, we had our complete architecture, database, and auth service ready.
>
> **Month 2** was Core Development, and this is where we worked in parallel. I built the Emergency Service with WebSocket integration. Ronak developed the Ambulance and Routing services. Soumya built the Hospital Service and blood network. Dushyant created our entire React frontend with maps and dashboards. And Sanskar built the ML Service and frontend components. In this month, we wrote 70,478 lines of code.
>
> **Month 3** was ML, Testing, and Deployment. Sanskar and I trained our three ML models - Random Forest achieving 1.8 MAE for demand forecasting, Gradient Boosting with 2.7 minutes RMSE for ETA prediction, and K-Means identifying 10 optimal ambulance positions. Ronak and Soumya handled integration testing and security audits. Dushyant set up Docker deployment. And we all worked together on presentation preparation.
>
> **[Gesture to overall poster]**
>
> The result? A production-ready system with 6 microservices, 3 ML models, Docker deployment, and complete documentation. We achieved 99.9% uptime target, sub-200ms API response times, and the ability to handle 500+ concurrent emergencies.
>
> **[Optional: If you have a demo ready]**
> We also have a working demo deployed locally that I can show if time permits.
>
> This system is ready for pilot deployment, and our future roadmap includes cloud deployment on AWS, mobile apps for drivers, and multi-city expansion."

---

### **[8:00-8:30] CLOSING - AAYUSH (30 seconds)**

**AAYUSH:**
> "To conclude, MediRouteX is more than just a technical project - it's a solution that can save lives. By reducing emergency response times, optimizing blood procurement, and enabling data-driven healthcare decisions, we're contributing to a future where no one dies waiting for an ambulance.
>
> **[Point to team names on poster]**
>
> This was truly a team effort. Each member contributed their expertise - from backend development to frontend design, from ML models to deployment infrastructure.
>
> **[Face camera]**
>
> We're excited about the potential impact of this project and hope to see it deployed in real-world scenarios soon. Thank you for your time and attention. We're now open to any questions you may have."

**[All team members wave or nod at camera]**

**[Stop recording]**

---

## 📝 **SPEAKER NOTES & TIPS**

### **For Aayush (Leader - 4 minutes total):**
- You handle the complex technical parts: architecture, development process, ML details
- Speak confidently about the codebase since you built most of it
- Use specific numbers: 70,478 lines, 6 microservices, 42,500 backend lines
- Point to poster sections while speaking
- Control the pace - you're the anchor

### **For Ronak (1 minute):**
- Focus on WHAT the objectives are, not HOW they work technically
- Read the objectives clearly and slowly
- Point to each objective on poster as you mention it
- You don't need to explain algorithms in depth - just mention them
- Confidence tip: You're just listing our goals, which is straightforward!

### **For Soumya (1 minute):**
- List the technologies like you're reading a shopping list
- Don't worry about explaining what each tech does in detail
- Point to the technology logos on the poster
- Mention the big number: "70,000+ lines of code"
- Confidence tip: Just read the tech stack - no need to be an expert on each!

### **For Dushyant (1 minute):**
- Focus on the IMPACT numbers - lives saved, money saved, efficiency gains
- These are the "so what?" benefits that non-technical people understand
- Point to each impact category as you speak
- Use emphasis on big numbers: "120-200 LIVES" "₹4.89 CRORES saved"
- Confidence tip: You're sharing the good news - the benefits!

### **For Sanskar (1 minute):**
- SDGs are simple - just explain how we help each goal
- Point to the 4 SDG icons on poster (3, 9, 11, 17)
- Connect each SDG to one simple benefit
- This is the "why it matters globally" section
- Confidence tip: You're explaining how we help the world - feel proud!

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
| Opening | Aayush | 0:30 | 0:30 |
| Introduction | Aayush | 1:30 | 2:00 |
| Objectives | Ronak | 1:00 | 3:00 |
| Technologies | Soumya | 1:00 | 4:00 |
| Impact | Dushyant | 1:00 | 5:00 |
| SDGs | Sanskar | 1:00 | 6:00 |
| Solution & Roadmap | Aayush | 2:00 | 8:00 |
| Closing | Aayush | 0:30 | 8:30 |

**Total Duration:** 8 minutes 30 seconds ✅

**Work Distribution:**
- Aayush (Leader): 50% (4 minutes)
- Ronak: 12.5% (1 minute)
- Soumya: 12.5% (1 minute)
- Dushyant: 12.5% (1 minute)
- Sanskar: 12.5% (1 minute)

---

## 💡 **EMERGENCY BACKUP PLANS**

### **If Someone's Audio Fails:**
- That person types their part in chat
- Aayush reads it on their behalf
- Mention: "[Name] is experiencing technical difficulties, I'll read their part"

### **If Video is Too Long (>10 min):**
- Cut some examples from Aayush's sections
- Speak slightly faster (but stay clear)
- Skip the optional demo mention

### **If Video is Too Short (<5 min):**
- Aayush adds 1-2 sentences to each major section
- Add brief pauses between speakers
- Mention 1-2 additional statistics

### **If Someone Forgets Their Lines:**
- Keep the script open on another screen
- It's okay to read from script - this isn't live!
- Can pause recording and start that section again

---

## 📧 **FINAL SUBMISSION**

**Files to Upload:**
1. ✅ Poster (PDF/Image)
2. ✅ Video Recording (MP4/MOV)
3. ✅ This script (optional, for reference)

**Video Specifications:**
- Format: MP4 or MOV
- Length: 5-10 minutes (yours is ~8.5 min ✅)
- Quality: 720p or 1080p
- Audio: Clear and audible
- Content: All 5 members speaking + poster visible

---

## 🎬 **GOOD LUCK!**

**Remember:**
- Speak clearly and confidently
- Point to poster sections while speaking
- Don't rush - take your time
- Smile and show enthusiasm
- This is YOUR project - be proud!

**You've built something amazing that can save lives. Now go show it! 🚀**

---

**For Questions/Practice:** Team can do 2-3 practice runs before final recording to get comfortable with timing and flow.
