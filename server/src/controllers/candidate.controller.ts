import { Request, Response } from 'express';
import Project from '../models/Project';
import ProjectEvidence from '../models/ProjectEvidence';
import ProjectAnalysis from '../models/ProjectAnalysis';
import Review from '../models/Review';
import Challenge from '../models/Challenge';
import ChallengeSubmission from '../models/ChallengeSubmission';
import User from '../models/User';
import TechnicalPracticeEvidence from '../models/TechnicalPracticeEvidence';
import CodingSubmission from '../models/CodingSubmission';
import CodingChallenge from '../models/CodingChallenge';
import Resume from '../models/Resume';
import ResumeAnalysis from '../models/ResumeAnalysis';
import Application from '../models/Application';
import InterviewSession from '../models/InterviewSession';
import CandidateProfile from '../models/CandidateProfile';
import NonTechProofOfWork from '../models/NonTechProofOfWork';
import ExpertReview from '../models/ExpertReview';
import { analyzeNonTechEvidence, containsTechnicalRepo } from '../services/nonTechEvidenceAnalyzer';
import { extractTextFromArtifact } from '../middleware/proofOfWorkUpload';

// ─── DASHBOARD ────────────────────────────────────────────────────────────────

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    const [
      projects, 
      reviews, 
      challengeSubmissions, 
      evidences, 
      practiceEvidences,
      latestResume,
      applications,
      interviews,
      totalCodingChallenges,
      allCodingSubmissions,
      profileDoc
    ] = await Promise.all([
      Project.find({ user: user._id }).sort({ createdAt: -1 }),
      Review.find({ candidate: user._id }).populate('reviewer', 'firstName lastName').populate('project', 'projectName').sort({ createdAt: -1 }),
      ChallengeSubmission.find({ candidate: user._id }).populate('challenge', 'title difficulty company estimatedTime skills track').sort({ updatedAt: -1 }),
      ProjectEvidence.find({ user: user._id }).populate('project'),
      TechnicalPracticeEvidence.find({ candidate: user._id }).sort({ createdAt: -1 }),
      // Only fetch RESUME documents — Proof of Work PDFs must not appear in Resume AI / Dashboard
      Resume.findOne({ user: user._id, $or: [{ documentType: 'RESUME' }, { documentType: { $exists: false } }] }).sort({ isPrimary: -1, createdAt: -1 }),
      Application.find({ candidate: user._id }).populate('job', 'title company location status workMode type').sort({ createdAt: -1 }),
      InterviewSession.find({ candidate: user._id }).populate('jobId', 'title company').populate('projectId', 'projectName').sort({ createdAt: -1 }),
      CodingChallenge.countDocuments({ status: 'ACTIVE' }),
      CodingSubmission.find({ candidate: user._id }),
      CandidateProfile.findOne({ user: user._id })
    ]);

    const isNonTech = user.track === 'NON_TECHNICAL';
    const verifiedProjectsCount = projects.filter(p => p.status === 'COMPLETED').length;
    const completedEvidences = evidences.filter(e => e.analysisStatus === 'COMPLETED');

    // Calculate Coding Practice Solved / Total
    const solvedSet = new Set<string>();
    const attemptedSet = new Set<string>();
    if (!isNonTech) {
      allCodingSubmissions.forEach(sub => {
        const cId = sub.challenge.toString();
        attemptedSet.add(cId);
        if (sub.status === 'PASSED') solvedSet.add(cId);
      });
    }

    const activeChallenges = isNonTech
      ? challengeSubmissions.filter(c => 
          (c.track === 'NON_TECHNICAL' || (c.challenge as any)?.track === 'NON_TECHNICAL') &&
          (c.status === 'ACCEPTED' || c.status === 'IN_PROGRESS')
        )
      : challengeSubmissions.filter(c => 
          c.status === 'ACCEPTED' || c.status === 'IN_PROGRESS' || c.status === 'SUBMITTED'
        );

    const completedWork = isNonTech
      ? challengeSubmissions.filter(c =>
          (c.track === 'NON_TECHNICAL' || (c.challenge as any)?.track === 'NON_TECHNICAL') &&
          (c.status as string) !== 'NEEDS_RESUBMISSION' &&
          (c.status as string) !== 'INVALID_SUBMISSION' &&
          (c.status as string) !== 'INSUFFICIENT_EVIDENCE' &&
          (c.status === 'COMPLETED' || c.status === 'VERIFIED')
        )
      : challengeSubmissions.filter(c =>
          c.status === 'COMPLETED' || c.status === 'SUBMITTED' || c.status === 'VERIFIED'
        );

    let compositeSignal: number | null = null;
    const allScores: number[] = [];
    if (!isNonTech) {
      if (completedEvidences.length > 0) {
        completedEvidences.forEach(e => {
          const s = e.scores?.overallEvidenceScore;
          if (s && s > 0) allScores.push(s);
        });
      }
      practiceEvidences.forEach(pe => {
        allScores.push(Math.round(pe.passRate * 85));
      });
    } else {
      // Non-tech scoring: ONLY valid completed/verified proof of work analysis & non-tech interview
      completedWork.forEach(cs => {
        if (cs.nonTechAnalysis?.overallScore) {
          allScores.push(Math.round(cs.nonTechAnalysis.overallScore * 10));
        }
      });
      interviews.forEach(i => {
        if (i.finalReport?.overallScore) {
          allScores.push(Math.round(i.finalReport.overallScore * 10));
        }
      });
    }
    if (latestResume?.score10) {
      allScores.push(Math.round(latestResume.score10 * 10));
    }
    if (allScores.length > 0) {
      compositeSignal = Math.round((allScores.reduce((a, b) => a + b, 0) / allScores.length) * 10) / 10;
    }

    // Evidence summary counts
    let totalCodeItems = 0;
    let totalArchitectureItems = 0;
    let totalDecisions = 0;
    const detectedLanguages = new Set<string>();

    if (!isNonTech) {
      completedEvidences.forEach(e => {
        e.evidenceItems?.forEach((item: any) => {
          if (item.type === 'LANGUAGE') {
            detectedLanguages.add(item.name);
            totalCodeItems++;
          } else if (item.type === 'FRAMEWORK' || item.type === 'LIBRARY') {
            totalCodeItems++;
          } else if (item.type === 'ARCHITECTURE' || item.type === 'PATTERN') {
            totalArchitectureItems++;
            totalDecisions++;
          }
        });
      });
    }

    // Calculate Profile Completion %
    let completionScore = 15; // base registered
    if (latestResume) completionScore += 25;
    if (projects.length > 0) completionScore += 20;
    if (solvedSet.size > 0) completionScore += 20;
    if (challengeSubmissions.length > 0) completionScore += 20;
    const profileCompletion = Math.min(100, completionScore);

    // Build real proofs from projects with evidence
    const proofs = projects.map(p => {
      const ev = evidences.find(e => e.project && (e.project as any)._id?.toString() === p._id.toString());
      return {
        id: p._id,
        title: p.projectName,
        description: p.description,
        status: p.status,
        githubUrl: p.githubUrl,
        signal: ev?.scores?.overallEvidenceScore ? (ev.scores.overallEvidenceScore / 10).toFixed(1) : null,
        score: ev?.scores?.overallEvidenceScore || null,
        scores: ev?.scores || null,
        claimedTechnologies: p.claimedTechnologies || [],
        evidenceItems: ev?.evidenceItems?.slice(0, 6) || [],
        createdAt: p.createdAt
      };
    });

    // Build chronological timeline from real DB activities
    const timelineItems: Array<{ title: string; desc: string; type: 'success' | 'action' | 'info'; date: Date }> = [];

    // 1. Projects
    projects.forEach(p => {
      if (p.status === 'COMPLETED') {
        timelineItems.push({
          title: `Project Verified: ${p.projectName}`,
          desc: `Static analysis completed and evidence verified`,
          type: 'success',
          date: p.updatedAt || p.createdAt
        });
      } else {
        timelineItems.push({
          title: `Project Uploaded: ${p.projectName}`,
          desc: `Queued for automated evidence analysis`,
          type: 'action',
          date: p.createdAt
        });
      }
    });

    // 2. Reviews
    reviews.forEach((r: any) => {
      const reviewerName = r.reviewer?.firstName
        ? `${r.reviewer.firstName} ${r.reviewer.lastName || ''}`
        : (r.reviewerName || 'Peer Reviewer');
      const projectName = r.project?.projectName || 'Project';
      const rating = r.overallRating || (r.score ? Math.round(r.score / 20) : 5);
      timelineItems.push({
        title: `Peer Review Received`,
        desc: `${reviewerName} gave ${rating}/5 for ${projectName}`,
        type: 'action',
        date: r.createdAt
      });
    });

    // 3. Challenges
    challengeSubmissions.forEach(c => {
      const chTitle = (c.challenge as any)?.title || 'Challenge';
      timelineItems.push({
        title: `Challenge: ${chTitle} (${c.status})`,
        desc: `Status: ${c.status}`,
        type: 'action',
        date: (c as any).completedAt || (c as any).submittedAt || (c as any).startedAt || c.createdAt
      });
    });

    // 4. Technical Practice Challenges (Only for Technical Candidates)
    if (user.track !== 'NON_TECHNICAL') {
      practiceEvidences.forEach(pe => {
        timelineItems.push({
          title: `Technical Challenge Solved: ${pe.challengeTitle}`,
          desc: `Verified ${pe.testsPassed}/${pe.testsTotal} test cases (${Math.round(pe.passRate * 100)}%) in ${pe.language}`,
          type: 'success',
          date: pe.createdAt
        });
      });
    }

    // Sort timeline newest first
    timelineItems.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Career and role resolution — CandidateProfile is authoritative, never user.targetRole fallback
    const resolvedCareerArea = (profileDoc?.careerArea || '').trim();
    const resolvedTargetRole = (profileDoc?.targetRole || '').trim() || (isNonTech ? '' : 'Software Engineer');

    const nonTechVerifiedSkillsCount = (() => {
      const sSet = new Set<string>();
      completedWork.forEach(c => {
        const skills = (c as any).nonTechAnalysis?.verifiedSkills || [];
        skills.forEach((sk: string) => {
          if (sk && typeof sk === 'string') sSet.add(sk.trim().toLowerCase());
        });
      });
      interviews.forEach(i => {
        if (i.status === 'COMPLETED' && i.focus) sSet.add(i.focus.trim().toLowerCase());
      });
      if (reviews.some(r => (r.overallRating || 0) >= 4)) sSet.add('professional quality');
      return sSet.size;
    })();

    res.json({
      success: true,
      data: {
        compositeSignal,
        profileCompletion,
        resumeScore10: latestResume?.score10 || null,
        resumeScore: latestResume?.score10 || null,
        resume: latestResume ? {
          _id: latestResume._id,
          fileName: latestResume.fileName,
          score10: latestResume.score10,
          scoreBreakdown: latestResume.scoreBreakdown,
          aiAssistanceSignals: latestResume.aiAssistanceSignals,
          createdAt: latestResume.createdAt
        } : null,
        practice: isNonTech ? null : {
          solved: solvedSet.size,
          total: totalCodingChallenges,
          attempted: attemptedSet.size,
          accuracy: allCodingSubmissions.length > 0 
            ? Math.round((allCodingSubmissions.filter(s => s.status === 'PASSED').length / allCodingSubmissions.length) * 100) 
            : 0
        },
        practiceStats: isNonTech ? null : {
          solved: solvedSet.size,
          total: totalCodingChallenges,
          attempted: attemptedSet.size,
          accuracy: allCodingSubmissions.length > 0 
            ? Math.round((allCodingSubmissions.filter(s => s.status === 'PASSED').length / allCodingSubmissions.length) * 100) 
            : 0
        },
        activeChallengesCount: activeChallenges.length,
        activeChallenge: activeChallenges[0] ? {
          id: activeChallenges[0]._id,
          challengeId: (activeChallenges[0].challenge as any)?._id || activeChallenges[0].challenge,
          title: (activeChallenges[0].challenge as any)?.title || (isNonTech ? 'Case Study Challenge' : 'Technical Challenge'),
          status: activeChallenges[0].status
        } : null,
        activeChallenges: activeChallenges.map(c => ({
          _id: c._id,
          challengeId: (c.challenge as any)?._id || c.challenge,
          title: (c.challenge as any)?.title || (isNonTech ? 'Case Study Challenge' : 'Technical Challenge'),
          difficulty: (c.challenge as any)?.difficulty || 'MEDIUM',
          company: (c.challenge as any)?.company || 'ProofHire Lab',
          status: c.status,
          acceptedAt: c.acceptedAt,
          startedAt: c.startedAt,
          submittedAt: c.submittedAt
        })),
        applicationsCount: applications.length,
        applications: applications.slice(0, 5).map(a => ({
          _id: a._id,
          job: a.job,
          status: a.status,
          appliedAt: a.appliedAt
        })),
        upcomingInterviewsCount: interviews.length,
        upcomingInterview: interviews[0] ? {
          id: interviews[0]._id,
          focus: interviews[0].focus,
          targetLevel: interviews[0].targetLevel,
          status: interviews[0].status
        } : null,
        interviews: interviews.slice(0, 3).map(i => ({
          _id: i._id,
          focus: i.focus,
          targetLevel: i.targetLevel,
          status: i.status,
          score: i.finalReport?.overallScore,
          startedAt: i.startedAt
        })),
        careerArea: resolvedCareerArea,
        targetRole: resolvedTargetRole,
        completedWorkCount: completedWork.length,
        resumeStatus: latestResume ? (latestResume.analysisStatus || 'ANALYZED') : 'NOT_UPLOADED',
        interviewStatus: interviews.length > 0 ? (interviews[0].status || 'COMPLETED') : 'NOT_STARTED',
        verifiedSkillsCount: isNonTech
          ? nonTechVerifiedSkillsCount
          : (solvedSet.size > 0 ? solvedSet.size : 0) + (latestResume?.skills?.length || 0) + completedEvidences.length,
        verifiedProjects: isNonTech ? completedWork.length : verifiedProjectsCount,
        totalProjects: isNonTech ? challengeSubmissions.length : projects.length,
        peerReviews: reviews.length,
        challengesDone: challengeSubmissions.filter(c => c.status === 'COMPLETED' || c.status === 'SUBMITTED' || c.status === 'VERIFIED').length + (isNonTech ? 0 : solvedSet.size),
        evidenceSummary: isNonTech ? {
          proofOfWork: completedWork.length > 0 ? `${completedWork.length} proof-of-work submission${completedWork.length > 1 ? 's' : ''}` : 'No submitted deliverables yet',
          challengesDesc: activeChallenges.length > 0 ? `${activeChallenges.length} active challenge${activeChallenges.length > 1 ? 's' : ''}` : 'No challenges currently in progress',
          reviewsDesc: reviews.length > 0 ? `${reviews.length} peer/expert review${reviews.length > 1 ? 's' : ''} recorded` : 'No reviews received yet',
          interviewsDesc: interviews.length > 0 ? `${interviews.filter(i => i.status === 'COMPLETED').length} AI interview session(s) completed` : 'AI interview not started'
        } : {
          codeEvidence: totalCodeItems > 0 ? `${totalCodeItems} verified artifacts across ${detectedLanguages.size || 1} languages` : 'No code evidence analyzed yet',
          architectureDecisions: totalDecisions > 0 ? `${totalDecisions} architecture decisions identified` : 'Awaiting repository architecture analysis',
          challengesDesc: challengeSubmissions.length > 0 ? `${challengeSubmissions.length} challenge${challengeSubmissions.length > 1 ? 's' : ''} in progress or completed` : 'No challenges accepted yet',
          reviewsDesc: reviews.length > 0 ? `${reviews.length} peer reviews recorded` : 'No peer reviews received yet'
        },
        proofs: isNonTech ? challengeSubmissions.map(c => ({
          id: c._id,
          title: (c as any).workTitle || (c.challenge as any)?.title || 'Proof of Work Deliverable',
          description: (c as any).workDescription || (c.challenge as any)?.description || '',
          status: c.status,
          workUrl: (c as any).workUrl || (c as any).documentUrl || '',
          signal: (c as any).nonTechAnalysis?.overallScore ? ((c as any).nonTechAnalysis.overallScore).toFixed(1) : null,
          score: (c as any).nonTechAnalysis?.overallScore ? Math.round((c as any).nonTechAnalysis.overallScore * 10) : null,
          claimedTechnologies: (c.challenge as any)?.skills || [],
          evidenceItems: [],
          createdAt: c.createdAt
        })) : proofs,
        timeline: timelineItems.slice(0, 10),
        recentProjects: isNonTech ? [] : projects.slice(0, 5)
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── CAPABILITIES ─────────────────────────────────────────────────────────────

export const getCapabilities = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    // Non-Technical Candidates have dedicated Capability Passport
    if (user.track === 'NON_TECHNICAL') {
      const [profileDoc, latestResume, submissions, interviews, reviews] = await Promise.all([
        CandidateProfile.findOne({ user: user._id }),
        Resume.findOne({ user: user._id }).sort({ isPrimary: -1, createdAt: -1 }),
        ChallengeSubmission.find({ candidate: user._id }).populate('challenge', 'title category domain difficulty description track company'),
        InterviewSession.find({ candidate: user._id, track: 'NON_TECHNICAL' }).sort({ createdAt: -1 }),
        Review.find({ candidate: user._id }).populate('reviewer', 'firstName lastName')
      ]);

      // ── AUTHORITATIVE IDENTITY: comes from CandidateProfile only.
      // If not set, passport is INCOMPLETE — we do NOT guess or default to any career.
      const careerArea = (profileDoc?.careerArea || '').trim();
      const targetRole = (profileDoc?.targetRole || '').trim();
      const passportTitle = careerArea
        ? `${careerArea.toUpperCase()} CAPABILITY PASSPORT`
        : 'NON-TECHNICAL CAPABILITY PASSPORT';

      // If no career area is selected yet, return INCOMPLETE state
      if (!careerArea) {
        return res.json({
          success: true,
          data: {
            track: 'NON_TECHNICAL',
            careerArea: '',
            targetRole: '',
            passportTitle: 'NON-TECHNICAL CAPABILITY PASSPORT',
            verificationStatus: 'INSUFFICIENT_EVIDENCE',
            requiresCareerSelection: true,
            candidate: {
              name: `${user.firstName} ${user.lastName}`.trim(),
              careerArea: '',
              targetRole: '',
              location: profileDoc?.location || user.location || ''
            },
            careerProfile: 'Select your career area and target role to begin building your Non-Technical capability profile.',
            claimedSkills: [],
            verifiedSkills: [],
            verifiedSkillsDetails: [],
            otherDetectedSkills: [],
            resume: null,
            proofOfWork: [],
            aiInterview: { score: null, totalSessions: 0, status: 'NOT_STARTED', domain: '' },
            expertReview: [],
            capabilities: [],
            compositeSignal: null,
            projectCount: 0,
            message: 'Choose a career area and target role to begin building your Non-Technical capability profile.'
          }
        });
      }

      const validSubmissions = submissions.filter(s => 
        (s.track === 'NON_TECHNICAL' || (s.challenge as any)?.track === 'NON_TECHNICAL') &&
        (s.status as string) !== 'NEEDS_RESUBMISSION' &&
        (s.status as string) !== 'INVALID_SUBMISSION' &&
        (s.status === 'VERIFIED' || s.status === 'COMPLETED') &&
        s.nonTechAnalysis &&
        ((s.nonTechAnalysis as any).overallScore || 0) > 0
      );

      const proofOfWork = validSubmissions.map(s => ({
        id: s._id,
        title: s.workTitle || (s.challenge as any)?.title || 'Proof of Work Deliverable',
        category: (s.challenge as any)?.careerArea || (s.challenge as any)?.category || (s.challenge as any)?.domain || careerArea,
        status: s.status,
        submittedAt: (s as any).submittedAt || s.createdAt,
        score: s.nonTechAnalysis?.overallScore || null,
        analysisStatus: 'Complete',
        nonTechAnalysis: s.nonTechAnalysis || null
      }));

      // Verified skills strictly derived from real verified submissions, interviews, or reviews
      const verifiedSkillsMap = new Map<string, { confidence: number; evidence: string }>();

      validSubmissions.forEach(s => {
        if (s.nonTechAnalysis) {
          const skills = (s.nonTechAnalysis as any).verifiedSkills || (s.nonTechAnalysis as any).strengths || [];
          skills.forEach((st: string) => {
            if (st && st.length < 50) {
              const key = st.trim();
              if (!verifiedSkillsMap.has(key.toLowerCase())) {
                verifiedSkillsMap.set(key.toLowerCase(), {
                  confidence: Math.round(((s.nonTechAnalysis?.overallScore) || 8) * 10),
                  evidence: `Verified in Proof of Work: ${s.workTitle || (s.challenge as any)?.title || 'Challenge Submission'}`
                });
              }
            }
          });
        }
      });

      interviews.forEach(inv => {
        if (inv.status === 'COMPLETED' && inv.finalReport) {
          const score = inv.finalReport.overallScore ? Math.round(inv.finalReport.overallScore * 10) : 85;
          const focusSkill = inv.focus || `${careerArea} Strategy`;
          if (!verifiedSkillsMap.has(focusSkill.toLowerCase())) {
            verifiedSkillsMap.set(focusSkill.toLowerCase(), {
              confidence: score,
              evidence: `Demonstrated in AI Role Interview (${inv.focus || careerArea})`
            });
          }
        }
      });

      reviews.forEach((r: any) => {
        if (r.overallRating >= 4) {
          const revEvidence = `Validated by Expert Reviewer (${r.overallRating}/5)`;
          if (!verifiedSkillsMap.has('professional quality')) {
            verifiedSkillsMap.set('professional quality', {
              confidence: 90,
              evidence: revEvidence
            });
          }
        }
      });

      const verifiedSkillsList = Array.from(verifiedSkillsMap.entries()).map(([k, v]) => ({
        name: k.charAt(0).toUpperCase() + k.slice(1),
        status: 'VERIFIED' as const,
        confidence: v.confidence,
        evidence: v.evidence
      }));

      // Claimed skills strictly from profile
      const claimedSkillsList = (profileDoc?.claimedSkills || []).map((sk: string) => ({
        name: sk,
        status: 'CLAIMED' as const,
        confidence: 65,
        evidence: 'Self-reported in candidate profile'
      }));

      // Other skills detected from resume that do NOT define the candidate's career identity
      const detectedResumeSkills: string[] = (latestResume as any)?.detectedSkills || latestResume?.skills || [];
      const otherDetectedSkills: string[] = (latestResume as any)?.otherDetectedSkills || detectedResumeSkills.filter(
        ds => !verifiedSkillsList.some(vs => vs.name.toLowerCase() === ds.toLowerCase()) &&
              !claimedSkillsList.some(cs => cs.name.toLowerCase() === ds.toLowerCase())
      );

      const completedInterviews = interviews.filter(i => i.status === 'COMPLETED');
      const interviewScore = completedInterviews.length > 0 && completedInterviews[0].finalReport?.overallScore
        ? completedInterviews[0].finalReport.overallScore
        : null;

      const hasProof = submissions.some(s => s.status === 'SUBMITTED' || s.status === 'COMPLETED');
      const hasInterview = completedInterviews.length > 0;
      const verificationStatus: 'VERIFIED' | 'PARTIALLY_VERIFIED' | 'INSUFFICIENT_EVIDENCE' = 
        (hasProof && hasInterview) ? 'VERIFIED' :
        (hasProof || hasInterview || latestResume) ? 'PARTIALLY_VERIFIED' :
        'INSUFFICIENT_EVIDENCE';

      // Career profile summary generated strictly from real context (NEVER "C++ Developer")
      let careerProfile = profileDoc?.bio || '';
      if (!careerProfile) {
        if (profileDoc?.education && profileDoc.education.length > 0) {
          const edu = profileDoc.education[0];
          careerProfile = `${edu.degree || 'Degree'} graduate focused on ${careerArea}, targeting ${targetRole}.`;
        } else {
          careerProfile = `Candidate with demonstrated interest in ${careerArea}, targeting ${targetRole}.`;
        }
      }

      return res.json({
        success: true,
        data: {
          track: 'NON_TECHNICAL',
          careerArea,
          targetRole,
          passportTitle,
          candidate: {
            name: `${user.firstName} ${user.lastName}`.trim(),
            careerArea,
            targetRole,
            location: profileDoc?.location || user.location || ''
          },
          careerProfile,
          claimedSkills: claimedSkillsList,
          verifiedSkills: verifiedSkillsList.map(v => v.name),
          verifiedSkillsDetails: verifiedSkillsList,
          otherDetectedSkills,
          resume: latestResume ? {
            score10: latestResume.score10,
            atsScore: latestResume.atsScore,
            roleRelevanceScore: latestResume.roleRelevanceScore,
            fileName: latestResume.fileName,
            uploadDate: latestResume.createdAt,
            analysisStatus: latestResume.analysisStatus || 'COMPLETED'
          } : null,
          proofOfWork,
          aiInterview: {
            score: interviewScore,
            totalSessions: interviews.length,
            status: interviews[0]?.status || (completedInterviews.length > 0 ? 'COMPLETED' : 'NOT_STARTED'),
            domain: interviews[0]?.focus || `${careerArea} Strategy`
          },
          expertReview: reviews.map((r: any) => ({
            id: r._id,
            reviewer: r.reviewer ? `${r.reviewer.firstName} ${r.reviewer.lastName || ''}`.trim() : 'Expert Reviewer',
            rating: r.overallRating,
            comments: r.comments,
            status: r.overallRating >= 4 ? 'VERIFIED' : 'REVIEWED'
          })),
          verificationStatus,
          capabilities: [
            ...verifiedSkillsList.map(v => ({
              name: v.name,
              type: 'VERIFIED_SKILL',
              confidence: v.confidence,
              evidence: v.evidence,
              projects: proofOfWork.map(p => p.title),
              verificationStatus: 'SUPPORTED' as const,
              evidenceCount: proofOfWork.length
            })),
            ...claimedSkillsList.map(c => ({
              name: c.name,
              type: 'CLAIMED_SKILL',
              confidence: 65,
              evidence: c.evidence,
              projects: [],
              verificationStatus: 'PARTIALLY_SUPPORTED' as const,
              evidenceCount: 0
            }))
          ],
          compositeSignal: interviewScore || (latestResume?.score10 ? latestResume.score10 * 10 : null),
          projectCount: proofOfWork.length
        }
      });
    }

    // Aggregate capabilities from real evidence across both projects and technical practice
    const [evidences, practiceEvidences, practiceSubmissions] = await Promise.all([
      ProjectEvidence.find({
        user: user._id,
        analysisStatus: 'COMPLETED'
      }).populate('project', 'projectName githubUrl'),
      TechnicalPracticeEvidence.find({
        candidate: user._id
      }).populate('challenge', 'title difficulty category'),
      CodingSubmission.find({ candidate: user._id })
    ]);

    if (evidences.length === 0 && practiceEvidences.length === 0) {
      return res.json({
        success: true,
        data: {
          capabilities: [],
          compositeSignal: null,
          projectCount: 0,
          technicalPractice: {
            totalAttempted: 0,
            completedChallenges: 0,
            overallPassRate: 0,
            evidences: []
          }
        },
        message: 'No verified evidence yet. Complete technical challenges or upload a project to build your verified capability profile.'
      });
    }

    // Aggregate evidence items across projects
    const skillMap = new Map<string, {
      name: string;
      type: string;
      totalConfidence: number;
      count: number;
      projects: string[];
      lastSeen: Date;
    }>();

    evidences.forEach(e => {
      const projectName = (e.project as any)?.projectName || 'Unknown';
      e.evidenceItems.forEach((item: any) => {
        const key = `${item.type}:${item.name.toLowerCase()}`;
        const existing = skillMap.get(key);
        if (existing) {
          existing.totalConfidence += item.confidence;
          existing.count += 1;
          if (!existing.projects.includes(projectName)) existing.projects.push(projectName);
          if (e.analyzedAt > existing.lastSeen) existing.lastSeen = e.analyzedAt;
        } else {
          skillMap.set(key, {
            name: item.name,
            type: item.type,
            totalConfidence: item.confidence,
            count: 1,
            projects: [projectName],
            lastSeen: e.analyzedAt
          });
        }
      });
    });

    // Merge Technical Practice Evidence into Skill Map
    practiceEvidences.forEach(pe => {
      const challengeTitle = `Technical Practice: ${pe.challengeTitle}`;
      
      // 1. Language Capability (proportional: 70% base + 15% passRate)
      const langKey = `LANGUAGE:${pe.language.toLowerCase()}`;
      const langConfidence = 0.70 + (0.15 * pe.passRate);
      const existingLang = skillMap.get(langKey);
      if (existingLang) {
        existingLang.totalConfidence += langConfidence;
        existingLang.count += 1;
        if (!existingLang.projects.includes(challengeTitle)) existingLang.projects.push(challengeTitle);
        if (pe.createdAt > existingLang.lastSeen) existingLang.lastSeen = pe.createdAt;
      } else {
        skillMap.set(langKey, {
          name: pe.language,
          type: 'LANGUAGE',
          totalConfidence: langConfidence,
          count: 1,
          projects: [challengeTitle],
          lastSeen: pe.createdAt
        });
      }

      // 2. Algorithmic / Problem Solving Capability
      const dsaKey = `PATTERN:data structures & algorithms`;
      const dsaConfidence = pe.difficulty === 'HARD' ? 0.88 : pe.difficulty === 'MEDIUM' ? 0.80 : 0.75;
      const existingDsa = skillMap.get(dsaKey);
      if (existingDsa) {
        existingDsa.totalConfidence += dsaConfidence;
        existingDsa.count += 1;
        if (!existingDsa.projects.includes(challengeTitle)) existingDsa.projects.push(challengeTitle);
        if (pe.createdAt > existingDsa.lastSeen) existingDsa.lastSeen = pe.createdAt;
      } else {
        skillMap.set(dsaKey, {
          name: 'Data Structures & Algorithms',
          type: 'PATTERN',
          totalConfidence: dsaConfidence,
          count: 1,
          projects: [challengeTitle],
          lastSeen: pe.createdAt
        });
      }
    });

    const capabilities = Array.from(skillMap.values())
      .map(s => {
        const avgConfidence = Math.min(0.95, s.totalConfidence / s.count);
        const verificationStatus =
          avgConfidence >= 0.8 ? 'SUPPORTED' :
          avgConfidence >= 0.5 ? 'PARTIALLY_SUPPORTED' :
          'INSUFFICIENT_EVIDENCE';

        return {
          name: s.name,
          type: s.type,
          confidence: Math.round(avgConfidence * 100),
          projectCount: s.projects.length,
          projects: s.projects,
          lastDemonstrated: s.lastSeen,
          verificationStatus,
          evidenceCount: s.count
        };
      })
      .filter(c => c.confidence >= 50)
      .sort((a, b) => b.confidence - a.confidence);

    // Calculate composite signal
    const topSkills = capabilities.slice(0, 10);
    const compositeSignal = topSkills.length > 0
      ? Math.round(topSkills.reduce((sum, s) => sum + s.confidence, 0) / topSkills.length * 10) / 10
      : null;

    // Technical practice summary
    const distinctAttempted = new Set(practiceSubmissions.map(s => s.challenge.toString())).size;
    const completedChallenges = practiceEvidences.filter(e => e.status === 'PASSED').length;
    const overallPassRate = practiceEvidences.length > 0
      ? Math.round((practiceEvidences.reduce((acc, curr) => acc + curr.passRate, 0) / practiceEvidences.length) * 100)
      : 0;

    res.json({
      success: true,
      data: {
        capabilities,
        compositeSignal,
        projectCount: evidences.length + (completedChallenges > 0 ? 1 : 0),
        technicalPractice: {
          totalAttempted: distinctAttempted,
          completedChallenges,
          overallPassRate,
          evidences: practiceEvidences.map(pe => ({
            id: pe._id,
            challengeTitle: pe.challengeTitle,
            difficulty: pe.difficulty,
            category: pe.category,
            language: pe.language,
            testsPassed: pe.testsPassed,
            testsTotal: pe.testsTotal,
            passRate: Math.round(pe.passRate * 100),
            status: pe.status,
            verificationStatus: pe.verificationStatus,
            skillsDemonstrated: pe.skillsDemonstrated,
            createdAt: pe.createdAt
          }))
        }
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── REVIEWS ──────────────────────────────────────────────────────────────────

export const getReviews = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const reviews = await Review.find({ candidate: user._id })
      .populate('project', 'projectName')
      .populate('reviewer', 'firstName lastName')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: reviews });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const submitReview = async (req: Request, res: Response) => {
  try {
    const reviewer = (req as any).user;
    const { projectId, overallRating, comments, evidenceConsistency, practicalViability } = req.body;

    // Get the project to determine the candidate
    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    // Prevent self-review
    if (project.user.toString() === reviewer._id.toString()) {
      return res.status(403).json({ success: false, message: 'You cannot review your own project' });
    }

    // Prevent duplicate review
    const existing = await Review.findOne({ project: projectId, reviewer: reviewer._id });
    if (existing) {
      return res.status(409).json({ success: false, message: 'You have already reviewed this project' });
    }

    const review = await Review.create({
      project: projectId,
      candidate: project.user,
      reviewer: reviewer._id,
      overallRating,
      comments,
      evidenceConsistency,
      practicalViability
    });

    res.status(201).json({ success: true, data: review });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── PROFILE UPDATE ───────────────────────────────────────────────────────────

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const {
      firstName,
      lastName,
      headline,
      bio,
      location,
      phone,
      github,
      linkedin,
      portfolio,
      links,
      careerArea,
      currentStatus,
      targetRole,
      preferredRoles,
      preferredDomains,
      experienceLevel,
      availability,
      claimedSkills,
      education,
      experience
    } = req.body;

    // 1. Update User if name or track context fields provided
    const userUpdates: any = {};
    if (firstName !== undefined) userUpdates.firstName = firstName.trim();
    if (lastName !== undefined) userUpdates.lastName = lastName.trim();
    if (careerArea !== undefined) userUpdates.careerArea = careerArea;
    if (targetRole !== undefined) userUpdates.targetRole = targetRole;
    if (Object.keys(userUpdates).length > 0) {
      await User.findByIdAndUpdate(user._id, userUpdates, { runValidators: true });
    }

    // 2. Prepare CandidateProfile updates
    const profileUpdates: any = {};
    if (headline !== undefined) profileUpdates.headline = headline;
    if (bio !== undefined) profileUpdates.bio = bio;
    if (location !== undefined) profileUpdates.location = location;
    if (phone !== undefined) profileUpdates.phone = phone;
    if (careerArea !== undefined) profileUpdates.careerArea = careerArea;
    if (currentStatus !== undefined) profileUpdates.currentStatus = currentStatus;
    if (targetRole !== undefined) profileUpdates.targetRole = targetRole;
    if (experienceLevel !== undefined) profileUpdates.experienceLevel = experienceLevel;
    if (availability !== undefined) profileUpdates.availability = availability;
    
    // Arrays
    if (Array.isArray(preferredRoles)) profileUpdates.preferredRoles = preferredRoles;
    if (Array.isArray(preferredDomains)) profileUpdates.preferredDomains = preferredDomains;
    if (Array.isArray(claimedSkills)) profileUpdates.claimedSkills = claimedSkills;
    if (Array.isArray(education)) profileUpdates.education = education;
    if (Array.isArray(experience)) profileUpdates.experience = experience;

    // Links: handle either links object or individual fields
    const updatedLinks: any = {};
    if (links) {
      if (links.github !== undefined) updatedLinks.github = links.github;
      if (links.linkedin !== undefined) updatedLinks.linkedin = links.linkedin;
      if (links.portfolio !== undefined) updatedLinks.portfolio = links.portfolio;
    }
    if (github !== undefined) updatedLinks.github = github;
    if (linkedin !== undefined) updatedLinks.linkedin = linkedin;
    if (portfolio !== undefined) updatedLinks.portfolio = portfolio;

    if (Object.keys(updatedLinks).length > 0) {
      profileUpdates.links = updatedLinks;
    }

    const updatedProfile = await CandidateProfile.findOneAndUpdate(
      { user: user._id },
      { $set: profileUpdates },
      { new: true, upsert: true }
    );

    const updatedUser = await User.findById(user._id).select('-password');

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: updatedUser,
        profile: updatedProfile
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── PROFILE PHOTO UPLOAD ─────────────────────────────────────────────────────

export const uploadProfilePhoto = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No photo uploaded. Please select an image file (PNG, JPG, JPEG, WEBP).' 
      });
    }

    const photoUrl = `/uploads/photos/${req.file.filename}`;
    const profile = await CandidateProfile.findOneAndUpdate(
      { user: user._id },
      { $set: { profilePhoto: photoUrl } },
      { upsert: true, new: true }
    );

    res.json({
      success: true,
      message: 'Profile photo uploaded successfully',
      data: {
        profilePhoto: photoUrl,
        profile
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── CANDIDATE OWN PROFILE ────────────────────────────────────────────────────

export const getCandidateOwnProfile = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const isNonTech = user.track === 'NON_TECHNICAL';

    const [
      userData, 
      profileDoc,
      projects, 
      projectAnalyses,
      reviews,
      resumes,
      codingSubmissions,
      interviews,
      challengeSubmissions
    ] = await Promise.all([
      User.findById(user._id).select('-password'),
      CandidateProfile.findOne({ user: user._id }),
      Project.find({ user: user._id }).sort({ createdAt: -1 }),
      ProjectAnalysis.find({ $or: [{ candidateId: user._id }, { user: user._id } as any] }),
      Review.find({ candidate: user._id }).populate('reviewer', 'firstName lastName role').populate('project', 'projectName').sort({ createdAt: -1 }),
      Resume.find({ user: user._id }).sort({ isPrimary: -1, createdAt: -1 }),
      CodingSubmission.find({ candidate: user._id }).populate('challenge', 'title difficulty category slug').sort({ createdAt: -1 }),
      InterviewSession.find({ candidate: user._id }).sort({ createdAt: -1 }),
      ChallengeSubmission.find({ candidate: user._id }).populate('challenge', 'title category domain difficulty type description track deadline company skills').sort({ createdAt: -1 })
    ]);

    // 1. Identity & Career
    // RULE: identity comes from CandidateProfile only. user.targetRole is NOT used — it may contain
    // a stale/incorrect value from a previous session.
    const resolvedCareerArea = (profileDoc?.careerArea || '').trim();
    // For Non-Tech: if no careerArea is selected, show empty strings — NEVER infer or guess.
    // For Technical: fall back to 'Software Engineer' is reasonable (that IS the track).
    const resolvedTargetRole = (profileDoc?.targetRole || '').trim() || (isNonTech ? '' : 'Software Engineer');

    const identity = {
      fullName: userData ? `${userData.firstName} ${userData.lastName}`.trim() : 'Candidate',
      firstName: userData?.firstName || '',
      lastName: userData?.lastName || '',
      email: userData?.email || '',
      profilePhoto: profileDoc?.profilePhoto || '',
      headline: profileDoc?.headline || '',
      location: profileDoc?.location || '',
      phone: profileDoc?.phone || '',
      bio: profileDoc?.bio || '',
      links: {
        github: profileDoc?.links?.github || '',
        linkedin: profileDoc?.links?.linkedin || '',
        portfolio: profileDoc?.links?.portfolio || ''
      }
    };

    const career = {
      careerArea: resolvedCareerArea,
      currentStatus: profileDoc?.currentStatus || 'Actively Looking',
      targetRole: resolvedTargetRole,
      preferredRoles: profileDoc?.preferredRoles || [],
      preferredDomains: profileDoc?.preferredDomains || [],
      experienceLevel: profileDoc?.experienceLevel || 'Not specified',
      availability: profileDoc?.availability || 'Immediately'
    };

    const education = profileDoc?.education || [];
    const experience = profileDoc?.experience || [];

    // 2. Skills: Separate Claimed vs Verified
    const claimedSkillsList: string[] = profileDoc?.claimedSkills || [];

    let verifiedSkills: Array<{ name: string; confidence: number; evidence: string; type: string; verificationStatus: string }> = [];
    let otherDetectedSkills: string[] = [];
    let validProofSubmissions: any[] = [];

    // Only RESUME documents — not Proof of Work PDFs uploaded through /proof-of-work
    const resumeOnlyDocs = resumes.filter((r: any) => !r.documentType || r.documentType === 'RESUME');
    const primaryResume = resumeOnlyDocs.find(r => r.isPrimary) || resumeOnlyDocs[0] || null;

    if (isNonTech) {
      // Non-tech: verify skills ONLY from actual proof of work, reviews, and completed interviews
      const nonTechVerifiedMap = new Map<string, { confidence: number; evidence: string; type: string }>();

      validProofSubmissions = challengeSubmissions.filter(cs =>
        (cs.track === 'NON_TECHNICAL' || (cs.challenge as any)?.track === 'NON_TECHNICAL') &&
        (cs.status as string) !== 'NEEDS_RESUBMISSION' &&
        (cs.status as string) !== 'INVALID_SUBMISSION' &&
        (cs.status === 'VERIFIED' || cs.status === 'COMPLETED') &&
        (cs as any).nonTechAnalysis &&
        ((cs as any).nonTechAnalysis?.overallScore || 0) > 0
      );

      validProofSubmissions.forEach(cs => {
        const chSkills = (cs as any).nonTechAnalysis?.verifiedSkills || [];
        const score = (cs as any).nonTechAnalysis?.overallScore ? Math.round((cs as any).nonTechAnalysis.overallScore * 10) : 85;
        chSkills.forEach((sk: string) => {
          const key = sk.trim();
          if (key && !nonTechVerifiedMap.has(key.toLowerCase())) {
            nonTechVerifiedMap.set(key.toLowerCase(), {
              confidence: score,
              evidence: `Demonstrated in deliverable: ${(cs.challenge as any)?.title || cs.workTitle || 'Proof of Work'}`,
              type: 'PROOF_OF_WORK'
            });
          }
        });
      });

      interviews.forEach(ci => {
        if (ci.status === 'COMPLETED' && ci.focus) {
          const key = ci.focus.trim();
          if (key && !nonTechVerifiedMap.has(key.toLowerCase())) {
            nonTechVerifiedMap.set(key.toLowerCase(), {
              confidence: Math.round(((ci.finalReport?.overallScore || 8) as number) * 10),
              evidence: `Evaluated in AI domain interview (${ci.focus})`,
              type: 'INTERVIEW'
            });
          }
        }
      });

      reviews.forEach(r => {
        if ((r.overallRating || 0) >= 4) {
          if (!nonTechVerifiedMap.has('communication')) {
            nonTechVerifiedMap.set('communication', {
              confidence: 90,
              evidence: 'Demonstrated in expert/peer review feedback',
              type: 'REVIEW'
            });
          }
        }
      });

      verifiedSkills = Array.from(nonTechVerifiedMap.entries()).map(([k, v]) => ({
        name: k.charAt(0).toUpperCase() + k.slice(1),
        confidence: v.confidence,
        evidence: v.evidence,
        type: v.type,
        verificationStatus: 'VERIFIED'
      }));

      // Other skills detected from resume (e.g. Java, Python, C++, React) that do NOT define the candidate's career identity
      const resumeExtracted = (primaryResume as any)?.detectedSkills || primaryResume?.skills || [];
      const lowerClaimed = new Set(claimedSkillsList.map(s => s.toLowerCase()));
      const lowerVerified = new Set(Array.from(nonTechVerifiedMap.keys()));

      otherDetectedSkills = resumeExtracted.filter((s: string) => {
        const lower = s.toLowerCase();
        return !lowerClaimed.has(lower) && !lowerVerified.has(lower);
      });
    } else {
      // Technical candidate: derive verified skills from project analysis and passed coding submissions
      const verifiedSkillsMap = new Map<string, { confidence: number; evidence: string; type: string }>();
      
      projectAnalyses.forEach(pa => {
        (pa.detectedTechnologies || []).forEach(tech => {
          const key = tech.toLowerCase();
          if (!verifiedSkillsMap.has(key)) {
            verifiedSkillsMap.set(key, {
              confidence: 90,
              evidence: `Detected in project repository analysis`,
              type: 'PROJECT'
            });
          }
        });
        (pa.evidenceItems || []).forEach(ei => {
          if (ei.name) {
            const key = ei.name.toLowerCase();
            const existing = verifiedSkillsMap.get(key);
            const conf = Math.round((ei.confidence ?? 0.8) * 100);
            if (!existing || conf > existing.confidence) {
              verifiedSkillsMap.set(key, {
                confidence: conf,
                evidence: ei.snippet ? `${ei.type}: ${ei.snippet.slice(0, 80)}` : `Extracted artifact in project`,
                type: ei.type || 'EVIDENCE'
              });
            }
          }
        });
      });

      codingSubmissions.forEach(cs => {
        if (cs.status === 'PASSED' && cs.language) {
          const langKey = cs.language.toLowerCase();
          if (!verifiedSkillsMap.has(langKey)) {
            verifiedSkillsMap.set(langKey, {
              confidence: 95,
              evidence: `Passed automated test suite in technical practice`,
              type: 'LANGUAGE'
            });
          }
        }
      });

      verifiedSkills = Array.from(verifiedSkillsMap.entries()).map(([k, v]) => ({
        name: k.charAt(0).toUpperCase() + k.slice(1),
        confidence: v.confidence,
        evidence: v.evidence,
        type: v.type,
        verificationStatus: 'VERIFIED'
      }));
    }

    // 3. Projects / Proof of Work
    let projectsWithDetails: any[] = [];
    if (isNonTech) {
      // For Non-Tech: Proof of work deliverables from challengeSubmissions
      projectsWithDetails = challengeSubmissions.map(s => {
        const ch = s.challenge as any;
        const isNeedsResubmission = s.status === 'NEEDS_RESUBMISSION' || s.status === 'INVALID_SUBMISSION';
        return {
          _id: s._id,
          name: (s as any).workTitle || ch?.title || 'Proof of Work Deliverable',
          description: (s as any).workDescription || (s as any).notes || ch?.description || '',
          category: ch?.careerArea || ch?.category || ch?.domain || (resolvedCareerArea || 'Non-Technical'),
          techStack: [],
          detectedTech: [],
          githubUrl: '',
          demoUrl: (s as any).workUrl || (s as any).documentUrl || '',
          documentUrl: (s as any).documentUrl || (s as any).workUrl || '',
          status: s.status,
          statusReason: s.statusReason || (isNeedsResubmission ? 'Technical GitHub repository submitted where a Non-Technical work artifact is required.' : ''),
          verificationStatus: (s.status === 'VERIFIED' || s.status === 'COMPLETED') ? 'VERIFIED' : (isNeedsResubmission ? 'NEEDS_RESUBMISSION' : 'PENDING'),
          analysisStatus: isNeedsResubmission ? 'NEEDS_RESUBMISSION' : ((s as any).nonTechAnalysis ? 'COMPLETED' : 'PENDING'),
          overallScore: isNeedsResubmission ? null : ((s as any).nonTechAnalysis?.overallScore ? Math.round((s as any).nonTechAnalysis.overallScore * 10) : null),
          scoreBreakdown: isNeedsResubmission ? null : ((s as any).nonTechAnalysis || null),
          evidenceCount: ch?.skills?.length || 1,
          createdAt: s.createdAt
        };
      });
    } else {
      projectsWithDetails = projects.map(p => {
        const pa = projectAnalyses.find(a => a.projectId?.toString() === p._id.toString() || (a as any).project?.toString() === p._id.toString());
        return {
          _id: p._id,
          name: p.projectName,
          description: p.description,
          techStack: p.claimedTechnologies || [],
          detectedTech: pa?.detectedTechnologies || (p as any).detectedLanguages || [],
          githubUrl: p.githubUrl,
          demoUrl: (p as any).liveUrl || '',
          verificationStatus: p.status,
          analysisStatus: pa ? pa.verification.status : (p.status === 'COMPLETED' ? 'COMPLETED' : 'INSUFFICIENT_EVIDENCE'),
          overallScore: pa?.scores?.overallScore ?? null,
          scoreBreakdown: pa?.scores ?? null,
          evidenceCount: pa?.evidenceItems?.length || 0,
          createdAt: p.createdAt
        };
      });
    }

    // 4. Resume
    const resumeData = primaryResume ? {
      _id: primaryResume._id,
      fileName: primaryResume.fileName,
      uploadDate: primaryResume.createdAt,
      analysisStatus: 'COMPLETED',
      atsScore: primaryResume.score10,
      scoreBreakdown: primaryResume.scoreBreakdown,
      analysisDate: (primaryResume as any).analyzedAt || primaryResume.updatedAt || primaryResume.createdAt,
      aiAssistanceSignal: primaryResume.aiAssistanceSignals?.category || 'INSUFFICIENT EVIDENCE',
      aiAssistanceSignals: primaryResume.aiAssistanceSignals,
      analysisUrl: '/candidate/resume-ai'
    } : null;

    // 5. Technical Practice (NULL for Non-Tech candidates)
    const solvedSet = new Set<string>();
    let easySolved = 0;
    let medSolved = 0;
    let hardSolved = 0;
    const practiceLanguages = new Set<string>();
    const practiceTopics = new Set<string>();
    let passedCount = 0;

    if (!isNonTech) {
      codingSubmissions.forEach(sub => {
        if (sub.language) practiceLanguages.add(sub.language);
        const ch = sub.challenge as any;
        if (ch?.category) practiceTopics.add(ch.category);

        if (sub.status === 'PASSED') {
          passedCount++;
          const cId = ch?._id ? ch._id.toString() : sub.challenge.toString();
          if (!solvedSet.has(cId)) {
            solvedSet.add(cId);
            if (ch?.difficulty === 'EASY') easySolved++;
            else if (ch?.difficulty === 'MEDIUM') medSolved++;
            else if (ch?.difficulty === 'HARD') hardSolved++;
          }
        }
      });
    }

    const technicalPractice = isNonTech ? null : {
      hasSubmissions: codingSubmissions.length > 0,
      problemsSolved: solvedSet.size,
      breakdown: {
        easy: easySolved,
        medium: medSolved,
        hard: hardSolved
      },
      languagesUsed: Array.from(practiceLanguages),
      topics: Array.from(practiceTopics),
      accuracy: codingSubmissions.length > 0 ? Math.round((passedCount / codingSubmissions.length) * 100) : 0,
      recentSubmissions: codingSubmissions.slice(0, 5).map(s => ({
        _id: s._id,
        challengeTitle: (s.challenge as any)?.title || 'Technical Problem',
        difficulty: (s.challenge as any)?.difficulty || 'MEDIUM',
        language: s.language,
        status: s.status,
        passedTests: s.passedTests,
        totalTests: s.totalTests,
        executionTimeMs: s.executionTimeMs,
        submittedAt: s.submittedAt || s.createdAt
      }))
    };

    // 6. AI Interview
    const completedInterviews = interviews.filter(i => i.status === 'COMPLETED');
    const interviewScores = completedInterviews
      .map(i => i.finalReport?.overallScore)
      .filter((s): s is number => typeof s === 'number' && s > 0);
    const avgInterviewScore = interviewScores.length > 0 
      ? Math.round(interviewScores.reduce((a, b) => a + b, 0) / interviewScores.length)
      : null;
    const interviewDomains = Array.from(new Set(interviews.map(i => i.focus || (i as any).domain).filter(Boolean)));
    const interviewLanguages = isNonTech ? [] : Array.from(new Set(interviews.map(i => (i as any).primaryLanguage || 'C++').filter(Boolean)));

    const aiInterview = {
      hasInterviews: interviews.length > 0,
      interviewsCompleted: completedInterviews.length,
      totalSessions: interviews.length,
      averageScore: avgInterviewScore,
      domains: interviewDomains.length > 0 ? interviewDomains : (isNonTech ? [resolvedCareerArea || 'Domain Strategy'] : ['Systems']),
      languages: interviewLanguages,
      recentInterview: interviews[0] ? {
        _id: interviews[0]._id,
        focus: interviews[0].focus || (interviews[0] as any).domain,
        language: isNonTech ? (resolvedCareerArea || 'Domain Strategy') : ((interviews[0] as any).primaryLanguage || 'C++'),
        status: interviews[0].status,
        score: interviews[0].finalReport?.overallScore || null,
        startedAt: interviews[0].startedAt,
        completedAt: interviews[0].completedAt
      } : null,
      latestStatus: interviews[0]?.status || 'NOT_STARTED'
    };

    // 7. Reviews
    const reviewsList = reviews.map((r: any) => ({
      _id: r._id,
      reviewerName: r.reviewer ? `${r.reviewer.firstName} ${r.reviewer.lastName || ''}`.trim() : 'Expert Reviewer',
      reviewerRole: r.reviewer?.role || 'PEER',
      projectName: r.project?.projectName || (isNonTech ? 'Deliverable Review' : 'Project Repository'),
      overallRating: r.overallRating || 0,
      comments: r.comments || '',
      verificationStatus: r.overallRating >= 4 ? 'VERIFIED' : 'REVIEWED',
      createdAt: r.createdAt
    }));

    // 8. Capability Summary
    const capabilitySummary = {
      verifiedSkillsCount: verifiedSkills.length,
      claimedSkillsCount: claimedSkillsList.length,
      verifiedProjectsCount: isNonTech ? validProofSubmissions.length : projects.filter(p => p.status === 'COMPLETED').length,
      totalProjectsCount: isNonTech ? challengeSubmissions.length : projects.length,
      practiceSolvedCount: isNonTech ? 0 : solvedSet.size,
      interviewsCompletedCount: completedInterviews.length,
      reviewsCount: reviews.length
    };

    res.json({
      success: true,
      data: {
        identity,
        career,
        education,
        experience,
        skills: {
          claimed: claimedSkillsList,
          verified: verifiedSkills,
          otherDetectedSkills
        },
        projects: projectsWithDetails,
        proofOfWork: isNonTech ? projectsWithDetails : [],
        resume: resumeData,
        technicalPractice,
        aiInterview,
        reviews: reviewsList,
        capabilitySummary,
        // Legacy top-level keys for backwards compatibility
        user: userData,
        profile: profileDoc
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getProofOfWork = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (user.track !== 'NON_TECHNICAL') {
      return res.status(403).json({ success: false, message: 'Proof of work portfolio is dedicated to Non-Technical track candidates.' });
    }

    const [dedicatedProofs, submissions] = await Promise.all([
      NonTechProofOfWork.find({ candidate: user._id }).populate('challenge', 'title category domain difficulty type description track deadline company').sort({ createdAt: -1 }),
      ChallengeSubmission.find({ candidate: user._id, track: 'NON_TECHNICAL' }).populate('challenge', 'title category domain difficulty type description track deadline company').sort({ createdAt: -1 })
    ]);

    const seenChallenges = new Set<string>();
    const seenTitles = new Set<string>();
    const proofList: any[] = [];

    // Helper to format item
    const formatItem = (item: any, isDedicated: boolean) => {
      const ch = item.challenge as any;
      const chId = ch?._id?.toString() || item.challengeId || '';
      const workTitle = item.title || item.workTitle || ch?.title || 'Proof of Work Deliverable';
      const key = chId || workTitle.toLowerCase();

      if (seenChallenges.has(key)) return null;
      seenChallenges.add(key);

      const isNeedsResubmission = item.status === 'NEEDS_RESUBMISSION' || item.status === 'INVALID_SUBMISSION';
      const isInsufficient = item.status === 'INSUFFICIENT_EVIDENCE';
      const effectiveReason = item.statusReason || (isNeedsResubmission ? 'Technical GitHub repository submitted where a Non-Technical work artifact is required.' : '');

      return {
        _id: item._id,
        workTitle,
        relatedChallenge: ch?.title || 'Independent Case Study',
        challengeId: chId,
        category: item.careerArea || ch?.careerArea || ch?.domain || ch?.category || user.careerArea || 'Marketing & Business',
        careerArea: item.careerArea || user.careerArea || 'Business Development',
        submissionType: item.submissionType || 'CASE_STUDY',
        submittedDate: item.submittedAt || item.createdAt,
        status: item.status,
        statusReason: effectiveReason,
        aiAnalysisStatus: isNeedsResubmission 
          ? 'Needs Resubmission' 
          : isInsufficient 
          ? 'Insufficient Evidence' 
          : (item.nonTechAnalysis ? 'Complete' : 'Pending'),
        verificationStatus: (item.status === 'VERIFIED' || item.status === 'COMPLETED') 
          ? 'Verified' 
          : isNeedsResubmission 
          ? 'Needs Resubmission' 
          : 'Pending',
        workUrl: item.externalWorkUrl || item.workUrl || item.documentUrl || '',
        documentUrl: item.documentUrl || item.externalWorkUrl || item.workUrl || '',
        externalWorkUrl: item.externalWorkUrl || item.workUrl || '',
        externalWorkType: item.externalWorkType || '',
        artifactFiles: item.artifactFiles || [],
        workDescription: item.description || item.workDescription || item.notes || '',
        deliverables: item.deliverables || '',
        nonTechAnalysis: isNeedsResubmission ? null : (item.nonTechAnalysis || null),
        overallScore: isNeedsResubmission ? null : (item.nonTechAnalysis?.overallScore || null)
      };
    };

    // First process dedicated proofs
    dedicatedProofs.forEach(dp => {
      const formatted = formatItem(dp, true);
      if (formatted) proofList.push(formatted);
    });

    // Then merge challenge submissions
    submissions.forEach(sub => {
      const formatted = formatItem(sub, false);
      if (formatted) proofList.push(formatted);
    });

    res.json({ success: true, data: proofList });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const submitCandidateProofOfWork = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (user.track !== 'NON_TECHNICAL') {
      return res.status(403).json({ success: false, message: 'Only Non-Technical candidates can submit Non-Technical Proof of Work.' });
    }

    const { 
      workTitle, 
      title, 
      category, 
      careerArea: inputCareerArea, 
      workUrl, 
      documentUrl, 
      externalWorkUrl, 
      externalWorkType, 
      workDescription, 
      description, 
      deliverables, 
      notes, 
      submissionType, 
      challengeId 
    } = req.body;

    const finalTitle = (workTitle || title || '').trim();
    if (!finalTitle) {
      return res.status(400).json({ success: false, message: 'Work title is required.' });
    }

    const effectiveDesc = (workDescription || description || notes || '').trim();
    const effectiveDeliverables = (deliverables || '').trim();
    const effectiveUrl = (externalWorkUrl || workUrl || documentUrl || '').trim();
    const effectiveCareerArea = inputCareerArea || category || user.careerArea || 'Marketing';
    const effectiveExternalWorkType = externalWorkType || (effectiveUrl ? 'DOCUMENT' : '');

    // Disallow technical submission types for Non-Tech
    const technicalTypes = ['CODE_REPOSITORY', 'GITHUB_REPOSITORY', 'CODING_PROJECT', 'TECHNICAL_PROJECT', 'LIVE_DEMO'];
    if (submissionType && technicalTypes.includes(submissionType.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: `Technical submission type "${submissionType}" is not allowed for Non-Technical Proof of Work. Allowed deliverables: CASE_STUDY, BUSINESS_DOCUMENT, MARKETING_PLAN, SALES_PLAYBOOK, HR_CASE_STUDY, BUSINESS_ANALYSIS, UI_UX_CASE_STUDY, CONTENT_PORTFOLIO, PRESENTATION, STRATEGY_DOCUMENT, WORK_SAMPLE.`
      });
    }

    // Process uploaded artifact file if present
    const artifactFiles: any[] = [];
    let extractedArtifactText = '';

    if (req.file) {
      const originalName = req.file.originalname;
      const mimeType = req.file.mimetype;
      const filePath = req.file.path;
      const fileSize = req.file.size;
      const fileUrl = `/uploads/proof-of-work/${req.file.filename}`;

      extractedArtifactText = await extractTextFromArtifact(filePath, mimeType, originalName);

      artifactFiles.push({
        fileName: originalName,
        fileUrl,
        filePath,
        fileSize,
        mimeType,
        extractedText: extractedArtifactText ? extractedArtifactText.slice(0, 10000) : ''
      });
    }

    // Hard reject GitHub and technical git repositories for Non-Tech proof of work
    if (
      containsTechnicalRepo(effectiveUrl) || 
      containsTechnicalRepo(notes) || 
      containsTechnicalRepo(effectiveDesc) || 
      containsTechnicalRepo(effectiveDeliverables) ||
      containsTechnicalRepo(extractedArtifactText)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Technical repository links are not accepted for Non-Technical Proof of Work. Please upload a case study, document, presentation, work sample, portfolio, or other role-relevant deliverable.'
      });
    }

    // Find linked challenge if provided or available
    let challenge: any = null;
    if (challengeId) {
      challenge = await Challenge.findById(challengeId);
    }
    if (!challenge) {
      challenge = await Challenge.findOne({ 
        track: 'NON_TECHNICAL', 
        $or: [{ careerArea: effectiveCareerArea }, { status: { $in: ['OPEN', 'AVAILABLE', 'PUBLISHED'] } }] 
      });
    }

    const resolvedSubmissionType = submissionType || (challenge?.type || 'CASE_STUDY');

    // Run deterministic evidence-based AI Work Analysis
    const analysisResult = analyzeNonTechEvidence({
      careerArea: effectiveCareerArea,
      targetRole: user.targetRole,
      challengeTitle: challenge?.title || finalTitle,
      challengeRequirements: challenge?.requirements || [],
      submissionType: resolvedSubmissionType,
      title: finalTitle,
      description: effectiveDesc,
      deliverables: effectiveDeliverables,
      extractedArtifactText,
      hasArtifactFile: artifactFiles.length > 0,
      artifactFileName: artifactFiles[0]?.fileName,
      externalWorkUrl: effectiveUrl,
      externalWorkType: effectiveExternalWorkType
    });

    if (analysisResult.status === 'NEEDS_RESUBMISSION') {
      return res.status(400).json({
        success: false,
        message: analysisResult.statusReason || 'Technical repository links are not accepted for Non-Technical Proof of Work.'
      });
    }

    // Create or update dedicated NonTechProofOfWork record
    const proofDoc = await NonTechProofOfWork.create({
      candidate: user._id,
      candidateId: user._id.toString(),
      track: 'NON_TECHNICAL',
      careerArea: effectiveCareerArea,
      targetRole: user.targetRole || '',
      challenge: challenge?._id,
      challengeId: challenge?._id?.toString(),
      title: finalTitle,
      submissionType: resolvedSubmissionType,
      description: effectiveDesc,
      deliverables: effectiveDeliverables,
      notes: effectiveDesc,
      artifactFiles,
      externalWorkUrl: effectiveUrl,
      externalWorkType: effectiveExternalWorkType,
      status: analysisResult.status,
      statusReason: analysisResult.statusReason || '',
      nonTechAnalysis: analysisResult.analysis,
      submittedAt: new Date()
    });

    // Also synchronize ChallengeSubmission for compatibility with challenge tracking
    if (challenge) {
      let sub = await ChallengeSubmission.findOne({ challenge: challenge._id, candidate: user._id });
      if (!sub) {
        sub = await ChallengeSubmission.create({
          challenge: challenge._id,
          candidate: user._id,
          track: 'NON_TECHNICAL',
          careerArea: effectiveCareerArea,
          submissionType: resolvedSubmissionType,
          status: analysisResult.status,
          statusReason: analysisResult.statusReason || '',
          workTitle: finalTitle,
          workDescription: effectiveDesc,
          workUrl: effectiveUrl,
          documentUrl: effectiveUrl,
          externalWorkUrl: effectiveUrl,
          externalWorkType: effectiveExternalWorkType,
          artifactFiles,
          notes: effectiveDesc,
          nonTechAnalysis: analysisResult.analysis,
          score: analysisResult.overallScore ? Math.round(analysisResult.overallScore * 10) : undefined,
          acceptedAt: new Date(),
          startedAt: new Date(),
          submittedAt: new Date()
        });
      } else {
        sub.track = 'NON_TECHNICAL';
        sub.careerArea = effectiveCareerArea;
        sub.submissionType = resolvedSubmissionType;
        sub.status = analysisResult.status as any;
        sub.statusReason = analysisResult.statusReason || '';
        sub.workTitle = finalTitle;
        sub.workDescription = effectiveDesc;
        sub.workUrl = effectiveUrl;
        sub.documentUrl = effectiveUrl;
        sub.externalWorkUrl = effectiveUrl;
        sub.externalWorkType = effectiveExternalWorkType;
        sub.artifactFiles = artifactFiles as any;
        sub.notes = effectiveDesc;
        sub.nonTechAnalysis = analysisResult.analysis as any;
        if (analysisResult.overallScore) sub.score = Math.round(analysisResult.overallScore * 10);
        sub.submittedAt = new Date();
        await sub.save();
      }
    }

    // Automatically create unassigned ExpertReview for the expert queue
    const existingReview = await ExpertReview.findOne({
      $or: [
        { nonTechProofOfWork: proofDoc._id },
        { submissionId: proofDoc._id }
      ]
    });
    if (!existingReview) {
      await ExpertReview.create({
        candidate: user._id,
        candidateId: user._id,
        nonTechProofOfWork: proofDoc._id,
        challengeSubmission: proofDoc.challenge || undefined,
        submissionId: proofDoc._id,
        track: 'NON_TECHNICAL',
        submissionTitle: finalTitle,
        submissionDescription: effectiveDesc,
        status: 'UNASSIGNED',
        assignedAt: new Date()
      });
    } else if (existingReview.status === 'COMPLETED' && existingReview.verificationStatus === 'NEEDS_RESUBMISSION') {
      await ExpertReview.create({
        candidate: user._id,
        candidateId: user._id,
        nonTechProofOfWork: proofDoc._id,
        challengeSubmission: proofDoc.challenge || undefined,
        submissionId: proofDoc._id,
        track: 'NON_TECHNICAL',
        submissionTitle: `${finalTitle} (Resubmission)`,
        submissionDescription: effectiveDesc,
        status: 'UNASSIGNED',
        assignedAt: new Date()
      });
    }

    res.status(201).json({ success: true, data: proofDoc });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── CANDIDATE EXPERT REVIEWS ─────────────────────────────────────────────────

export const getCandidateExpertReviews = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const expertReviews = await ExpertReview.find({
      $or: [{ candidate: user._id }, { candidateId: user._id }]
    })
      .populate('expert', 'firstName lastName name role email')
      .populate('project', 'projectName description status')
      .populate('nonTechProofOfWork', 'title description status')
      .populate('challengeSubmission', 'workTitle track status')
      .select('-internalNotes -evidenceNotes')
      .sort({ completedAt: -1, createdAt: -1 });

    res.json({ success: true, data: expertReviews, expertReviews });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};


