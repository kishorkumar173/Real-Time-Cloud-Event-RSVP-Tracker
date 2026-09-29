# ☁️ Real-Time Cloud-Based Event Planning & RSVP Tracker

> A cloud-native, real-time event management and RSVP platform that enables organizers to create and manage events, track attendee responses, enforce capacity limits, manage waitlists, publish announcements, and monitor live attendance analytics.

---

## 📌 Overview

The **Real-Time Cloud-Based Event Planning & RSVP Tracker** is an industry-oriented cloud computing project designed to solve the limitations of traditional event management methods such as spreadsheets, manual attendance lists, messaging groups, and static registration forms.

The platform provides a centralized cloud-based system where organizers can create and manage events while attendees can discover events, submit or update RSVPs, receive announcements, and track their registrations.

The system uses **cloud authentication, cloud database services, REST APIs, real-time database synchronization, role-based authorization, transaction-based capacity management, notifications, analytics, and cloud deployment**.

The primary focus of the project is to demonstrate practical **Cloud Computing, Real-Time Application Development, Backend Engineering, Database Management, Security, Scalability, and DevOps concepts**.

---

## 🎯 Problem Statement

Traditional event management frequently relies on:

* Spreadsheets
* WhatsApp or messaging groups
* Manual attendance lists
* Static Google Forms
* Separate registration and attendance systems
* Manual capacity tracking

These approaches can result in:

* Duplicate registrations
* Incorrect attendee counts
* Delayed updates
* Difficulty managing capacity
* No centralized event information
* Manual communication
* Poor visibility into attendance analytics
* Difficulty coordinating multiple organizers and attendees

This project addresses these challenges using a centralized **cloud-based and real-time architecture**.

---

## 💡 Proposed Solution

The system provides a unified platform for:

```text
Organizer
    ↓
Create Event
    ↓
Publish Event
    ↓
Attendees Discover Event
    ↓
Submit RSVP
    ↓
Cloud Database
    ↓
Real-Time Synchronization
    ↓
Organizer Dashboard
    ↓
Live RSVP Analytics
```

When an attendee changes their RSVP, the cloud database is updated and connected dashboards can receive the change without requiring a manual page refresh.

---

# 🚀 Key Features

## 👤 Authentication

* User registration
* User login
* User logout
* Firebase Authentication
* Protected routes
* Authentication token validation
* Role-based access control

---

## 👥 Role-Based Access Control

### Organizer

Organizers can:

* Create events
* Edit events
* Publish events
* Cancel events
* Set event capacity
* Set registration deadlines
* View attendee responses
* Monitor RSVP analytics
* Publish announcements
* Manage their events

### Attendee

Attendees can:

* Register/login
* Browse available events
* View event details
* RSVP to events
* Select:

  * GOING
  * MAYBE
  * NOT GOING
* Update their RSVP
* Cancel their RSVP
* View upcoming events
* View announcements
* View notifications

---

# 📅 Event Management

Each event contains information such as:

| Field                 | Description                     |
| --------------------- | ------------------------------- |
| Event ID              | Unique event identifier         |
| Organizer ID          | Event owner                     |
| Event Name            | Name of the event               |
| Description           | Event details                   |
| Event Type            | Workshop, seminar, meetup, etc. |
| Event Date            | Date of event                   |
| Start Time            | Starting time                   |
| End Time              | Ending time                     |
| Venue                 | Physical location               |
| Online Link           | Optional meeting link           |
| Maximum Capacity      | Maximum GOING attendees         |
| Registration Deadline | RSVP deadline                   |
| Status                | Event lifecycle state           |
| Created At            | Creation timestamp              |
| Updated At            | Last modification timestamp     |

### Event Status

```text
DRAFT
PUBLISHED
FULL
COMPLETED
CANCELLED
```

---

# 🎟️ RSVP Management

Attendees can respond using:

```text
GOING
MAYBE
NOT GOING
```

The system maintains a single active RSVP for each:

```text
Event + User
```

This prevents duplicate RSVP records.

### Example

```text
Event: Cloud Computing Workshop

GOING       → 48
MAYBE       → 12
NOT GOING   → 7
```

If an attendee changes:

```text
MAYBE → GOING
```

the counts are updated accordingly.

---

