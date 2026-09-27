import { Router, Request, Response } from 'express';
import { discoverTalent, getDashboardStats, getRecruiterProfile, updateRecruiterProfile } from '../controllers/recruiter.controller';
import { protect, authorize } from '../middleware/auth.middleware';

const router = Router();

// Only RECRUITER and ADMIN can access these routes
router.use(protect);
router.use(authorize('RECRUITER', 'ADMIN'));

// Talent discovery — both /discover and /talent work (frontend uses /talent)
router.get('/discover', discoverTalent);
router.get('/talent', discoverTalent);

router.get('/dashboard', getDashboardStats);

// Recruiter profile
router.get('/profile', getRecruiterProfile);
router.put('/profile', updateRecruiterProfile);

// ─── HIRING PIPELINE ──────────────────────────────────────────────────────────
// Returns applications across all recruiter's jobs
router.get('/pipeline', async (req: Request, res: Response) => {
  try {
    // Lazy-import to avoid circular deps
    const Job = (await import('../models/Job')).default;
    const Application = (await import('../models/Application')).default;

    const recruiter = (req as any).user;
    const jobs = await Job.find({ recruiter: recruiter._id }).select('_id title');
    const jobIds = jobs.map((j: any) => j._id);

    const applications = await Application.find({ job: { $in: jobIds } })
      .populate('candidate', 'firstName lastName email track')
      .populate('job', 'title')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: applications });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Move candidate to a new stage
router.patch('/pipeline/:id/stage', async (req: Request, res: Response) => {
  try {
    const Application = (await import('../models/Application')).default;
    const { stage } = req.body;
    const validStages = ['APPLIED', 'SHORTLISTED', 'INTERVIEWING', 'OFFERED', 'HIRED', 'REJECTED'];
    if (!validStages.includes(stage)) {
      return res.status(400).json({ success: false, message: 'Invalid stage' });
    }
    const updated = await Application.findByIdAndUpdate(
      req.params.id,
      { status: stage },
      { new: true }
    );
    if (!updated) return res.status(404).json({ success: false, message: 'Application not found' });
    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;

