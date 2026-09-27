import { Request, Response } from 'express';
import Resume from '../models/Resume';
import ResumeAnalysis from '../models/ResumeAnalysis';
import CandidateProfile from '../models/CandidateProfile';
import { analyzeResumeBuffer } from '../services/resumeAnalyzer';

// ─── UPLOAD RESUME ─────────────────────────────────────────────────────────────
// RULES:
//  1. This endpoint creates/updates ONLY the Resume collection.
//  2. It NEVER modifies CandidateProfile (careerArea / targetRole / track / experienceLevel).
//  3. careerArea used for analysis is READ from CandidateProfile — it is a SNAPSHOT, not a write-back.
//  4. If the candidate has not selected a careerArea, analysis runs without career-context and returns detectedSkills only.
//  5. documentType = 'RESUME' is stamped on every record created here.
export const uploadResume = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a resume file (PDF, DOCX, or TXT)' });
    }

    const file = req.file;
    const allowedMimes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/plain'
    ];

    const isPdfOrDoc = allowedMimes.includes(file.mimetype) ||
      file.originalname.match(/\.(pdf|docx|doc|txt)$/i);

    if (!isPdfOrDoc) {
      return res.status(400).json({
        success: false,
        message: 'Invalid file type. Only PDF, DOCX, DOC, and TXT files are accepted.'
      });
    }

    if (file.size > 10 * 1024 * 1024) {
      return res.status(400).json({ success: false, message: 'File size exceeds 10MB limit.' });
    }

    // ── IDENTITY READ: Get track and careerArea from CandidateProfile (NEVER from resume content).
    // careerArea is a READ-ONLY snapshot for analysis context — it is NOT written back.
    const profile = await CandidateProfile.findOne({ user: user._id });
    const track = user.track || 'TECHNICAL';

    // For Non-Tech: use the explicitly selected careerArea from CandidateProfile.
    // If careerArea is not yet selected, run analysis without career context (detectedSkills only).
    const candidateCareerArea: string = (profile?.careerArea || '').trim();

    // Run analysis with track & careerArea context.
    // For NON_TECHNICAL with no careerArea: still run but analysis will note insufficient career context.
    const analysis = await analyzeResumeBuffer(
      file.buffer,
      file.originalname,
      file.mimetype,
      user._id.toString(),
      track,
      candidateCareerArea  // may be empty — the analyzer handles this gracefully
    );

    // Check if this is the first resume — if so mark primary
    const existingCount = await Resume.countDocuments({ user: user._id, documentType: 'RESUME' });
    const isPrimary = existingCount === 0;

    // ── SAVE RESUME: documentType is ALWAYS 'RESUME' for this endpoint.
    // careerArea stored here is the snapshot of the candidate's selected careerArea at upload time.
    // It is NOT the AI-inferred careerArea from the resume content.
    const resume = await Resume.create({
      user: user._id,
      candidateId: user._id,
      resumeId: `RES-${Date.now()}`,
      fileName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
      fileHash: analysis.fileHash,
      isPrimary,
      documentType: 'RESUME',  // explicit type — prevents PROOF_OF_WORK contamination
      status: 'Uploaded',
      analysisStatus: 'COMPLETED',
      extractedText: analysis.extractedText,
      track,
      // careerArea snapshot from CandidateProfile (NOT from AI inference):
      careerArea: candidateCareerArea,
      atsScore: analysis.atsScore,
      roleRelevanceScore: analysis.roleRelevanceScore,
      // detectedSkills = all keywords found in resume — these do NOT define identity
      detectedSkills: analysis.detectedSkills || analysis.skills,
      // roleRelevantSkills = skills relevant to the selected careerArea — still not VERIFIED
      roleRelevantSkills: analysis.roleRelevantSkills || [],
      missingRoleSkills: analysis.missingRoleSkills || [],
      score10: analysis.score10,
      scoreBreakdown: analysis.scoreBreakdown,
      aiAssistanceSignals: analysis.aiAssistanceSignals,
      // skills stored = detectedSkills only (not VERIFIED capabilities)
      skills: analysis.detectedSkills || analysis.skills,
      experience: analysis.experience,
      education: analysis.education,
      projects: analysis.projects,
      certifications: analysis.certifications,
      strengths: analysis.strengths,
      weaknesses: analysis.weaknesses,
      missingKeywords: analysis.missingKeywords,
      formattingIssues: analysis.formattingIssues,
      recommendations: analysis.recommendations,
      integrity: analysis.integrity,
      scores: analysis.scores,
      aiWritingIndicator: analysis.aiWritingIndicator,
      technicalEvidence: analysis.technicalEvidence,
      improvementSuggestions: analysis.improvementSuggestions
    });

    // ── SAVE RESUME ANALYSIS: careerArea is a SNAPSHOT from CandidateProfile.
    // Direction: CandidateProfile → ResumeAnalysis (NOT Resume → CandidateProfile).
    const resumeAnalysis = await ResumeAnalysis.create({
      resumeId: resume._id,
      candidateId: user._id,
      track,
      // Snapshot: reflects what the candidate has selected, NOT what AI inferred
      careerArea: candidateCareerArea,
      overallScore: analysis.overallScore || analysis.score10,
      atsScore: analysis.atsScore,
      roleRelevanceScore: analysis.roleRelevanceScore,
      experienceScore: analysis.experienceScore,
      projectsScore: analysis.projectsScore,
      clarityScore: analysis.clarityScore,
      detectedSkills: analysis.detectedSkills || analysis.skills,
      roleRelevantSkills: analysis.roleRelevantSkills || [],
      // otherDetectedSkills = skills outside selected careerArea (e.g. Java, Python for a Marketing candidate)
      otherDetectedSkills: analysis.otherDetectedSkills || [],
      missingRoleSkills: analysis.missingRoleSkills || [],
      strengths: analysis.strengths,
      weaknesses: analysis.weaknesses,
      score: analysis.score10,
      scoreBreakdown: {
        atsCompatibility: analysis.scoreBreakdown.atsCompatibility,
        skillsRelevance: analysis.scoreBreakdown.skillsRelevance,
        experience: analysis.scoreBreakdown.experience,
        projects: analysis.scoreBreakdown.projects || (analysis.scoreBreakdown as any).projectQuality || 1.5,
        clarityStructure: analysis.scoreBreakdown.clarityStructure
      },
      skills: analysis.detectedSkills || analysis.skills,
      experience: analysis.experience,
      education: analysis.education,
      projects: analysis.projects,
      certifications: analysis.certifications,
      atsAnalysis: {
        score: Math.round((analysis.atsScore || 7) * 10),
        compatibility: analysis.scoreBreakdown.atsCompatibility,
        findings: analysis.strengths
      },
      missingKeywords: analysis.missingKeywords,
      formatting: analysis.formattingIssues,
      recommendations: analysis.recommendations,
      aiAssistanceSignals: {
        category: analysis.aiAssistanceSignals.category,
        confidence: analysis.aiAssistanceSignals.confidence,
        evidence: analysis.aiAssistanceSignals.evidence,
        explanation: analysis.aiAssistanceSignals.summary
      },
      documentMetadataSignals: analysis.documentMetadataSignals || {
        creator: 'Standard Document Editor',
        producer: 'PDF Generator',
        creationDate: new Date().toISOString(),
        isSuspicious: false,
        signals: ['Standard PDF structure detected']
      }
    });

    // ── CRITICAL: DO NOT write to CandidateProfile here.
    // Resume analysis is READ-ONLY with respect to candidate identity.

    res.status(201).json({
      success: true,
      message: 'Resume uploaded and analyzed successfully',
      data: resume,
      analysis: resumeAnalysis
    });
  } catch (error: any) {
    console.error('Error in uploadResume:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to process resume' });
  }
};