# ⚡ Real-Time RSVP Tracking

Real-time synchronization is one of the major features of the system.

The project uses **Cloud Firestore real-time listeners** to synchronize RSVP information.

### Example

```text
Attendee A
    ↓
GOING
    ↓
Firestore
    ↓
Real-Time Listener
    ↓
Organizer Dashboard
    ↓
GOING: 49 → 50
```

The organizer does not need to manually refresh the dashboard.

---

# 🧑‍💻 Multi-User Real-Time Demonstration

The system can be demonstrated using multiple browser windows.

### Browser 1

```text
Organizer Dashboard
```

### Browser 2

```text
Attendee A
```

### Browser 3

```text
Attendee B
```

Example:

```text
Attendee A → GOING

Organizer Dashboard
GOING = 1
```

Then:

```text
Attendee B → GOING

Organizer Dashboard
GOING = 2
```

Then:

```text
Attendee A
GOING → MAYBE

Organizer Dashboard
GOING = 1
MAYBE = 1
```

No manual refresh is required.

---

# 🔒 Capacity Management

The platform supports maximum event capacity.

Example:

```text
Maximum Capacity = 100

Current GOING = 99
```

If one attendee selects GOING:

```text
GOING = 100
STATUS = FULL
```

Further GOING requests are rejected or moved to the waitlist.

---

# ⚠️ Concurrency & Race Condition Handling

A naive implementation could use:

```text
Check current capacity
        ↓
Create RSVP
```

This can cause a race condition when multiple users attempt to reserve the final available seat simultaneously.

For example:

```text
Capacity = 100
Current GOING = 99

User A → GOING
User B → GOING
```

Both requests may initially see:

```text
99 < 100
```

and both could be accepted.

The project therefore uses **database transaction-based capacity validation** so that the capacity check and RSVP update are handled atomically.

```text
Request
   ↓
Database Transaction
   ↓
Read Current Capacity
   ↓
Check Availability
   ↓
Update RSVP + Count
   ↓
Commit
```

This makes the RSVP system safer under concurrent requests.

---

# 📝 Waitlist

The system can optionally support a FIFO waitlist.

When an event becomes full:

```text
Event Capacity = 100
GOING = 100
```

a new attendee can be added to:

```text
WAITLIST
```

When a GOING attendee cancels:

```text
Available Seat
      ↓
First Eligible Waitlisted User
      ↓
Promotion
      ↓
GOING
```

Waitlist information can include:

* Waitlist ID
* Event ID
* User ID
* Joined timestamp
* Position
* Status

---

# 📢 Event Announcements

Organizers can publish announcements such as:

* Venue changes
* Schedule changes
* Important instructions
* Event reminders
* Cancellation notices
* General updates

Example:

```text
Title:
Venue Updated

Message:
The workshop has been moved to Seminar Hall 2.
```

Attendees associated with the event can view the announcement through the application.

---

# 🔔 Notification System

The platform supports in-app notifications for:

* RSVP confirmation
* RSVP updates
* Event reminders
* Venue changes
* Schedule changes
* Event cancellation
* Waitlist promotion
* Organizer announcements

Example:

```text
🔔 Your RSVP for Cloud Computing Workshop
has been confirmed as GOING.
```

---

# 📊 Organizer Analytics Dashboard

The organizer dashboard provides real-time event statistics.

### Key Metrics

* Total Events
* Upcoming Events
* Total Responses
* GOING
* MAYBE
* NOT GOING
* Response Rate
* Capacity Utilization
* Available Seats
* Waitlist Size

### Analytics

The dashboard can visualize:

1. RSVP Status Distribution
2. RSVP Growth Over Time
3. Capacity Utilization
4. Response Rate
5. RSVP Timeline

### Example

```text
Invited Users = 500
Responses = 350

Response Rate:

350 / 500 × 100 = 70%
```

---

# ☁️ Cloud Computing Concepts Demonstrated

This project is designed primarily as a **Cloud Computing project**.

