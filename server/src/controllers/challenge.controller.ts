import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Challenge from '../models/Challenge';
import ChallengeSubmission from '../models/ChallengeSubmission';
import NonTechProofOfWork from '../models/NonTechProofOfWork';
import ExpertReview from '../models/ExpertReview';
import { analyzeNonTechEvidence, containsTechnicalRepo } from '../services/nonTechEvidenceAnalyzer';

// ─── STATUS ALIASES ─────────────────────────────────────────────────────────
// Canonical status for active challenges is 'OPEN'.
// Legacy documents may have 'PUBLISHED' or 'AVAILABLE' — treat them as open.
const OPEN_STATUSES = ['OPEN', 'PUBLISHED', 'AVAILABLE'];

// ─── GET CHALLENGES ──────────────────────────────────────────────────────────

export const getChallenges = async (req: Request, res: Response) => {
  try {
    const { difficulty, type, search, track, status: queryStatus } = req.query;
    const user = (req as any).user;
    
    // Base filter: visible/open challenges with future deadline
    const filter: any = { 
      status: { $in: OPEN_STATUSES },
      deadline: { $gt: new Date() }
    };
    
    // Track filter — enforce authenticated candidate's track strictly
    if (user?.track === 'NON_TECHNICAL') {
      filter.track = 'NON_TECHNICAL';
    } else if (user?.track === 'TECHNICAL') {
      filter.track = { $ne: 'NON_TECHNICAL' };
    } else {
      const resolvedTrack = (track as string) || 'TECHNICAL';
      if (resolvedTrack !== 'ALL') {
        filter.track = resolvedTrack.toUpperCase();
      }
    }
    
    // Difficulty filter (normalized to uppercase)
    if (difficulty && difficulty !== 'ALL') {
      filter.difficulty = (difficulty as string).toUpperCase();
    }
    
    if (type && type !== 'ALL') {
      filter.type = type;
    }
    
    if (search) {
      const escapedSearch = (search as string).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { title: { $regex: escapedSearch, $options: 'i' } },
        { description: { $regex: escapedSearch, $options: 'i' } },
        { domain: { $regex: escapedSearch, $options: 'i' } },
        { company: { $regex: escapedSearch, $options: 'i' } },
        { tags: { $in: [new RegExp(escapedSearch, 'i')] } },
        { skills: { $in: [new RegExp(escapedSearch, 'i')] } },
        { technologies: { $in: [new RegExp(escapedSearch, 'i')] } }
      ];
    }
    
    const challenges = await Challenge.find(filter).sort({ createdAt: -1 });
    
    // Fetch participation/submissions strictly for the current authenticated candidate
    let submissionMap = new Map<string, any>();
    if (user && user._id) {
      const submissions = await ChallengeSubmission.find({ 
        candidate: user._id,
        challenge: { $in: challenges.map(c => c._id) }
      });
      submissionMap = new Map(submissions.map(s => [s.challenge.toString(), s]));
    }
    
    // Map each challenge with current candidate's participationStatus
    const enrichedAll = challenges.map(c => {
      const sub = submissionMap.get(c._id.toString());
      const participationStatus = sub ? sub.status : 'AVAILABLE';
      return {
        ...c.toObject(),
        participationStatus,
        candidateStatus: participationStatus,
        submission: sub ? {
          _id: sub._id,
          status: sub.status,
          score: sub.score,
          githubUrl: sub.githubUrl,
          notes: sub.notes,
          acceptedAt: sub.acceptedAt,
          startedAt: sub.startedAt,
          submittedAt: sub.submittedAt
        } : null,
        completed: sub?.status === 'COMPLETED' || sub?.status === 'VERIFIED',
        score: sub?.score
      };
    });
    
    // Compute dynamic counts based on the current candidate's real data
    const counts = {
      ALL: enrichedAll.length,
      AVAILABLE: enrichedAll.filter(c => c.participationStatus === 'AVAILABLE').length,
      ACCEPTED: enrichedAll.filter(c => c.participationStatus === 'ACCEPTED').length,
      IN_PROGRESS: enrichedAll.filter(c => c.participationStatus === 'IN_PROGRESS').length,
      SUBMITTED: enrichedAll.filter(c => c.participationStatus === 'SUBMITTED' || c.participationStatus === 'UNDER_REVIEW').length,
      COMPLETED: enrichedAll.filter(c => c.participationStatus === 'COMPLETED' || c.participationStatus === 'VERIFIED').length
    };
    
    // Optional backend status filter
    let finalChallenges = enrichedAll;
    if (queryStatus && queryStatus !== 'ALL') {
      const targetStatus = (queryStatus as string).toUpperCase();
      if (targetStatus === 'SUBMITTED') {
        finalChallenges = enrichedAll.filter(c => c.participationStatus === 'SUBMITTED' || c.participationStatus === 'UNDER_REVIEW');
      } else if (targetStatus === 'COMPLETED') {
        finalChallenges = enrichedAll.filter(c => c.participationStatus === 'COMPLETED' || c.participationStatus === 'VERIFIED');
      } else {
        finalChallenges = enrichedAll.filter(c => c.participationStatus === targetStatus);
      }
    }
    
    res.json({ 
      success: true, 
      count: finalChallenges.length,
      counts,
      challenges: finalChallenges,
      data: finalChallenges 
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── GET SINGLE CHALLENGE ────────────────────────────────────────────────────

export const getChallengeById = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { challengeId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(challengeId)) {
      return res.status(400).json({ success: false, message: 'Invalid challenge ID format' });
    }
    
    const challenge = await Challenge.findById(challengeId);
    if (!challenge) {
      return res.status(404).json({ success: false, message: 'Challenge not found' });
    }
    
    let submission = null;
    if (user && user._id) {
      submission = await ChallengeSubmission.findOne({
        challenge: challengeId,
        candidate: user._id
      });
    }
    
    const participationStatus = submission ? submission.status : 'AVAILABLE';
    const enriched = {
      ...challenge.toObject(),
      participationStatus,
      candidateStatus: participationStatus,
      submission: submission ? {
        _id: submission._id,
        status: submission.status,
        score: submission.score,
        githubUrl: submission.githubUrl,
        notes: submission.notes,
        acceptedAt: submission.acceptedAt,
        startedAt: submission.startedAt,
        submittedAt: submission.submittedAt
      } : null,
      completed: submission?.status === 'COMPLETED' || submission?.status === 'VERIFIED',
      score: submission?.score
    };
    
    res.json({ 
      success: true, 
      challenge: enriched,
      data: enriched
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── ACCEPT CHALLENGE ────────────────────────────────────────────────────────

export const acceptChallenge = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user._id) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    
    // Verify candidate role if specified
    if (user.role && user.role.toUpperCase() !== 'CANDIDATE') {
      return res.status(403).json({ success: false, message: 'Only candidates can accept challenges' });
    }
    
    const { challengeId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(challengeId)) {
      return res.status(400).json({ success: false, message: 'Invalid challenge ID' });
    }
    
    const challenge = await Challenge.findById(challengeId);
    if (!challenge) {
      return res.status(404).json({ success: false, message: 'Challenge not found' });
    }

    // Enforce candidate track isolation
    if (user.track && challenge.track && user.track !== challenge.track) {
      return res.status(403).json({
        success: false,
        message: `Track mismatch: this is a ${challenge.track} challenge and cannot be accepted by a ${user.track} candidate.`
      });
    }
    
    // Verify challenge is OPEN
    if (!OPEN_STATUSES.includes(challenge.status)) {
      return res.status(400).json({ success: false, message: 'Challenge is not currently open for acceptance' });
    }
    
    // Verify deadline has not expired
    if (challenge.deadline && new Date(challenge.deadline) <= new Date()) {
      return res.status(400).json({ success: false, message: 'Challenge deadline has expired' });
    }
    
    // Check if candidate already has a participation document
    let submission = await ChallengeSubmission.findOne({ 
      challenge: challengeId, 
      candidate: user._id 
    });
    
    if (submission && submission.status !== 'AVAILABLE') {
      return res.json({ 
        success: true, 
        message: 'Challenge already accepted',
        participation: {
          challengeId: challenge._id,
          status: submission.status
        },
        data: submission 
      });
    }
    
    if (!submission) {
      submission = await ChallengeSubmission.create({
        challenge: challengeId,
        candidate: user._id,
        track: challenge.track || user.track || 'TECHNICAL',
        careerArea: challenge.careerArea || challenge.domain || '',
        status: 'ACCEPTED',
        acceptedAt: new Date()
      });
    } else {
      submission.status = 'ACCEPTED';
      submission.track = challenge.track || user.track || 'TECHNICAL';
      submission.careerArea = challenge.careerArea || challenge.domain || '';
      submission.acceptedAt = new Date();
      await submission.save();
    }
    
    res.json({ 
      success: true, 
      message: 'Challenge accepted successfully', 
      participation: {
        challengeId: challenge._id,
        status: 'ACCEPTED'
      },
      data: submission 
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── START CHALLENGE ─────────────────────────────────────────────────────────

export const startChallenge = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user._id) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    
    const { challengeId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(challengeId)) {
      return res.status(400).json({ success: false, message: 'Invalid challenge ID' });
    }
    
    const challenge = await Challenge.findById(challengeId);
    if (!challenge) {
      return res.status(404).json({ success: false, message: 'Challenge not found' });
    }

    if (user.track && challenge.track && user.track !== challenge.track) {
      return res.status(403).json({
        success: false,
        message: `Track mismatch: this is a ${challenge.track} challenge.`
      });
    }
    
    let submission = await ChallengeSubmission.findOne({ 
      challenge: challengeId, 
      candidate: user._id 
    });
    
    if (!submission) {
      // If not yet accepted, automatically accept and start
      submission = await ChallengeSubmission.create({
        challenge: challengeId,
        candidate: user._id,
        track: challenge.track || user.track || 'TECHNICAL',
        careerArea: challenge.careerArea || challenge.domain || '',
        status: 'IN_PROGRESS',
        acceptedAt: new Date(),
        startedAt: new Date()
      });
    } else {
      submission.status = 'IN_PROGRESS';
      if (!submission.startedAt) submission.startedAt = new Date();
      await submission.save();
    }
    
    res.json({ 
      success: true, 
      message: 'Challenge started successfully', 
      participation: {
        challengeId: challengeId,
        status: 'IN_PROGRESS'
      },
      data: submission 
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── SUBMIT CHALLENGE ────────────────────────────────────────────────────────

export const submitChallenge = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user._id) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    
    const { challengeId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(challengeId)) {
      return res.status(400).json({ success: false, message: 'Invalid challenge ID' });
    }
    
    const challenge = await Challenge.findById(challengeId);
    if (!challenge) {
      return res.status(404).json({ success: false, message: 'Challenge not found' });
    }

    // Enforce strict track matching
    if (user.track !== challenge.track) {
      return res.status(403).json({
        success: false,
        message: `Track mismatch: this is a ${challenge.track} challenge and cannot be submitted by a ${user.track} candidate.`
      });
    }

    const isNonTech = challenge.track === 'NON_TECHNICAL' || user.track === 'NON_TECHNICAL';
    const { 
      githubUrl = '', 
      notes = '', 
      workTitle = '', 
      workDescription = '', 
      documentUrl = '', 
      workUrl = '',
      title = '',
      description = '',
      deliverables = '',
      submissionType = '',
      externalWorkUrl = '',
      externalWorkType = ''
    } = req.body;

    const finalTitle = (workTitle || title || challenge.title).trim();
    const finalDesc = (workDescription || description || notes || '').trim();
    const effectiveWorkUrl = (externalWorkUrl || workUrl || documentUrl || '').trim();

    if (isNonTech) {
      // Hard reject GitHub and technical git repositories for Non-Tech proof of work
      if (
        containsTechnicalRepo(effectiveWorkUrl) || 
        containsTechnicalRepo(notes) || 
        containsTechnicalRepo(finalDesc) || 
        containsTechnicalRepo(githubUrl)
      ) {
        return res.status(400).json({
          success: false,
          message: 'Technical repository links are not accepted for Non-Technical Proof of Work. Please upload a case study, document, presentation, work sample, portfolio, or other role-relevant deliverable.'
        });
      }

      // Disallow technical submission types for Non-Tech
      const technicalTypes = ['CODE_REPOSITORY', 'GITHUB_REPOSITORY', 'CODING_PROJECT', 'TECHNICAL_PROJECT', 'LIVE_DEMO'];
      if (submissionType && technicalTypes.includes(submissionType.toUpperCase())) {
        return res.status(400).json({
          success: false,
          message: `Technical submission type "${submissionType}" is not allowed for Non-Technical Proof of Work. Allowed deliverables: CASE_STUDY, BUSINESS_DOCUMENT, MARKETING_PLAN, SALES_PLAYBOOK, HR_CASE_STUDY, BUSINESS_ANALYSIS, UI_UX_CASE_STUDY, CONTENT_PORTFOLIO, PRESENTATION, STRATEGY_DOCUMENT, WORK_SAMPLE.`
        });
      }

      if (!finalTitle) {
        return res.status(400).json({ success: false, message: 'Please provide a title for your deliverable.' });
      }

      if (finalDesc.length < 30 && !effectiveWorkUrl) {
        return res.status(400).json({ 
          success: false, 
          message: 'Submission requires substantive deliverable content or a valid document URL (Google Docs, PDF, slide deck, or Notion).' 
        });
      }
    } else {
      if (!githubUrl || !githubUrl.trim()) {
        return res.status(400).json({ success: false, message: 'GitHub repository URL is required for technical challenge submission' });
      }
    }

    let submission = await ChallengeSubmission.findOne({ 
      challenge: challengeId, 
      candidate: user._id 
    });

    // Determine submission type
    const resolvedSubmissionType = submissionType || (isNonTech ? (challenge.type || 'CASE_STUDY') : 'CODE_REPOSITORY');
    const careerArea = challenge.careerArea || challenge.domain || user.careerArea || 'General Strategy';

    let nonTechAnalysis: any = undefined;
    let computedScore: number | undefined = undefined;
    let finalStatus: string = 'SUBMITTED';
    let statusReason = '';

    if (isNonTech) {
      const analysisResult = analyzeNonTechEvidence({
        careerArea,
        targetRole: user.targetRole,
        challengeTitle: challenge.title,
        challengeRequirements: challenge.requirements || [],
        submissionType: resolvedSubmissionType,
        title: finalTitle,
        description: finalDesc,
        deliverables,
        extractedArtifactText: '',
        hasArtifactFile: false,
        externalWorkUrl: effectiveWorkUrl,
        externalWorkType: externalWorkType || (effectiveWorkUrl ? 'DOCUMENT' : '')
      });

      if (analysisResult.status === 'NEEDS_RESUBMISSION') {
        return res.status(400).json({
          success: false,
          message: analysisResult.statusReason || 'Technical repository links are not accepted for Non-Technical Proof of Work.'
        });
      }

      finalStatus = analysisResult.status;
      statusReason = analysisResult.statusReason || '';
      nonTechAnalysis = analysisResult.analysis;
      computedScore = analysisResult.overallScore ? Math.round(analysisResult.overallScore * 10) : undefined;
    }

    if (!submission) {
      submission = await ChallengeSubmission.create({
        challenge: challengeId,
        candidate: user._id,
        track: isNonTech ? 'NON_TECHNICAL' : 'TECHNICAL',
        careerArea,
        submissionType: resolvedSubmissionType,
        status: finalStatus,
        statusReason,
        githubUrl: isNonTech ? '' : githubUrl.trim(),
        workTitle: finalTitle,
        workDescription: finalDesc,
        workUrl: isNonTech ? effectiveWorkUrl : '',
        documentUrl: isNonTech ? effectiveWorkUrl : '',
        externalWorkUrl: isNonTech ? effectiveWorkUrl : '',
        externalWorkType: isNonTech ? (externalWorkType || 'DOCUMENT') : '',
        notes: finalDesc,
        nonTechAnalysis,
        score: computedScore,
        acceptedAt: new Date(),
        startedAt: new Date(),
        submittedAt: new Date()
      });
    } else {
      submission.track = isNonTech ? 'NON_TECHNICAL' : 'TECHNICAL';
      submission.careerArea = careerArea;
      submission.submissionType = resolvedSubmissionType;
      submission.status = finalStatus as any;
      submission.statusReason = statusReason;
      if (!isNonTech) submission.githubUrl = githubUrl.trim() || submission.githubUrl;
      submission.workTitle = finalTitle;
      submission.workDescription = finalDesc;
      submission.workUrl = isNonTech ? effectiveWorkUrl : submission.workUrl;
      submission.documentUrl = isNonTech ? effectiveWorkUrl : submission.documentUrl;
      submission.externalWorkUrl = isNonTech ? effectiveWorkUrl : '';
      submission.externalWorkType = isNonTech ? (externalWorkType || 'DOCUMENT') : '';
      submission.notes = finalDesc;
      submission.nonTechAnalysis = nonTechAnalysis;
      submission.score = computedScore;
      submission.submittedAt = new Date();
      await submission.save();
    }

    // If Non-Tech, also upsert NonTechProofOfWork dedicated model
    if (isNonTech) {
      await NonTechProofOfWork.findOneAndUpdate(
        { candidate: user._id, challenge: challengeId },
        {
          candidate: user._id,
          candidateId: user._id.toString(),
          track: 'NON_TECHNICAL',
          careerArea,
          targetRole: user.targetRole || '',
          challenge: challengeId,
          challengeId: challengeId.toString(),
          title: finalTitle,
          submissionType: resolvedSubmissionType,
          description: finalDesc,
          deliverables,
          notes: finalDesc,
          externalWorkUrl: effectiveWorkUrl,
          externalWorkType: externalWorkType || (effectiveWorkUrl ? 'DOCUMENT' : ''),
          status: finalStatus,
          statusReason,
          nonTechAnalysis,
          submittedAt: new Date()
        },
        { upsert: true, new: true }
      );
    }
    
    // Increment verified submissions count on challenge
    await Challenge.findByIdAndUpdate(challengeId, { $inc: { verifiedSubmissions: 1 } });

    // Automatically create unassigned ExpertReview for the expert queue
    const existingReview = await ExpertReview.findOne({
      $or: [
        { challengeSubmission: submission._id },
        { submissionId: submission._id }
      ]
    });
    if (!existingReview) {
      await ExpertReview.create({
        candidate: user._id,
        candidateId: user._id,
        challengeSubmission: submission._id,
        submissionId: submission._id,
        track: isNonTech ? 'NON_TECHNICAL' : 'TECHNICAL',
        submissionTitle: finalTitle,
        submissionDescription: finalDesc,
        status: 'UNASSIGNED',
        assignedAt: new Date()
      });
    } else if (existingReview.status === 'COMPLETED' && existingReview.verificationStatus === 'NEEDS_RESUBMISSION') {
      // Re-enter review queue for newly improved submission version while preserving review history
      await ExpertReview.create({
        candidate: user._id,
        candidateId: user._id,
        challengeSubmission: submission._id,
        submissionId: submission._id,
        track: isNonTech ? 'NON_TECHNICAL' : 'TECHNICAL',
        submissionTitle: `${finalTitle} (Resubmission)`,
        submissionDescription: finalDesc,
        status: 'UNASSIGNED',
        assignedAt: new Date()
      });
    }
    
    res.json({ 
      success: true, 
      message: 'Challenge submitted successfully', 
      participation: {
        challengeId: challengeId,
        status: finalStatus
      },
      data: submission 
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── GET MY SUBMISSIONS ──────────────────────────────────────────────────────

export const getChallengeSubmissions = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user._id) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    
    const submissions = await ChallengeSubmission.find({ candidate: user._id })
      .populate('challenge', 'title difficulty domain type track company deadline skills estimatedTime technologies category')
      .sort({ createdAt: -1 });
    
    res.json({ success: true, count: submissions.length, data: submissions });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
