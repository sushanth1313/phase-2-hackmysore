import { Request, Response } from 'express';
import mongoose from 'mongoose';
import CodingChallenge, { ICodingChallenge } from '../models/CodingChallenge';
import CodingSubmission from '../models/CodingSubmission';
import TechnicalPracticeEvidence from '../models/TechnicalPracticeEvidence';
import { executeTestCases } from '../services/codeExecution.service';

// ─── GET CHALLENGES ─────────────────────────────────────────────────────────

export const getPracticeChallenges = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { difficulty, category, search } = req.query;

    const filter: any = { status: 'ACTIVE' };
    if (difficulty && difficulty !== 'ALL') filter.difficulty = difficulty;
    if (category && category !== 'ALL') filter.category = category;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { functionName: { $regex: search, $options: 'i' } }
      ];
    }

    const challenges = await CodingChallenge.find(filter).sort({ difficulty: 1, createdAt: -1 });

    // Fetch candidate submissions if authenticated as candidate
    let submissionMap = new Map<string, any>();
    if (user && user.role === 'CANDIDATE') {
      const submissions = await CodingSubmission.find({ candidate: user._id });
      submissions.forEach(sub => {
        const cId = sub.challenge.toString();
        const existing = submissionMap.get(cId);
        if (!existing || sub.status === 'PASSED' || (sub.passedTests > (existing.passedTests || 0))) {
          submissionMap.set(cId, sub);
        }
      });
    }

    const enriched = challenges.map(c => {
      const bestSub = submissionMap.get(c._id.toString());
      // For listing, strip test cases to keep payload light
      const obj = c.toObject();
      delete (obj as any).testCases;

      return {
        ...obj,
        testCasesCount: c.testCases.length,
        candidateStatus: bestSub ? (bestSub.status === 'PASSED' ? 'PASSED' : 'ATTEMPTED') : 'NOT_STARTED',
        bestScore: bestSub ? Math.round((bestSub.passedTests / (bestSub.totalTests || 1)) * 100) : null,
        lastAttemptAt: bestSub ? bestSub.submittedAt : null
      };
    });

    res.json({ success: true, data: enriched });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── GET SINGLE CHALLENGE ───────────────────────────────────────────────────

