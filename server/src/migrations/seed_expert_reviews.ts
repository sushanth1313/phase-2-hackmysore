/**
 * Migration: seed_expert_reviews.ts
 *
 * Creates ExpertReview records for existing COMPLETED projects that don't yet
 * have an ExpertReview assigned. This seeds the queue so experts can see real work.
 *
 * Safe to run multiple times (upsert logic won't duplicate).
 */
import mongoose from 'mongoose';
import ExpertReview from '../models/ExpertReview';
import Project from '../models/Project';
import User from '../models/User';

async function run() {
  await mongoose.connect('mongodb://127.0.0.1:27017/proofhire');
  console.log('Connected to MongoDB');

  // Count before
  const beforeCount = await ExpertReview.countDocuments();
  console.log(`\nExpertReview records BEFORE: ${beforeCount}`);

  // Find all EXPERT users
  const experts = await User.find({ role: 'EXPERT' });
  console.log(`Expert users found: ${experts.length}`);
  experts.forEach((e: any) => console.log(`  - ${e.email} (${e._id})`));

  if (experts.length === 0) {
    console.log('No experts found — skipping assignment');
    process.exit(0);
  }

  // Find all COMPLETED projects
  const completedProjects = await Project.find({ status: 'COMPLETED' });
  console.log(`\nCompleted projects found: ${completedProjects.length}`);

  let created = 0;
  let skipped = 0;

  for (let i = 0; i < completedProjects.length; i++) {
    const project = completedProjects[i];

    // Assign to experts in round-robin
    const expert = experts[i % experts.length];

    // Don't assign to the candidate themselves
    if (project.user.toString() === expert._id.toString()) {
      // try next expert
      const altExpert = experts[(i + 1) % experts.length];
      if (altExpert._id.toString() === project.user.toString()) {
        console.log(`  Skipping project ${project.projectName} — no eligible expert`);
        skipped++;
        continue;
      }
    }

    // Check if an ExpertReview already exists for this project
    const existing = await ExpertReview.findOne({ project: project._id });
    if (existing) {
      console.log(`  Already has review: ${project.projectName}`);
      skipped++;
      continue;
    }

    await ExpertReview.create({
      expert: expert._id,
      candidate: project.user,
      project: project._id,
      track: 'TECHNICAL',
      submissionTitle: project.projectName,
      submissionDescription: project.description || '',
      status: 'ASSIGNED'
    });
    console.log(`  Created review: [${project.projectName}] → expert: ${expert.email}`);
    created++;
  }

  // Also seed from SUBMITTED challenge submissions
  const { default: ChallengeSubmission } = await import('../models/ChallengeSubmission');
  const submittedChallenges = await ChallengeSubmission.find({
    status: { $in: ['SUBMITTED', 'UNDER_REVIEW', 'COMPLETED'] }
  });
  console.log(`\nSubmitted challenge submissions: ${submittedChallenges.length}`);

  for (let i = 0; i < submittedChallenges.length; i++) {
    const sub = submittedChallenges[i];

    const existing = await ExpertReview.findOne({ challengeSubmission: sub._id });
    if (existing) {
      console.log(`  Already has review: ${sub.workTitle || sub._id}`);
      skipped++;
      continue;
    }

    const expert = experts[i % experts.length];

    // Don't self-assign
    if (sub.candidate.toString() === expert._id.toString()) {
      skipped++;
      continue;
    }

    await ExpertReview.create({
      expert: expert._id,
      candidate: sub.candidate,
      challengeSubmission: sub._id,
      track: sub.track || 'TECHNICAL',
      submissionTitle: sub.workTitle || 'Challenge Submission',
      submissionDescription: sub.workDescription || '',
      status: 'ASSIGNED'
    });
    console.log(`  Created review: [${sub.workTitle || 'Challenge'}] → expert: ${expert.email}`);
    created++;
  }

  const afterCount = await ExpertReview.countDocuments();
  console.log(`\n=== MIGRATION COMPLETE ===`);
  console.log(`ExpertReview records BEFORE: ${beforeCount}`);
  console.log(`ExpertReview records AFTER:  ${afterCount}`);
  console.log(`Created: ${created}, Skipped (already existed or ineligible): ${skipped}`);

  await mongoose.disconnect();
  process.exit(0);
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});
