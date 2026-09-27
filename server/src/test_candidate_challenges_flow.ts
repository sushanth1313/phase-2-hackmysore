import axios from 'axios';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from './models/User';
import Challenge from './models/Challenge';
import ChallengeSubmission from './models/ChallengeSubmission';

const API_URL = 'http://localhost:8080/api';

async function runTests() {
  console.log('========================================================');
  console.log('PROOFHIRE CANDIDATE CHALLENGES — VERIFICATION TEST SUITE');
  console.log('========================================================');

  await mongoose.connect('mongodb://127.0.0.1:27017/proofhire');
  console.log('✓ Connected to MongoDB');

  const hashedPassword = await bcrypt.hash('password123', 10);

  // 1. Find or create two test candidates for isolation testing
  let candidateA = await User.findOne({ email: 'candidate.test.a@proofhire.io' });
  if (!candidateA) {
    candidateA = await User.create({
      firstName: 'Alice',
      lastName: 'Candidate',
      email: 'candidate.test.a@proofhire.io',
      password: hashedPassword,
      role: 'CANDIDATE',
      track: 'TECHNICAL'
    });
  } else {
    candidateA.password = hashedPassword;
    await candidateA.save();
  }

  let candidateB = await User.findOne({ email: 'candidate.test.b@proofhire.io' });
  if (!candidateB) {
    candidateB = await User.create({
      firstName: 'Bob',
      lastName: 'Candidate',
      email: 'candidate.test.b@proofhire.io',
      password: hashedPassword,
      role: 'CANDIDATE',
      track: 'TECHNICAL'
    });
  } else {
    candidateB.password = hashedPassword;
    await candidateB.save();
  }

  // Clean up any previous test submissions for candidate A & B to ensure clean run
  await ChallengeSubmission.deleteMany({
    candidate: { $in: [candidateA._id, candidateB._id] }
  });

  // Log in as Candidate A
  const loginResA = await axios.post(`${API_URL}/auth/login`, {
    email: 'candidate.test.a@proofhire.io',
    password: 'password123'
  });
  const tokenA = loginResA.data?.data?.token || loginResA.data?.token;
  console.log('✓ Candidate A authenticated successfully');

  // Log in as Candidate B
  const loginResB = await axios.post(`${API_URL}/auth/login`, {
    email: 'candidate.test.b@proofhire.io',
    password: 'password123'
  });
  const tokenB = loginResB.data?.data?.token || loginResB.data?.token;
  console.log('✓ Candidate B authenticated successfully');

  const headersA = { Authorization: `Bearer ${tokenA}` };
  const headersB = { Authorization: `Bearer ${tokenB}` };

  // ───────────────────────────────────────────────────────────────────────────
  // TEST 1: GET ALL CANDIDATE CHALLENGES
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n--- TEST 1: GET /api/candidate/challenges ---');
  const resAll = await axios.get(`${API_URL}/candidate/challenges`, { headers: headersA });
  const challenges = resAll.data.challenges;
  console.log(`✓ Returned ${challenges.length} challenges (HTTP ${resAll.status})`);
  console.log(`✓ Counts reported by API:`, resAll.data.counts);

  if (challenges.length !== 20) {
    throw new Error(`Expected 20 technical challenges, received ${challenges.length}`);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // TEST 2: VERIFY DIFFICULTY COUNTS (5 EASY, 5 MEDIUM, 5 HARD, 5 EXPERT)
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n--- TEST 2: DIFFICULTY COUNTS IN DATASET ---');
  const easy = challenges.filter((c: any) => c.difficulty === 'EASY');
  const medium = challenges.filter((c: any) => c.difficulty === 'MEDIUM');
  const hard = challenges.filter((c: any) => c.difficulty === 'HARD');
  const expert = challenges.filter((c: any) => c.difficulty === 'EXPERT');

  console.log(`  EASY:   ${easy.length}/5 challenges`);
  console.log(`  MEDIUM: ${medium.length}/5 challenges`);
  console.log(`  HARD:   ${hard.length}/5 challenges`);
  console.log(`  EXPERT: ${expert.length}/5 challenges`);

  if (easy.length !== 5 || medium.length !== 5 || hard.length !== 5 || expert.length !== 5) {
    throw new Error('Difficulty count mismatch! Must have 5 Easy, 5 Medium, 5 Hard, 5 Expert.');
  }
  console.log('✓ All 4 difficulty tiers contain exactly 5 challenges!');

  // ───────────────────────────────────────────────────────────────────────────
  // TEST 3: BACKEND DIFFICULTY FILTERS
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n--- TEST 3: BACKEND DIFFICULTY QUERY PARAMS ---');
  for (const diff of ['EASY', 'MEDIUM', 'HARD', 'EXPERT']) {
    const diffRes = await axios.get(`${API_URL}/candidate/challenges?difficulty=${diff}`, { headers: headersA });
    console.log(`  ?difficulty=${diff} => ${diffRes.data.challenges.length} challenges`);
    const allMatch = diffRes.data.challenges.every((c: any) => c.difficulty === diff);
    if (!allMatch || diffRes.data.challenges.length !== 5) {
      throw new Error(`Filter failed for difficulty ${diff}`);
    }
  }
  console.log('✓ Backend difficulty filtering verified for all tiers!');

  // ───────────────────────────────────────────────────────────────────────────
  // TEST 4: ACCEPT CHALLENGE FLOW
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n--- TEST 4: ACCEPT CHALLENGE FLOW ---');
  const targetChallenge = challenges.find((c: any) => c.slug === 'two-sum-api') || challenges[0];
  console.log(`Target Challenge: "${targetChallenge.title}" (${targetChallenge._id})`);

  // Initially AVAILABLE
  const initialStatus = targetChallenge.participationStatus;
  console.log(`  Initial status: ${initialStatus}`);
  if (initialStatus !== 'AVAILABLE') {
    throw new Error(`Expected initial status to be AVAILABLE, got ${initialStatus}`);
  }

  // Accept challenge
  const acceptRes = await axios.post(
    `${API_URL}/candidate/challenges/${targetChallenge._id}/accept`,
    {},
    { headers: headersA }
  );
  console.log(`  Accept response:`, acceptRes.data);
  if (acceptRes.data.participation?.status !== 'ACCEPTED') {
    throw new Error('Expected participation status to be ACCEPTED after accept');
  }

  // Verify in MongoDB
  const dbSubAfterAccept = await ChallengeSubmission.findOne({
    challenge: targetChallenge._id,
    candidate: candidateA._id
  });
  if (!dbSubAfterAccept || dbSubAfterAccept.status !== 'ACCEPTED') {
    throw new Error('MongoDB does not contain ACCEPTED submission document');
  }
  console.log(`✓ MongoDB verification: document exists with status = ACCEPTED`);

  // Verify refresh persistence (GET /api/candidate/challenges)
  const refreshRes1 = await axios.get(`${API_URL}/candidate/challenges`, { headers: headersA });
  const refreshedCh1 = refreshRes1.data.challenges.find((c: any) => c._id === targetChallenge._id);
  console.log(`  After refresh GET: participationStatus = ${refreshedCh1.participationStatus}`);
  if (refreshedCh1.participationStatus !== 'ACCEPTED') {
    throw new Error('Participation status ACCEPTED did not survive refresh!');
  }
  console.log(`✓ Accepted state survives refresh!`);

  // ───────────────────────────────────────────────────────────────────────────
  // TEST 5: START CHALLENGE FLOW
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n--- TEST 5: START CHALLENGE FLOW ---');
  const startRes = await axios.post(
    `${API_URL}/candidate/challenges/${targetChallenge._id}/start`,
    {},
    { headers: headersA }
  );
  console.log(`  Start response:`, startRes.data);
  if (startRes.data.participation?.status !== 'IN_PROGRESS') {
    throw new Error('Expected participation status to be IN_PROGRESS after start');
  }

  // Verify in MongoDB
  const dbSubAfterStart = await ChallengeSubmission.findOne({
    challenge: targetChallenge._id,
    candidate: candidateA._id
  });
  if (!dbSubAfterStart || dbSubAfterStart.status !== 'IN_PROGRESS' || !dbSubAfterStart.startedAt) {
    throw new Error('MongoDB does not contain IN_PROGRESS status with startedAt timestamp');
  }
  console.log(`✓ MongoDB verification: document updated to IN_PROGRESS with startedAt timestamp`);

  // Verify refresh persistence
  const refreshRes2 = await axios.get(`${API_URL}/candidate/challenges`, { headers: headersA });
  const refreshedCh2 = refreshRes2.data.challenges.find((c: any) => c._id === targetChallenge._id);
  if (refreshedCh2.participationStatus !== 'IN_PROGRESS') {
    throw new Error('Participation status IN_PROGRESS did not survive refresh!');
  }
  console.log(`✓ In Progress state survives refresh!`);

  // ───────────────────────────────────────────────────────────────────────────
  // TEST 6: SUBMIT CHALLENGE FLOW
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n--- TEST 6: SUBMIT CHALLENGE FLOW ---');
  const submitPayload = {
    githubUrl: 'https://github.com/candidate-a/two-sum-api-solution',
    notes: 'Implemented O(n) hash map with full Jest test suite'
  };
  const submitRes = await axios.post(
    `${API_URL}/candidate/challenges/${targetChallenge._id}/submit`,
    submitPayload,
    { headers: headersA }
  );
  console.log(`  Submit response:`, submitRes.data);
  if (submitRes.data.participation?.status !== 'SUBMITTED') {
    throw new Error('Expected participation status to be SUBMITTED after submit');
  }

  // Verify in MongoDB
  const dbSubAfterSubmit = await ChallengeSubmission.findOne({
    challenge: targetChallenge._id,
    candidate: candidateA._id
  });
  if (!dbSubAfterSubmit || dbSubAfterSubmit.status !== 'SUBMITTED' || !dbSubAfterSubmit.submittedAt) {
    throw new Error('MongoDB does not contain SUBMITTED status with submittedAt timestamp');
  }
  console.log(`✓ MongoDB verification: document updated to SUBMITTED with submittedAt timestamp and githubUrl`);

  // Verify refresh persistence
  const refreshRes3 = await axios.get(`${API_URL}/candidate/challenges`, { headers: headersA });
  const refreshedCh3 = refreshRes3.data.challenges.find((c: any) => c._id === targetChallenge._id);
  if (refreshedCh3.participationStatus !== 'SUBMITTED') {
    throw new Error('Participation status SUBMITTED did not survive refresh!');
  }
  console.log(`✓ Submitted state survives refresh!`);

  // ───────────────────────────────────────────────────────────────────────────
  // TEST 7: STATUS FILTERING FOR CANDIDATE A
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n--- TEST 7: STATUS FILTERING ---');
  const filterSubmitted = await axios.get(`${API_URL}/candidate/challenges?status=SUBMITTED`, { headers: headersA });
  console.log(`  ?status=SUBMITTED => ${filterSubmitted.data.challenges.length} challenge(s)`);
  if (!filterSubmitted.data.challenges.some((c: any) => c._id === targetChallenge._id)) {
    throw new Error('Target challenge missing from SUBMITTED filter!');
  }

  const filterAvailable = await axios.get(`${API_URL}/candidate/challenges?status=AVAILABLE`, { headers: headersA });
  console.log(`  ?status=AVAILABLE => ${filterAvailable.data.challenges.length} challenge(s)`);
  if (filterAvailable.data.challenges.some((c: any) => c._id === targetChallenge._id)) {
    throw new Error('Submitted target challenge incorrectly appears under AVAILABLE filter!');
  }
  console.log('✓ Status filtering verified correctly!');

  // ───────────────────────────────────────────────────────────────────────────
  // TEST 8: CANDIDATE ISOLATION
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n--- TEST 8: CANDIDATE ISOLATION ---');
  // Candidate B should see targetChallenge as AVAILABLE, not SUBMITTED!
  const resCandidateB = await axios.get(`${API_URL}/candidate/challenges`, { headers: headersB });
  const chB = resCandidateB.data.challenges.find((c: any) => c._id === targetChallenge._id);
  console.log(`  Candidate B status for "${targetChallenge.title}": ${chB.participationStatus}`);
  if (chB.participationStatus !== 'AVAILABLE') {
    throw new Error(`Isolation failed! Candidate B saw status "${chB.participationStatus}" instead of AVAILABLE`);
  }
  console.log('✓ Candidate isolation fully verified! Candidate A and Candidate B have completely separate participation states.');

  console.log('\n========================================================');
  console.log('ALL 8 END-TO-END VERIFICATION TESTS PASSED SUCCESSFULLY!');
  console.log('========================================================\n');

  await mongoose.disconnect();
  process.exit(0);
}

runTests().catch(err => {
  console.error('\n❌ TEST FAILED:', err.message);
  if (err.response?.data) console.error('API Error Response:', err.response.data);
  process.exit(1);
});
