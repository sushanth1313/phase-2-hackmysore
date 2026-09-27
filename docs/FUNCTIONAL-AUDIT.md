# Functional Audit
This document tracks the functional state of the ProofHire application.

## Legend
- WORKING: End-to-end functionality confirmed (UI -> API -> DB -> UI).
- PARTIAL: Some functionality works, but relies on mock data or has missing connections.
- MOCK: Completely relies on fake/hardcoded data.
- BROKEN: Throws errors, fails to load, or behaves incorrectly.
- MISSING: Not implemented yet.

## Public Features

### Landing
- **Frontend Route:** `/`
- **Component:** `Landing.tsx`
- **Status:** WORKING

### Authentication
- **Frontend Route:** `/login`, `/register`
- **Components:** `Login.tsx`, `Register.tsx`
- **API Endpoints:** `POST /api/auth/login`, `POST /api/auth/register`, `GET /api/auth/me`
- **Status:** PARTIAL (Currently uses Node.js backend on 8080, needs full verification)

## Candidate Features

### Dashboard
- **Frontend Route:** `/student`
- **Component:** `student/Dashboard.tsx`
- **API Endpoint:** TBD
- **Status:** TBD

### Proof of Work
- **Frontend Route:** `/student/proof`
- **Component:** `student/ProofOfWork.tsx`
- **API Endpoint:** TBD
- **Status:** TBD

### Challenges
- **Frontend Route:** `/student/challenges`
- **Component:** `student/Challenges.tsx`
- **Status:** TBD

### Reviews
- **Frontend Route:** `/student/reviews`
- **Component:** `student/Reviews.tsx`
- **Status:** TBD

### Capability Passport
- **Frontend Route:** `/student/passport`
- **Component:** `student/CapabilityPassport.tsx`
- **Status:** TBD

### AI Interview
- **Frontend Route:** `/student/interview`
- **Component:** `student/AIInterview.tsx`
- **Status:** TBD

### Technical Practice
- **Frontend Route:** `/student/practice`
- **Component:** `student/TechnicalPractice.tsx`
- **Status:** TBD

### Resume Intelligence
- **Frontend Route:** `/student/resume`
- **Component:** `student/ResumeIntelligence.tsx`
- **API Endpoint:** `POST /api/resume/upload`
- **Status:** PARTIAL

### Settings
- **Frontend Route:** `/student/settings`
- **Component:** `student/Settings.tsx`
- **Status:** TBD

## Recruiter Features

### Dashboard
- **Frontend Route:** `/recruiter`
- **Component:** `recruiter/Dashboard.tsx`
- **Status:** TBD

### Talent Discovery
- **Frontend Route:** `/recruiter/talent`
- **Component:** `recruiter/TalentDiscovery.tsx`
- **Status:** TBD

### Candidate Detail
- **Frontend Route:** `/recruiter/candidate/:id`
- **Component:** `recruiter/CandidateDetail.tsx`
- **Status:** TBD

### Shortlists
- **Frontend Route:** `/recruiter/shortlists`
- **Component:** `recruiter/Shortlists.tsx`
- **Status:** TBD

### Jobs
- **Frontend Route:** `/recruiter/jobs`
- **Component:** `recruiter/Jobs.tsx`
- **Status:** TBD

### Messages
- **Frontend Route:** `/recruiter/messages`
- **Component:** `recruiter/Messages.tsx`
- **Status:** TBD

### Settings
- **Frontend Route:** `/recruiter/settings`
- **Component:** `recruiter/Settings.tsx`
- **Status:** TBD

## Admin Features

### Dashboard
- **Frontend Route:** `/admin`
- **Component:** `admin/AdminDashboard.tsx`
- **Status:** TBD
