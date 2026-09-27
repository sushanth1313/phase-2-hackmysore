# ProofHire — Full Functional Audit
Generated: 2026-09-26

## Legend
- WORKING: Full end-to-end, real data
- PARTIAL: Some layers connected
- MOCK: Hardcoded/seeded fake data returned
- HARDCODED: Static values in frontend
- BROKEN: Produces errors/wrong result
- MISSING: Zero backend implementation

## Authentication
- Register: WORKING (real bcrypt + JWT + MongoDB)
- Login: WORKING
- Logout: WORKING (frontend clears token)
- /me session restore: WORKING
- GitHub OAuth: MISSING
- Email verification: MISSING
- Password reset: MISSING

## Candidate Dashboard
- Composite Signal: MOCK (hardcoded 84.2)
- Verified Projects count: PARTIAL (real DB count)
- Peer Reviews / Challenges done: HARDCODED (0)
- Evidence timeline cards: HARDCODED (fake project names)
- ProofCards: HARDCODED (fake tech stacks)

## Proof of Work
- List projects: WORKING
- Upload ZIP: PARTIAL (saves file, analysis never completes)
- Trigger analysis: MOCK (Python simulates, no real ML)
- Analysis status: PARTIAL (never updates from QUEUED)
- View project detail: MISSING
- GitHub import: MISSING
- Evidence model: MISSING

## Capability Passport
- List capabilities: MOCK (auto-seeds fake on empty)
- Evidence links: MISSING
- Derived from real analysis: MISSING

## Reviews
- List reviews: PARTIAL (fetches DB, falls back to mock)
- Submit review: MISSING
- Reviewer verification: MISSING

## Challenges
- List challenges: HARDCODED (frontend array)
- Start/Submit challenge: MISSING
- Challenge/Submission models: MISSING

## AI Interview
- Entire feature: MISSING (only UI, no backend)
- LLM integration: MISSING

## Technical Practice
- List questions: HARDCODED
- Submit/Run: MISSING
- Code sandbox: MISSING

## Resume Intelligence
- Upload: PARTIAL (works)
- Text extraction: PARTIAL (pdf-parse)
- Claim verification: BROKEN (wrong DB field: 'candidate' vs 'user')
- AI indicator: PARTIAL (buzzword heuristic only)

## Recruiter Dashboard
- Candidate count: WORKING
- Project count: WORKING
- Shortlisted: HARDCODED (0)
- Avg signal: HARDCODED (7.8)

## Talent Discovery
- List candidates: PARTIAL (real users, fake skills/signal)
- Search/filter: MISSING (cosmetic only)
- Click to detail: MISSING

## Candidate Detail (Recruiter)
- Entire page: HARDCODED

## Shortlists
- List: HARDCODED (Alex Rivera, Sarah Connor)
- Add/Remove: BROKEN (useState only, resets on refresh)
- Shortlist model: MISSING

## Jobs
- List: HARDCODED
- Create/Edit/Delete: MISSING
- Job model: MISSING

## Messages
- Conversations: HARDCODED
- Send/receive: MISSING
- Message/Conversation models: MISSING

## Missing Models
- Evidence, AnalysisJob, Challenge, ChallengeSubmission
- Shortlist, Job, Message, Conversation
- InterviewSession, PracticeQuestion, PracticeAttempt
- Notification, AuditLog, CandidateProfile

## Missing Infrastructure
- Health endpoint
- GitHub OAuth
- LLM API integration
- ML models (real)
- Code execution sandbox
- Email service
- Rate limiting
- DB indexes
