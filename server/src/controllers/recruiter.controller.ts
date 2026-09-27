import { Request, Response } from 'express';
import User from '../models/User';
import Project from '../models/Project';
import ProjectEvidence from '../models/ProjectEvidence';
import Shortlist from '../models/Shortlist';
import TechnicalPracticeEvidence from '../models/TechnicalPracticeEvidence';

// ─── DISCOVER TALENT ──────────────────────────────────────────────────────────

export const discoverTalent = async (req: Request, res: Response) => {
  try {
    const { skills, minConfidence = 0, search } = req.query;

    // Find all candidates
    let candidateQuery: any = { role: 'CANDIDATE' };
    if (search) {
      candidateQuery.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } }
      ];
    }

    const candidates = await User.find(candidateQuery).select('-password');

    // For each candidate, get their real evidence
    const enriched = await Promise.all(candidates.map(async (c: any) => {
      const [evidences, practiceEvidences] = await Promise.all([
        ProjectEvidence.find({
          user: c._id,
          analysisStatus: 'COMPLETED'
        }),
        TechnicalPracticeEvidence.find({
          candidate: c._id
        })
      ]);

      // Aggregate skill signals
      const skillMap = new Map<string, { confidence: number; count: number }>();
      evidences.forEach(e => {
        e.evidenceItems.forEach((item: any) => {
          const key = item.name;
          const existing = skillMap.get(key);
          if (existing) {
            existing.confidence = Math.max(existing.confidence, item.confidence);
            existing.count += 1;
          } else {
            skillMap.set(key, { confidence: item.confidence, count: 1 });
          }
        });
      });

      // Incorporate Technical Practice verified skills (Java, Python, JS, DSA)
      practiceEvidences.forEach(pe => {
        // Language skill
        const langKey = pe.language;
        const langConf = 0.70 + (0.15 * pe.passRate);
        const existingLang = skillMap.get(langKey);
        if (existingLang) {
          existingLang.confidence = Math.max(existingLang.confidence, langConf);
          existingLang.count += 1;
        } else {
          skillMap.set(langKey, { confidence: langConf, count: 1 });
        }

        // DSA / Problem Solving skill
        const dsaKey = 'DSA';
        const dsaConf = pe.difficulty === 'HARD' ? 0.88 : pe.difficulty === 'MEDIUM' ? 0.80 : 0.75;
        const existingDsa = skillMap.get(dsaKey);
        if (existingDsa) {
          existingDsa.confidence = Math.max(existingDsa.confidence, dsaConf);
          existingDsa.count += 1;
        } else {
          skillMap.set(dsaKey, { confidence: dsaConf, count: 1 });
        }
      });

      const aggregatedSkills = Array.from(skillMap.entries())
        .map(([name, data]) => ({ name, confidence: Math.round(data.confidence * 100), count: data.count }))
        .sort((a, b) => b.confidence - a.confidence);

      // Filter by requested skills if specified
      if (skills) {
        const requestedSkills = (skills as string).toLowerCase().split(',').map(s => s.trim());
        const hasRequiredSkills = requestedSkills.some(rs =>
          aggregatedSkills.some(s => s.name.toLowerCase().includes(rs))
        );
        if (!hasRequiredSkills && requestedSkills.length > 0) return null;
      }

      // Composite signal = average confidence of top skills (only if evidence exists)
      const topSkills = aggregatedSkills.slice(0, 10);
      const compositeSignal = topSkills.length > 0
        ? Math.round(topSkills.reduce((sum, s) => sum + s.confidence, 0) / topSkills.length * 10) / 10
        : null;

      // Filter by minConfidence
      if (minConfidence && compositeSignal !== null && compositeSignal < Number(minConfidence)) {
        return null;
      }

      // Build match reasons
      const matchReasons: string[] = [];
      if (aggregatedSkills.length > 0) {
        if (evidences.length > 0) {
          matchReasons.push(`${evidences.length} verified project repository analysis`);
        }
        if (practiceEvidences.length > 0) {
          const langs = Array.from(new Set(practiceEvidences.map(p => p.language))).join(', ');
          matchReasons.push(`${practiceEvidences.length} verified technical coding test(s) passed (${langs})`);
        }
        if (topSkills[0]) matchReasons.push(`Top verified skill: ${topSkills[0].name} (${topSkills[0].confidence}%)`);
      }

      const projectCount = evidences.length;

      return {
        _id: c._id,
        firstName: c.firstName,
        lastName: c.lastName,
        compositeSignal,
        skills: aggregatedSkills.slice(0, 8),
        projectCount,
        technicalPracticeCount: practiceEvidences.length,
        matchReasons,
        hasEvidence: evidences.length > 0 || practiceEvidences.length > 0,
        lastActive: c.updatedAt
      };
    }));

    const results = enriched.filter(Boolean);

    res.json({ success: true, data: results, total: results.length });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── DASHBOARD STATS ──────────────────────────────────────────────────────────

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const recruiter = (req as any).user;

    const [candidatesCount, projectsCount, shortlistedCount] = await Promise.all([
      User.countDocuments({ role: 'CANDIDATE' }),
      Project.countDocuments({ status: 'COMPLETED' }),
      Shortlist.countDocuments({ recruiter: recruiter._id })
    ]);

    // Avg capability signal from real evidence
    const allEvidence = await ProjectEvidence.find({ analysisStatus: 'COMPLETED' });
    let avgSignal: number | null = null;
    const scores = allEvidence
      .map(e => e.scores?.overallEvidenceScore)
      .filter((s): s is number => typeof s === 'number' && s > 0);
    if (scores.length > 0) {
      avgSignal = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 10) / 10;
    }

    // Recent candidate signups for activity feed
    const recentCandidates = await User.find({ role: 'CANDIDATE' })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('firstName lastName createdAt');

    res.json({
      success: true,
      data: {
        activeCandidates: candidatesCount,
        verifiedProjects: projectsCount,
        shortlisted: shortlistedCount,
        avgSignal,
        recentActivity: recentCandidates.map((c: any) => ({
          _id: c._id,
          name: `${c.firstName} ${c.lastName}`,
          time: c.createdAt
        }))
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── RECRUITER PROFILE ────────────────────────────────────────────────────────

export const getRecruiterProfile = async (req: Request, res: Response) => {
  try {
    const recruiter = (req as any).user;
    const user = await User.findById(recruiter._id).select('-password');
    res.json({ success: true, data: user });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateRecruiterProfile = async (req: Request, res: Response) => {
  try {
    const recruiter = (req as any).user;
    const allowedFields = ['firstName', 'lastName', 'bio', 'title', 'company', 'website', 'location', 'phone'];
    const updates: any = {};
    allowedFields.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

    const updated = await User.findByIdAndUpdate(
      recruiter._id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

