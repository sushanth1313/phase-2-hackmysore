import os
import re
import json
import shutil
import hashlib
import tempfile
import zipfile
import logging
from typing import Dict, Any, List, Tuple
from llm_service import llm_service

logger = logging.getLogger("proofhire.analyzer")

IGNORED_DIRS = {
    "node_modules", ".git", "__pycache__", "venv", ".venv", "env",
    "dist", "build", ".next", ".nuxt", "target", "bin", "obj", ".idea", ".vscode"
}

IGNORED_EXTS = {
    ".png", ".jpg", ".jpeg", ".gif", ".svg", ".ico", ".woff", ".woff2",
    ".ttf", ".eot", ".mp4", ".mp3", ".pdf", ".zip", ".tar", ".gz", ".exe"
}

LANGUAGE_EXTENSIONS = {
    ".py": "Python",
    ".ts": "TypeScript",
    ".tsx": "TypeScript (React)",
    ".js": "JavaScript",
    ".jsx": "JavaScript (React)",
    ".go": "Go",
    ".rs": "Rust",
    ".java": "Java",
    ".cpp": "C++",
    ".c": "C",
    ".cs": "C#",
    ".php": "PHP",
    ".rb": "Ruby",
    ".sql": "SQL",
    ".html": "HTML",
    ".css": "CSS",
    ".scss": "SCSS",
    ".sh": "Shell",
    ".ps1": "PowerShell"
}

TECH_SIGNATURES = {
    # Frameworks
    "Express": {"type": "FRAMEWORK", "regex": r"(require\(['\"]express['\"]|from ['\"]express['\"]|express\(\))"},
    "FastAPI": {"type": "FRAMEWORK", "regex": r"(from fastapi import|import fastapi|FastAPI\()"},
    "Flask": {"type": "FRAMEWORK", "regex": r"(from flask import|import flask|Flask\(__name__\))"},
    "Django": {"type": "FRAMEWORK", "regex": r"(from django|import django|django\.db)"},
    "Next.js": {"type": "FRAMEWORK", "regex": r"(from ['\"]next/|next/navigation|next/router)"},
    "React": {"type": "FRAMEWORK", "regex": r"(from ['\"]react['\"]|require\(['\"]react['\"]|React\.Component|useState|useEffect)"},
    "Vue": {"type": "FRAMEWORK", "regex": r"(from ['\"]vue['\"]|createApp\(|<template>)"},
    "NestJS": {"type": "FRAMEWORK", "regex": r"(@nestjs/|@Controller\(|@Injectable\()"},
    "Spring Boot": {"type": "FRAMEWORK", "regex": r"(@SpringBootApplication|@RestController|@Autowired)"},

    # Databases & ORM
    "MongoDB / Mongoose": {"type": "DATABASE", "regex": r"(mongoose\.connect|mongoose\.Schema|mongodb://|MongoClient)"},
    "PostgreSQL": {"type": "DATABASE", "regex": r"(postgres://|postgresql://|psycopg2|from ['\"]pg['\"]|TypeOrmModule\.forRoot)"},
    "Prisma": {"type": "DATABASE", "regex": r"(@prisma/client|new PrismaClient|prisma\.)"},
    "Redis": {"type": "DATABASE", "regex": r"(createClient\(\{.*redis|from ['\"]ioredis['\"]|import redis|redis\.Redis)"},
    "SQLite": {"type": "DATABASE", "regex": r"(sqlite3|sqlite://|open\(\{.*sqlite)"},
    "SQLAlchemy": {"type": "DATABASE", "regex": r"(from sqlalchemy|import sqlalchemy|declarative_base|sessionmaker)"},

    # Authentication & Security
    "JWT": {"type": "SECURITY", "regex": r"(jsonwebtoken|jwt\.sign|jwt\.verify|pyjwt|Bearer )"},
    "Bcrypt": {"type": "SECURITY", "regex": r"(bcrypt\.hash|bcrypt\.compare|bcrypt\.gensalt)"},
    "CORS": {"type": "SECURITY", "regex": r"(cors\(\)|CORSMiddleware|add_middleware\(CORSMiddleware)"},
    "Helmet": {"type": "SECURITY", "regex": r"(helmet\(\)|import helmet)"},

    # Architecture & APIs
    "REST API": {"type": "API", "regex": r"(\.get\(|\.post\(|\.put\(|\.delete\(|\.patch\(|@app\.get|@app\.post|@router\.get)"},
    "GraphQL": {"type": "API", "regex": r"(graphql|ApolloServer|buildSchema|type Query)"},
    "WebSocket": {"type": "API", "regex": r"(WebSocket|io\.on\(['\"]connection|socket\.emit|ws://|wss://)"},

    # Testing
    "Jest": {"type": "TESTING", "regex": r"(describe\(|test\(|it\(|expect\(.*\.toBe|jest\.fn)"},
    "Pytest": {"type": "TESTING", "regex": r"(import pytest|def test_|pytest\.mark|pytest\.fixture)"},
    "Mocha / Chai": {"type": "TESTING", "regex": r"(describe\(.*it\(|expect\(.*\.to\.equal)"},
    "Unittest": {"type": "TESTING", "regex": r"(import unittest|unittest\.TestCase)"},

    # DevOps
    "Docker": {"type": "DEVOPS", "regex": r"(FROM |CMD |ENTRYPOINT |docker-compose)"},
    "GitHub Actions": {"type": "DEVOPS", "regex": r"(on:\s*\[push|jobs:\s*build:)"}
}