| Concept                   | Implementation                                  |
| ------------------------- | ----------------------------------------------- |
| Cloud Computing           | Cloud-hosted application                        |
| SaaS                      | Event management platform delivered through web |
| Cloud Authentication      | Firebase Authentication                         |
| Cloud Database            | Cloud Firestore                                 |
| Real-Time Computing       | Firestore real-time listeners                   |
| REST APIs                 | FastAPI backend                                 |
| Serverless Concepts       | Managed Firebase/cloud services                 |
| Event-Driven Architecture | Database changes trigger real-time updates      |
| RBAC                      | Organizer and Attendee permissions              |
| Scalability               | Managed cloud services                          |
| High Availability         | Cloud-managed infrastructure                    |
| Security                  | Authentication, authorization, validation       |
| Environment Variables     | Sensitive configuration management              |
| Logging                   | Backend/application logs                        |
| Monitoring                | Cloud deployment monitoring                     |
| CI/CD                     | GitHub-based deployment workflow                |
| Cloud Deployment          | Production cloud hosting                        |
| Database Transactions     | Concurrency-safe RSVP processing                |

---

# 🏗️ System Architecture

```text
                    ┌───────────────────┐
                    │       Users       │
                    │                   │
                    │ Organizer         │
                    │ Attendee          │
                    └─────────┬─────────┘
                              │
                              ▼
                    ┌───────────────────┐
                    │    React + Vite   │
                    │    Frontend       │
                    └─────────┬─────────┘
                              │
                 ┌────────────┴────────────┐
                 │                         │
                 ▼                         ▼
       ┌──────────────────┐       ┌──────────────────┐
       │ Firebase Auth    │       │ FastAPI REST API │
       └──────────────────┘       └────────┬─────────┘
                                           │
                                           ▼
                                  ┌──────────────────┐
                                  │ Firebase Admin   │
                                  │ SDK              │
                                  └────────┬─────────┘
                                           │
                                           ▼
                                  ┌──────────────────┐
                                  │ Cloud Firestore  │
                                  └────────┬─────────┘
                                           │
                                           ▼
                                  ┌──────────────────┐
                                  │ Real-Time        │
                                  │ Listeners        │
                                  └────────┬─────────┘
                                           │
                                           ▼
                                  ┌──────────────────┐
                                  │ Live Dashboard   │
                                  └──────────────────┘
```

---

# 🗄️ Database Architecture

The primary Firestore collections are:

```text
users/
events/
notifications/
waitlist/
audit_logs/
```

Event-specific subcollections:

```text
events/{eventId}/rsvps/
events/{eventId}/announcements/
```

### User

```text
users/{userId}
```

Example fields:

```text
userId
name
email
role
createdAt
updatedAt
```

### Event

```text
events/{eventId}
```

Example:

```text
eventId
organizerId
eventName
description
eventType
eventDate
startTime
endTime
venue
onlineLink
maximumCapacity
registrationDeadline
status
createdAt
updatedAt
```

### RSVP

```text
events/{eventId}/rsvps/{userId}
```

Example:

```text
userId
status
respondedAt
updatedAt
```

Using the user ID as the RSVP document ID ensures one active RSVP per user per event.

---

# 🔐 Security

Security is an important part of the architecture.

The system implements:

* Firebase Authentication
* Role-based authorization
* Protected API routes
* Token verification
* Input validation
* CORS configuration
* Environment variables
* Secure database access
* Backend-controlled RSVP counts
* Transaction-based updates
* Duplicate request handling
* Authorization checks
* Error handling
* Audit logging concepts

### Important principle

The frontend is **not trusted as the source of truth**.

For example, a user should not be able to send:

```json
{
  "goingCount": 999
}
```

and modify the event count.

Instead:

```text
Frontend
   ↓
RSVP Request
   ↓
Backend
   ↓
Validation
   ↓
Database Transaction
   ↓
Database becomes source of truth
```

---

# 🌐 REST API

## Authentication

```text
POST /api/register
POST /api/login
POST /api/logout
```

## Events

```text
POST   /api/events
GET    /api/events
GET    /api/events/{id}
PUT    /api/events/{id}
DELETE /api/events/{id}
```

## RSVP

```text
POST   /api/events/{id}/rsvp
PUT    /api/events/{id}/rsvp
DELETE /api/events/{id}/rsvp
GET    /api/events/{id}/rsvps
GET    /api/rsvps/me
```

## Analytics

```text
GET /api/events/{id}/analytics
```

## Announcements