export const getPracticeChallengeById = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    const challenge = await CodingChallenge.findById(id);
    if (!challenge) {
      return res.status(404).json({ success: false, message: 'Challenge not found' });
    }

    const challengeObj = challenge.toObject();

    // If user is candidate, only show non-hidden test cases
    if (!user || user.role === 'CANDIDATE') {
      challengeObj.testCases = challenge.testCases
        .filter(tc => !tc.isHidden)
        .map(tc => ({
          _id: tc._id,
          label: tc.label,
          args: tc.args,
          expectedReturn: tc.expectedReturn,
          explanation: tc.explanation,
          isHidden: false
        }));
    }

    // Get candidate's previous submission / draft if available
    let latestSubmission = null;
    if (user) {
      latestSubmission = await CodingSubmission.findOne({
        challenge: challenge._id,
        candidate: user._id
      }).sort({ createdAt: -1 });
    }

    res.json({
      success: true,
      data: {
        ...challengeObj,
        latestSubmission
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── RUN TESTS (VISIBLE TEST CASES ONLY) ────────────────────────────────────

export const runPracticeTests = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { code, language } = req.body;

    if (!code || !language) {
      return res.status(400).json({ success: false, message: 'Code and language are required' });
    }

    const challenge = await CodingChallenge.findById(id);
    if (!challenge) {
      return res.status(404).json({ success: false, message: 'Challenge not found' });
    }

    if (!challenge.allowedLanguages.includes(language)) {
      return res.status(400).json({ 
        success: false, 
        message: `Language '${language}' is not permitted for this challenge. Allowed: ${challenge.allowedLanguages.join(', ')}` 
      });
    }

    // Run only visible test cases
    const visibleTestCases = challenge.testCases.filter(tc => !tc.isHidden);
    const testCasesToRun = visibleTestCases.length > 0 ? visibleTestCases : challenge.testCases.slice(0, 2);

    const results = await executeTestCases({
      code,
      language,
      functionName: challenge.functionName,
      parameters: challenge.parameters,
      returnType: challenge.returnType,
      testCases: testCasesToRun,
      timeoutMs: challenge.timeLimitMs || 5000
    });

    const passedCount = results.filter(r => r.passed).length;

    res.json({
      success: true,
      data: {
        results,
        passedCount,
        totalCount: results.length,
        allPassed: passedCount === results.length
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── SUBMIT CODE (RUNS ALL TEST CASES & GENERATES EVIDENCE) ─────────────────

export const submitPracticeSolution = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const { code, language } = req.body;

    if (!code || !language) {
      return res.status(400).json({ success: false, message: 'Code and language are required' });
    }

    const challenge = await CodingChallenge.findById(id);
    if (!challenge) {
      return res.status(404).json({ success: false, message: 'Challenge not found' });
    }

    if (!challenge.allowedLanguages.includes(language)) {
      return res.status(400).json({ 
        success: false, 
        message: `Language '${language}' is not permitted for this challenge.` 
      });
    }

    // Execute ALL test cases (visible + hidden)
    const results = await executeTestCases({
      code,
      language,
      functionName: challenge.functionName,
      parameters: challenge.parameters,
      returnType: challenge.returnType,
      testCases: challenge.testCases,
      timeoutMs: challenge.timeLimitMs || 5000
    });

    const totalTests = results.length;
    const passedTests = results.filter(r => r.passed).length;
    const isPassed = passedTests === totalTests && totalTests > 0;
    const passRate = totalTests > 0 ? passedTests / totalTests : 0;
    const status = isPassed ? 'PASSED' : 'FAILED';
    const totalExecutionTimeMs = results.reduce((sum, r) => sum + (r.executionTimeMs || 0), 0);

    // Save CodingSubmission in MongoDB
    const submission = await CodingSubmission.create({
      candidate: user._id,
      challenge: challenge._id,
      language,
      code,
      status,
      passedTests,
      totalTests,
      executionTimeMs: totalExecutionTimeMs,
      testResults: results,
      submittedAt: new Date()
    });

    // Generate verified evidence if submission is successful
    let evidence = null;
    if (isPassed || passRate >= 0.6) {
      const skillsDemonstrated = [
        language.toUpperCase(),
        challenge.category,
        challenge.difficulty === 'HARD' ? 'Advanced Algorithms' : 'Data Structures & Algorithms',
        'Problem Solving'
      ];

      evidence = await TechnicalPracticeEvidence.create({
        candidate: user._id,
        challenge: challenge._id,
        submission: submission._id,
        challengeTitle: challenge.title,
        difficulty: challenge.difficulty,
        category: challenge.category,
        language: language.toUpperCase(),
        testsPassed: passedTests,
        testsTotal: totalTests,
        passRate,
        status: isPassed ? 'PASSED' : 'PARTIAL',
        verificationStatus: 'VERIFIED',
        skillsDemonstrated,
        metrics: {
          executionTimeMs: totalExecutionTimeMs,
          memoryMb: challenge.memoryLimitMb || 256
        }
      });

      submission.evidenceGenerated = true;
      submission.evidenceId = evidence._id as any;
      await submission.save();

      // Increment challenge verified submissions
      await CodingChallenge.findByIdAndUpdate(challenge._id, {
        $inc: { verifiedSubmissions: 1 }
      });
    }

    // Hide hidden test case details from response to protect problem bank integrity
    const sanitizedResults = results.map((r, i) => {
      const tc = challenge.testCases[i];
      if (tc && tc.isHidden) {
        return {
          ...r,
          label: 'Hidden Test Case',
          args: ['[HIDDEN]'],
          expectedReturn: '[HIDDEN]',
          actualOutput: r.passed ? '[MATCHED]' : '[FAILED]'
        };
      }
      return r;
    });

    res.json({
      success: true,
      data: {
        submissionId: submission._id,
        status,
        passedTests,
        totalTests,
        passRate: Math.round(passRate * 100),
        executionTimeMs: totalExecutionTimeMs,
        results: sanitizedResults,
        evidence: evidence ? {
          id: evidence._id,
          verificationStatus: evidence.verificationStatus,
          status: evidence.status,
          passRate: Math.round(evidence.passRate * 100),
          skillsDemonstrated: evidence.skillsDemonstrated
        } : null
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── GET SUBMISSION HISTORY ─────────────────────────────────────────────────

export const getSubmissionHistory = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { id } = req.params; // challengeId

    const filter: any = { challenge: id };
    if (user.role === 'CANDIDATE') {
      filter.candidate = user._id;
    }

    const history = await CodingSubmission.find(filter)
      .select('language status passedTests totalTests executionTimeMs code submittedAt')
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({ success: true, data: history });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── GET CANDIDATE PRACTICE EVIDENCE ────────────────────────────────────────

export const getCandidatePracticeEvidence = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const candidateId = req.params.candidateId || user._id;

    // Only allow candidate themselves or recruiters/admins to view evidence
    if (user.role === 'CANDIDATE' && user._id.toString() !== candidateId.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this candidate evidence' });
    }

    const evidences = await TechnicalPracticeEvidence.find({ candidate: candidateId })
      .sort({ createdAt: -1 });

    const totalAttempted = await CodingSubmission.distinct('challenge', { candidate: candidateId });
    const completedChallenges = evidences.filter(e => e.status === 'PASSED').length;

    // Aggregate languages demonstrated
    const languageStats: Record<string, { count: number; testsPassed: number; testsTotal: number }> = {};
    evidences.forEach(e => {
      if (!languageStats[e.language]) {
        languageStats[e.language] = { count: 0, testsPassed: 0, testsTotal: 0 };
      }
      languageStats[e.language].count += 1;
      languageStats[e.language].testsPassed += e.testsPassed;
      languageStats[e.language].testsTotal += e.testsTotal;
    });

    const overallPassRate = evidences.length > 0
      ? Math.round((evidences.reduce((sum, e) => sum + e.passRate, 0) / evidences.length) * 100)
      : 0;

    res.json({
      success: true,
      data: {
        totalAttempted: totalAttempted.length,
        completedChallenges,
        overallPassRate,
        languageStats,
        evidences
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── ADMIN: CREATE CHALLENGE ────────────────────────────────────────────────

export const createPracticeChallenge = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const {
      title,
      description,
      difficulty,
      category,
      allowedLanguages,
      functionName,
      parameters,
      returnType,
      starterCode,
      constraints,
      hints,
      testCases,
      timeLimitMs,
      memoryLimitMb
    } = req.body;

    if (!title || !description || !difficulty || !functionName || !parameters || !returnType) {
      return res.status(400).json({ 
        success: false, 
        message: 'title, description, difficulty, functionName, parameters, and returnType are required' 
      });
    }

    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now().toString(36);

    const challenge = await CodingChallenge.create({
      title,
      slug,
      description,
      difficulty,
      category: category || 'DSA',
      allowedLanguages: allowedLanguages || ['java', 'python', 'javascript'],
      functionName,
      parameters,
      returnType,
      starterCode: starterCode || {},
      constraints: constraints || [],
      hints: hints || [],
      testCases: testCases || [],
      timeLimitMs: timeLimitMs || 5000,
      memoryLimitMb: memoryLimitMb || 256,
      createdBy: user._id
    });

    res.status(201).json({ success: true, data: challenge });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── ADMIN: UPDATE CHALLENGE ────────────────────────────────────────────────

export const updatePracticeChallenge = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const challenge = await CodingChallenge.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
    if (!challenge) {
      return res.status(404).json({ success: false, message: 'Challenge not found' });
    }
    res.json({ success: true, data: challenge });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── ADMIN: DELETE CHALLENGE ────────────────────────────────────────────────

export const deletePracticeChallenge = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const challenge = await CodingChallenge.findByIdAndUpdate(id, { status: 'ARCHIVED' }, { new: true });
    if (!challenge) {
      return res.status(404).json({ success: false, message: 'Challenge not found' });
    }
    res.json({ success: true, message: 'Challenge archived successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── CANDIDATE PRACTICE STATS ────────────────────────────────────────────────

export const getCandidatePracticeStats = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const allChallenges = await CodingChallenge.find({ status: 'ACTIVE' });
    const allSubmissions = await CodingSubmission.find({ candidate: user._id }).sort({ createdAt: -1 });

    const solvedChallengeIds = new Set<string>();
    const attemptedChallengeIds = new Set<string>();

    allSubmissions.forEach(sub => {
      const cId = sub.challenge.toString();
      attemptedChallengeIds.add(cId);
      if (sub.status === 'PASSED') {
        solvedChallengeIds.add(cId);
      }
    });

    const diffStats = {
      EASY: { solved: 0, total: 0 },
      MEDIUM: { solved: 0, total: 0 },
      HARD: { solved: 0, total: 0 }
    };

    const topicStats: Record<string, { solved: number; total: number }> = {};

    allChallenges.forEach(c => {
      const diff = (c.difficulty || 'EASY').toUpperCase() as 'EASY' | 'MEDIUM' | 'HARD';
      if (diffStats[diff]) diffStats[diff].total += 1;

      // Extract topic from title or category
      let topic: string = (c.category as string) || 'Algorithms';

      const titleLower = c.title.toLowerCase();
      if (titleLower.includes('sum') || titleLower.includes('array') || titleLower.includes('colors')) topic = 'Arrays';
      else if (titleLower.includes('palindrome') || titleLower.includes('parentheses') || titleLower.includes('string') || titleLower.includes('anagram')) topic = 'Strings';
      else if (titleLower.includes('duplicate') || titleLower.includes('frequent') || titleLower.includes('hash')) topic = 'Hashing';
      else if (titleLower.includes('pointer') || titleLower.includes('trapping') || titleLower.includes('three sum')) topic = 'Two Pointers';
      else if (titleLower.includes('window') || titleLower.includes('stock')) topic = 'Sliding Window';
      else if (titleLower.includes('linked list') || titleLower.includes('list')) topic = 'Linked Lists';
      else if (titleLower.includes('stack') || titleLower.includes('parentheses')) topic = 'Stack';
      else if (titleLower.includes('binary search') || titleLower.includes('search')) topic = 'Binary Search';
      else if (titleLower.includes('tree') || titleLower.includes('bst')) topic = 'Trees';
      else if (titleLower.includes('island') || titleLower.includes('course') || titleLower.includes('graph')) topic = 'Graphs';
      else if (titleLower.includes('subsets') || titleLower.includes('combination')) topic = 'Backtracking';
      else if (titleLower.includes('stairs') || titleLower.includes('coin') || titleLower.includes('subsequence') || titleLower.includes('distance')) topic = 'Dynamic Programming';

      if (!topicStats[topic]) topicStats[topic] = { solved: 0, total: 0 };
      topicStats[topic].total += 1;

      if (solvedChallengeIds.has(c._id.toString())) {
        if (diffStats[diff]) diffStats[diff].solved += 1;
        topicStats[topic].solved += 1;
      }
    });

    const accuracy = allSubmissions.length > 0 
      ? Math.round((allSubmissions.filter(s => s.status === 'PASSED').length / allSubmissions.length) * 100)
      : 0;

    res.json({
      success: true,
      data: {
        totalChallenges: allChallenges.length,
        solved: solvedChallengeIds.size,
        solvedCount: solvedChallengeIds.size,
        attempted: attemptedChallengeIds.size,
        attemptedCount: attemptedChallengeIds.size,
        accuracy,
        easy: diffStats.EASY,
        medium: diffStats.MEDIUM,
        hard: diffStats.HARD,
        difficulty: {
          easy: diffStats.EASY,
          medium: diffStats.MEDIUM,
          hard: diffStats.HARD
        },
        topicProgress: Object.entries(topicStats).map(([topic, stats]) => ({
          topic,
          solved: stats.solved,
          total: stats.total,
          percentage: stats.total > 0 ? Math.round((stats.solved / stats.total) * 100) : 0
        })),
        recentSubmissions: allSubmissions.slice(0, 5).map(s => ({
          _id: s._id,
          challenge: s.challenge,
          language: s.language,
          status: s.status,
          passedTests: s.passedTests,
          totalTests: s.totalTests,
          executionTimeMs: s.executionTimeMs,
          submittedAt: s.submittedAt
        }))
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

