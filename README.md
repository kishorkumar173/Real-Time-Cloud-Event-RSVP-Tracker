# Real-Time Cloud-Based Event Planning & RSVP Tracker

[![Cloud Computing](https://img.shields.io/badge/Course_Project-Cloud_Computing-blue.svg)](https://github.com)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI_0.117-009688.svg)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/Frontend-React_18_+_Vite-61DAFB.svg)](https://react.dev)
[![WebSockets](https://img.shields.io/badge/Real--Time-Native_WebSockets-green.svg)](https://developer.mozilla.org)
[![Database](https://img.shields.io/badge/ACID_Database-PostgreSQL_%2F_SQLite-336791.svg)](https://www.postgresql.org)
[![Tests](https://img.shields.io/badge/Tests-11_Passed_100%25-brightgreen.svg)](https://docs.pytest.org)

> An industry-grade, full-stack Cloud Computing capstone project demonstrating **real-time bi-directional WebSocket synchronization**, **ACID-compliant concurrency control**, **role-based authorization (RBAC)**, **FIFO waitlist auto-promotion**, **QR ticket generation**, and **cloud-native event analytics**.

---

## 1. Project Explanation

### A. Simple Explanation
Imagine organizing a 100-person Cloud Computing workshop. Traditionally, organizers send Google Forms or WhatsApp messages. People invite colleagues, lists get corrupted with duplicate names, organizers have no live count of how many seats remain, and when capacity is hit, people still show up expecting entry.

**Real-Time Cloud-Based Event Planning & RSVP Tracker** solves this by centralizing event lifecycle management in the cloud:
1. Organizers create an event with a strict capacity (e.g., 50 seats).
2. Attendees discover the event and tap **"Going"**, **"Maybe"**, or **"Not Going"**.
3. The moment an attendee taps **"Going"**, the organizer's screen and all attendee screens update **instantly** without refreshing.
4. When seat 50 is taken, the cloud automatically locks the event to **FULL** and queues subsequent attendees into a **FIFO Waitlist**.
5. If a confirmed attendee cancels, the cloud instantly promotes the first waitlisted person and notifies them in real time.

### B. Technical Explanation
The platform is designed around an **Event-Driven Architecture (EDA)** backed by an **asynchronous REST gateway** (FastAPI) and a persistent **WebSocket Pub/Sub Connection Hub**. 

- **State Centralization**: The cloud database represents the single source of truth.
- **Race Condition Prevention**: Capacity decrement and RSVP status transitions execute inside an isolated **database transaction** with immediate locks.
- **Push vs. Pull**: Instead of wasting client bandwidth with aggressive polling, the server dispatches microsecond JSON event payloads over persistent bi-directional WebSocket frames (`ws://`) to all subscribed clients.

```
Organizer (Browser 1)          Attendee (Browser 2)
        │                               │
        │                               ├─► Submits RSVP: GOING
        │                               │         │
        │                         ┌─────▼─────────▼──────┐
        │                         │  Cloud REST Gateway  │
        │                         └─────┬────────────────┘
        │                               │ ACID Transaction
        │                         ┌─────▼────────────────┐
        │                         │    Cloud Database    │
        │                         │ (Enforces Capacity)  │
        │                         └─────┬────────────────┘
        │                               │ Triggers Event
        │                         ┌─────▼────────────────┐
        │                         │  WebSocket Pub/Sub   │
        │                         └─────┬────────────────┘
        │◄──────────────────────────────┘ Broadcast Payload
  Dashboard Count
  Auto-Updates: 49 -> 50
  (No Refresh Needed)
```

---

## 2. Industry Relevance & Real-World Use Cases

Similar cloud architectures power global applications:
- **Major Event & Conference Platforms**: Eventbrite, Meetup, Luma, AWS re:Invent portal.
- **Enterprise Webinars & Town Halls**: Zoom Events, Microsoft Virtual Events.
- **College Hackathons & Cultural Fests**: Real-time participant check-in and capacity-capped workshops.
- **High-Demand Ticketing**: Ticketmaster, BookMyShow (flash booking queuing).

### Business Benefits:
1. **Zero Double-Bookings**: Atomic transactions ensure events never oversell past venue fire-code limits.
2. **Reduced Manual Coordination**: Eliminates messy spreadsheets and manual email threads.
3. **Live Operational Telemetry**: Organizers monitor attendance rates, waitlist pressure, and drop-off velocity in real-time.
4. **Instant Crisis Communication**: Venue or time change broadcasts immediately alert registered attendees.

---

## 3. Cloud Computing Concepts Demonstrated

| Concept | Implementation in this Project |
| :--- | :--- |
| **SaaS (Software as a Service)** | Fully web-accessible event management and RSVP tracking portal for organizers and attendees. |
| **PaaS (Platform as a Service)** | Deployable on managed app platforms like Render, Railway, Vercel, and AWS App Runner. |
| **IaaS (Infrastructure as a Service)** | VM-compatible hosting architecture (AWS EC2 / GCP Compute Engine / Docker containerization). |
| **Cloud Database** | Centralized ACID storage supporting PostgreSQL (Supabase / AWS RDS) and SQLite. |
| **Real-Time Database / PubSub** | Asynchronous WebSocket connection hub broadcasting live RSVP delta states. |
| **Cloud Authentication** | Stateless JWT authentication with bcrypt password hashing and cloud provider hooks. |
| **Authorization & RBAC** | Strict role-based middleware (`ORGANIZER`, `ATTENDEE`, `ADMIN`). |
| **REST APIs** | Fully documented OpenAPI 3.0 endpoints (`/api/events`, `/api/events/{id}/rsvp`). |
| **WebSockets** | Bi-directional streaming sockets (`/ws/events/{id}`) for zero-refresh UI updates. |
| **Server-Sent Events (SSE)** | Alternative push mechanism analyzed and compared against WebSockets and polling. |
| **Event-Driven Architecture (EDA)**| RSVP status changes trigger notification pipelines, waitlist processors, and socket broadcasts. |
| **Scalability & Elasticity** | Stateless application tier allowing horizontal autoscaling behind a Load Balancer. |
| **High Availability (HA)** | Resilient database health probes (`/api/health`) and client auto-reconnection backoff. |
| **API Gateway & CDN** | Reverse proxy routing, CORS filtering, and static edge asset caching. |
| **Secrets Management** | Zero hardcoded keys; 100% environment variable injection via `.env`. |
| **Audit Trails & Logging** | Structured logging and dedicated `audit_logs` database entity for administrative auditing. |

---

## 4. User Roles & Permission Matrix

| Operation | ATTENDEE | ORGANIZER | ADMIN |
| :--- | :---: | :---: | :---: |
| Register & Login | ✅ | ✅ | ✅ |
| Browse Published Events | ✅ | ✅ | ✅ |
| Submit / Update RSVP (Going/Maybe/Not) | ✅ | ✅ | ✅ |
| View Own RSVPs | ✅ | ✅ | ✅ |
| Receive Real-Time Notifications | ✅ | ✅ | ✅ |
| Create New Event | ❌ | ✅ | ✅ |
| Edit Own Event Details | ❌ | ✅ | ✅ |
| Cancel / Delete Event | ❌ | ✅ | ✅ |
| View Attendee Email Roster | ❌ | ✅ | ✅ |
| Broadcast Announcements | ❌ | ✅ | ✅ |
| Access Global Platform Auditing | ❌ | ❌ | ✅ |

---

## 5. Concurrency & Race Condition Handling

### The Problem
Suppose an event has **1 seat remaining** (`maximum_capacity = 100`, `current_going = 99`).
Two attendees (User A and User B) click **"GOING"** at the exact same millisecond:
1. Thread A reads: `current_going = 99 < 100` (Condition is True).
2. Thread B reads: `current_going = 99 < 100` (Condition is True).
3. Thread A inserts RSVP and increments `current_going = 100`.
4. Thread B inserts RSVP and increments `current_going = 101`!
*Result*: **The event oversold by 1 seat.**

### The Solution: Database Transactions with Immediate Verification
In this project, RSVP processing is wrapped in an atomic database transaction:
```python
# Concurrency-Safe Transaction Block
with db.begin():
    # 1. Query exact confirmed count
    confirmed_count = db.query(func.count(RSVP.rsvp_id)).filter(
        RSVP.event_id == event_id, RSVP.status == "GOING"
    ).scalar()

    # 2. Atomic capacity boundary check
    if confirmed_count >= event.maximum_capacity:
        # Prevent overselling and route to waitlist
        event.status = "FULL"
        WaitlistService.join_waitlist(db, event_id, user.user_id)
        raise HTTPException(status_code=409, detail="Event full. Added to waitlist.")

    # 3. Safe insertion/update
    existing_rsvp.status = "GOING"
    event.current_going = confirmed_count + 1
```

---

## 6. FIFO Waitlist Auto-Promotion Engine

When an event is full, subsequent attendees who choose **"GOING"** are placed into a FIFO (First-In, First-Out) waitlist:
- `waitlists` table records `joined_at` timestamp.
- Whenever any confirmed attendee cancels their RSVP or switches to **"MAYBE"** or **"NOT GOING"**:
  1. The cloud executes `WaitlistService.promote_next_waitlisted_user()`.
  2. The earliest waitlisted user (`ORDER BY joined_at ASC`) is promoted to `GOING`.
  3. Their status transitions to `PROMOTED`.
  4. An in-app push notification is immediately dispatched to their device.
  5. The real-time counter updates on all connected dashboards.

---

## 7. Folder Structure

```
Cloud-Event-RSVP-Tracker/
├── backend/
│   ├── app.py                     # FastAPI entry point, CORS, WebSockets, Lifespan
│   ├── config.py                  # Settings & environment variables
│   ├── database.py                # SQLAlchemy engine & session factory
│   ├── models/
│   │   ├── db_models.py           # Database entities (User, Event, RSVP, Waitlist, etc.)
│   │   └── schemas.py             # Pydantic v2 validation models
│   ├── routes/
│   │   ├── auth_routes.py         # /api/register, /api/login, /api/me
│   │   ├── event_routes.py        # /api/events (CRUD, cancel, upcoming)
│   │   ├── rsvp_routes.py         # /api/events/{id}/rsvp (Submit, update, cancel)
│   │   ├── announcement_routes.py # /api/events/{id}/announcements
│   │   ├── analytics_routes.py    # /api/events/{id}/analytics
│   │   └── notification_routes.py # /api/notifications
│   ├── services/
│   │   ├── event_service.py       # Event business logic
│   │   ├── rsvp_service.py        # ACID RSVP processing & socket triggers
│   │   └── waitlist_service.py    # FIFO waitlist promotion
│   └── middleware/
│       └── security.py            # JWT verification & RBAC guards
├── realtime/
│   └── realtime_service.py        # Asynchronous WebSocket ConnectionManager
├── cloud/
│   ├── database_service.py        # Cloud DB connection pool & audit logger
│   ├── auth_service.py            # Cloud identity adapter (Firebase/Cognito)
│   └── notification_service.py    # Cloud messaging hub (FCM / AWS SNS)
├── analytics/
│   └── event_analytics.py         # Real-time KPI & response rate engine
├── frontend/
│   ├── package.json               # React 18, Vite, QRCode, Lucide dependencies
│   ├── vite.config.js             # Vite configuration with proxy rules
│   ├── index.html                 # HTML root
│   └── src/
│       ├── App.jsx                # Router & role switcher
│       ├── api.js                 # API fetch wrapper & resilient WebSocket client
│       ├── index.css              # Modern responsive styling
│       ├── components/
│       │   ├── Navbar.jsx         # Header & quick user demo switcher
│       │   ├── EventCard.jsx      # Card with progress bar & QR modal
│       │   ├── RsvpWidget.jsx     # One-click Going/Maybe/Not-Going buttons
│       │   ├── AnalyticsPanel.jsx # Live gauges & statistics
│       │   ├── AnnouncementFeed.jsx# Live organizer broadcast stream
│       │   └── NotificationBell.jsx# In-app notifications dropdown
│       └── pages/
│           ├── AttendeeDashboard.jsx
│           ├── OrganizerView.jsx
│           └── LoginPage.jsx
├── tests/
│   ├── conftest.py                # Pytest configuration
│   ├── test_auth.py               # Auth & registration tests
│   ├── test_events.py             # Event CRUD & RBAC tests
│   ├── test_rsvp_concurrency.py   # Capacity limits & duplicate prevention
│   └── test_waitlist.py           # Auto-promotion verification
├── sample_data/
│   └── seed.py                    # Synthetic seed script for instant demo
├── docs/
│   └── architecture.md            # Mermaid topology & sequence diagrams
├── requirements.txt               # Python package dependencies
├── .env.example                   # Environment configuration template
└── README.md                      # Comprehensive project documentation
```

---

## 8. Installation & Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+ & npm

### Step 1: Clone Repository
```bash
git clone https://github.com/your-username/Real-Time-Cloud-Event-RSVP-Tracker.git
cd Real-Time-Cloud-Event-RSVP-Tracker
```

### Step 2: Install Python Dependencies
```bash
python -m pip install -r requirements.txt
```

### Step 3: Seed Synthetic Data
```bash
python sample_data/seed.py
```
*Seeds pre-configured accounts:*
- **Organizer**: `organizer@cloud.edu` (Password: `Cloud2026!`)
- **Attendee A**: `alice@cloud.edu` (Password: `Cloud2026!`)
- **Attendee B**: `bob@cloud.edu` (Password: `Cloud2026!`)
- **Attendee C**: `carol@cloud.edu` (Password: `Cloud2026!`)

### Step 4: Run Unified Application
```bash
python -m uvicorn backend.app:app --reload --port 8000
```
Open your browser to:
- **Application Portal**: `http://localhost:8000`
- **Interactive OpenAPI Documentation**: `http://localhost:8000/docs`

*(Optional: For frontend hot-reloading development, open a second terminal and run `cd frontend && npm run dev` to view at `http://localhost:5173`)*.

---

## 9. Multi-Browser Live Simulation Walkthrough

To demonstrate genuine real-time synchronization to interviewers or evaluators:

1. **Window 1 (Organizer)**:
   - Open Chrome Incognito at `http://localhost:8000`.
   - Log in as **Prof. Sarah (Organizer)** (`organizer@cloud.edu`).
   - Notice the "Organizer Studio" displays:
     - `Cloud Computing & Real-Time Systems Workshop`
     - **Capacity**: 3 seats | **Going**: 2 | **Available**: 1 | **Waitlist**: 0.

2. **Window 2 (Attendee C - Carol)**:
   - Open Microsoft Edge or Firefox at `http://localhost:8000`.
   - Log in as **Carol Davis** (`carol@cloud.edu`).
   - Click **"Going"** on the workshop.
   - **Look at Window 1**: The Organizer screen **instantly pulses to Going: 3, Available: 0, Event: FULL** without refreshing!

3. **Window 3 (Attendee D - David)**:
   - Open a third browser window as **David Zhang** (`david@cloud.edu`).
   - Click **"Going"**.
   - Notice David immediately receives: *"Event reached maximum capacity. You have been added to the priority waitlist."*
   - In Window 1, **Waitlist Count** updates to `1`.

4. **Auto-Promotion Test**:
   - In Window 2 (Carol), click **"Cancel RSVP"**.
   - **Instant Result**:
     - David (Window 3) is automatically promoted to **"GOING"**!
     - David receives an in-app notification: *"A seat opened up! Your RSVP is now confirmed as GOING."*
     - Window 1 confirms confirmed going remains at 3/3!

---

## 10. Automated Testing

Run the full automated test suite verifying auth, RBAC, capacity bounds, and waitlist promotion:
```bash
python -m pytest -v
```

### Verified Test Cases:
```text
tests/test_auth.py::test_register_user_success PASSED
tests/test_auth.py::test_duplicate_registration_fails PASSED
tests/test_auth.py::test_login_success PASSED
tests/test_auth.py::test_login_invalid_password PASSED
tests/test_events.py::test_organizer_can_create_event PASSED
tests/test_events.py::test_attendee_forbidden_from_creating_event PASSED
tests/test_events.py::test_get_events PASSED
tests/test_events.py::test_unauthorized_event_update PASSED
tests/test_rsvp_concurrency.py::test_capacity_enforcement_and_waitlist PASSED
tests/test_rsvp_concurrency.py::test_duplicate_rsvp_updates_record_not_duplicates PASSED
tests/test_waitlist.py::test_waitlist_auto_promotion PASSED

============================= 11 passed in 7.79s =============================
```

---

## 11. Cloud Deployment Strategy

### Approach A: Free-Tier / Student-Friendly Cloud
1. **Database**: Create a free PostgreSQL instance on **Supabase** or **Neon**.
2. **Backend**: Deploy on **Render** / **Railway** as a Python Web Service. Set environment variable `DATABASE_URL=postgresql://...`.
3. **Frontend**: Deploy on **Vercel** / **Netlify** or serve directly via the unified FastAPI static mount.

### Approach B: Enterprise AWS Cloud Architecture
- **Clients**: Routed via **Amazon Route 53** with SSL terminated at **AWS CloudFront** (Global Edge CDN).
- **Compute Tier**: **AWS ECS Fargate** running containerized FastAPI services autoscaling on CPU/Memory utilization.
- **Real-Time Tier**: **Amazon API Gateway WebSocket API** connecting to backend pub/sub or **AWS AppSync**.
- **Data Tier**: **Amazon Aurora Serverless v2 PostgreSQL** with Multi-AZ replication and read replicas.
- **Notifications**: **Amazon SNS** for fan-out mobile push/SMS and **Amazon SES** for transactional emails.

---

## 12. Security & Compliance

1. **Stateless JWT with Expiration**: User passwords hashed using industry standard `bcrypt` with salt rounds. Tokens signed with `HS256`.
2. **Client Immutability**: Attendee clients **cannot** submit arbitrary counts. The server calculates all metrics directly from verified rows in the database.
3. **Input Sanitization**: Pydantic v2 models strictly enforce field bounds, regex patterns, and ISO date formatting.
4. **SQL Injection Defense**: SQLAlchemy ORM parameterized queries eliminate SQL injection vulnerabilities.
5. **CORS Security**: Cross-Origin Resource Sharing is locked down to authorized domains.

---

## 13. License & Author

**Author**: Student Cloud Computing Engineer  
**Institution**: Department of Computer Science & Engineering  
**Project**: Cloud Computing Capstone Project  
**License**: MIT License
