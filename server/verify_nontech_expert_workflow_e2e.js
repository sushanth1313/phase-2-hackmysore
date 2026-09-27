const axios = require('axios');

const BASE_URL = 'http://localhost:8080/api';

async function runNonTechTest() {
  console.log('=== STARTING NON-TECHNICAL CANDIDATE -> EXPERT WORKFLOW TEST ===\n');

  try {
    const timestamp = Date.now();
    const candEmail = `e2e_nontech_cand_${timestamp}@proofhire.io`;
    const expertEmail = `e2e_nontech_expert_${timestamp}@proofhire.io`;

    // 1. Register fresh Non-Technical Candidate
    console.log(`1. Registering Non-Tech Candidate (${candEmail})...`);
    const candReg = await axios.post(`${BASE_URL}/auth/register`, {
      firstName: 'Jordan',
      lastName: 'NonTech',
      email: candEmail,
      password: 'password123',
      role: 'CANDIDATE',
      track: 'NON_TECHNICAL'
    });
    const candidateData = candReg.data.data;
    const candidateToken = candidateData.token;
    console.log(`✓ Non-Tech Candidate registered (${candidateData.id || candidateData._id})`);

    // 2. Register fresh Expert
    console.log(`\n2. Registering Expert (${expertEmail})...`);
    const expertReg = await axios.post(`${BASE_URL}/auth/register`, {
      firstName: 'Rachel',
      lastName: 'Strategist',
      email: expertEmail,
      password: 'password123',
      role: 'EXPERT',
      track: 'NON_TECHNICAL'
    });
    const expertData = expertReg.data.data;
    const expertToken = expertData.token;
    const expertId = expertData.id || expertData._id;
    console.log(`✓ Expert registered (${expertId})`);

    // 3. Candidate submits Non-Technical Proof of Work
    console.log('\n3. Candidate submitting Non-Technical Proof of Work...');
    const uniqueTitle = `B2B Enterprise SaaS Go-To-Market Playbook ${timestamp}`;
    const powRes = await axios.post(
      `${BASE_URL}/candidate/proof-of-work`,
      {
        workTitle: uniqueTitle,
        category: 'Sales Strategy',
        careerArea: 'Sales Strategy',
        submissionType: 'SALES_PLAYBOOK',
        workUrl: 'https://docs.google.com/document/d/1example-gtm-playbook-proofhire',
        workDescription: 'Comprehensive 40-page enterprise sales playbook detailing ICP qualification, discovery frameworks, stakeholder consensus building, and competitive objection handling against incumbents.',
        deliverables: 'Executive summary, discovery question matrix, economic buyer deck, and contract closing checklist.'
      },
      { headers: { Authorization: `Bearer ${candidateToken}` } }
    );
    const powData = powRes.data.proofOfWork || powRes.data.data || powRes.data;
    console.log(`✓ Proof of Work submitted: "${uniqueTitle}"`);

    // 4. Expert checks Available Submissions Queue
    console.log('\n4. Expert checking Available Submissions Queue...');
    const availRes = await axios.get(`${BASE_URL}/expert/submissions`, {
      headers: { Authorization: `Bearer ${expertToken}` }
    });
    const submissions = availRes.data.submissions || availRes.data.data || [];
    const targetReview = submissions.find(
      (r) =>
        (r.title && r.title.includes(uniqueTitle)) ||
        (r.submissionTitle && r.submissionTitle.includes(uniqueTitle))
    );

    if (!targetReview) {
      console.error('FAILED: Non-Tech Proof of Work not found in Available queue!');
      console.log('Available items:', submissions);
      process.exit(1);
    }
    console.log(`✓ Found review in queue! ID: ${targetReview._id || targetReview.reviewId}, Track: ${targetReview.track}`);

    // 5. Expert Assigns review
    console.log('\n5. Expert assigning review to themselves...');
    await axios.post(
      `${BASE_URL}/expert/submissions/${targetReview._id || targetReview.reviewId}/assign-me`,
      {},
      { headers: { Authorization: `Bearer ${expertToken}` } }
    );
    console.log('✓ Successfully assigned');

    // 6. Expert Submits Review (VERIFIED)
    console.log('\n6. Expert submitting human evaluation with VERIFIED...');
    const reviewRes = await axios.post(
      `${BASE_URL}/expert/reviews/${targetReview._id || targetReview.reviewId}/complete`,
      {
        verificationStatus: 'VERIFIED',
        overallAssessment: 'Exceptional enterprise playbook demonstrating deep commercial empathy and structured MEDDPICC discovery execution.',
        whatWasDoneWell: 'The discovery framework and multi-threading stakeholder map are exceptionally thorough and field-ready.',
        strengths: ['Clear ICP tiering criteria', 'Well-defined champion enablement scripts'],
        weaknesses: ['Could include pricing discount governance guardrails'],
        whatNeedsImprovement: 'Minor additions to procurement negotiation guidelines.',
        recommendedImprovements: ['Include procurement security questionnaire cheat sheet'],
        rubric: {
          workQuality: { score: 92, comment: 'Strategic caliber' },
          problemSolving: { score: 90, comment: 'Solves complex enterprise sales cycle friction' },
          domainKnowledge: { score: 95, comment: 'Mastery of B2B sales dynamics' },
          communication: { score: 94, comment: 'Crisp, structured executive messaging' },
          documentation: { score: 90, comment: 'Complete playbooks and checklists' },
          creativityAndInitiative: { score: 88, comment: 'Novel approach to objections' },
          aiAssessmentAlignment: { score: 92, comment: 'Fully aligned' },
          peerAndExpertReview: { score: 92, comment: 'Verified by human sales leader' }
        }
      },
      { headers: { Authorization: `Bearer ${expertToken}` } }
    );
    console.log(`✓ Review completed: status = ${reviewRes.data.review.status}, verification = ${reviewRes.data.review.verificationStatus}`);

    // 7. Candidate checks Expert Reviews
    console.log('\n7. Candidate fetching Expert Reviews via GET /api/candidate/expert-reviews...');
    const candReviewsRes = await axios.get(`${BASE_URL}/candidate/expert-reviews`, {
      headers: { Authorization: `Bearer ${candidateToken}` }
    });
    const candReviews = candReviewsRes.data.expertReviews || candReviewsRes.data.data || [];
    const receivedReview = candReviews.find((r) => (r._id || r.id).toString() === (targetReview._id || targetReview.reviewId).toString());

    if (!receivedReview) {
      console.error('FAILED: Non-Tech Candidate could not see the completed review!');
      process.exit(1);
    }
    console.log(`✓ Candidate received review!`);
    console.log(`  - Status: ${receivedReview.status}`);
    console.log(`  - Verification: ${receivedReview.verificationStatus}`);
    console.log(`  - Overall Assessment: "${receivedReview.overallAssessment}"`);
    console.log(`  - Track: ${receivedReview.track}`);
    console.log(`  - Internal notes hidden: ${receivedReview.internalNotes === undefined}`);

    console.log('\n==================================================');
    console.log('SUCCESS: NON-TECHNICAL CANDIDATE -> EXPERT WORKFLOW FULLY VERIFIED!');
    console.log('==================================================\n');
  } catch (err) {
    console.error('Test error:', err.response ? err.response.data : err.message);
    process.exit(1);
  }
}

runNonTechTest();