class ProjectAnalyzer:
    def validate_and_extract_archive(self, zip_path: str) -> Tuple[str, str]:
        """
        Validates the zip archive for integrity and security (anti-zip slip / zip bomb).
        Extracts to an isolated temporary sandbox.
        Returns: (extracted_directory_path, project_sha256_hash)
        """
        if not os.path.exists(zip_path):
            raise FileNotFoundError(f"Project archive not found at: {zip_path}")

        # Compute SHA-256 hash of the archive
        sha256 = hashlib.sha256()
        with open(zip_path, "rb") as f:
            while chunk := f.read(65536):
                sha256.update(chunk)
        project_hash = sha256.hexdigest()

        if not zipfile.is_zipfile(zip_path):
            raise ValueError("Uploaded file is not a valid zip archive")

        temp_dir = tempfile.mkdtemp(prefix="proofhire_sandbox_")

        total_extracted_size = 0
        MAX_UNCOMPRESSED_SIZE = 100 * 1024 * 1024  # 100 MB max

        with zipfile.ZipFile(zip_path, 'r') as zf:
            for member in zf.infolist():
                # Prevent Zip Slip directory traversal
                member_path = member.filename.replace('\\', '/')
                if member_path.startswith('/') or '..' in member_path.split('/'):
                    shutil.rmtree(temp_dir, ignore_errors=True)
                    raise ValueError(f"Security Alert: Malicious path detected in archive: {member.filename}")

                total_extracted_size += member.file_size
                if total_extracted_size > MAX_UNCOMPRESSED_SIZE:
                    shutil.rmtree(temp_dir, ignore_errors=True)
                    raise ValueError("Security Alert: Uncompressed archive size exceeds maximum safety limit")

            zf.extractall(temp_dir)

        return temp_dir, project_hash

    def analyze_workspace(
        self,
        extracted_dir: str,
        project_name: str,
        claimed_technologies: List[str]
    ) -> Dict[str, Any]:
        """
        Executes static analysis across the extracted codebase.
        Gathers deterministic evidence, verifies claims, computes 8-dim scores, and generates assessment.
        """
        file_tree = []
        languages_count: Dict[str, int] = {}
        all_source_files: List[str] = []
        test_files: List[str] = []
        has_docker = False
        has_cicd = False
        has_readme = False
        readme_content = ""

        # Walk through file tree
        for root, dirs, files in os.walk(extracted_dir):
            dirs[:] = [d for d in dirs if d not in IGNORED_DIRS]
            rel_root = os.path.relpath(root, extracted_dir)

            for file in files:
                rel_path = os.path.normpath(os.path.join(rel_root, file)).replace('\\', '/')
                if rel_path.startswith('./'):
                    rel_path = rel_path[2:]

                ext = os.path.splitext(file)[1].lower()
                base_name = file.lower()

                file_tree.append(rel_path)

                # Check documentation
                if base_name in ("readme.md", "readme.txt", "readme"):
                    has_readme = True
                    try:
                        with open(os.path.join(root, file), 'r', encoding='utf-8', errors='ignore') as rf:
                            readme_content = rf.read(10000)
                    except Exception:
                        pass

                # Check Docker
                if base_name in ("dockerfile", "docker-compose.yml", "docker-compose.yaml"):
                    has_docker = True

                # Check CI/CD
                if ".github/workflows" in rel_path or base_name == ".gitlab-ci.yml":
                    has_cicd = True

                # Count languages
                if ext in LANGUAGE_EXTENSIONS:
                    lang = LANGUAGE_EXTENSIONS[ext]
                    languages_count[lang] = languages_count.get(lang, 0) + 1

                # Classify source vs tests
                if ext not in IGNORED_EXTS and ext != "":
                    all_source_files.append(rel_path)
                    if any(t in base_name for t in ("test", "spec", "_test", ".test.", ".spec.")):
                        test_files.append(rel_path)

        # Calculate Tree Hash
        tree_hash = hashlib.sha256("".join(sorted(file_tree)).encode('utf-8')).hexdigest()

        # Parse Package Manifests
        manifest_evidence = self._parse_manifests(extracted_dir)

        # Scan code files for technical patterns
        pattern_evidence = self._scan_source_patterns(extracted_dir, all_source_files[:150])

        # Merge evidence items
        evidence_items_map: Dict[str, Dict[str, Any]] = {}
        for item in manifest_evidence + pattern_evidence:
            key = f"{item['type']}:{item['name']}"
            if key in evidence_items_map:
                existing = evidence_items_map[key]
                existing["occurrences"] += item.get("occurrences", 1)
                existing["confidence"] = max(existing["confidence"], item.get("confidence", 0.8))
                for f in item.get("files", []):
                    if f not in existing["files"]:
                        existing["files"].append(f)
            else:
                evidence_items_map[key] = item

        # Also add prominent languages as evidence items
        for lang, count in languages_count.items():
            key = f"LANGUAGE:{lang}"
            if count >= 1 and key not in evidence_items_map:
                evidence_items_map[key] = {
                    "type": "LANGUAGE",
                    "name": lang,
                    "confidence": min(1.0, 0.7 + (count * 0.05)),
                    "occurrences": count,
                    "files": [f for f in all_source_files if f.endswith(tuple(k for k, v in LANGUAGE_EXTENSIONS.items() if v == lang))][:5]
                }

        evidence_items = list(evidence_items_map.values())

        # Claim Verification
        claim_verifications = self._verify_claims(claimed_technologies, evidence_items, file_tree)

        # Calculate 8-Dimension Scores
        scores = self._calculate_scores(
            evidence_items=evidence_items,
            languages_count=languages_count,
            source_file_count=len(all_source_files),
            test_file_count=len(test_files),
            has_docker=has_docker,
            has_cicd=has_cicd,
            has_readme=has_readme,
            readme_length=len(readme_content)
        )

        # AI Interpretation (LLM or deterministic)
        detected_stats = {
            "languages": languages_count,
            "source_files_count": len(all_source_files),
            "test_files_count": len(test_files),
            "has_docker": has_docker,
            "has_cicd": has_cicd
        }
        ai_assessment = llm_service.interpret_project_evidence(
            project_name=project_name,
            claimed_technologies=claimed_technologies,
            evidence_items=evidence_items,
            detected_stats=detected_stats,
            scores=scores
        )

        return {
            "evidenceItems": evidence_items,
            "claimVerifications": claim_verifications,
            "scores": scores,
            "aiAssessment": {
                "summary": ai_assessment.get("summary", ""),
                "strengths": ai_assessment.get("strengths", []),
                "weaknesses": ai_assessment.get("weaknesses", []),
                "architectureNotes": ai_assessment.get("architectureNotes", ""),
                "generatedAt": None
            },
            "integritySignals": {
                "treeHash": tree_hash,
                "requiresReview": len(all_source_files) < 2,
                "reviewReason": "Very small submission" if len(all_source_files) < 2 else None
            }
        }

    def _parse_manifests(self, extracted_dir: str) -> List[Dict[str, Any]]:
        """Parses dependency manifests (package.json, requirements.txt, pyproject.toml, go.mod, Cargo.toml)."""
        items = []

        # package.json
        pkg_path = os.path.join(extracted_dir, "package.json")
        if os.path.exists(pkg_path):
            try:
                with open(pkg_path, 'r', encoding='utf-8', errors='ignore') as f:
                    data = json.load(f)
                    deps = {**data.get("dependencies", {}), **data.get("devDependencies", {})}
                    for dep in deps:
                        dep_lower = dep.lower()
                        if dep_lower in ("express", "fastify", "koa"):
                            items.append({"type": "FRAMEWORK", "name": dep.capitalize(), "confidence": 0.95, "occurrences": 1, "files": ["package.json"]})
                        elif dep_lower in ("react", "react-dom"):
                            items.append({"type": "FRAMEWORK", "name": "React", "confidence": 0.95, "occurrences": 1, "files": ["package.json"]})
                        elif dep_lower in ("next", "next.js"):
                            items.append({"type": "FRAMEWORK", "name": "Next.js", "confidence": 0.95, "occurrences": 1, "files": ["package.json"]})
                        elif dep_lower in ("vue", "nuxt"):
                            items.append({"type": "FRAMEWORK", "name": "Vue", "confidence": 0.95, "occurrences": 1, "files": ["package.json"]})
                        elif dep_lower in ("mongoose", "mongodb"):
                            items.append({"type": "DATABASE", "name": "MongoDB / Mongoose", "confidence": 0.95, "occurrences": 1, "files": ["package.json"]})
                        elif dep_lower in ("pg", "postgres", "typeorm", "prisma", "@prisma/client"):
                            items.append({"type": "DATABASE", "name": "PostgreSQL / Prisma", "confidence": 0.95, "occurrences": 1, "files": ["package.json"]})
                        elif dep_lower in ("redis", "ioredis"):
                            items.append({"type": "DATABASE", "name": "Redis", "confidence": 0.95, "occurrences": 1, "files": ["package.json"]})
                        elif dep_lower in ("jest", "vitest", "mocha", "supertest"):
                            items.append({"type": "TESTING", "name": dep.capitalize(), "confidence": 0.95, "occurrences": 1, "files": ["package.json"]})
                        elif dep_lower in ("jsonwebtoken", "bcrypt", "bcryptjs", "helmet", "cors"):
                            items.append({"type": "SECURITY", "name": dep.capitalize(), "confidence": 0.95, "occurrences": 1, "files": ["package.json"]})
                        elif dep_lower in ("typescript",):
                            items.append({"type": "LANGUAGE", "name": "TypeScript", "confidence": 0.95, "occurrences": 1, "files": ["package.json"]})
                        elif dep_lower in ("tailwindcss", "tailwind"):
                            items.append({"type": "LIBRARY", "name": "TailwindCSS", "confidence": 0.90, "occurrences": 1, "files": ["package.json"]})
                        elif dep_lower in ("axios", "fetch"):
                            items.append({"type": "LIBRARY", "name": "Axios", "confidence": 0.85, "occurrences": 1, "files": ["package.json"]})
            except Exception as e:
                logger.warning(f"Error parsing package.json: {e}")

        # requirements.txt
        req_path = os.path.join(extracted_dir, "requirements.txt")
        if os.path.exists(req_path):
            try:
                with open(req_path, 'r', encoding='utf-8', errors='ignore') as f:
                    for line in f:
                        line = line.strip().split("==")[0].split(">=")[0].split("<=")[0].strip().lower()
                        if not line or line.startswith("#"):
                            continue
                        if line in ("fastapi", "uvicorn"):
                            items.append({"type": "FRAMEWORK", "name": "FastAPI", "confidence": 0.95, "occurrences": 1, "files": ["requirements.txt"]})
                        elif line in ("flask",):
                            items.append({"type": "FRAMEWORK", "name": "Flask", "confidence": 0.95, "occurrences": 1, "files": ["requirements.txt"]})
                        elif line in ("django",):
                            items.append({"type": "FRAMEWORK", "name": "Django", "confidence": 0.95, "occurrences": 1, "files": ["requirements.txt"]})
                        elif line in ("pymongo", "motor"):
                            items.append({"type": "DATABASE", "name": "MongoDB", "confidence": 0.95, "occurrences": 1, "files": ["requirements.txt"]})
                        elif line in ("sqlalchemy", "psycopg2", "psycopg2-binary", "asyncpg"):
                            items.append({"type": "DATABASE", "name": "SQLAlchemy / PostgreSQL", "confidence": 0.95, "occurrences": 1, "files": ["requirements.txt"]})
                        elif line in ("redis",):
                            items.append({"type": "DATABASE", "name": "Redis", "confidence": 0.95, "occurrences": 1, "files": ["requirements.txt"]})
                        elif line in ("pytest",):
                            items.append({"type": "TESTING", "name": "Pytest", "confidence": 0.95, "occurrences": 1, "files": ["requirements.txt"]})
                        elif line in ("pydantic",):
                            items.append({"type": "LIBRARY", "name": "Pydantic", "confidence": 0.90, "occurrences": 1, "files": ["requirements.txt"]})
                        elif line in ("pandas", "numpy", "scipy", "scikit-learn", "torch", "tensorflow"):
                            items.append({"type": "LIBRARY", "name": line.capitalize(), "confidence": 0.90, "occurrences": 1, "files": ["requirements.txt"]})
            except Exception as e:
                logger.warning(f"Error parsing requirements.txt: {e}")

        return items

    def _scan_source_patterns(self, extracted_dir: str, source_files: List[str]) -> List[Dict[str, Any]]:
        """Scans code files against regular expressions for frameworks, databases, security, and APIs."""
        findings: Dict[str, Dict[str, Any]] = {}

        for rel_file in source_files:
            full_path = os.path.join(extracted_dir, rel_file)
            try:
                # Read up to 100KB per file to avoid memory spikes
                with open(full_path, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read(100000)

                for name, sig in TECH_SIGNATURES.items():
                    matches = re.findall(sig["regex"], content, re.IGNORECASE)
                    if matches:
                        count = len(matches)
                        key = f"{sig['type']}:{name}"
                        if key not in findings:
                            findings[key] = {
                                "type": sig["type"],
                                "name": name,
                                "confidence": 0.85,
                                "occurrences": count,
                                "files": [rel_file]
                            }
                        else:
                            findings[key]["occurrences"] += count
                            if rel_file not in findings[key]["files"]:
                                findings[key]["files"].append(rel_file)
            except Exception:
                pass

        return list(findings.values())

    def _verify_claims(
        self,
        claimed_technologies: List[str],
        evidence_items: List[Dict[str, Any]],
        file_tree: List[str]
    ) -> List[Dict[str, Any]]:
        """Cross-checks candidate claimed technologies against detected evidence items."""
        verifications = []
        evidence_names_lower = {item["name"].lower(): item for item in evidence_items}

        for claim in claimed_technologies:
            clean_claim = claim.strip()
            if not clean_claim:
                continue

            claim_lower = clean_claim.lower()
            matched_evidence = []
            status = "INSUFFICIENT_EVIDENCE"
            confidence = 0.2

            # Direct or substring match in evidence items
            for ev_name_lower, ev_item in evidence_names_lower.items():
                if claim_lower in ev_name_lower or ev_name_lower in claim_lower:
                    matched_evidence.append(f"{ev_item['type']}: {ev_item['name']} ({ev_item['occurrences']} occurrences)")
                    confidence = max(confidence, ev_item["confidence"])
                    if ev_item["occurrences"] >= 2 or ev_item["confidence"] >= 0.8:
                        status = "SUPPORTED"
                    else:
                        status = "PARTIALLY_SUPPORTED"

            # Check filename match if not yet supported
            if status == "INSUFFICIENT_EVIDENCE":
                matching_files = [f for f in file_tree if claim_lower in f.lower()][:3]
                if matching_files:
                    matched_evidence.append(f"Files referencing name: {', '.join(matching_files)}")
                    status = "PARTIALLY_SUPPORTED"
                    confidence = 0.55

            verifications.append({
                "claim": clean_claim,
                "evidenceFound": matched_evidence,
                "status": status,
                "confidence": confidence
            })

        return verifications

    def _calculate_scores(
        self,
        evidence_items: List[Dict[str, Any]],
        languages_count: Dict[str, int],
        source_file_count: int,
        test_file_count: int,
        has_docker: bool,
        has_cicd: bool,
        has_readme: bool,
        readme_length: int
    ) -> Dict[str, Any]:
        """Calculates 8-dimension grounded scoring model (0-100)."""
        # Code Quality: file volume, modularity, type usage
        is_typed = any("typescript" in lang.lower() for lang in languages_count) or any("java" in lang.lower() for lang in languages_count)
        base_quality = 65
        if source_file_count >= 5: base_quality += 10
        if source_file_count >= 15: base_quality += 10
        if is_typed: base_quality += 10
        code_quality = min(95, base_quality)

        # Architecture: separation into models/routes/services
        has_api = any(item["type"] == "API" for item in evidence_items)
        has_db = any(item["type"] == "DATABASE" for item in evidence_items)
        base_arch = 60
        if has_api: base_arch += 15
        if has_db: base_arch += 15
        if source_file_count > 8: base_arch += 5
        architecture = min(96, base_arch)

        # Testing
        if test_file_count >= 3:
            testing_score = 90
        elif test_file_count >= 1:
            testing_score = 75
        elif any(item["type"] == "TESTING" for item in evidence_items):
            testing_score = 50
        else:
            testing_score = 25

        # Documentation
        if has_readme and readme_length > 1500:
            doc_score = 90
        elif has_readme and readme_length > 400:
            doc_score = 75
        elif has_readme:
            doc_score = 55
        else:
            doc_score = 30

        # Security
        has_sec = any(item["type"] == "SECURITY" for item in evidence_items)
        security_score = 85 if has_sec else 60

        # Maintainability & Complexity
        complexity = min(95, 55 + (source_file_count * 2) + (len(evidence_items) * 2))
        maintainability = min(95, 70 + (5 if is_typed else 0) + (10 if has_readme else 0))
        functionality = min(95, 65 + (15 if has_api else 0) + (10 if has_db else 0))

        # 8 Architecture Dimensions
        work_quality = code_quality
        problem_solving = min(95, int((complexity + functionality) / 2))
        domain_knowledge = min(95, int((architecture + (85 if has_db or has_api else 65)) / 2))
        communication = min(95, int((doc_score + maintainability) / 2))
        documentation = doc_score
        creativity = min(95, 60 + (15 if has_docker else 0) + (15 if has_cicd else 0))
        ai_assessment = min(95, int((work_quality + problem_solving + domain_knowledge) / 3))
        peer_review = 70  # Baseline neutral pending expert review

        # Weighted Evidence Score
        overall = round(
            work_quality * 0.20 +
            problem_solving * 0.15 +
            domain_knowledge * 0.15 +
            communication * 0.10 +
            documentation * 0.10 +
            creativity * 0.10 +
            ai_assessment * 0.10 +
            peer_review * 0.10
        )

        return {
            "functionality": functionality,
            "codeQuality": code_quality,
            "architecture": architecture,
            "complexity": complexity,
            "testing": testing_score,
            "documentation": doc_score,
            "security": security_score,
            "maintainability": maintainability,
            "overallEvidenceScore": overall,
            # 8-dim breakdown
            "workQuality": work_quality,
            "problemSolving": problem_solving,
            "domainKnowledge": domain_knowledge,
            "communication": communication,
            "creativity": creativity,
            "aiAssessmentScore": ai_assessment,
            "peerReviewScore": peer_review
        }

project_analyzer = ProjectAnalyzer()
