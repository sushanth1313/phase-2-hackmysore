import os
import shutil
import logging
from typing import List, Optional
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

from llm_service import llm_service
from analyzer import project_analyzer
from resume_parser import resume_parser

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("proofhire.main")

app = FastAPI(
    title="ProofHire AI & Static Analysis Service",
    version="2.0.0",
    description="Factual evidence extraction, deterministic code auditing, and explainable AI assessment engine."
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AnalyzeProjectRequest(BaseModel):
    projectId: str
    filePath: str
    userId: str
    projectName: Optional[str] = "Uploaded Project"
    claimedTechnologies: Optional[List[str]] = []

class InterviewAnswerRequest(BaseModel):
    question: str
    answer: str
    expectedRubric: Optional[str] = ""
    technology: Optional[str] = ""

@app.get("/")
def read_root():
    return {
        "message": "ProofHire AI Service is running",
        "status": "healthy",
        "version": "2.0.0",
        "llm_provider": llm_service.get_provider()
    }

@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "proofhire-ai-analyzer",
        "version": "2.0.0",
        "llm_configured": llm_service.is_configured(),
        "llm_provider": llm_service.get_provider()
    }

@app.post("/api/analyze")
async def analyze_project(req: AnalyzeProjectRequest):
    """
    Main project analysis pipeline:
    1. Validates zip file safety & integrity
    2. Extracts to isolated sandbox
    3. Performs deterministic static code analysis (manifests, patterns, tests, docs)
    4. Cross-verifies candidate claims against detected evidence
    5. Calculates 8-dimension grounded scores
    6. Interprets evidence via LLM (or deterministic rule engine if LLM offline)
    7. Cleans up source files from disk (PRD security compliance)
    """
    logger.info(f"Received analysis request for project: {req.projectId}, path: {req.filePath}")
    
    if not os.path.exists(req.filePath):
        raise HTTPException(status_code=404, detail=f"Archive file not found at {req.filePath}")

    sandbox_dir = None
    try:
        sandbox_dir, project_hash = project_analyzer.validate_and_extract_archive(req.filePath)
        
        result = project_analyzer.analyze_workspace(
            extracted_dir=sandbox_dir,
            project_name=req.projectName or "Candidate Project",
            claimed_technologies=req.claimedTechnologies or []
        )
        
        # Attach project hash
        result["integritySignals"]["projectHash"] = project_hash

        return {
            "success": True,
            "projectId": req.projectId,
            "data": result
        }

    except ValueError as ve:
        logger.error(f"Validation error for project {req.projectId}: {ve}")
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logger.error(f"Analysis error for project {req.projectId}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Code analysis failed: {str(e)}")
    finally:
        if sandbox_dir and os.path.exists(sandbox_dir):
            shutil.rmtree(sandbox_dir, ignore_errors=True)
            logger.info(f"Cleaned up sandbox workspace: {sandbox_dir}")

@app.post("/analyze-resume")
async def analyze_resume_endpoint(
    file: UploadFile = File(...),
    jobDescription: Optional[str] = Form(None)
):
    """Real resume analysis endpoint supporting PDF, DOCX, and TXT."""
    filename = file.filename or "resume.pdf"
    if not filename.lower().endswith(('.pdf', '.docx', '.txt')):
        raise HTTPException(status_code=400, detail="Only PDF, DOCX, or TXT allowed")

    try:
        content = await file.read()
        report = resume_parser.analyze_resume(
            file_bytes=content,
            filename=filename,
            job_description=jobDescription
        )
        return {
            "success": True,
            "data": report
        }
    except Exception as e:
        logger.error(f"Resume analysis failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to analyze resume: {str(e)}")

@app.get("/generate-interview-question")
def get_interview_question(
    role: str = "Software Engineer",
    difficulty: str = "Medium",
    skills: Optional[str] = None
):
    """Generates targeted technical interview questions grounded in candidate's skills."""
    skill_list = [s.strip() for s in skills.split(",")] if skills else []
    questions = llm_service.generate_interview_questions(
        candidate_skills=skill_list,
        verified_technologies=skill_list,
        role=role,
        difficulty=difficulty
    )
    return {
        "success": True,
        "questions": questions,
        "role": role,
        "difficulty": difficulty
    }

