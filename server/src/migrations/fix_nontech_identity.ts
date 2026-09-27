/**
 * DATA MIGRATION: Fix Non-Technical Candidate Identity Contamination
 * 
 * WHAT THIS FIXES:
 * 1. Clears stale C++ careerArea / targetRole from CandidateProfile (if set by AI inference)
 * 2. Clears stale C++ targetRole from User document
 * 3. Stamps all existing Resume documents with documentType = 'RESUME'
 *    (so they are not confused with Proof of Work uploads)
 * 4. Marks any ResumeAnalysis with wrong-track career as stale (sets careerArea = '' so it regenerates)
 * 5. Marks the SYNAPSA PDF and any non-resume PDFs in Resume collection
 *    as documentType = 'OTHER' if their fileName matches known Proof-of-Work filenames
 * 6. Preserves all raw extracted text, legitimate resume data, and Proof of Work submissions
 * 
 * SAFE: Does NOT delete source evidence. Does NOT delete resume files.
 * SCOPE: Only affects non-technical candidates where identity contamination is detected.
 * 
 * Run: node -r ts-node/register server/src/migrations/fix_nontech_identity.ts
 * Or:  npx ts-node server/src/migrations/fix_nontech_identity.ts
 */

import mongoose from 'mongoose';

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/proofhire';

// ── Schemas (minimal, for migration only) ──────────────────────────────────────

const UserSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: String,
  role: String,
  track: String,
  careerArea: String,
  targetRole: String,
}, { timestamps: true });

const CandidateProfileSchema = new mongoose.Schema({
  user: mongoose.Schema.Types.ObjectId,
  careerArea: { type: String, default: '' },
  targetRole: { type: String, default: '' },
  experienceLevel: { type: String, default: '' },
  claimedSkills: [String],
  verifiedSkills: [String],
}, { timestamps: true });

const ResumeSchema = new mongoose.Schema({
  user: mongoose.Schema.Types.ObjectId,
  fileName: String,
  isPrimary: Boolean,
  documentType: { type: String, default: 'RESUME' },
  track: String,
  careerArea: String,
  extractedText: String,
  skills: [String],
  detectedSkills: [String],
  roleRelevantSkills: [String],
}, { timestamps: true });

const ResumeAnalysisSchema = new mongoose.Schema({
  candidateId: mongoose.Schema.Types.ObjectId,
  resumeId: mongoose.Schema.Types.Mixed,
  track: String,
  careerArea: String,
}, { timestamps: true });

const ChallengeSubmissionSchema = new mongoose.Schema({
  candidate: mongoose.Schema.Types.ObjectId,
  track: String,
  status: String,
  statusReason: String,
  workTitle: String,
  githubUrl: String,
}, { timestamps: true });

// ── Models ─────────────────────────────────────────────────────────────────────
const User = mongoose.model('User', UserSchema);
const CandidateProfile = mongoose.model('CandidateProfile', CandidateProfileSchema);
const Resume = mongoose.model('Resume', ResumeSchema);
const ResumeAnalysis = mongoose.model('ResumeAnalysis', ResumeAnalysisSchema);
const ChallengeSubmission = mongoose.model('ChallengeSubmission', ChallengeSubmissionSchema);

// Keywords that indicate a stale technical identity for a Non-Tech candidate
const TECH_CAREER_KEYWORDS = [
  'engineer', 'developer', 'programmer', 'software', 'systems', 'c++', 'java',
  'python', 'backend', 'frontend', 'fullstack', 'devops', 'architect', 'data scientist'
];

const isTechnicalIdentity = (value: string): boolean => {
  if (!value) return false;
  const lower = value.toLowerCase();
  return TECH_CAREER_KEYWORDS.some(k => lower.includes(k));
};

// Known Proof of Work filenames that should NOT be in Resume collection
const KNOWN_POW_FILENAMES = [
  'SYNAPSA',
  'synapsa',
  'presentation',
  'judge_qa',
  'member_presentation',
  'case_study',
  'playbook',
  'strategy_doc',
  'campaign',
  'business_case'
];