```text
POST /api/events/{id}/announcements
GET  /api/events/{id}/announcements
```

## Notifications

```text
GET /api/notifications
PUT /api/notifications/{id}/read
```

FastAPI also provides automatically generated API documentation through:

```text
/docs
```

---

# 🛠️ Technology Stack

## Frontend

* React
* Vite
* JavaScript
* CSS
* Recharts
* Firebase Web SDK

## Backend

* Python
* FastAPI
* Pydantic
* Firebase Admin SDK

## Cloud

* Firebase Authentication
* Cloud Firestore
* Firebase Hosting
* Cloud deployment platform for FastAPI

## Development

* Git
* GitHub
* VS Code
* Postman
* Pytest
* Browser DevTools

---

# 📁 Project Structure

```text
Real-Time-Cloud-Event-RSVP-Tracker/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── hooks/
│   │   └── firebase/
│   ├── package.json
│   └── .env.example
│
├── backend/
│   ├── app/
│   │   ├── routes/
│   │   ├── models/
│   │   ├── services/
│   │   ├── middleware/
│   │   └── utils/
│   ├── tests/
│   ├── requirements.txt
│   └── .env.example
│
├── sample_data/
├── screenshots/
├── docs/
├── reports/
├── README.md
├── .gitignore
└── LICENSE
```

---

# ⚙️ Local Installation

## Prerequisites

Install:

* Node.js
* npm
* Python 3.11+
* Git
* Firebase account
* VS Code

Verify:

```bash
node --version
npm --version
python --version
git --version
```

---

# 📥 Clone Repository

```bash
git clone <repository-url>

cd Real-Time-Cloud-Event-RSVP-Tracker
```

---

# 🖥️ Frontend Setup

```bash
cd frontend

npm install
```

Create:

```text
.env
```

based on:

```text
.env.example
```

Then start the development server:

```bash
npm run dev
```

The frontend will normally be available at:

```text
http://localhost:5173
```

---

# 🐍 Backend Setup

Navigate to the backend:

```bash
cd backend
```

Create a virtual environment:

### Windows

```bash
python -m venv .venv
.venv\Scripts\activate
```

### Linux/macOS

```bash
python3 -m venv .venv
source .venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Start FastAPI:

```bash
uvicorn app.main:app --reload
```

Backend:

```text
http://127.0.0.1:8000
```

Swagger API documentation:

```text
http://127.0.0.1:8000/docs
```

---

# 🔑 Environment Variables

Never commit credentials to GitHub.

Example:

```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account-email
FIREBASE_PRIVATE_KEY=your-private-key
```

Frontend example:

```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-auth-domain
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-storage-bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

Only placeholder values should be committed.

---

# 🧪 Testing

The project includes automated tests for important application workflows.

### Test Categories

* User registration
* Login
* Event creation
* Event retrieval
* Event authorization
* RSVP creation
* Duplicate RSVP prevention
* RSVP update
* RSVP cancellation
* Registration deadline
* Capacity enforcement
* Concurrent final-seat requests
* Waitlist
* Announcements
* Notifications
* Analytics
* Unauthorized access
* Authentication failures
* Failure handling

Run backend tests:

```bash
pytest
```

---

# 🔄 Local Real-Time Demonstration

Run the application and open three browser windows.

### Window 1

```text
Organizer
```

### Window 2

```text
Attendee A
```

### Window 3

```text
Attendee B
```

Create:

```text
Cloud Computing Workshop
```

Set:

```text
Capacity: 100
```

Then:

```text
Attendee A → GOING
```

Organizer dashboard:

```text
GOING = 1
```

Next:

```text
Attendee B → MAYBE
```

Organizer:

```text
GOING = 1
MAYBE = 1
```

Then:

```text
Attendee B
MAYBE → GOING
```

Organizer:

```text
GOING = 2
MAYBE = 0
```

The dashboard updates without manually refreshing the page.

---

# ☁️ Cloud Deployment

The project is designed to support student-friendly cloud deployment.

## Firebase

Firebase can provide:

* Authentication
* Firestore
* Real-time synchronization
* Frontend hosting
* Cloud services

## Backend

The FastAPI backend can be deployed to a cloud platform that supports Python applications or containers.

The production architecture becomes:

