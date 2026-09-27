import { Request, Response } from 'express';
import Job from '../models/Job';
import Shortlist from '../models/Shortlist';
import User from '../models/User';
import ProjectEvidence from '../models/ProjectEvidence';
import Application from '../models/Application';
import CandidateProfile from '../models/CandidateProfile';
import Resume from '../models/Resume';

// ─── JOBS (RECRUITER) ────────────────────────────────────────────────────────

export const createJob = async (req: Request, res: Response) => {
  try {
    const recruiter = (req as any).user;
    const job = await Job.create({ ...req.body, recruiter: recruiter._id });
    res.status(201).json({ success: true, data: job });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getJobs = async (req: Request, res: Response) => {
  try {
    const recruiter = (req as any).user;
    const jobs = await Job.find({ recruiter: recruiter._id }).sort({ createdAt: -1 });
    res.json({ success: true, data: jobs });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateJob = async (req: Request, res: Response) => {
  try {
    const recruiter = (req as any).user;
    const job = await Job.findOneAndUpdate(
      { _id: req.params.id, recruiter: recruiter._id },
      req.body,
      { new: true }
    );
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    res.json({ success: true, data: job });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteJob = async (req: Request, res: Response) => {
  try {
    const recruiter = (req as any).user;
    const job = await Job.findOneAndDelete({ _id: req.params.id, recruiter: recruiter._id });
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    res.json({ success: true, message: 'Job deleted' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── JOBS (CANDIDATE DISCOVERY) ──────────────────────────────────────────────

export const discoverJobs = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const isNonTechCandidate = user?.track === 'NON_TECHNICAL';
    const queryTrack = (req.query.track as string);

    const jobFilter: any = { status: 'ACTIVE' };
    if (isNonTechCandidate || queryTrack === 'NON_TECHNICAL') {
      jobFilter.track = 'NON_TECHNICAL';
    } else {
      jobFilter.track = { $ne: 'NON_TECHNICAL' };
    }

    const jobs = await Job.find(jobFilter)
      .populate('recruiter', 'firstName lastName email')
      .sort({ createdAt: -1 });

    // Fetch candidate's verified skills
    const profile = await CandidateProfile.findOne({ user: user._id });
    const candidateSkills = (profile?.verifiedSkills || []).map(s => s.toLowerCase());

    const enriched = jobs.map(job => {
      const required = job.requiredSkills || [];
      const matched = required.filter(reqSkill => 
        candidateSkills.some(cs => cs.includes(reqSkill.toLowerCase()) || reqSkill.toLowerCase().includes(cs))
      );
      const matchPercentage = required.length > 0
        ? Math.round((matched.length / required.length) * 100)
        : 100;

      return {
        ...job.toObject(),
        matchAnalysis: {
          matchedSkills: matched,
          missingSkills: required.filter(r => !matched.includes(r)),
          matchPercentage
        }
      };
    });

    res.json({ success: true, data: enriched });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── APPLICATIONS & HIRING PIPELINE ──────────────────────────────────────────

export const getCompanies = async (req: Request, res: Response) => {
  try {
    const activeJobs = await Job.find({ status: 'ACTIVE' }).sort({ createdAt: -1 });
    const companyMap = new Map<string, any>();

    activeJobs.forEach(job => {
      const cName = job.company || 'TechCorp';
      if (!companyMap.has(cName)) {
        companyMap.set(cName, {
          name: cName,
          logo: job.companyLogo || '',
          industry: job.industry || 'Software & Technology',
          location: job.location || 'Remote',
          size: job.companySize || '100-500 employees',
          hiringStatus: 'HIRING_NOW',
          openJobsCount: 0,
          activeJobsCount: 0,
          jobs: []
        });
      }
      const c = companyMap.get(cName);
      c.openJobsCount += 1;
      c.activeJobsCount += 1;
      c.jobs.push({
        _id: job._id,
        title: job.title,
        department: job.department,
        location: job.location,
        workMode: job.workMode,
        type: job.type,
        seniority: job.seniority,
        requiredSkills: job.requiredSkills,
        requirements: job.requirements,
        deadline: job.deadline,
        description: job.description
      });
    });

    res.json({ success: true, data: Array.from(companyMap.values()) });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const applyToJob = async (req: Request, res: Response) => {
  try {
    const candidate = (req as any).user;
    const { id: jobId } = req.params;
    const { coverNote = '', resumeId } = req.body;

    const job = await Job.findById(jobId);
    if (!job || job.status !== 'ACTIVE') {
      return res.status(404).json({ success: false, message: 'Active job opening not found' });
    }

    const existing = await Application.findOne({ job: jobId, candidate: candidate._id });
    if (existing) {
      return res.status(409).json({ success: false, message: 'You have already applied for this role' });
    }

    // Resolve resume: explicit resumeId > primary resume > latest resume
    let chosenResume = null;
    if (resumeId) {
      chosenResume = await Resume.findOne({ _id: resumeId, user: candidate._id });
    }
    if (!chosenResume) {
      chosenResume = await Resume.findOne({ user: candidate._id, isPrimary: true });
    }
    if (!chosenResume) {
      chosenResume = await Resume.findOne({ user: candidate._id }).sort({ createdAt: -1 });
    }

    // Match candidate skills
    const profile = await CandidateProfile.findOne({ user: candidate._id });
    const verified = profile?.verifiedSkills || [];
    const matchedSkills = (job.requiredSkills || []).filter(r => 
      verified.some(v => v.toLowerCase().includes(r.toLowerCase()))
    );

    const application = await Application.create({
      job: jobId,
      candidate: candidate._id,
      recruiter: job.recruiter,
      resume: chosenResume?._id,
      stage: 'APPLIED',
      status: 'SUBMITTED',
      coverNote,
      matchedSkills,
      stageHistory: [{
        stage: 'APPLIED',
        changedAt: new Date(),
        changedBy: candidate._id,
        note: 'Application submitted by candidate'
      }]
    });

    await Job.findByIdAndUpdate(jobId, { $inc: { applicantCount: 1 } });

    res.status(201).json({
      success: true,
      message: 'Application Submitted',
      data: application
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getCandidateApplications = async (req: Request, res: Response) => {
  try {
    const candidate = (req as any).user;
    const applications = await Application.find({ candidate: candidate._id })
      .populate('job', 'title company companyLogo department location workMode type seniority status')
      .populate('resume', 'fileName score10 scoreBreakdown createdAt')
      .populate('recruiter', 'firstName lastName email')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: applications });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getJobApplications = async (req: Request, res: Response) => {
  try {
    const recruiter = (req as any).user;
    const { jobId, stage } = req.query;

    const filter: any = { recruiter: recruiter._id };
    if (jobId) filter.job = jobId;
    if (stage) filter.stage = stage;

    const applications = await Application.find(filter)
      .populate('job', 'title department location type')
      .populate('candidate', 'firstName lastName email track')
      .sort({ createdAt: -1 });

    // Enrich applications with candidate's actual project evidence
    const enriched = await Promise.all(applications.map(async (app: any) => {
      const candidateId = app.candidate?._id;
      const [evidences, profile] = await Promise.all([
        candidateId ? ProjectEvidence.find({ user: candidateId, analysisStatus: 'COMPLETED' }) : [],
        candidateId ? CandidateProfile.findOne({ user: candidateId }) : null
      ]);

      const verifiedSkills = profile?.verifiedSkills || [];
      const overallScores = profile?.scores || {};

      return {
        ...app.toObject(),
        candidateEvidence: {
          verifiedSkills,
          scores: overallScores,
          projectCount: evidences.length,
          topEvidence: evidences.slice(0, 2).map(e => ({
            score: e.scores?.overallEvidenceScore,
            summary: e.aiAssessment?.summary
          }))
        }
      };
    }));

    res.json({ success: true, data: enriched });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateApplicationStage = async (req: Request, res: Response) => {
  try {
    const recruiter = (req as any).user;
    const { id } = req.params;
    const { stage, note = '' } = req.body;

    const validStages = ['APPLIED', 'SHORTLISTED', 'CONTACTED', 'INTERVIEW', 'OFFER', 'HIRED', 'REJECTED'];
    if (!validStages.includes(stage)) {
      return res.status(400).json({ success: false, message: `Invalid stage. Must be one of: ${validStages.join(', ')}` });
    }

    const application = await Application.findOne({ _id: id, recruiter: recruiter._id });
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    application.stage = stage;
    application.stageHistory.push({
      stage,
      changedAt: new Date(),
      changedBy: recruiter._id,
      note: note || `Candidate transitioned to ${stage}`
    });

    await application.save();

    res.json({
      success: true,
      message: `Candidate stage successfully updated to ${stage}`,
      data: application
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── SHORTLISTS ──────────────────────────────────────────────────────────────

export const addToShortlist = async (req: Request, res: Response) => {
  try {
    const recruiter = (req as any).user;
    const { candidateId, jobId, notes } = req.body;
    
    const candidate = await User.findById(candidateId);
    if (!candidate || candidate.role !== 'CANDIDATE') {
      return res.status(404).json({ success: false, message: 'Candidate not found' });
    }
    
    const shortlist = await Shortlist.findOneAndUpdate(
      { recruiter: recruiter._id, candidate: candidateId, job: jobId || null },
      { recruiter: recruiter._id, candidate: candidateId, job: jobId || null, notes },
      { upsert: true, new: true }
    );
    
    res.status(201).json({ success: true, data: shortlist });
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'Candidate already shortlisted' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getShortlist = async (req: Request, res: Response) => {
  try {
    const recruiter = (req as any).user;
    const shortlists = await Shortlist.find({ recruiter: recruiter._id })
      .populate('candidate', 'firstName lastName email track')
      .populate('job', 'title department')
      .sort({ addedAt: -1 });
    
    // Enrich with evidence
    const enriched = await Promise.all(shortlists.map(async (s: any) => {
      const candidateId = s.candidate?._id;
      const [evidence, profile] = await Promise.all([
        candidateId ? ProjectEvidence.find({ user: candidateId, analysisStatus: 'COMPLETED' }) : [],
        candidateId ? CandidateProfile.findOne({ user: candidateId }) : null
      ]);
      
      const skills = profile?.verifiedSkills || [];
      
      return {
        ...s.toObject(),
        skills: skills.slice(0, 8),
        projectCount: evidence.length,
        scores: profile?.scores || {}
      };
    }));
    
    res.json({ success: true, data: enriched });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const removeFromShortlist = async (req: Request, res: Response) => {
  try {
    const recruiter = (req as any).user;
    const result = await Shortlist.findOneAndDelete({ 
      _id: req.params.id, 
      recruiter: recruiter._id 
    });
    if (!result) return res.status(404).json({ success: false, message: 'Shortlist entry not found' });
    res.json({ success: true, message: 'Removed from shortlist' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── CANDIDATE DETAIL ────────────────────────────────────────────────────────

export const getCandidateProfile = async (req: Request, res: Response) => {
  try {
    const { candidateId } = req.params;
    
    const candidate = await User.findById(candidateId).select('-password');
    if (!candidate || candidate.role !== 'CANDIDATE') {
      return res.status(404).json({ success: false, message: 'Candidate not found' });
    }
    
    const [evidences, profile] = await Promise.all([
      ProjectEvidence.find({ 
        user: candidateId,
        analysisStatus: 'COMPLETED'
      }).populate('project', 'projectName description githubUrl status'),
      CandidateProfile.findOne({ user: candidateId })
    ]);
    
    const skillMap = new Map<string, { totalConfidence: number; count: number; type: string }>();
    evidences.forEach(e => {
      e.evidenceItems.forEach((item: any) => {
        const key = item.name.toLowerCase();
        const existing = skillMap.get(key);
        if (existing) {
          existing.totalConfidence += item.confidence;
          existing.count += 1;
        } else {
          skillMap.set(key, { totalConfidence: item.confidence, count: 1, type: item.type });
        }
      });
    });
    
    const aggregatedSkills = Array.from(skillMap.entries())
      .map(([name, data]) => ({
        name,
        confidence: Math.min(1, data.totalConfidence / data.count),
        type: data.type,
        projectCount: data.count,
        verificationStatus: data.totalConfidence / data.count > 0.7 ? 'SUPPORTED' : 'INSUFFICIENT_EVIDENCE'
      }))
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 20);
    
    res.json({
      success: true,
      data: {
        profile: {
          id: candidate._id,
          firstName: candidate.firstName,
          lastName: candidate.lastName,
          email: candidate.email,
          role: candidate.role,
          track: candidate.track,
          claimedSkills: profile?.claimedSkills || [],
          verifiedSkills: profile?.verifiedSkills || [],
          scores: profile?.scores || {}
        },
        skills: aggregatedSkills,
        projects: evidences.map(e => ({
          project: e.project,
          scores: e.scores,
          evidenceItems: e.evidenceItems,
          claimVerifications: e.claimVerifications,
          aiAssessment: e.aiAssessment,
          analysisStatus: e.analysisStatus,
          analyzedAt: e.analyzedAt
        })),
        projectCount: evidences.length
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