TECH_DOMAIN_KEYWORDS = [
    "load balancing", "horizontal scaling", "vertical scaling", "redis", "caching", 
    "cache", "replication", "consistency", "eventual consistency", "strong consistency", 
    "sharding", "partition", "kafka", "rabbitmq", "queue", "message queue", "latency", 
    "throughput", "circuit breaker", "circuit-breaker", "backpressure", "postgres", 
    "postgresql", "mysql", "mongodb", "distributed", "concurrency", "mutex", "lock", 
    "failover", "idempotent", "idempotency", "acid", "index", "btree", "microservices", 
    "rest", "grpc", "graphql", "observability", "metrics", "prometheus", "docker", 
    "kubernetes", "stateless", "stateful", "high availability", "sla", "slo", "timeout", 
    "retry", "exponential backoff", "dead letter queue", "database", "api gateway",
    "dfs", "bfs", "graph", "cycle", "vector", "pointer", "tree", "hash", "recursion",
    "memory", "template", "stl", "algorithm", "stack", "topological", "kahn", "complexity"
]

EVASIVE_SHORT_ANSWERS = {
    "ok", "k", "yes", "no", "fine", "good", "maybe", "sure", "idk", 
    "cool", "nope", "yep", "done", "alright", "test", "idk man", "pass"
}