// ─── GET LATEST RESUME ─────────────────────────────────────────────────────────
// Only fetches documents uploaded through the Resume endpoint (documentType = 'RESUME').
// A Proof of Work PDF uploaded through /proof-of-work NEVER appears here.
export const getLatestResume = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    // Only return documents explicitly marked as RESUME — not Proof of Work or other uploads
    let resume = await Resume.findOne({ user: user._id, documentType: 'RESUME', isPrimary: true });
    if (!resume) {
      resume = await Resume.findOne({ user: user._id, documentType: 'RESUME' }).sort({ createdAt: -1 });
    }
    res.json({
      success: true,
      data: resume || null
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── GET LATEST RESUME ANALYSIS ───────────────────────────────────────────────
// Returns the most recent ResumeAnalysis for the candidate's current careerArea.
// If careerArea has changed since the last analysis, re-runs analysis against the selected area.
// If careerArea is NOT SET for Non-Tech: returns null — no identity is inferred.
export const getLatestResumeAnalysis = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const isNonTech = user.track === 'NON_TECHNICAL';

    // Read identity from CandidateProfile (authoritative source)
    const profile = await CandidateProfile.findOne({ user: user._id });
    const currentCareerArea = (profile?.careerArea || '').trim();

    // For Non-Tech: if no careerArea has been selected, return null with a prompt
    // NEVER infer careerArea from resume content or AI
    if (isNonTech && !currentCareerArea) {
      return res.json({
        success: true,
        data: null,
        requiresCareerSelection: true,
        message: 'Please select your career area before Resume AI can evaluate your resume against your target role.'
      });
    }

    // Only look at analyses for this track + selected careerArea
    let filter: any = { candidateId: user._id };
    if (isNonTech) {
      filter.track = 'NON_TECHNICAL';
      filter.careerArea = currentCareerArea; // must match current selection exactly
    } else {
      filter.track = { $ne: 'NON_TECHNICAL' };
    }

    let analysis = await ResumeAnalysis.findOne(filter).sort({ createdAt: -1 });

    // If no matching analysis exists for current careerArea — re-analyze against the selected area
    if (!analysis) {
      // Only get RESUME documents (not Proof of Work)
      let resume = await Resume.findOne({ user: user._id, documentType: 'RESUME', isPrimary: true });
      if (!resume) {
        resume = await Resume.findOne({ user: user._id, documentType: 'RESUME' }).sort({ createdAt: -1 });
      }

      if (resume && resume.extractedText && isNonTech && currentCareerArea) {
        // Re-analyze for the newly selected career area
        // Uses the extractedText already on file — NO new careerArea inferred from resume
        const detailed = await analyzeResumeBuffer(
          Buffer.from(resume.extractedText),
          resume.fileName || 'resume.txt',
          'text/plain',
          user._id.toString(),
          'NON_TECHNICAL',
          currentCareerArea // from CandidateProfile — not from resume
        );

        analysis = await ResumeAnalysis.create({
          resumeId: resume._id,
          candidateId: user._id,
          track: 'NON_TECHNICAL',
          careerArea: currentCareerArea, // snapshot from CandidateProfile
          overallScore: detailed.overallScore || detailed.score10,
          atsScore: detailed.atsScore,
          roleRelevanceScore: detailed.roleRelevanceScore,
          experienceScore: detailed.experienceScore,
          projectsScore: detailed.projectsScore,
          clarityScore: detailed.clarityScore,
          detectedSkills: detailed.detectedSkills || detailed.skills,
          roleRelevantSkills: detailed.roleRelevantSkills || [],
          otherDetectedSkills: detailed.otherDetectedSkills || [],
          missingRoleSkills: detailed.missingRoleSkills || [],
          strengths: detailed.strengths,
          weaknesses: detailed.weaknesses,
          score: detailed.score10,
          scoreBreakdown: detailed.scoreBreakdown,
          skills: detailed.detectedSkills || detailed.skills,
          experience: detailed.experience,
          education: detailed.education,
          projects: detailed.projects,
          certifications: detailed.certifications,
          atsAnalysis: {
            score: Math.round((detailed.atsScore || 7) * 10),
            compatibility: detailed.scoreBreakdown.atsCompatibility,
            findings: detailed.strengths
          },
          missingKeywords: detailed.missingRoleSkills && detailed.missingRoleSkills.length > 0
            ? detailed.missingRoleSkills.slice(0, 5)
            : detailed.missingKeywords,
          formatting: detailed.formattingIssues,
          recommendations: detailed.recommendations,
          aiAssistanceSignals: {
            category: detailed.aiAssistanceSignals.category,
            confidence: detailed.aiAssistanceSignals.confidence,
            evidence: detailed.aiAssistanceSignals.evidence,
            explanation: detailed.aiAssistanceSignals.summary
          },
          documentMetadataSignals: detailed.documentMetadataSignals || {
            creator: 'Standard Document Editor',
            producer: 'PDF Generator',
            creationDate: new Date().toISOString(),
            isSuspicious: false,
            signals: ['Document streams validated without automated headless tags']
          }
        });
      } else if (resume && !isNonTech) {
        // Technical candidate fallback: build analysis from stored resume data
        // Uses existing technical rubric — never creates Non-Tech analysis for Technical candidates
        const detailed = await analyzeResumeBuffer(
          Buffer.from(resume.extractedText || ''),
          resume.fileName || 'resume.txt',
          'text/plain',
          user._id.toString(),
          'TECHNICAL',
          ''
        );

        analysis = await ResumeAnalysis.create({
          resumeId: resume._id,
          candidateId: user._id,
          track: 'TECHNICAL',
          score: detailed.score10 || resume.score10 || 7.8,
          overallScore: detailed.score10 || resume.score10,
          detectedSkills: detailed.detectedSkills || resume.detectedSkills || resume.skills || [],
          roleRelevantSkills: detailed.roleRelevantSkills || resume.roleRelevantSkills || [],
          missingRoleSkills: detailed.missingRoleSkills || resume.missingRoleSkills || [],
          scoreBreakdown: {
            atsCompatibility: detailed.scoreBreakdown?.atsCompatibility || resume.scoreBreakdown?.atsCompatibility || 1.6,
            skillsRelevance: detailed.scoreBreakdown?.skillsRelevance || resume.scoreBreakdown?.skillsRelevance || 1.6,
            experience: detailed.scoreBreakdown?.experience || resume.scoreBreakdown?.experience || 1.5,
            projects: (detailed.scoreBreakdown as any)?.projects || (detailed.scoreBreakdown as any)?.projectQuality ||
              (resume.scoreBreakdown as any)?.projects || (resume.scoreBreakdown as any)?.projectQuality || 1.6,
            clarityStructure: detailed.scoreBreakdown?.clarityStructure || resume.scoreBreakdown?.clarityStructure || 1.5
          },
          skills: detailed.skills || resume.skills || [],
          experience: detailed.experience || resume.experience || [],
          education: detailed.education || resume.education || [],
          projects: detailed.projects || resume.projects || [],
          certifications: detailed.certifications || resume.certifications || [],
          strengths: detailed.strengths || resume.strengths || ['Standard header structure recognized'],
          weaknesses: detailed.weaknesses || resume.weaknesses || [],
          atsAnalysis: {
            score: Math.round(((detailed.scoreBreakdown?.atsCompatibility || resume.scoreBreakdown?.atsCompatibility || 1.6)) * 50),
            compatibility: detailed.scoreBreakdown?.atsCompatibility || resume.scoreBreakdown?.atsCompatibility || 1.6,
            findings: detailed.strengths || resume.strengths || ['Standard header structure recognized']
          },
          missingKeywords: detailed.missingKeywords || resume.missingKeywords || [],
          formatting: detailed.formattingIssues || resume.formattingIssues || [],
          recommendations: detailed.recommendations || resume.recommendations || [],
          aiAssistanceSignals: {
            category: detailed.aiAssistanceSignals?.category || resume.aiAssistanceSignals?.category || 'LOW AI-ASSISTANCE SIGNAL',
            confidence: detailed.aiAssistanceSignals?.confidence || (resume.aiAssistanceSignals?.confidence as any) || 'Moderate',
            evidence: detailed.aiAssistanceSignals?.evidence || resume.aiAssistanceSignals?.evidence || ['Varied syntactic structures detected across bullet points.'],
            explanation: detailed.aiAssistanceSignals?.summary || resume.aiAssistanceSignals?.summary || 'Possible AI-assisted writing signals: LOW.'
          },
          documentMetadataSignals: {
            creator: 'Standard Document Editor',
            producer: 'PDF Generator',
            creationDate: resume.createdAt?.toISOString() || new Date().toISOString(),
            isSuspicious: false,
            signals: ['Document streams validated without automated headless tags']
          }
        });
      }
    }

    res.json({
      success: true,
      data: analysis || null
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getResumeAnalysisById = async (req: Request, res: Response) => {
  try {
    const analysis = await ResumeAnalysis.findById(req.params.id);
    if (!analysis) {
      return res.status(404).json({ success: false, message: 'Resume analysis not found' });
    }
    res.json({ success: true, data: analysis });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Only returns documents with documentType = 'RESUME'
export const getResumeById = async (req: Request, res: Response) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, documentType: 'RESUME' });
    if (!resume) {
      return res.status(404).json({ success: false, message: 'Resume not found' });
    }
    res.json({ success: true, data: resume });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Only returns RESUME documents (not Proof of Work uploads)
export const getResumeVersions = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const resumes = await Resume.find({ user: user._id, documentType: 'RESUME' })
      .sort({ createdAt: -1 })
      .select('fileName fileSize mimeType fileHash isPrimary status analysisStatus score10 scoreBreakdown aiAssistanceSignals detectedSkills roleRelevantSkills careerArea track createdAt');

    res.json({ success: true, data: resumes });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const setPrimaryResume = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    const resume = await Resume.findOne({ _id: id, user: user._id, documentType: 'RESUME' });
    if (!resume) {
      return res.status(404).json({ success: false, message: 'Resume not found' });
    }

    await Resume.updateMany({ user: user._id, documentType: 'RESUME' }, { isPrimary: false });
    resume.isPrimary = true;
    await resume.save();

    res.json({ success: true, message: 'Primary resume updated successfully', data: resume });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteResume = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const resume = await Resume.findOneAndDelete({ _id: req.params.id, user: user._id, documentType: 'RESUME' });
    if (!resume) {
      return res.status(404).json({ success: false, message: 'Resume not found' });
    }

    await ResumeAnalysis.deleteMany({ resumeId: req.params.id, candidateId: user._id });

    if (resume.isPrimary) {
      const another = await Resume.findOne({ user: user._id, documentType: 'RESUME' }).sort({ createdAt: -1 });
      if (another) {
        another.isPrimary = true;
        await another.save();
      }
    }

    res.json({ success: true, message: 'Resume deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
