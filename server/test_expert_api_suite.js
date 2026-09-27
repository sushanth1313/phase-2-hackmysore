import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'secret';
const BASE_URL = 'http://localhost:8080/api/expert';

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/proofhire');
  const db = mongoose.connection.db;

  const expert = await db.collection('users').findOne({ email: 'testexpert@proofhire.io' });
  if (!expert) {
    console.error('Expert user not found');
    process.exit(1);
  }

  const token = jwt.sign(
    { id: expert._id.toString(), email: expert.email, role: expert.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  console.log('=== TEST 1: GET /api/expert/dashboard ===');
  const dashRes = await fetch(`${BASE_URL}/dashboard`, { headers });
  console.log('Dashboard status:', dashRes.status);
  const dashData = await dashRes.json();
  console.log('Dashboard stats:', JSON.stringify(dashData.data?.stats, null, 2));

  console.log('\n=== TEST 2: GET /api/expert/submissions/available ===');
  const availRes = await fetch(`${BASE_URL}/submissions/available`, { headers });
  console.log('Available submissions status:', availRes.status);
  const availData = await availRes.json();
  console.log(`Found ${availData.data?.length} available submissions`);
  availData.data?.slice(0, 5).forEach((s, idx) => {
    console.log(`  ${idx + 1}. [${s.id}] "${s.title}" | Type: ${s.type} | Track: ${s.track} | Candidate: ${s.candidate?.firstName || s.candidate?.email || 'N/A'}`);
  });

  // Pick an available submission to test "Assign Me"
  const targetSubmission = availData.data?.[0];
  if (targetSubmission) {
    console.log(`\n=== TEST 3: POST /api/expert/submissions/${targetSubmission.id}/assign-me (Assign Me) ===`);
    const assignRes = await fetch(`${BASE_URL}/submissions/${targetSubmission.id}/assign-me`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ track: targetSubmission.track, type: targetSubmission.type })
    });
    console.log('Assign Me status:', assignRes.status);
    const assignData = await assignRes.json();
    console.log('Assign Me response:', assignData.message, 'Review ID:', assignData.data?._id);

    console.log(`\n=== TEST 4: Idempotent Assign Me (Calling Assign Me Again on Same Submission) ===`);
    const repeatRes = await fetch(`${BASE_URL}/submissions/${targetSubmission.id}/assign-me`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ track: targetSubmission.track })
    });
    console.log('Repeat Assign Me status:', repeatRes.status);
    const repeatData = await repeatRes.json();
    console.log('Repeat response:', repeatData.message, 'alreadyAssigned:', repeatData.alreadyAssigned);
  }

  console.log('\n=== TEST 5: GET /api/expert/reviews (Assigned Reviews) ===');
  const revRes = await fetch(`${BASE_URL}/reviews`, { headers });
  console.log('Reviews status:', revRes.status);
  const revData = await revRes.json();
  console.log(`Found ${revData.data?.length} assigned reviews`);
  revData.data?.forEach(r => {
    console.log(`- [${r._id}] ${r.submissionTitle || r.title} | Track: ${r.track} | Status: ${r.status}`);
  });

  // Test Review Context & AI Evidence Analysis
  const techReview = revData.data?.find(r => r.track === 'TECHNICAL');
  const nonTechReview = revData.data?.find(r => r.track === 'NON_TECHNICAL');

  if (techReview) {
    console.log(`\n=== TEST 6: Technical Review Context for ${techReview._id} ===`);
    const ctxRes = await fetch(`${BASE_URL}/reviews/${techReview._id}/context`, { headers });
    console.log('Technical Context status:', ctxRes.status);
    const ctxData = await ctxRes.json();
    console.log('Title:', ctxData.data?.submission?.title);
    console.log('Candidate:', ctxData.data?.candidate?.name, '| Track:', ctxData.data?.candidate?.track);
    console.log('Evidence items:', ctxData.data?.evidenceItems?.length);
    console.log('Technical Analysis pillars:', ctxData.data?.technicalAnalysis?.pillars?.length);

    console.log(`\n=== TEST 7: Technical AI Evidence Analysis (/analyze) ===`);
    const analyzeRes = await fetch(`${BASE_URL}/reviews/${techReview._id}/analyze`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ force: true })
    });
    console.log('Technical AI Analysis status:', analyzeRes.status);
    const analyzeData = await analyzeRes.json();
    console.log('1. Demonstrated:', analyzeData.data?.demonstratedCapabilities?.slice(0, 2));
    console.log('2. Supporting Evidence:', analyzeData.data?.supportingEvidence?.length, 'items');
    console.log('4. Strongest Parts:', analyzeData.data?.strongestParts?.slice(0, 1));
    console.log('8. Manual Checklist:', analyzeData.data?.manualVerificationChecklist?.length, 'items');
  }

  if (nonTechReview) {
    console.log(`\n=== TEST 8: Non-Technical Review Context for ${nonTechReview._id} ===`);
    const ctxRes = await fetch(`${BASE_URL}/reviews/${nonTechReview._id}/context`, { headers });
    console.log('Non-Technical Context status:', ctxRes.status);
    const ctxData = await ctxRes.json();
    console.log('Title:', ctxData.data?.submission?.title);
    console.log('Candidate:', ctxData.data?.candidate?.name, '| Track:', ctxData.data?.candidate?.track);
    console.log('Non-Tech Pillars count:', ctxData.data?.nonTechnicalAnalysis?.pillars?.length);
    console.log('Non-Tech Deliverables count:', ctxData.data?.nonTechDeliverables?.length);

    console.log(`\n=== TEST 9: Non-Technical AI Evidence Analysis (/analyze) ===`);
    const analyzeRes = await fetch(`${BASE_URL}/reviews/${nonTechReview._id}/analyze`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ force: true })
    });
    console.log('Non-Technical AI Analysis status:', analyzeRes.status);
    const analyzeData = await analyzeRes.json();
    console.log('1. Demonstrated:', analyzeData.data?.demonstratedCapabilities?.slice(0, 2));
    console.log('7. Suggested improvements:', analyzeData.data?.candidateImprovements?.length, 'items');

    console.log(`\n=== TEST 10: Submit Non-Technical Review Evaluation (/submit) ===`);
    const submitPayload = {
      scores: {
        workQuality: 90,
        problemSolving: 92,
        domainKnowledge: 94,
        communication: 88,
        documentation: 91,
        creativityAndInitiative: 89,
        aiAssessmentAlignment: 90,
        peerAndExpertReview: 92
      },
      verificationStatus: 'VERIFIED',
      feedback: 'Exceptional enterprise business development submission. Demonstrated comprehensive enterprise sales discovery framework and rigorous account progression strategy.',
      internalNotes: 'Authentic candidate work. Verified deliverables thoroughly.',
      suggestedSkills: ['Enterprise Sales Strategy', 'Account Qualification', 'B2B Sales Methodology']
    };

    const submitRes = await fetch(`${BASE_URL}/reviews/${nonTechReview._id}/submit`, {
      method: 'POST',
      headers,
      body: JSON.stringify(submitPayload)
    });
    console.log('Submit status:', submitRes.status);
    const submitData = await submitRes.json();
    console.log('Submit response:', submitData.message, 'Overall score:', submitData.data?.overallScore);

    // Verify propagation in MongoDB
    const updatedRev = await db.collection('expertreviews').findOne({ _id: new mongoose.Types.ObjectId(nonTechReview._id) });
    console.log('DB Review Status:', updatedRev?.status, 'Verification:', updatedRev?.verificationStatus);

    const candProfile = await db.collection('candidateprofiles').findOne({ user: updatedRev.candidate });
    console.log('DB CandidateProfile verifiedSkills:', candProfile?.verifiedSkills);
    console.log('DB CandidateProfile expertReview score:', candProfile?.scores?.expertReview);
  }

  console.log('\n=== TEST 11: GET /api/expert/review-history ===');
  const histRes = await fetch(`${BASE_URL}/review-history`, { headers });
  console.log('Review History status:', histRes.status);
  const histData = await histRes.json();
  console.log(`Review History count: ${histData.data?.length}`);
  histData.data?.forEach(h => {
    console.log(`- [${h._id}] "${h.submissionTitle}" | Score: ${h.overallScore} | Status: ${h.verificationStatus || h.verificationDecision}`);
  });

  console.log('\n=== TEST 12: GET /api/expert/profile ===');
  const profRes = await fetch(`${BASE_URL}/profile`, { headers });
  console.log('Profile status:', profRes.status);
  const profData = await profRes.json();
  console.log('Profile User:', profData.data?.user?.name, profData.data?.user?.email);
  console.log('Profile Stats:', profData.data?.stats);

  await mongoose.disconnect();
  console.log('\n=============================================');
  console.log('ALL API WORKFLOW TESTS EXECUTED SUCCESSFULLY!');
  console.log('=============================================');
}

run().catch(err => {
  console.error('Fatal error during test suite:', err);
  process.exit(1);
});