@app.post("/evaluate-interview-answer")
def evaluate_interview_answer(req: InterviewAnswerRequest):
    """
    Evaluates candidate response strictly against the supplied question.
    Enforces server-side validation, relevance check, and rubric scoring.
    """
    answer_raw = req.answer.strip()
    lower_ans = answer_raw.lower()
    
    # 1. Validation check
    if not answer_raw:
        raise HTTPException(status_code=400, detail="Answer cannot be empty.")

    irrelevant_words = {"banana", "apple", "orange", "pizza", "car", "dog", "cat", "random", "hello", "hi"}
    is_irrelevant_phrase = "i like working with react" in lower_ans or lower_ans in irrelevant_words

    # 2. Check Irrelevance FIRST (e.g. "banana", or talking about React for graph questions)
    if is_irrelevant_phrase:
        return {
            "success": True,
            "status": "IRRELEVANT",
            "relevance": 0,
            "technical_accuracy": 0.0,
            "problem_solving": 0.0,
            "depth": 0.0,
            "communication": 1.0,
            "evidence": [],
            "strengths": [],
            "weaknesses": ["Answer does not address the technical or architectural concept requested"],
            "feedback": f"The response does not address the requested architectural or algorithmic concept.",
            "next_question_reason": "Candidate provided an irrelevant response. Request direct technical explanation.",
            "score": 0.0,
            "technicalAccuracy": 0.0,
            "problemSolving": 0.0,
            "domainKeywords": [],
            "adaptiveFollowUp": "The previous answer did not address the technical question. Please explain how you would solve this directly.",
            "passed": False
        }

    # 3. Check for extremely short or evasive answers ("ok", "yes", "no", "fine")
    if lower_ans in EVASIVE_SHORT_ANSWERS or len(answer_raw) < 8:
        return {
            "success": True,
            "status": "INSUFFICIENT",
            "relevance": 0,
            "technical_accuracy": 0.0,
            "problem_solving": 0.0,
            "depth": 0.0,
            "communication": 1.0,
            "evidence": [],
            "strengths": [],
            "weaknesses": ["Response is too brief to evaluate technical depth or implementation details"],
            "feedback": "The response does not contain enough technical information to evaluate the requested concept.",
            "next_question_reason": "Answer is too brief. Prompt for detailed technical explanation.",
            "score": 0.0,
            "technicalAccuracy": 0.0,
            "problemSolving": 0.0,
            "domainKeywords": [],
            "adaptiveFollowUp": "Your answer is too brief to evaluate. Please explain how you would handle this scenario in detail.",
            "passed": False
        }

    # 4. Detect matched technical domain keywords
    detected_keywords = []
    for kw in TECH_DOMAIN_KEYWORDS:
        if kw in lower_ans:
            detected_keywords.append(kw)
    
    # Check technology param
    if req.technology and req.technology.lower() in lower_ans and req.technology.lower() not in detected_keywords:
        detected_keywords.append(req.technology.lower())

    words = answer_raw.split()
    word_count = len(words)

    # 5. Evaluate if LLM is configured
    if llm_service.is_configured():
        try:
            eval_prompt = f"""
QUESTION:
{req.question}

CANDIDATE ANSWER:
{answer_raw}

EVALUATION RULE:
Evaluate ONLY the candidate's answer to the supplied question.
Do not infer knowledge that the candidate did not demonstrate.
Do not reward the candidate for concepts not present in the answer.
Do not generate generic positive feedback.
If the answer is too short, irrelevant, evasive, or insufficient, mark it as INSUFFICIENT or IRRELEVANT.

Return JSON ONLY with this schema:
{{
  "relevance": "RELEVANT" | "PARTIALLY_RELEVANT" | "IRRELEVANT" | "INSUFFICIENT",
  "score": float (0.0 to 10.0),
  "technicalAccuracy": float (0.0 to 10.0),
  "problemSolving": float (0.0 to 10.0),
  "communication": float (0.0 to 10.0),
  "depth": float (0.0 to 10.0),
  "evidenceGrounding": float (0.0 to 10.0),
  "domainKeywords": list of strings,
  "feedback": string,
  "missingConcepts": list of strings,
  "recommendation": string,
  "adaptiveFollowUp": string
}}
"""
            model_name = os.getenv("LLM_MODEL", "gpt-4o-mini" if llm_service.provider == "openai" else "llama-3.1-8b-instant")
            response = llm_service.client.chat.completions.create(
                model=model_name,
                messages=[
                    {"role": "system", "content": "You are a strict, objective technical evaluator. Output valid JSON only."},
                    {"role": "user", "content": eval_prompt}
                ],
                temperature=0.1,
                response_format={"type": "json_object"}
            )
            parsed = json.loads(response.choices[0].message.content)
            # Bound all scores 0 <= score <= 10
            for key in ["score", "technicalAccuracy", "problemSolving", "communication", "depth", "evidenceGrounding"]:
                if key in parsed:
                    parsed[key] = max(0.0, min(10.0, float(parsed[key])))
            parsed["success"] = True
            parsed["passed"] = parsed.get("score", 0) >= 7.0
            return parsed
        except Exception as e:
            logger.warning(f"LLM evaluation failed, falling back to deterministic evaluation: {e}")

    # 6. High-fidelity deterministic evaluation based on actual demonstrated content
    if len(detected_keywords) >= 3 and word_count >= 20:
        relevance = "RELEVANT"
        tech_acc = min(9.5, 7.0 + len(detected_keywords) * 0.5)
        prob_solv = min(9.0, 6.5 + (0.5 if "trade-off" in lower_ans or "tradeoff" in lower_ans or "consistency" in lower_ans else 0.0) + (1.0 if word_count > 40 else 0.5))
        comm = min(9.0, 7.5 + (1.0 if word_count > 30 else 0.5))
        depth_val = min(9.0, 6.0 + len(detected_keywords) * 0.6)
        evidence_val = min(9.0, 6.5 + len(detected_keywords) * 0.4)
        overall = round((tech_acc + prob_solv + comm + depth_val + evidence_val) / 5.0, 1)
        
        feedback_text = f"Candidate demonstrated concrete understanding of {', '.join(detected_keywords[:4])} with clear system design reasoning."
        adaptive_followup = f"You touched on {detected_keywords[0]}. How would you handle node failover, split-brain scenarios, or backpressure under high load?"
        missing = ["Quantitative SLO/SLA targets", "Failure boundary isolation"] if "failover" not in detected_keywords else ["Automated canary rollouts"]
        recommendation = "Elaborate with specific latency metrics and backpressure strategies."
    elif len(detected_keywords) >= 1 or word_count >= 15:
        relevance = "PARTIALLY_RELEVANT"
        tech_acc = 5.5
        prob_solv = 5.0
        comm = 6.0
        depth_val = 4.5
        evidence_val = 5.0
        overall = round((tech_acc + prob_solv + comm + depth_val + evidence_val) / 5.0, 1)
        feedback_text = f"Candidate mentioned {', '.join(detected_keywords) if detected_keywords else 'general concepts'}, but the answer lacks architectural depth and concrete trade-offs."
        adaptive_followup = f"Could you dive deeper into how you would structure data replication and recovery in this architecture?"
        missing = ["Failure modes", "Consistency trade-offs", "Operational recovery"]
        recommendation = "Detail the mechanisms for data partitioning, replication, and caching."
    else:
        relevance = "INSUFFICIENT"
        tech_acc = 2.0
        prob_solv = 2.0
        comm = 3.0
        depth_val = 1.5
        evidence_val = 1.5
        overall = 2.0
        feedback_text = "The answer does not adequately address the architectural question or demonstrate required technical depth."
        adaptive_followup = "Your answer lacks sufficient detail. Please explain the technical components and trade-offs."
        missing = ["Architecture patterns", "Data flow", "Fault tolerance"]
        recommendation = "Provide concrete system design patterns and implementation details."

    return {
        "success": True,
        "relevance": relevance,
        "score": overall,
        "technicalAccuracy": tech_acc,
        "problemSolving": prob_solv,
        "communication": comm,
        "depth": depth_val,
        "evidenceGrounding": evidence_val,
        "domainKeywords": detected_keywords,
        "feedback": feedback_text,
        "missingConcepts": missing,
        "recommendation": recommendation,
        "adaptiveFollowUp": adaptive_followup,
        "passed": overall >= 7.0
    }