```text
User
 ↓
Cloud-hosted React Frontend
 ↓
Firebase Authentication
 ↓
FastAPI Cloud Backend
 ↓
Firebase Admin SDK
 ↓
Cloud Firestore
 ↓
Real-Time Synchronization
```

---

# 🏢 Enterprise Cloud Architecture

A larger production deployment could use:

```text
Users
  ↓
CDN
  ↓
CloudFront / Equivalent CDN
  ↓
Frontend Hosting
  ↓
API Gateway
  ↓
Serverless Functions / Containers
  ↓
Managed Database
  ↓
Real-Time Service
  ↓
Notification Service
  ↓
Monitoring
```

Possible cloud mappings:

| Capability     | AWS            | Azure                      | Google Cloud             |
| -------------- | -------------- | -------------------------- | ------------------------ |
| Authentication | Cognito        | Entra ID / B2C             | Firebase Auth            |
| API            | API Gateway    | API Management             | API Gateway              |
| Compute        | Lambda / ECS   | Functions / Container Apps | Cloud Run / Functions    |
| Database       | DynamoDB / RDS | Cosmos DB / SQL            | Firestore / Cloud SQL    |
| Storage        | S3             | Blob Storage               | Cloud Storage            |
| CDN            | CloudFront     | Front Door                 | Cloud CDN                |
| Monitoring     | CloudWatch     | Azure Monitor              | Cloud Monitoring         |
| Notifications  | SNS / SES      | Notification Hubs          | Firebase Cloud Messaging |

---

# 📈 Scalability

The architecture can be extended for large events.

For example:

```text
100 users
     ↓
10,000 users
     ↓
100,000 users
     ↓
1,000,000 users
```

For high traffic scenarios, the architecture can introduce:

* CDN
* Load balancing
* Autoscaling
* Serverless functions
* Database indexing
* Caching
* Queues
* Event-driven processing
* Rate limiting
* Connection management
* Database partitioning strategies

A large RSVP spike can be handled by separating:

```text
Request Handling
       ↓
Queue
       ↓
Transaction Processing
       ↓
Database
       ↓
Real-Time Notification
```

---

# 🛡️ Failure Handling

The system considers several failure scenarios.

### Database failure

```text
Request
 ↓
Database unavailable
 ↓
Graceful error
 ↓
Log failure
 ↓
Retry where appropriate
```

### Real-time connection failure

The frontend can reconnect to the real-time service.

### Duplicate RSVP request

Use idempotent operations and unique user/event relationships.

### RSVP timeout

The frontend displays an appropriate error instead of assuming the RSVP succeeded.

### Page refresh

The application reloads the current state from the cloud database.

---

# 📊 Analytics

The platform calculates:

```text
Total Responses
Going Count
Maybe Count
Not Going Count
Response Rate
Capacity Utilization
Available Seats
Waitlist Count
RSVP Growth
```

### Response Rate

```text
Response Rate =
Responses / Invited Users × 100
```

### Capacity Utilization

```text
Capacity Utilization =
Going / Maximum Capacity × 100
```

### Available Seats

```text
Available Seats =
Maximum Capacity - Going
```

---

# 🧪 Sample Event

```text
Event:
Cloud Computing Workshop

Organizer:
Demo Organizer

Date:
15 October 2026

Venue:
Seminar Hall 1

Capacity:
100

Registration Deadline:
14 October 2026

Status:
PUBLISHED
```

Example RSVP statistics:

```text
GOING       48
MAYBE       12
NOT GOING    7
----------------
RESPONSES   67
```

---

# 📸 Screenshots

Recommended screenshots for the project:

```text
screenshots/
│
├── 01-registration.png
├── 02-login.png
├── 03-organizer-dashboard.png
├── 04-create-event.png
├── 05-published-event.png
├── 06-attendee-dashboard.png
├── 07-event-details.png
├── 08-going-rsvp.png
├── 09-maybe-rsvp.png
├── 10-realtime-update.png
├── 11-multi-browser-realtime.png
├── 12-rsvp-database.png
├── 13-capacity-utilization.png
├── 14-full-event.png
├── 15-waitlist.png
├── 16-announcement.png
├── 17-notification.png
├── 18-analytics.png
├── 19-concurrency-test.png
├── 20-unauthorized-request.png
├── 21-automated-tests.png
├── 22-cloud-deployment.png
├── 23-live-application.png
├── 24-github-commits.png
└── 25-github-readme.png
```

