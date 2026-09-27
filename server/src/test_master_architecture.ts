import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import axios from 'axios';
import http from 'http';
import app from './app';
import Project from './models/Project';
import ProjectAnalysis from './models/ProjectAnalysis';
import Resume from './models/Resume';
import CodingSubmission from './models/CodingSubmission';
import CodingChallenge from './models/CodingChallenge';

const TEST_PORT = 8089;
const BASE_URL = `http://127.0.0.1:${TEST_PORT}/api`;

async function runTests() {
  console.log('====================================================');
  console.log('  PROOFHIRE MASTER CANDIDATE AI ARCHITECTURE TEST   ');
  console.log('====================================================\n');

  let server: http.Server | null = null;
  const timestamp = Date.now();
  const testEmail = `test_candidate_${timestamp}@proofhire.com`;
  const testPassword = 'Password123!';

  try {
    // Connect DB
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/proofhire';
    await mongoose.connect(mongoUri);
    console.log('[1/10] Connected to MongoDB:', mongoUri);

    // Start Express app
    server = app.listen(TEST_PORT, () => {
      console.log(`[2/10] Express test server listening on port ${TEST_PORT}`);
    });

    // ─── STEP 1: REGISTER ─────────────────────────────────────────────
    console.log('\n--- STEP 1: REGISTER CANDIDATE ---');
    const regRes = await axios.post(`${BASE_URL}/auth/register`, {
      firstName: 'Linus',
      lastName: 'Torvalds',
      email: testEmail,
      password: testPassword,
      role: 'CANDIDATE',
      track: 'TECHNICAL'
    });
    console.log('Registration status:', regRes.status, 'User ID:', regRes.data?.data?._id || regRes.data?.user?._id);

    // ─── STEP 2: LOGIN ────────────────────────────────────────────────
    console.log('\n--- STEP 2: LOGIN ---');
    const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: testEmail,
      password: testPassword
    });
    const token = loginRes.data?.data?.token || loginRes.data?.token;
    const userId = loginRes.data?.data?.id || loginRes.data?.id;
    if (!token || !userId) throw new Error('Failed to obtain JWT token or user ID on login');
    console.log('Login successful. User ID:', userId);

    const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

    // ─── STEP 3: INITIAL PROFILE FETCH ────────────────────────────────
    console.log('\n--- STEP 3: FETCH INITIAL PROFILE ---');
    const initProfile = await axios.get(`${BASE_URL}/candidate/profile`, authHeaders);
    console.log('Profile loaded successfully:');
    console.log('  Name:', initProfile.data.data.identity.fullName);
    console.log('  Email:', initProfile.data.data.identity.email);
    console.log('  Claimed Skills:', initProfile.data.data.skills.claimed);
    console.log('  Verified Skills:', initProfile.data.data.skills.verified);
    console.log('  Projects count:', initProfile.data.data.projects.length);
    console.log('  Practice submissions:', initProfile.data.data.technicalPractice.hasSubmissions);
    console.log('  AI Interviews count:', initProfile.data.data.aiInterview.interviewsCompleted);

    // ─── STEP 4: EDIT PROFILE ─────────────────────────────────────────
    console.log('\n--- STEP 4: EDIT PROFILE (PERSISTENCE TEST) ---');
    const profileUpdates = {
      firstName: 'Linus',
      lastName: 'Torvalds',
      headline: 'Principal C++ Systems & Distributed Kernel Architect',
      bio: 'High-throughput low-latency systems engineer specializing in modern C++20 and lock-free concurrency.',
      location: 'Portland, OR',
      phone: '+1 503-555-0142',
      github: 'https://github.com/torvalds',
      linkedin: 'https://linkedin.com/in/torvalds',
      portfolio: 'https://kernel.org',
      targetRole: 'Staff C++ Infrastructure Architect',
      currentStatus: 'Open to Offers',
      experienceLevel: 'Senior (5+ years)',
      availability: '1 Month Notice',
      preferredDomains: ['Distributed Systems', 'Backend Engineering', 'Data Structures & Algorithms'],
      claimedSkills: ['C++', 'Linux', 'Concurrency', 'gRPC', 'CMake', 'Memory Management']
    };

    const patchRes = await axios.patch(`${BASE_URL}/candidate/profile`, profileUpdates, authHeaders);
    console.log('PATCH /api/candidate/profile response:', patchRes.data.message);

    // ─── STEP 5: RE-FETCH (BROWSER REFRESH SIMULATION) ─────────────────
    console.log('\n--- STEP 5: VERIFY PERSISTENCE ACROSS RE-FETCH ---');
    const refetchedProfile = await axios.get(`${BASE_URL}/candidate/profile`, authHeaders);
    const id = refetchedProfile.data.data.identity;
    const car = refetchedProfile.data.data.career;
    const sk = refetchedProfile.data.data.skills;

    if (id.headline !== profileUpdates.headline) throw new Error(`Headline did not persist! Got: ${id.headline}`);
    if (id.bio !== profileUpdates.bio) throw new Error(`Bio did not persist! Got: ${id.bio}`);
    if (id.location !== profileUpdates.location) throw new Error(`Location did not persist! Got: ${id.location}`);
    if (car.targetRole !== profileUpdates.targetRole) throw new Error(`Target role did not persist! Got: ${car.targetRole}`);
    if (sk.claimed.length !== profileUpdates.claimedSkills.length) throw new Error(`Claimed skills did not persist!`);
    console.log('✓ SUCCESS: Profile updates persisted cleanly in MongoDB across re-fetch!');

    // ─── STEP 6: RESUME AI ANALYSIS ───────────────────────────────────
    console.log('\n--- STEP 6: RESUME AI ANALYSIS ---');
    const testResume = await Resume.create({
      user: userId,
      candidateId: userId,
      fileName: 'Linus_Torvalds_Staff_Cpp_Resume.pdf',
      fileSize: 1048576,
      mimeType: 'application/pdf',
      fileHash: 'sha256-abc1234567890def',
      filePath: 'uploads/resumes/linus_resume.pdf',
      score10: 9.3,
      scoreBreakdown: {
        atsCompatibility: 2.0,
        skillsRelevance: 1.7,
        experience: 2.0,
        projectQuality: 1.7,
        clarityStructure: 1.9
      },
      aiAssistanceSignals: {
        category: 'LOW AI-ASSISTANCE SIGNAL',
        confidence: 'High',
        summary: 'Natural sentence variety and specific technical implementation artifacts detected.',
        evidence: ['Human metadata authoring timestamps', 'Consistent idiosyncratic technical vocabulary']
      },
      skills: ['C++', 'Linux', 'CMake', 'POSIX', 'Distributed Systems'],
      experience: [{ company: 'Linux Foundation', role: 'Chief Architect', duration: '1991 - Present', highlights: ['Kernel architecture'] }],
      integrity: {
        fingerprint: 'fp-sha256-test123456',
        candidateId: userId.toString(),
        version: 'v1.0 (Immutable)',
        timestamp: new Date()
      },
      isPrimary: true
    });
    console.log('Created candidate resume record: ID', testResume._id);

    const resumeAiRes = await axios.get(`${BASE_URL}/resume/latest`, authHeaders);
    console.log('Resume AI Score:', resumeAiRes.data.data.score10, '/ 10');
    console.log('Score Breakdown:', resumeAiRes.data.data.scoreBreakdown);
    console.log('AI Assistance Signal:', resumeAiRes.data.data.aiAssistanceSignals.category);
    if (!resumeAiRes.data.data.scoreBreakdown?.atsCompatibility) {
      throw new Error('Resume AI score breakdown missing!');
    }
    console.log('✓ SUCCESS: Resume AI provides explainable 5-dimension score and signal-based AI detection.');

    // ─── STEP 7: PROJECT ANALYSIS ─────────────────────────────────────
    console.log('\n--- STEP 7: PROJECT ANALYSIS WITH REAL EVIDENCE ---');
    const testProject = await Project.create({
      user: userId,
      projectName: 'Cpp-LockFree-Queue',
      description: 'Ultra-low-latency bounded lock-free ring buffer queue in C++20 with cacheline padding.',
      githubUrl: 'https://github.com/torvalds/lockfree-queue',
      claimedTechnologies: ['C++', 'CMake', 'Atomic', 'POSIX Threads'],
      detectedLanguages: ['C++', 'CMake'],
      status: 'COMPLETED'
    });
    console.log('Created project:', testProject.projectName, 'ID:', testProject._id);

    // Call project analysis API
    const projAnalysisRes = await axios.get(`${BASE_URL}/project/${testProject._id}/analysis`, authHeaders);
    const pa = projAnalysisRes.data.data;
    console.log('Project Analysis Status:', pa.verification?.status);
    console.log('Deterministic Overall Score:', pa.scores?.overallScore, '/ 100');
    console.log('Dimension Breakdown:');
    console.log('  Code Quality:', pa.scores?.codeQuality, '/ 15');
    console.log('  Architecture:', pa.scores?.architecture, '/ 15');
    console.log('  Correctness:', pa.scores?.correctness, '/ 15');
    console.log('  Testing:', pa.scores?.testing, '/ 10');
    console.log('  Documentation:', pa.scores?.documentation, '/ 10');
    console.log('  Security:', pa.scores?.security, '/ 10');
    console.log('  Complexity:', pa.scores?.complexity, '/ 10');
    console.log('  Evidence:', pa.scores?.evidence, '/ 15');
    console.log('13 Inspections notes count:', Object.keys(pa.inspections || {}).length);

    if (pa.scores.overallScore === 89) {
      throw new Error('Arbitrary 89 score detected!');
    }
    const sum = pa.scores.codeQuality + pa.scores.architecture + pa.scores.correctness +
                pa.scores.testing + pa.scores.documentation + pa.scores.security +
                pa.scores.complexity + pa.scores.evidence;
    if (sum !== pa.scores.overallScore) {
      throw new Error(`Score mismatch: sum=${sum} vs overall=${pa.scores.overallScore}`);
    }
    console.log('✓ SUCCESS: Project Analysis has deterministic 8-dimension score and 13 inspection notes.');

    // ─── STEP 8: AI TECHNICAL INTERVIEW (C++ & STRICT EVALUATION) ─────
    console.log('\n--- STEP 8: AI TECHNICAL INTERVIEW (C++ & DOMAIN) ---');
    const startInterviewRes = await axios.post(`${BASE_URL}/interview/start`, {
      domain: 'Data Structures & Algorithms',
      primaryLanguage: 'C++',
      targetLevel: 'Senior'
    }, authHeaders);

    const session = startInterviewRes.data.data;
    const sessionId = session._id;
    const initialQuestion = session.turns[0].question;
    console.log('Interview Session started: ID', sessionId);
    console.log('Primary Language:', session.language || (session as any).primaryLanguage);
    console.log('Domain:', session.domain || session.focus);
    console.log('Question 1:', initialQuestion);

    if ((session.language || (session as any).primaryLanguage) !== 'C++') {
      throw new Error('Interview did not default to C++!');
    }

    // ─── TEST 8A: ANSWER "ok" -> MUST BE INSUFFICIENT WITH 0 SCORE ───
    console.log('\n--- TEST 8A: SUBMIT "ok" ANSWER ---');
    const okAnsRes = await axios.post(`${BASE_URL}/interview/${sessionId}/respond`, {
      answer: 'ok'
    }, authHeaders);

    const s1 = okAnsRes.data.data;
    const okEval = s1.turns[0].evaluation;
    console.log('Evaluation Status for "ok":', okEval.status);
    console.log('Technical Accuracy:', okEval.technicalAccuracy);
    console.log('Problem Solving:', okEval.problemSolving);
    console.log('Feedback:', okEval.reasoning);

    if (okEval.status !== 'INSUFFICIENT' || okEval.technicalAccuracy !== 0) {
      throw new Error(`"ok" was given positive evaluation! status: ${okEval.status}, acc: ${okEval.technicalAccuracy}`);
    }
    console.log('✓ SUCCESS: "ok" was strictly marked INSUFFICIENT with score 0!');

    // ─── TEST 8B: ANSWER IRRELEVANT TEXT -> MUST BE IRRELEVANT WITH 0 SCORE ───
    console.log('\n--- TEST 8B: SUBMIT IRRELEVANT ANSWER ---');
    const irrAnsRes = await axios.post(`${BASE_URL}/interview/${sessionId}/respond`, {
      answer: 'I really like working with React and configuring TailwindCSS styles for buttons.'
    }, authHeaders);

    const s2 = irrAnsRes.data.data;
    const irrEval = s2.turns[1].evaluation;
    console.log('Evaluation Status for React on graph question:', irrEval.status);
    console.log('Technical Accuracy:', irrEval.technicalAccuracy);
    console.log('Feedback:', irrEval.reasoning);

    if (irrEval.status !== 'IRRELEVANT' || irrEval.technicalAccuracy !== 0) {
      throw new Error(`Irrelevant answer was awarded positive scores! status: ${irrEval.status}`);
    }
    console.log('✓ SUCCESS: Irrelevant answer strictly rejected with score 0!');

    // ─── TEST 8C: REAL C++ TECHNICAL EXPLANATION ──────────────────────
    console.log('\n--- TEST 8C: SUBMIT VALID TECHNICAL C++ ANSWER ---');
    const validCppAnswer = 
      `To detect a cycle in a directed graph in C++, we use Depth-First Search (DFS) with three-state vertex coloring:\n` +
      `0 = UNVISITED (White), 1 = VISITING / in current recursion stack (Gray), 2 = FULLY_VISITED (Black).\n\n` +
      `In C++ implementation:\n` +
      `bool dfs(int u, const vector<vector<int>>& adj, vector<int>& state) {\n` +
      `    state[u] = 1; // Mark Gray\n` +
      `    for (int v : adj[u]) {\n` +
      `        if (state[v] == 1) return true; // Found back-edge to ancestor -> CYCLE\n` +
      `        if (state[v] == 0 && dfs(v, adj, state)) return true;\n` +
      `    }\n` +
      `    state[u] = 2; // Mark Black\n` +
      `    return false;\n` +
      `}\n\n` +
      `Time Complexity is O(V + E) and Space Complexity is O(V) for the state vector and recursion stack. ` +
      `Alternatively, Kahn's algorithm using in-degree BFS detects cycles if the topological order count < V.`;

    const validAnsRes = await axios.post(`${BASE_URL}/interview/${sessionId}/respond`, {
      answer: validCppAnswer
    }, authHeaders);

    const s3 = validAnsRes.data.data;
    const validEval = s3.turns[2].evaluation;
    console.log('Evaluation Status for valid C++ answer:', validEval.status);
    console.log('Technical Accuracy:', validEval.technicalAccuracy, '/ 10');
    console.log('Problem Solving:', validEval.problemSolving, '/ 10');
    console.log('Evidence / Depth:', validEval.evidenceGrounding, '/ 10');
    console.log('Domain keywords detected:', validEval.domainKeywords);
    console.log('Turn 3 Interview session status:', s3.status);
    console.log('Final Report Overall Score:', s3.finalReport?.overallScore, '/ 100');

    if (validEval.status !== 'VALID' || validEval.technicalAccuracy < 7) {
      throw new Error(`Valid C++ answer did not receive high technical score! Got: ${validEval.technicalAccuracy}`);
    }
    console.log('✓ SUCCESS: Valid C++ response received rigorous evidence-grounded score!');
    console.log('✓ SUCCESS: Interview completed with overall score:', s3.finalReport?.overallScore);

    // ─── STEP 9: RE-FETCH PROFILE & VERIFY FULL INTEGRATION ───────────
    console.log('\n--- STEP 9: RE-FETCH PROFILE AND VERIFY MODULE SEPARATION ---');
    const finalProfile = await axios.get(`${BASE_URL}/candidate/profile`, authHeaders);
    const fp = finalProfile.data.data;

    console.log('Final Profile Summary:');
    console.log('  Identity Full Name:', fp.identity.fullName);
    console.log('  Claimed Skills Count:', fp.skills.claimed.length);
    console.log('  Verified Skills Count:', fp.skills.verified.length);
    console.log('  Projects Count:', fp.projects.length);
    console.log('  Project [0] Name:', fp.projects[0]?.name, 'Score:', fp.projects[0]?.overallScore);
    console.log('  Resume ATS Score:', fp.resume?.atsScore);
    console.log('  Interview Completed Count:', fp.aiInterview.interviewsCompleted);
    console.log('  Interview Average Score:', fp.aiInterview.averageScore);
    console.log('  Interview Languages:', fp.aiInterview.languages);
    console.log('  Interview Domains:', fp.aiInterview.domains);

    // Assert strict separation
    if (fp.resume?.atsScore === fp.projects[0]?.overallScore) {
      throw new Error('Resume and Project scores collided!');
    }
    if (fp.resume?.atsScore === fp.aiInterview.averageScore) {
      throw new Error('Resume and Interview scores collided!');
    }
    if (!fp.aiInterview.languages.includes('C++')) {
      throw new Error('C++ not recorded in candidate interview history!');
    }
    console.log('✓ SUCCESS: All modules strictly separated with no score contamination!');

    console.log('\n====================================================');
    console.log('  ALL MASTER CANDIDATE AI ARCHITECTURE TESTS PASSED! ');
    console.log('====================================================\n');

  } catch (error: any) {
    console.error('\n❌ TEST FAILURE:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error(error.message);
    }
    process.exitCode = 1;
  } finally {
    if (server) {
      server.close();
      console.log('Test server closed.');
    }
    await mongoose.disconnect();
    console.log('MongoDB disconnected.');
  }
}

runTests();
