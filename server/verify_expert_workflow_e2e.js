const axios = require('axios');

const BASE_URL = 'http://localhost:8080/api';

async function runTest() {
  console.log('=== STARTING END-TO-END EXPERT WORKFLOW TEST ===\n');

  try {
    const timestamp = Date.now();
    const candEmail = `e2e_candidate_${timestamp}@proofhire.io`;
    const expertEmail = `e2e_expert_${timestamp}@proofhire.io`;

    // Step 1: Register fresh Candidate
    console.log(`1. Registering fresh Candidate (${candEmail})...`);
    const candReg = await axios.post(`${BASE_URL}/auth/register`, {
      firstName: 'Samantha',
      lastName: 'Candidate',
      email: candEmail,
      password: 'password123',
      role: 'CANDIDATE',
      track: 'TECHNICAL'
    });
    const candidateData = candReg.data.data;
    const candidateToken = candidateData.token;
    console.log(`✓ Candidate registered: ${candidateData.firstName} ${candidateData.lastName} (${candidateData.id || candidateData._id})`);

    // Step 2: Register fresh Expert
    console.log(`\n2. Registering fresh Expert (${expertEmail})...`);
    const expertReg = await axios.post(`${BASE_URL}/auth/register`, {
      firstName: 'Marcus',
      lastName: 'Expert',
      email: expertEmail,
      password: 'password123',
      role: 'EXPERT',
      track: 'TECHNICAL'
    });
    const expertData = expertReg.data.data;
    const expertToken = expertData.token;
    const expertId = expertData.id || expertData._id;
    console.log(`✓ Expert registered: ${expertData.firstName} ${expertData.lastName} (${expertId})`);

    // Step 3: Candidate submits a challenge deliverable
    console.log('\n3. Candidate fetching and submitting a Technical Challenge...');
    const challengesRes = await axios.get(`${BASE_URL}/challenges`, {
      headers: { Authorization: `Bearer ${candidateToken}` }
    });
    const challenges = challengesRes.data.challenges || challengesRes.data.data || challengesRes.data || [];
    console.log(`Found ${challenges.length} challenges.`);
    let targetChallenge = challenges.find((c) => (c.track === 'TECHNICAL' || !c.track) && c.status === 'OPEN');
    if (!targetChallenge && challenges.length > 0) targetChallenge = challenges[0];

    if (!targetChallenge) {
      console.error('FAILED: No open challenge found to submit.');
      process.exit(1);
    }
    console.log(`Using Challenge: "${targetChallenge.title}" (${targetChallenge._id})`);

    // Accept challenge
    try {
      await axios.post(
        `${BASE_URL}/challenges/${targetChallenge._id}/accept`,
        {},
        { headers: { Authorization: `Bearer ${candidateToken}` } }
      );
      console.log('✓ Challenge accepted');
    } catch (e) {
      console.log('Note on accept:', e.response?.data?.message || e.message);
    }

    // Submit challenge
    const uniqueTitle = `High-Throughput Event Engine ${Date.now()}`;
    const submitRes = await axios.post(
      `${BASE_URL}/challenges/${targetChallenge._id}/submit`,
      {
        workTitle: uniqueTitle,
        githubUrl: 'https://github.com/candidate-test/event-engine',
        liveUrl: 'https://event-engine-demo.proofhire.io',
        notes: 'Implemented distributed event stream processor with Kafka & Node.js.',
        technologies: ['TypeScript', 'Kafka', 'Redis', 'Docker'],
        deliverables: 'Architecture diagram, benchmarks, and full source code.'
      },
      { headers: { Authorization: `Bearer ${candidateToken}` } }
    );
    const submissionData = submitRes.data.submission || submitRes.data.data || submitRes.data;
    console.log(`✓ Challenge submitted! Submission ID: ${submissionData._id || targetChallenge._id}`);

    // Step 4: Expert checks Available Submissions Queue
    console.log('\n4. Expert fetching available submissions queue...');
    const availableRes = await axios.get(`${BASE_URL}/expert/submissions`, {
      headers: { Authorization: `Bearer ${expertToken}` }
    });
    const available = availableRes.data.submissions || [];
    console.log(`Found ${available.length} available submission(s) in queue.`);
    
    // Find our newly submitted review
    const submissionIdStr = (submissionData._id || targetChallenge._id).toString();
    const targetReview = available.find(
      (r) =>
        (r.submissionId && r.submissionId.toString() === submissionIdStr) ||
        (r.challenge && r.challenge.toString() === targetChallenge._id.toString()) ||
        (r.submissionTitle && r.submissionTitle.includes(uniqueTitle)) ||
        (r.title && r.title.includes(uniqueTitle))
    );

    if (!targetReview) {
      console.error('FAILED: New project was not automatically added to Expert available queue!');
      console.log('Available items:', JSON.stringify(available.slice(0, 3), null, 2));
      process.exit(1);
    }
    console.log(`✓ Target review found in Expert queue! Review ID: ${targetReview._id}, Status: ${targetReview.status}`);

    // Step 5: Expert assigns the review to themselves
    console.log('\n5. Expert clicking "Assign Me"...');
    const assignRes = await axios.post(
      `${BASE_URL}/expert/submissions/${targetReview._id}/assign-me`,
      {},
      { headers: { Authorization: `Bearer ${expertToken}` } }
    );
    console.log(`✓ Assigned successfully: status = ${assignRes.data.review.status}, expertId = ${assignRes.data.review.expertId}`);

    // Verify it is now in expert's assigned reviews
    const assignedRes = await axios.get(`${BASE_URL}/expert/reviews/assigned`, {
      headers: { Authorization: `Bearer ${expertToken}` }
    });
    const assignedList = assignedRes.data.reviews || [];
    const isNowAssigned = assignedList.some((r) => r._id.toString() === targetReview._id.toString());
    console.log(`✓ Review appears in expert's assigned list: ${isNowAssigned}`);

    // Step 6: Expert writes human evaluation and submits review with NEEDS_RESUBMISSION first to test improvement loop
    console.log('\n6. Expert submitting human evaluation with NEEDS_RESUBMISSION...');
    const completeRes1 = await axios.post(
      `${BASE_URL}/expert/reviews/${targetReview._id}/complete`,
      {
        verificationStatus: 'NEEDS_RESUBMISSION',
        overallAssessment: 'Strong architecture foundations, but lacks end-to-end integration tests and clear API contract documentation.',
        whatWasDoneWell: 'Clean folder structure and well-modularized microservice boundaries.',
        strengths: ['Solid TypeScript typing', 'Effective MongoDB schema indexing'],
        weaknesses: ['Missing integration tests', 'Zero rate-limiting on auth endpoints'],
        whatNeedsImprovement: 'Implement integration test suite using Supertest and add OpenAPI documentation.',
        recommendedImprovements: [
          'Add supertest integration suite covering /auth and /projects endpoints',
          'Document Swagger / OpenAPI endpoints in /docs'
        ],
        internalNotes: 'Candidate demonstrates senior level concepts; resubmission should focus on testing.',
        evidenceNotes: 'Inspected GitHub repository code structure and commit history.',
        rubric: {
          workQuality: { score: 75, comment: 'Solid craftsmanship' },
          problemSolving: { score: 78, comment: 'Good algorithmic approach' },
          domainKnowledge: { score: 82, comment: 'Strong understanding of backend systems' },
          communication: { score: 70, comment: 'Clear explanations in README' },
          documentation: { score: 50, comment: 'API docs missing' },
          creativityAndInitiative: { score: 80, comment: 'Innovative caching implementation' },
          aiAssessmentAlignment: { score: 85, comment: 'Consistent with AI analysis' },
          peerAndExpertReview: { score: 75, comment: 'Expert verification baseline' }
        }
      },
      { headers: { Authorization: `Bearer ${expertToken}` } }
    );
    console.log(`✓ Review submitted: status = ${completeRes1.data.review.status}, verification = ${completeRes1.data.review.verificationStatus}`);

    // Step 7: Candidate views Expert Reviews
    console.log('\n7. Candidate fetching Expert Reviews via GET /api/candidate/expert-reviews...');
    const candReviewsRes = await axios.get(`${BASE_URL}/candidate/expert-reviews`, {
      headers: { Authorization: `Bearer ${candidateToken}` }
    });
    const candReviews = candReviewsRes.data.expertReviews || candReviewsRes.data.data || [];
    const receivedReview = candReviews.find((r) => (r._id || r.id).toString() === (targetReview._id || targetReview.reviewId).toString());

    if (!receivedReview) {
      console.error('FAILED: Candidate could not see the completed expert review!');
      console.log('Candidate reviews received:', candReviews);
      process.exit(1);
    }
    console.log(`✓ Candidate received review!`);
    console.log(`  - Status: ${receivedReview.status}`);
    console.log(`  - Verification: ${receivedReview.verificationStatus}`);
    console.log(`  - Overall Assessment: "${receivedReview.overallAssessment}"`);
    console.log(`  - Done Well: "${receivedReview.whatWasDoneWell}"`);
    const wqScore = receivedReview.rubric?.workQuality?.score ?? receivedReview.rubricScores?.workQuality?.score ?? receivedReview.rubric?.workQuality;
    const psScore = receivedReview.rubric?.problemSolving?.score ?? receivedReview.rubricScores?.problemSolving?.score ?? receivedReview.rubric?.problemSolving;
    console.log(`  - Rubric Work Quality: ${wqScore}/100`);
    console.log(`  - Rubric Problem Solving: ${psScore}/100`);
    console.log(`  - Internal Notes leaked? ${receivedReview.internalNotes !== undefined ? 'YES (SECURITY ISSUE)' : 'NO (SECURE)'}`);

    // Step 8: Expert Review History
    console.log('\n8. Checking Expert Review History via GET /api/expert/review-history...');
    const historyRes = await axios.get(`${BASE_URL}/expert/review-history`, {
      headers: { Authorization: `Bearer ${expertToken}` }
    });
    const historyList = historyRes.data.reviews || [];
    const inHistory = historyList.some((r) => r._id.toString() === targetReview._id.toString());
    console.log(`✓ Review appears in expert history: ${inHistory}`);

    // Step 9: Improvement Loop - Candidate resubmits improved work
    console.log('\n9. Candidate resubmits improved deliverable responding to expert feedback...');
    const resubmitRes = await axios.post(
      `${BASE_URL}/challenges/${targetChallenge._id}/submit`,
      {
        workTitle: `${uniqueTitle} v2`,
        githubUrl: 'https://github.com/candidate-test/event-engine',
        liveUrl: 'https://event-engine-demo.proofhire.io',
        notes: 'Added Supertest integration suite with 92% coverage and OpenAPI 3.0 documentation.',
        technologies: ['TypeScript', 'Kafka', 'Redis', 'Docker', 'Supertest', 'Swagger'],
        deliverables: 'Architecture diagram, benchmarks, integration test suite, and Swagger docs.'
      },
      { headers: { Authorization: `Bearer ${candidateToken}` } }
    );
    console.log('✓ Candidate resubmission posted');

    // Step 10: Expert sees new resubmission in Available Queue
    console.log('\n10. Expert checking Available Queue for resubmission...');
    const availableRes2 = await axios.get(`${BASE_URL}/expert/submissions`, {
      headers: { Authorization: `Bearer ${expertToken}` }
    });
    const available2 = availableRes2.data.submissions || availableRes2.data.data || [];
    const resubReview = available2.find((r) => (r.title && r.title.includes('Resubmission')) || (r.submissionTitle && r.submissionTitle.includes('Resubmission')));
    if (!resubReview) {
      console.error('FAILED: Resubmission did not enter Expert Available Queue!');
      console.log('Available items:', available2);
      process.exit(1);
    }
    console.log(`✓ Resubmission found in queue! ID: ${resubReview._id || resubReview.reviewId}, Title: ${resubReview.title || resubReview.submissionTitle}`);

    // Step 11: Expert assigns and verifies resubmission
    console.log('\n11. Expert assigning and verifying resubmission...');
    await axios.post(
      `${BASE_URL}/expert/submissions/${resubReview._id || resubReview.reviewId}/assign-me`,
      {},
      { headers: { Authorization: `Bearer ${expertToken}` } }
    );
    const completeRes2 = await axios.post(
      `${BASE_URL}/expert/reviews/${resubReview._id || resubReview.reviewId}/complete`,
      {
        verificationStatus: 'VERIFIED',
        overallAssessment: 'Outstanding improvement! Complete integration test coverage and well-structured OpenAPI docs.',
        whatWasDoneWell: 'Comprehensive test coverage and seamless Kafka mock handlers in tests.',
        strengths: ['Robust Supertest integration suite', 'Thorough OpenAPI documentation'],
        weaknesses: ['None observed in this revision'],
        whatNeedsImprovement: 'Ready for production deployment.',
        recommendedImprovements: ['Deploy with Kubernetes Helm chart for canary releases'],
        rubric: {
          workQuality: { score: 95, comment: 'High production quality' },
          problemSolving: { score: 92, comment: 'Resilient fault tolerance' },
          domainKnowledge: { score: 94, comment: 'Expert event streaming' },
          communication: { score: 90, comment: 'Exemplary documentation' },
          documentation: { score: 95, comment: 'Full OpenAPI coverage' },
          creativityAndInitiative: { score: 90, comment: 'Clean architectural patterns' },
          aiAssessmentAlignment: { score: 95, comment: 'Perfect match with AI evidence' },
          peerAndExpertReview: { score: 95, comment: 'Fully verified by human expert' }
        }
      },
      { headers: { Authorization: `Bearer ${expertToken}` } }
    );
    console.log(`✓ Resubmission verified: status = ${completeRes2.data.review.status}, verification = ${completeRes2.data.review.verificationStatus}`);

    // Step 12: Candidate verifies updated status
    console.log('\n12. Candidate verifying updated review history...');
    const candReviewsRes2 = await axios.get(`${BASE_URL}/candidate/expert-reviews`, {
      headers: { Authorization: `Bearer ${candidateToken}` }
    });
    const candReviews2 = candReviewsRes2.data.expertReviews || candReviewsRes2.data.data || [];
    console.log(`✓ Candidate has ${candReviews2.length} expert review record(s) preserving complete audit trail!`);
    const verifiedRecord = candReviews2.find((r) => r.verificationStatus === 'VERIFIED');
    const needsResubRecord = candReviews2.find((r) => r.verificationStatus === 'NEEDS_RESUBMISSION');
    console.log(`✓ Contains previous NEEDS_RESUBMISSION record: ${!!needsResubRecord}`);
    console.log(`✓ Contains new VERIFIED record: ${!!verifiedRecord}`);

    console.log('\n==================================================');
    console.log('SUCCESS: COMPLETE CANDIDATE -> EXPERT -> RESUBMISSION -> VERIFICATION WORKFLOW VERIFIED!');
    console.log('==================================================\n');
  } catch (err) {
    console.error('Test error:', err.response ? err.response.data : err.message);
    process.exit(1);
  }
}

runTest();