---

# 🗓️ Development Roadmap

| Day    | Milestone                 |
| ------ | ------------------------- |
| Day 1  | Architecture + Repository |
| Day 2  | Authentication + Roles    |
| Day 3  | Event Management          |
| Day 4  | RSVP System               |
| Day 5  | Cloud Database            |
| Day 6  | Real-Time Updates         |
| Day 7  | Capacity Management       |
| Day 8  | Waitlist                  |
| Day 9  | Organizer Dashboard       |
| Day 10 | Notifications             |
| Day 11 | Analytics                 |
| Day 12 | Security + Concurrency    |
| Day 13 | Cloud Deployment          |
| Day 14 | README + Documentation    |

---

# 📝 Recommended Git Commit History

```bash
git commit -m "Initialize real-time cloud event tracker"

git commit -m "Implement authentication and roles"

git commit -m "Add event management module"

git commit -m "Implement RSVP workflow"

git commit -m "Integrate cloud database"

git commit -m "Add real-time RSVP updates"

git commit -m "Implement capacity-safe transactions"

git commit -m "Add optional waitlist"

git commit -m "Build organizer dashboard"

git commit -m "Add announcements and notifications"

git commit -m "Implement event analytics"

git commit -m "Add security controls"

git commit -m "Add automated tests"

git commit -m "Deploy application to cloud"

git commit -m "Complete README and documentation"
```

---

# 📦 GitHub Setup

```bash
git init

git add .

git commit -m "Initialize real-time cloud event tracker"

git branch -M main

git remote add origin <repository-url>

git push -u origin main
```

---

# 🧑‍💻 Learning Outcomes

Through this project, the following concepts are demonstrated:

### Cloud Computing

* Cloud databases
* Cloud authentication
* Cloud deployment
* Serverless architecture
* Scalability
* Availability

### Backend Development

* REST API development
* FastAPI
* Authentication middleware
* Authorization
* API validation
* Error handling

### Real-Time Systems

* Real-time database synchronization
* Event-driven architecture
* Multi-user state synchronization
* Live dashboard updates

### Database Engineering

* Data modeling
* Relationships
* Unique constraints
* Indexing
* Transactions
* Concurrency control

### Software Engineering

* Modular architecture
* Git/GitHub
* Automated testing
* Environment management
* Security practices
* Documentation

---

# 🔮 Future Improvements

Potential future enhancements include:

* QR-based event invitations
* QR-code attendee check-in
* Email notifications
* SMS notifications
* Push notifications
* Calendar integration
* Google Calendar synchronization
* Advanced organizer analytics
* Event recommendation system
* Recurring events
* Ticketing and payment integration
* Multi-organization support
* Admin moderation
* Advanced audit logging
* AI-powered event recommendations
* Attendance prediction
* Serverless event processing

---

⚠️ Limitations

The current academic implementation focuses on demonstrating cloud computing and real-time application concepts.

Potential production-level enhancements would include:

Enterprise-grade monitoring
Advanced rate limiting
Distributed caching
Dedicated notification infrastructure
Advanced disaster recovery
Multi-region deployment
Comprehensive load testing
Enterprise identity management
🏆 Project Highlights

The project demonstrates:

☁️ Cloud Computing
⚡ Real-Time Systems
🔐 Authentication & Authorization
🗄️ Cloud Database
🔄 REST APIs
🎟️ RSVP Management
🚦 Capacity Control
📋 Waitlist Management
📢 Announcements
🔔 Notifications
📊 Analytics
🔒 Security
⚙️ Concurrency Handling
🧪 Automated Testing
🚀 Cloud Deployment
🐙 GitHub Development
📚 Academic & Industry Relevance

The architecture can be adapted for:

College festivals
Workshops
Seminars
Conferences
Corporate events
Training programs
Webinars
Meetups
Community events
Networking events
Ticketing platforms
Social gatherings

The same underlying architecture can support thousands of users while maintaining centralized cloud data and real-time synchronization.

👨‍💻 Author

Kishor Kumar L

BE – Computer Science & Engineering (AI & ML)

AMC Engineering College
