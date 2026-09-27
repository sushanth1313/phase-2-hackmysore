# API Feature Matrix
This matrix tracks the mapping and status of all APIs in ProofHire.

## Authentication
| Feature | Frontend Route | API Endpoint | HTTP Method | Authentication | Database | Status | Test Result |
|---------|----------------|--------------|-------------|----------------|----------|--------|-------------|
| Login | `/login` | `/api/auth/login` | POST | None | MongoDB | WORKING | Needs E2E |
| Register | `/register` | `/api/auth/register` | POST | None | MongoDB | WORKING | Needs E2E |
| Get User | N/A | `/api/auth/me` | GET | Token (`protect`) | MongoDB | WORKING | Needs E2E |
| Logout | N/A | `/api/auth/logout` | POST | None | MongoDB | WORKING | Needs E2E |
| Refresh | N/A | `/api/auth/refresh` | POST | Token | MongoDB | WORKING | Needs E2E |

## Projects & Proof of Work
| Feature | Frontend Route | API Endpoint | HTTP Method | Authentication | Database | Status | Test Result |
|---------|----------------|--------------|-------------|----------------|----------|--------|-------------|
| Upload Project | `/student/proof` | `/api/projects/upload` | POST | Token (`protect`) | MongoDB | PARTIAL | Needs Test |
| Project Status | `/student/proof` | `/api/projects/:id/analysis-status`| GET | Token (`protect`) | MongoDB | PARTIAL | Needs Test |
| Project Evidence | `/student/proof` | `/api/projects/:id/evidence` | GET | Token | MongoDB | MISSING | Not Started |

## Resume Intelligence
| Feature | Frontend Route | API Endpoint | HTTP Method | Authentication | Database | Status | Test Result |
|---------|----------------|--------------|-------------|----------------|----------|--------|-------------|
| Upload Resume | `/student/resume` | `/api/resume/upload` | POST | Token (`protect`) | MongoDB | PARTIAL | UI broken |
| Get Latest | `/student/resume` | `/api/resume/latest` | GET | Token (`protect`) | MongoDB | PARTIAL | Needs Test |
| Get Versions | `/student/resume` | `/api/resume/versions` | GET | Token (`protect`) | MongoDB | PARTIAL | Needs Test |
| Delete Resume | `/student/resume` | `/api/resume/:id` | DELETE | Token (`protect`) | MongoDB | PARTIAL | Needs Test |
| Get Resume By ID | `/student/resume` | `/api/resume/:id` | GET | Token (`protect`) | MongoDB | PARTIAL | Needs Test |

## Candidate Portal (Pending Backend Implementation)
| Feature | Frontend Route | API Endpoint | HTTP Method | Authentication | Database | Status | Test Result |
|---------|----------------|--------------|-------------|----------------|----------|--------|-------------|
| Dashboard Stats | `/student` | `/api/candidate/dashboard` | GET | Token | MongoDB | MISSING | Not Started |
| Capability Passport | `/student/passport` | `/api/candidate/capabilities` | GET | Token | MongoDB | MISSING | Not Started |
| Start AI Interview | `/student/interview` | `/api/interview/start` | POST | Token | MongoDB | MISSING | Not Started |
| Submit Answer | `/student/interview` | `/api/interview/answer` | POST | Token | MongoDB | MISSING | Not Started |
| Practice List | `/student/practice` | `/api/practice/challenges` | GET | Token | MongoDB | MISSING | Not Started |
| Run Practice Code | `/student/practice` | `/api/practice/run` | POST | Token | MongoDB | MISSING | Not Started |
| Submit Code | `/student/practice` | `/api/practice/submit` | POST | Token | MongoDB | MISSING | Not Started |
| Review Requests | `/student/reviews` | `/api/reviews/requests` | GET | Token | MongoDB | MISSING | Not Started |
| Submit Review | `/student/reviews` | `/api/reviews/submit` | POST | Token | MongoDB | MISSING | Not Started |

## Recruiter Portal (Pending Backend Implementation)
| Feature | Frontend Route | API Endpoint | HTTP Method | Authentication | Database | Status | Test Result |
|---------|----------------|--------------|-------------|----------------|----------|--------|-------------|
| Dashboard Stats | `/recruiter` | `/api/recruiter/dashboard` | GET | Token | MongoDB | MISSING | Not Started |
| Search Candidates | `/recruiter/talent` | `/api/recruiter/search` | GET | Token | MongoDB | MISSING | Not Started |
| View Candidate | `/recruiter/candidate/:id` | `/api/recruiter/candidate/:id` | GET | Token | MongoDB | MISSING | Not Started |
| Shortlists | `/recruiter/shortlists` | `/api/recruiter/shortlists` | GET | Token | MongoDB | MISSING | Not Started |
| Jobs | `/recruiter/jobs` | `/api/recruiter/jobs` | GET | Token | MongoDB | MISSING | Not Started |
| Messages | `/recruiter/messages` | `/api/recruiter/messages` | GET | Token | MongoDB | MISSING | Not Started |
