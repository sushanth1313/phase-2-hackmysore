import os
import json
import logging
from typing import Dict, Any, List, Optional
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("proofhire.llm")

class LLMService:
    def __init__(self):
        self.api_key = (
            os.getenv("OPENAI_API_KEY") or 
            os.getenv("GROQ_API_KEY") or 
            os.getenv("ANTHROPIC_API_KEY")
        )
        self.provider = "none"
        self.client = None

        if os.getenv("OPENAI_API_KEY"):
            self.provider = "openai"
            try:
                from openai import OpenAI
                base_url = os.getenv("OPENAI_BASE_URL", None)
                self.client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"), base_url=base_url)
            except Exception as e:
                logger.warning(f"Failed to initialize OpenAI client: {e}")
        elif os.getenv("GROQ_API_KEY"):
            self.provider = "groq"
            try:
                from openai import OpenAI
                self.client = OpenAI(
                    api_key=os.getenv("GROQ_API_KEY"),
                    base_url="https://api.groq.com/openai/v1"
                )
            except Exception as e:
                logger.warning(f"Failed to initialize Groq client: {e}")

    def is_configured(self) -> bool:
        return self.client is not None and bool(self.api_key)

    def get_provider(self) -> str:
        return self.provider if self.is_configured() else "not_configured"

    def interpret_project_evidence(
        self,
        project_name: str,
        claimed_technologies: List[str],
        evidence_items: List[Dict[str, Any]],
        detected_stats: Dict[str, Any],
        scores: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Interprets factual project evidence into explainable insights.
        Grounds every conclusion strictly in detected evidence.
        """
        if not self.is_configured():
            return self._deterministic_project_interpretation(
                project_name, claimed_technologies, evidence_items, detected_stats, scores
            )

        try:
            detected_names = [f"{item['type']}: {item['name']}" for item in evidence_items]
            prompt = f"""
You are an expert technical assessor for ProofHire.
Evaluate the candidate's project based strictly on factual evidence extracted via static code analysis.

Project Name: {project_name}
Claimed Technologies: {', '.join(claimed_technologies) if claimed_technologies else 'None specified'}
Detected Evidence Items:
{json.dumps(detected_names[:30], indent=2)}

Codebase Statistics:
- Languages: {json.dumps(detected_stats.get('languages', {}))}
- Total Source Files: {detected_stats.get('source_files_count', 0)}
- Test Files Detected: {detected_stats.get('test_files_count', 0)}
- Docker / Containerization: {detected_stats.get('has_docker', False)}
- CI/CD Configuration: {detected_stats.get('has_cicd', False)}

Scoring Signals (0-100):
- Functionality & Architecture: {scores.get('architecture', 70)}
- Code Quality: {scores.get('codeQuality', 70)}
- Testing: {scores.get('testing', 50)}
- Documentation: {scores.get('documentation', 50)}
- Security & Config: {scores.get('security', 60)}

CRITICAL INSTRUCTIONS:
1. Ground your observations strictly in the detected facts above. DO NOT hallucinate technologies not present.
2. Return JSON ONLY with keys:
   - "summary": A 2-3 sentence technical overview of what the candidate built and demonstrated.
   - "strengths": Array of 3-4 specific technical strengths backed by the evidence.
   - "weaknesses": Array of 2-3 constructive technical improvement areas (e.g. lack of tests, missing docs, error handling).
   - "architectureNotes": 2-3 sentences explaining the architectural patterns detected (e.g. MVC, modular services, API structure).
"""
            model_name = os.getenv("LLM_MODEL", "gpt-4o-mini" if self.provider == "openai" else "llama-3.1-8b-instant")
            response = self.client.chat.completions.create(
                model=model_name,
                messages=[
                    {"role": "system", "content": "You are a factual, strict technical auditor. Always output valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.2,
                response_format={"type": "json_object"}
            )
            raw_content = response.choices[0].message.content
            parsed = json.loads(raw_content)
            return {
                "summary": parsed.get("summary", ""),
                "strengths": parsed.get("strengths", []),
                "weaknesses": parsed.get("weaknesses", []),
                "architectureNotes": parsed.get("architectureNotes", ""),
                "provider": self.provider,
                "model": model_name
            }
        except Exception as e:
            logger.error(f"LLM interpretation error: {e}. Falling back to deterministic synthesis.")
            return self._deterministic_project_interpretation(
                project_name, claimed_technologies, evidence_items, detected_stats, scores
            )

    def _deterministic_project_interpretation(
        self,
        project_name: str,
        claimed_technologies: List[str],
        evidence_items: List[Dict[str, Any]],
        detected_stats: Dict[str, Any],
        scores: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Deterministic, grounded evidence interpretation when LLM is offline or not configured."""
        frameworks = [item['name'] for item in evidence_items if item['type'] in ('FRAMEWORK', 'LIBRARY')]
        languages = list(detected_stats.get('languages', {}).keys())
        has_tests = detected_stats.get('test_files_count', 0) > 0
        has_docker = detected_stats.get('has_docker', False)
        has_cicd = detected_stats.get('has_cicd', False)

        summary_parts = []
        if languages:
            summary_parts.append(f"Demonstrates implementation in {', '.join(languages[:3])}")
        if frameworks:
            summary_parts.append(f"leveraging {', '.join(frameworks[:4])}")
        summary_str = f"Codebase '{project_name}' {(' '.join(summary_parts)) if summary_parts else 'verified through static source analysis'}."

        strengths = []
        if languages:
            strengths.append(f"Primary implementation in {languages[0]} with structured modular organization.")
        if frameworks:
            strengths.append(f"Direct integration with {', '.join(frameworks[:2])} detected in source files.")
        if has_docker:
            strengths.append("Containerization configured via Docker / Compose.")
        if has_cicd:
            strengths.append("Automated workflows detected in repository configuration.")
        if not strengths:
            strengths.append("Successfully validated file integrity and source structure.")

        weaknesses = []
        if not has_tests:
            weaknesses.append("No automated test suite detected. Adding unit and integration tests is recommended.")
        if scores.get('documentation', 0) < 60:
            weaknesses.append("Documentation is sparse. Consider adding detailed API specifications and setup instructions.")
        if scores.get('security', 0) < 60:
            weaknesses.append("Consider adopting structured input validation and centralized environment variable management.")
        if not weaknesses:
            weaknesses.append("Continue expanding test coverage across edge cases and asynchronous pipelines.")

        arch_parts = []
        if any(item['name'] == 'Express' or item['name'] == 'FastAPI' for item in evidence_items):
            arch_parts.append("Exposes modular REST API endpoints with routing separation.")
        if any(item['type'] == 'DATABASE' for item in evidence_items):
            db_item = next(item['name'] for item in evidence_items if item['type'] == 'DATABASE')
            arch_parts.append(f"Integrates persistence layer utilizing {db_item}.")
        arch_notes = " ".join(arch_parts) if arch_parts else "Standard monolithic modular architecture."

        return {
            "summary": summary_str,
            "strengths": strengths,
            "weaknesses": weaknesses,
            "architectureNotes": arch_notes,
            "provider": "deterministic-engine",
            "model": "rule-based-v1"
        }

    def generate_interview_questions(
        self,
        candidate_skills: List[str],
        verified_technologies: List[str],
        role: str = "Software Engineer",
        difficulty: str = "Medium"
    ) -> List[Dict[str, Any]]:
        """Generates dynamic interview questions rooted in candidate's verified evidence."""
        tech_context = verified_technologies if verified_technologies else candidate_skills
        if not tech_context:
            tech_context = ["General Software Engineering", "Data Structures", "API Design"]

        if not self.is_configured():
            # Return evidence-targeted rule questions
            questions = []
            for i, tech in enumerate(tech_context[:3]):
                questions.append({
                    "id": f"q_{i+1}",
                    "technology": tech,
                    "question": f"In your recent work with {tech}, how did you handle error propagation, boundary validation, and state consistency?",
                    "difficulty": difficulty,
                    "expectedRubric": f"Demonstrates practical knowledge of {tech} idioms, error boundaries, and production reliability."
                })
            return questions

        try:
            prompt = f"""
Generate 3 realistic, technical interview questions tailored specifically to a candidate with verified experience in:
{', '.join(tech_context)}
Role: {role}
Difficulty: {difficulty}

Each question must evaluate deep architectural and implementation understanding of their actual tech stack.
Return JSON with key "questions" containing a list of objects:
- "id": string
- "technology": string
- "question": string
- "difficulty": string
- "expectedRubric": string (concise grading criteria)
"""
            model_name = os.getenv("LLM_MODEL", "gpt-4o-mini" if self.provider == "openai" else "llama-3.1-8b-instant")
            response = self.client.chat.completions.create(
                model=model_name,
                messages=[
                    {"role": "system", "content": "You are a senior technical interviewer. Output valid JSON only."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                response_format={"type": "json_object"}
            )
            parsed = json.loads(response.choices[0].message.content)
            return parsed.get("questions", [])
        except Exception as e:
            logger.error(f"Failed to generate LLM interview questions: {e}")
            return [
                {
                    "id": "q_1",
                    "technology": tech_context[0],
                    "question": f"Walk me through the architecture of a production project you built using {tech_context[0]}. What were the toughest trade-offs?",
                    "difficulty": difficulty,
                    "expectedRubric": "Assesses architecture decision-making, performance trade-offs, and design clarity."
                }
            ]

llm_service = LLMService()
