# ACADEMIC PROJECT REPORT
## Title: Real-Time Cloud-Based Event Planning & RSVP Tracker
**Course**: Cloud Computing & Distributed Systems  
**Domain**: Cloud Architecture, Real-Time WebSockets, Database Concurrency  

---

### 1. ABSTRACT
Modern event management demands real-time synchronization, accurate attendance capacity limits, and seamless multi-device accessibility. Traditional methods relying on spreadsheets, chat messaging, and manual check-in lists suffer from severe data inconsistency, duplicate submissions, and race conditions during high-demand registrations. This project implements an enterprise-grade, cloud-native event planning and RSVP tracking platform. Built with Python FastAPI, React with Vite, SQLAlchemy, and bi-directional WebSockets, the system guarantees ACID-compliant capacity enforcement, automatic FIFO waitlist promotions, and millisecond-level live count synchronization without client page refreshes. Comprehensive automated test suites and synthetic workload simulations validate the system's resilience under concurrent user requests.

---

### 2. PROBLEM STATEMENT
Organizing physical or hybrid events presents significant distributed systems challenges:
1. **Overselling & Race Conditions**: When multiple users attempt to reserve the final remaining seats simultaneously, non-transactional systems over-allocate capacity.
2. **Stale Client Data**: Without persistent push notifications, organizers and invitees see outdated RSVP counts.
3. **Manual Waitlist Management**: Managing cancellations and promoting replacement attendees is traditionally error-prone and manual.
4. **Security & Role Isolation**: Unrestricted endpoints risk unauthorized event cancellations or tampering with other users' reservations.

---

### 3. OBJECTIVES
- Engineer a cloud-hosted, multi-tenant application with separate Attendee, Organizer, and Administrator roles.
- Implement bi-directional WebSocket broadcasting to update organizer dashboards instantaneously when any attendee RSVPs.
- Ensure strict database-level concurrency control to eliminate race conditions at capacity limits.
- Implement an automated FIFO waitlist that immediately promotes waiting attendees upon cancellations.
- Provide QR-code ticket verification, event announcements, and real-time analytical gauges.
- Deploy the system using free-tier cloud architectures with local fallback capabilities.

---

### 4. EXISTING SYSTEM VS. PROPOSED SYSTEM

| Feature | Existing Systems (Google Forms / WhatsApp) | Proposed Cloud RSVP Platform |
| :--- | :--- | :--- |
| **Data Synchronization** | Manual refresh; delayed by minutes/hours | Real-time WebSockets (< 50ms sync) |
| **Capacity Enforcement** | Manual cutoff; frequently oversells | Atomic DB check inside transaction |
| **Duplicate Submissions** | Common duplicate rows per respondent | DB uniqueness constraint `(event_id, user_id)` |
| **Waitlist Handling** | Manual triage and messaging | Automated FIFO queue with auto-promotion |
| **Role-Based Security** | Shared links; minimal role permissions | JWT authentication with RBAC guards |
| **Live Telemetry** | Requires spreadsheet exporting & charting | Live visual gauges for utilization & velocity |

---

### 5. CLOUD COMPUTING CONCEPTS IMPLEMENTED
1. **Software as a Service (SaaS)**: A complete web-delivered application accessible across desktop and mobile browsers.
2. **Platform as a Service (PaaS)**: Pre-configured deployment pipelines compatible with container runtimes (Render, Railway, AWS ECS).
3. **Cloud Database (DBaaS)**: Decoupled relational storage model capable of executing on managed instances (Supabase PostgreSQL, AWS RDS).
4. **Event-Driven Architecture (EDA)**: State changes in the RSVP domain publish events to the WebSocket hub and trigger notification dispatchers.
5. **Horizontal Scalability**: Stateless API tier allowing dynamic horizontal pod autoscaling behind reverse proxy load balancers.
6. **Stateless Authentication**: Token-based JSON Web Tokens (JWT) allowing request distribution across stateless worker nodes without server affinity.

---

### 6. CONCURRENCY CONTROL & ACID TRANSACTIONS
A key focus of this research project is solving race conditions at capacity boundaries. 
When capacity $C$ is reached and current confirmed count is $N$, concurrent requests arriving at time $t$ are serialized using database row locking and immediate transactional boundaries.
- **Atomicity**: The read of current attendance, validation of available seats, update of the event counter, and insertion into the `rsvps` table occur as an indivisible unit of work.
- **Consistency**: The invariant $N \le C$ is strictly preserved at all times.
- **Isolation**: Concurrent threads cannot observe intermediate states during RSVP allocation.
- **Durability**: Confirmed reservations are immediately persisted to write-ahead logs.

---

### 7. SYSTEM TESTING & RESULTS
The platform was subjected to automated verification using `pytest`:
- **Authentication Suite**: Verified password hashing, token issuance, and duplicate registration rejections.
- **Authorization Guard**: Validated that attendees receive HTTP 403 Forbidden when attempting organizer operations.
- **Capacity Limit Simulation**: Populated an event with maximum capacity $M=2$. Verified that a 3rd concurrent attendee was rejected with HTTP 409 Conflict and placed onto the waitlist.
- **Auto-Promotion Test**: Verified that upon the cancellation of a confirmed attendee, the waitlisted user was instantly promoted to `GOING` status and sent a confirmation alert.
- **Test Results**: **11/11 tests passed with 100% success rate**.

---

### 8. CONCLUSION & FUTURE SCOPE
The Real-Time Cloud-Based Event Planning & RSVP Tracker successfully demonstrates modern cloud computing principles including distributed real-time pub/sub, transactional concurrency control, role-based access security, and cloud database architecture. 
**Future Scope**:
- Integrating Redis-backed distributed pub/sub to support horizontal WebSocket scaling across multiple container instances.
- Adding native Webhook notifications for Slack and Discord community integration.
- Implementing facial recognition or NFC check-in at physical kiosk venues.
