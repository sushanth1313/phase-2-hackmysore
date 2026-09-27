# ProofHire - Show What You Can Build

**"RESUMES TELL YOU WHAT SOMEONE CLAIMS. PROOF OF WORK SHOWS WHAT THEY CAN ACTUALLY DO."**

ProofHire is a modern hiring platform that replaces traditional resume screening with verified technical capability, AI-powered authenticity detection, and interactive proof of work.

## 🚀 Hackathon Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Student | `student@demo.com` | `demo123` |
| Recruiter | `recruiter@demo.com` | `demo123` |
| Admin | `admin@demo.com` | `demo123` |

## 🏗 Architecture

1. **Frontend**: React + Vite + Tailwind CSS (Interactive Proof Graphs, Dashboards)
2. **Backend**: Spring Boot + Java (Verification Engine, Ranking, RBAC)
3. **AI Service**: Python + FastAPI (Resume Analysis, AI-Style Detection, Virtual Interviews)
4. **Database**: PostgreSQL (Relational mapping for Candidates, Projects, Reviews)

## ⚡ Setup Instructions (Local Development)

### Prerequisites
- Node.js 18+
- Java 17+
- Python 3.10+
- Docker & Docker Compose

### 1. Database & Infrastructure
```bash
# Start PostgreSQL via Docker Compose
docker-compose up -d db
```

### 2. AI Service
```bash
cd ai-service
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 3. Backend (Spring Boot)
```bash
cd backend
./mvnw spring-boot:run
```

### 4. Frontend
```bash
cd frontend
npm install
npm run dev
```

## 🌟 Key Features

- **Resume Intelligence**: Analyzes resume for technical evidence and detects AI-slop generation.
- **Watermarking**: Cryptographic hashes for document authenticity.
- **Proof Graph**: Visual mapping connecting capability scores to verified project evidence.
- **Project Verification**: Deep GitHub integration validating commits and repos.
- **Recruiter Discovery**: Talent matching based strictly on *verified* technical evidence, not claims.
- **Virtual AI Interview**: Dynamic technical system design assessments.

## 📄 Documentation

- Architecture: `docs/architecture.md`
- Database Schema: `docs/database_schema.md`
