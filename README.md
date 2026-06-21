### Project Name: Repair Portal

This project aims to deliver the following features:
Module 01: Core Platform Functionality
This module establishes the essential features for the marketplace to function at a basic level, allowing users to register, find technicians, and book a service.

User Profile Creation and Management: Users can securely create, access, and manage their accounts (name, phone, address, picture). This is the foundational step for any user interaction. (RODOSHI)
Browse Repair Services: A searchable catalog of all available repair services, allowing users to see what the platform offers.(sabah)
Search Technicians: Users can search for technicians by service type, rating, and location, which is the core mechanism for finding help.(Intesar)
Service Booking: Allows users to create a booking request by describing the issue, selecting a time, and confirming urgency. This is the primary action connecting users and technicians. (RODOSHI)
Technician Booking Dashboard: Provides technicians with a dashboard to view and accept or reject incoming booking requests, making the two-way marketplace operational.(Intesar)

Module 02: Enhancing the Booking & Service Experience
This module builds directly on Module 1 by adding features that improve the detail, tracking, and management of a booked service.

Upload Item Photos: Users can attach images to a booking request, giving technicians more context before they accept a job. This depends on an existing booking system (Module 1).(sabah)
ah)Booking Status Tracking: Users can see the live status of their booking (e.g., Pending, Accepted, Completed), which requires an active booking record (Module 1). (RODOSHI)
Payment Processing: Integration with payment gateways (bKash, Nagad, cards) to handle transactions for confirmed bookings. This logically follows the booking creation and acceptance phase.(Intesar)
Cancel or Reschedule Booking: Users can manage their active bookings, a necessary function once a booking is made and accepted (Module 1).(safwan)
Rate & Review Technician: After a service is completed, users can rate the technician. This depends on having a history of completed bookings. (RODOSHI)

Module 03: Post-Service and Support Features
This module focuses on adding value after the service is completed and introduces more sophisticated interaction and administrative tools.

Booking History: Provides users with a complete history of their past jobs, including details, invoices, and reviews. This relies on completed and rated bookings from Modules 1 & 2.
Invoice Generation: Automatically creates a downloadable PDF invoice upon payment or completion, building on the payment and booking completion features
Auto-Generated Warranty Cards: Issues a digital service warranty after a repair is marked complete, enhancing customer trust.
Live Chat Support for Instant Help: Enables real-time communication for users needing assistance before or during the booking process.(Intesar)
Technician Bidding on Requests: Introduces an alternative booking model where technicians can bid on jobs, giving users more choice. This is an advanced alternative to the direct booking in Module 1.(safwan)
Repair Diagnosis AI: An AI model that suggests a diagnosis and estimated cost from a photo or text description. This is a complex feature that enhances the initial user query. (safwan)

Extra Module: Advanced & Community Features
This module includes highly advanced, AI-driven, and community-oriented features that can be added once the core platform is stable and has a user base.

Analytics Dashboard: An admin-level feature to view platform metrics like top services and revenue, which requires accumulated data from all previous module activities.
Intelligent Technician Matching: An algorithm that proactively suggests the top 3 technicians for a request based on multiple data points (proximity, rating, availability). This is an advanced version of the basic search in Module 1.
Inventory & Parts Marketplace: An e-commerce-style platform for technicians to sell repair parts to each other or to users.
Community Fix Days / Repair Drives: A feature for organizing community-based repair events, fostering social impact and brand loyalty.

---

## Development

### Stack
- **Frontend:** React 19 + Vite + Tailwind CSS v4 + shadcn/ui
- **Backend:** Express 5 + Socket.io + SQLite (`better-sqlite3`)
- **AI:** Google Gemini (`@google/generative-ai`) for repair diagnosis

### Getting started
```bash
# 1. Install dependencies (root = backend deps, frontend/ = frontend deps)
npm install
npm install --prefix frontend

# 2. Configure environment
cp .env.example .env            # then fill in JWT_SECRET and GEMINI_API_KEY
cp frontend/.env.example frontend/.env

# 3. (Optional) seed the database with sample data
npm run seed

# 4. Run backend + frontend together
npm run dev                     # backend :3000, frontend :5173
```

### Useful scripts (from root)
| Command | Description |
|---------|-------------|
| `npm run dev` | Run backend + frontend concurrently |
| `npm start` | Run the backend only |
| `npm test` | Run the backend test suite (Vitest + Supertest) |
| `npm run test:watch` | Run tests in watch mode |
| `npm run seed` | Seed the SQLite database |
| `npm run backup-db` | Back up the SQLite database |
| `npm run lint` | Lint the frontend |

The SQLite database is created automatically at `backend/data/repair-portal.db` (override with `DB_PATH`). No external database server is required.