const isProbableProofOfWork = (fileName: string): boolean => {
  if (!fileName) return false;
  const lower = fileName.toLowerCase();
  return KNOWN_POW_FILENAMES.some(k => lower.includes(k.toLowerCase()));
};

// ── Migration Logic ─────────────────────────────────────────────────────────────

async function migrate() {
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB:', MONGO_URI);

  // ── 1. Find all Non-Technical candidates ──────────────────────────────────────
  const nonTechUsers = await User.find({ track: 'NON_TECHNICAL' });
  console.log(`\n📋 Found ${nonTechUsers.length} NON_TECHNICAL candidate(s).`);

  let usersFixed = 0;
  let profilesFixed = 0;
  let resumesStamped = 0;
  let powResumesMarked = 0;
  let analysisInvalidated = 0;
  let submissionsAlreadyHandled = 0;

  for (const user of nonTechUsers) {
    const userId = user._id;
    const userEmail = user.email;
    const changes: string[] = [];

    // ── 2. Fix User document ────────────────────────────────────────────────────
    const userFixes: any = {};
    if (isTechnicalIdentity(user.targetRole || '')) {
      console.log(`  ⚠️  [${userEmail}] user.targetRole = "${user.targetRole}" — CLEARING (technical identity)`);
      userFixes.targetRole = '';
      changes.push(`Cleared user.targetRole: "${user.targetRole}"`);
    }
    if (isTechnicalIdentity(user.careerArea || '')) {
      console.log(`  ⚠️  [${userEmail}] user.careerArea = "${user.careerArea}" — CLEARING`);
      userFixes.careerArea = '';
      changes.push(`Cleared user.careerArea: "${user.careerArea}"`);
    }
    if (Object.keys(userFixes).length > 0) {
      await User.findByIdAndUpdate(userId, { $set: userFixes });
      usersFixed++;
    }

    // ── 3. Fix CandidateProfile ─────────────────────────────────────────────────
    const profile = await CandidateProfile.findOne({ user: userId }) as any;
    if (profile) {
      const profileFixes: any = {};
      if (isTechnicalIdentity(profile.careerArea || '')) {
        console.log(`  ⚠️  [${userEmail}] profile.careerArea = "${profile.careerArea}" — CLEARING`);
        profileFixes.careerArea = '';
        changes.push(`Cleared profile.careerArea: "${profile.careerArea}"`);
      }
      if (isTechnicalIdentity(profile.targetRole || '')) {
        console.log(`  ⚠️  [${userEmail}] profile.targetRole = "${profile.targetRole}" — CLEARING`);
        profileFixes.targetRole = '';
        changes.push(`Cleared profile.targetRole: "${profile.targetRole}"`);
      }
      if (isTechnicalIdentity(profile.experienceLevel || '')) {
        console.log(`  ⚠️  [${userEmail}] profile.experienceLevel = "${profile.experienceLevel}" — CLEARING`);
        profileFixes.experienceLevel = 'Not specified';
        changes.push(`Cleared profile.experienceLevel: "${profile.experienceLevel}"`);
      }
      // Do NOT clear verifiedSkills from CandidateProfile.verifiedSkills — that field is
      // controlled by the profile update endpoint, not by AI. We leave it as-is.
      if (Object.keys(profileFixes).length > 0) {
        await CandidateProfile.findOneAndUpdate({ user: userId }, { $set: profileFixes });
        profilesFixed++;
      }
    }

    // ── 4. Stamp Resume documents with documentType = 'RESUME' ────────────────
    // All existing resumes that don't have documentType yet get stamped as 'RESUME'.
    // Then SYNAPSA / Proof-of-Work filenames get marked as 'OTHER'.
    const resumes = await Resume.find({ user: userId }) as any[];
    for (const resume of resumes) {
      if (!resume.documentType || resume.documentType === '') {
        if (isProbableProofOfWork(resume.fileName || '')) {
          console.log(`  🗂️  [${userEmail}] "${resume.fileName}" looks like Proof of Work — marking documentType=OTHER`);
          await Resume.findByIdAndUpdate(resume._id, { $set: { documentType: 'OTHER', isPrimary: false } });
          powResumesMarked++;
          changes.push(`Marked "${resume.fileName}" as documentType=OTHER (was masquerading as Resume)`);
        } else {
          await Resume.findByIdAndUpdate(resume._id, { $set: { documentType: 'RESUME' } });
          resumesStamped++;
        }
      } else if (resume.documentType === 'RESUME' && isProbableProofOfWork(resume.fileName || '')) {
        console.log(`  🗂️  [${userEmail}] "${resume.fileName}" was RESUME but looks like Proof of Work — correcting`);
        await Resume.findByIdAndUpdate(resume._id, { $set: { documentType: 'OTHER', isPrimary: false } });
        powResumesMarked++;
        changes.push(`Corrected "${resume.fileName}" from documentType=RESUME to OTHER`);
      }
    }

    // ── 5. Invalidate stale ResumeAnalysis records generated with wrong career identity ──
    // These are Non-Tech analyses where careerArea was inferred from resume rather than
    // from CandidateProfile. We mark them by clearing careerArea so they regenerate.
    const staleAnalyses = await ResumeAnalysis.find({
      candidateId: userId,
      track: 'NON_TECHNICAL',
      careerArea: { $in: ['C++ Systems Engineer', 'Software Engineer', 'Software Development', 'Engineering', ''] }
    }) as any[];

    for (const analysis of staleAnalyses) {
      if (isTechnicalIdentity(analysis.careerArea || '')) {
        console.log(`  🔄  [${userEmail}] Stale ResumeAnalysis with careerArea="${analysis.careerArea}" — invalidating`);
        await ResumeAnalysis.findByIdAndUpdate(analysis._id, {
          $set: { careerArea: '__STALE__' }  // Will not match any valid careerArea query
        });
        analysisInvalidated++;
        changes.push(`Invalidated stale ResumeAnalysis (careerArea was "${analysis.careerArea}")`);
      }
    }

    // ── 6. Report challenge submissions status (already handled by previous migration) ──
    const invalidSubs = await ChallengeSubmission.find({
      candidate: userId,
      status: 'NEEDS_RESUBMISSION'
    });
    if (invalidSubs.length > 0) {
      submissionsAlreadyHandled += invalidSubs.length;
      console.log(`  ✅  [${userEmail}] ${invalidSubs.length} challenge submission(s) already marked NEEDS_RESUBMISSION`);
    }

    if (changes.length > 0) {
      console.log(`\n  📝 Changes applied for [${userEmail}]:`);
      changes.forEach(c => console.log(`     - ${c}`));
    } else {
      console.log(`  ✅ [${userEmail}] No identity contamination detected.`);
    }
  }

  // ── 7. Final summary ──────────────────────────────────────────────────────────
  console.log('\n═══════════════════════════════════════════════');
  console.log('MIGRATION COMPLETE');
  console.log('═══════════════════════════════════════════════');
  console.log(`Users fixed (stale targetRole/careerArea cleared): ${usersFixed}`);
  console.log(`CandidateProfiles fixed:                          ${profilesFixed}`);
  console.log(`Resume documents stamped with documentType=RESUME: ${resumesStamped}`);
  console.log(`Proof-of-Work PDFs corrected (documentType=OTHER): ${powResumesMarked}`);
  console.log(`Stale ResumeAnalysis records invalidated:          ${analysisInvalidated}`);
  console.log(`Challenge submissions already NEEDS_RESUBMISSION:  ${submissionsAlreadyHandled}`);
  console.log('\nNEXT STEPS for the candidate:');
  console.log('  1. Log in and select a Career Area in your profile.');
  console.log('  2. Upload your resume via Resume AI — it will now analyze against your selected role.');
  console.log('  3. Your Capability Passport will show INCOMPLETE until careerArea is selected.');
  console.log('  4. Re-submit Proof of Work through the Non-Tech Proof of Work page.');
  console.log('═══════════════════════════════════════════════\n');

  await mongoose.disconnect();
  process.exit(0);
}

migrate().catch(err => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
