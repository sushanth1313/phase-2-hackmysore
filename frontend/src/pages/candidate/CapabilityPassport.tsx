import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ShieldCheck, Award, Loader2, AlertCircle, CheckCircle2, Clock, Code2, 
  Database, Cpu, Globe, Lock, TestTube, Server, FileText, Sparkles, 
  Briefcase, Star, ArrowRight, ExternalLink
} from 'lucide-react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';

interface Capability {
  name: string;
  type: string;
  confidence: number;
  projectCount: number;
  projects: string[];
  lastDemonstrated: string;
  verificationStatus: 'SUPPORTED' | 'PARTIALLY_SUPPORTED' | 'INSUFFICIENT_EVIDENCE';
  evidenceCount: number;
}

interface TechnicalEvidenceItem {
  id: string;
  challengeTitle: string;
  language: string;
  difficulty: string;
  category: string;
  testsPassed: number;
  testsTotal: number;
  passRate: number;
  verificationStatus: string;
  status: string;
  skillsDemonstrated: string[];
  createdAt: string;
}

interface NonTechProofItem {
  id: string;
  title: string;
  category: string;
  status: string;
  submittedAt: string;
  score: number | null;
  analysisStatus: string;
}

interface PassportData {
  track?: string;
  passportTitle?: string;
  candidateName?: string;
  careerArea?: string;
  targetRole?: string;
  careerProfile?: string;
  claimedSkills?: string[];
  verifiedSkills?: string[];
  otherDetectedSkills?: string[];
  capabilities: Capability[];
  compositeSignal: number | null;
  projectCount: number;
  resume?: {
    score10: number | null;
    fileName: string;
    skills: string[];
    analysisStatus?: string;
  } | null;
  proofOfWork?: NonTechProofItem[];
  aiInterview?: {
    score: number | null;
    totalSessions: number;
    status: string;
    focus?: string;
  };
  expertReview?: Array<{
    id: string;
    reviewer: string;
    rating: number;
    comments: string;
  }>;
  verificationStatus?: 'VERIFIED' | 'PARTIALLY_VERIFIED' | 'NEEDS_REVIEW' | 'INSUFFICIENT_EVIDENCE';
  technicalPractice?: {
    totalAttempted: number;
    completedChallenges: number;
    overallPassRate: number;
    evidences: TechnicalEvidenceItem[];
  };
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  LANGUAGE: <Code2 className="w-4 h-4" />,
  FRAMEWORK: <Server className="w-4 h-4" />,
  DATABASE: <Database className="w-4 h-4" />,
  TESTING: <TestTube className="w-4 h-4" />,
  SECURITY: <Lock className="w-4 h-4" />,
  DEVOPS: <Globe className="w-4 h-4" />,
  ARCHITECTURE: <Cpu className="w-4 h-4" />,
  API: <Globe className="w-4 h-4" />,
  LIBRARY: <Code2 className="w-4 h-4" />,
  PATTERN: <Cpu className="w-4 h-4" />,
};

const STATUS_CONFIG = {
  SUPPORTED: { color: 'text-emerald-600 bg-emerald-50 border-emerald-200', label: 'SUPPORTED' },
  PARTIALLY_SUPPORTED: { color: 'text-amber-600 bg-amber-50 border-amber-200', label: 'PARTIAL' },
  INSUFFICIENT_EVIDENCE: { color: 'text-slate-500 bg-slate-100 border-slate-200', label: 'WEAK' },
};

export default function CapabilityPassport() {
  const { user } = useAuth();
  const [data, setData] = useState<PassportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState('ALL');

  const isNonTech = user?.track === 'NON_TECHNICAL' || data?.track === 'NON_TECHNICAL';

  useEffect(() => {
    const fetch = async () => {
      setLoading(true); setError(null);
      try {
        const res = await api.get('/candidate/capabilities');
        if (res.data?.success) {
          if (Array.isArray(res.data.data)) {
            setData({ capabilities: [], compositeSignal: null, projectCount: 0 });
          } else {
            setData(res.data.data);
          }
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load capability passport.');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <Loader2 className="w-8 h-8 text-brand-500 animate-spin mb-3" />
      <p className="text-slate-500 text-sm">Loading capability passport...</p>
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6">
      <AlertCircle className="w-10 h-10 text-red-400 mb-4" />
      <p className="text-slate-900 font-bold text-lg mb-2">Failed to load passport</p>
      <p className="text-slate-500 text-sm mb-6">{error}</p>
      <button onClick={() => window.location.reload()} className="px-4 py-2 bg-brand-600 text-slate-900 text-sm font-bold rounded-lg">Retry</button>
    </div>
  );

  // ══════════════════════════════════════════════════════════════════════
  // NON-TECHNICAL CANDIDATE CAPABILITY PASSPORT
  // ══════════════════════════════════════════════════════════════════════
  if (isNonTech) {
    const resolvedCareerArea = data?.careerArea || user?.careerArea || 'Marketing';
    const passportTitle = data?.passportTitle || `${resolvedCareerArea.toUpperCase()} CAPABILITY PASSPORT`;
    const targetRole = data?.targetRole || user?.targetRole || `${resolvedCareerArea} Specialist`;
    const candidateName = data?.candidateName || `${user?.firstName || 'Candidate'} ${user?.lastName || ''}`.trim();
    
    // Strict claimed vs verified skills
    const claimedSkills = data?.claimedSkills || [];
    const verifiedSkills = data?.verifiedSkills || [];
    const otherDetectedSkills = data?.otherDetectedSkills || [];
    
    const proofOfWork = data?.proofOfWork || [];
    const interviewScore = data?.aiInterview?.score;
    const resumeScore = data?.resume?.score10;
    const verificationStatus = data?.verificationStatus || (verifiedSkills.length > 0 ? 'PARTIALLY_VERIFIED' : 'INSUFFICIENT_EVIDENCE');
    const reviews = data?.expertReview || [];

    const statusBadge = 
      verificationStatus === 'VERIFIED' ? { color: 'bg-emerald-50 text-emerald-600 border-emerald-200', label: 'VERIFIED' } :
      verificationStatus === 'PARTIALLY_VERIFIED' ? { color: 'bg-amber-50 text-amber-600 border-amber-200', label: 'PARTIALLY VERIFIED' } :
      verificationStatus === 'NEEDS_REVIEW' ? { color: 'bg-purple-500/10 text-purple-400 border-purple-500/20', label: 'NEEDS REVIEW' } :
      { color: 'bg-slate-100 text-slate-500 border-slate-200', label: 'INSUFFICIENT EVIDENCE' };

    return (
      <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out pb-20">
        {/* HERO */}
        <section className="bg-gradient-to-b from-[#0D1322] to-[#070B14] border-b border-slate-200 px-6 py-12 md:px-12">
          <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div>
              <div className="flex items-center gap-2 text-brand-600 font-bold text-xs uppercase tracking-widest mb-2">
                <ShieldCheck className="w-4 h-4" /> Non-Technical Verification Credential
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-2">
                {passportTitle}
              </h1>
              <p className="text-slate-500 text-sm">
                Authentic, proof-backed validation across {resolvedCareerArea} capabilities, verified work deliverables, and role-based assessment.
              </p>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1 justify-end">
                  <Award className="w-3 h-3" /> Career Area
                </div>
                <div className="text-2xl font-black text-slate-900 uppercase">{resolvedCareerArea}</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Status</div>
                <span className={`inline-block text-xs font-bold px-3 py-1 rounded-full border ${statusBadge.color}`}>
                  {statusBadge.label}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* CONTENT GRID */}
        <div className="max-w-[1400px] mx-auto px-6 md:px-12 py-10 space-y-8">
          
          {/* TOP 3-COLUMN: Candidate Identity, Career Profile & AI Interview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Candidate Identity Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6">
              <div className="flex items-center gap-2 text-xs font-bold text-brand-600 uppercase tracking-wider mb-2">
                <Briefcase className="w-4 h-4" /> Candidate & Role
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-1">{candidateName}</h3>
              <div className="text-sm font-semibold text-brand-600 mb-2">{targetRole}</div>
              <div className="text-xs text-slate-500 space-y-1 pt-2 border-t border-slate-200">
                <div>Track: <span className="text-slate-700 font-medium">Non-Technical</span></div>
                <div>Career Area: <span className="text-slate-700 font-medium">{resolvedCareerArea}</span></div>
              </div>
            </div>

            {/* Career Profile Summary Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 uppercase tracking-wider mb-2">
                <Sparkles className="w-4 h-4" /> Career Profile
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {data?.careerProfile || user?.bio || `${candidateName} is an emerging ${resolvedCareerArea} professional with verified proof of work, strategic problem-solving abilities, and demonstrated execution.`}
              </p>
              <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-xs">
                <span className="text-slate-500">Overall Verification:</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${statusBadge.color}`}>
                  {statusBadge.label}
                </span>
              </div>
            </div>

            {/* AI Interview Assessment Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-xs font-bold text-purple-400 uppercase tracking-wider">
                  <Award className="w-4 h-4" /> Role-Based AI Interview
                </div>
                <Link to="/candidate/interview" className="text-[11px] text-brand-600 hover:underline flex items-center gap-1 font-bold">
                  {interviewScore != null ? 'Retake' : 'Start'} <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="text-3xl font-black text-purple-400 mb-1">
                {interviewScore != null ? `${interviewScore}/10` : 'Not Completed'}
              </div>
              <p className="text-xs text-slate-500">
                Evaluation of {resolvedCareerArea} reasoning, decision-making, and strategic clarity.
              </p>
            </div>
          </div>

          {/* CLAIMED VS VERIFIED SKILLS SECTION */}
          <div className="bg-white border border-slate-200 rounded-2xl p-8 space-y-6">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs uppercase tracking-widest mb-1">
                    <CheckCircle2 className="w-4 h-4" /> Evidence Grounded
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">Verified Skills</h2>
                  <p className="text-slate-500 text-xs mt-1">
                    Skills backed by actual evidence from your submitted deliverables, case studies, reviews, and domain interviews.
                  </p>
                </div>
              </div>

              {verifiedSkills.length === 0 ? (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500">
                  No verified skills recorded yet. Complete and submit non-technical case studies or take your AI domain interview to generate verified evidence.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  {verifiedSkills.map((skill, idx) => (
                    <div key={idx} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">{skill}</span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-600 uppercase">
                        VERIFIED
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Claimed Skills (Self-Reported)
                </h3>
                <span className="text-[10px] text-slate-500 font-mono">Profile Declared</span>
              </div>
              {claimedSkills.length === 0 ? (
                <p className="text-xs text-slate-500">No claimed skills added in profile.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {claimedSkills.map((skill, idx) => (
                    <span key={idx} className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center gap-1.5">
                      <span>{skill}</span>
                      <span className="text-[9px] font-mono text-slate-500 uppercase">CLAIMED</span>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Other skills detected from resume (e.g. C++, Java, Python, React) that do NOT define the candidate */}
            {otherDetectedSkills.length > 0 && (
              <div className="pt-4 border-t border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold text-slate-500">
                    Other Skills Detected from Resume (Context Only)
                  </h3>
                  <span className="text-[10px] text-slate-500 font-mono">Not Primary Identity</span>
                </div>
                <p className="text-[11px] text-slate-500 mb-2">
                  These skills appear in your resume text. Because your selected track is Non-Technical ({resolvedCareerArea}), they do not define your primary capability profile.
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {otherDetectedSkills.map((sk, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded bg-slate-50 border border-slate-200 text-[11px] font-mono text-slate-500">
                      {sk}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* PROOF OF WORK SECTION */}
          <div className="bg-white border border-slate-200 rounded-2xl p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="flex items-center gap-2 text-brand-600 font-bold text-xs uppercase tracking-widest mb-1">
                  <Briefcase className="w-4 h-4" /> Deliverables & Case Studies
                </div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Proof of Work</h2>
                <p className="text-slate-500 text-xs mt-1">
                  Actual non-technical submissions evaluated across Problem Understanding, Strategy, Creativity, Communication, and Completeness.
                </p>
              </div>
              <Link
                to="/candidate/challenges"
                className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
              >
                Browse Challenges <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {proofOfWork.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <Briefcase className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-sm text-slate-500">No proof of work deliverables submitted yet.</p>
                <Link
                  to="/candidate/challenges"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded-lg transition-colors"
                >
                  Accept a {resolvedCareerArea} Challenge
                </Link>
              </div>
            ) : (
              <div className="space-y-3.5">
                {proofOfWork.map(item => (
                  <div key={item.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="font-bold text-slate-900 text-sm">{item.title}</span>
                      </div>
                      <div className="text-xs text-slate-500">
                        Category: <span className="text-slate-600 font-semibold">{item.category}</span> · Status: <span className="text-emerald-600 font-semibold">{item.status}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {item.score != null ? (
                        <div className="text-right">
                          <div className="text-lg font-black text-brand-600">{item.score}/10</div>
                          <div className="text-[10px] text-slate-500 uppercase font-semibold">AI Work Score</div>
                        </div>
                      ) : (
                        <span className="text-xs text-amber-600 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          {item.analysisStatus || 'In Progress'}
                        </span>
                      )}
                      <Link
                        to="/candidate/challenges"
                        className="p-2 rounded-lg bg-slate-100 hover:bg-slate-700 text-slate-600 transition-colors"
                        title="View Submission"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* RESUME AI & EXPERT REVIEW 2-COLUMN */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Resume AI Summary */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-brand-600 uppercase tracking-wider">
                  <FileText className="w-4 h-4" /> Role-Aware Resume AI
                </div>
                <Link to="/candidate/resume-ai" className="text-xs text-brand-600 hover:underline font-bold flex items-center gap-1">
                  View Analysis <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              {data?.resume ? (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                  <div>
                    <div className="text-sm font-bold text-slate-900 font-mono">{data.resume.fileName}</div>
                    <div className="text-xs text-slate-500 mt-1">
                      Status: <span className="text-emerald-600 font-semibold">{data.resume.analysisStatus || 'COMPLETED'}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-black text-brand-600">
                      {resumeScore != null ? `${resumeScore}/10` : '—'}
                    </div>
                    <div className="text-[10px] text-emerald-600 uppercase font-bold">Resume Score</div>
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <p className="text-xs text-slate-500">No resume analyzed yet.</p>
                  <Link to="/candidate/resume-ai" className="inline-block px-4 py-1.5 bg-brand-600 text-slate-900 text-xs font-bold rounded-lg">
                    Upload Resume
                  </Link>
                </div>
              )}
            </div>

            {/* Expert Review */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-600 uppercase tracking-wider">
                <Star className="w-4 h-4" /> Expert Review
              </div>

              {reviews.length === 0 ? (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-amber-600" />
                    <span className="text-sm font-bold text-slate-900">Peer & Industry Review</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Your proof of work has been queued for industry review. Expert feedback will be attached directly to your passport.
                  </p>
                  <span className="inline-block mt-2 text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-600 border border-amber-200">
                    PENDING REVIEW
                  </span>
                </div>
              ) : (
                <div className="space-y-3">
                  {reviews.map(r => (
                    <div key={r.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                      <div className="flex justify-between font-bold text-slate-900">
                        <span>{r.reviewer}</span>
                        <span className="text-amber-600">{r.rating}/5</span>
                      </div>
                      <p className="text-slate-600">{r.comments}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════
  // TECHNICAL CANDIDATE CAPABILITY PASSPORT (UNCHANGED)
  // ══════════════════════════════════════════════════════════════════════
  const capabilities = data?.capabilities || [];
  const compositeSignal = data?.compositeSignal;
  const projectCount = data?.projectCount || 0;

  if (capabilities.length === 0) return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out px-6 md:px-12 py-8 max-w-[1400px] mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-brand-600 font-bold text-xs uppercase tracking-widest mb-1">
          <ShieldCheck className="w-4 h-4" /> Verified Evidence Profile
        </div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Capability Passport</h1>
        <p className="text-slate-500 text-sm mt-1">Derived from real project evidence — not self-reported claims.</p>
      </div>
      <div className="flex flex-col items-center justify-center py-24 bg-white border border-slate-200 rounded-2xl text-center">
        <ShieldCheck className="w-16 h-16 text-slate-600 mb-4" />
        <p className="text-slate-900 font-bold text-xl mb-2">No verified capabilities yet</p>
        <p className="text-slate-500 text-sm max-w-md mb-6">
          Your capability passport is built from real code evidence. Upload a project or import from GitHub to generate your verified profile.
        </p>
        <a href="/candidate/proof" className="px-6 py-3 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl transition-colors text-sm">
          Upload Your First Project
        </a>
      </div>
    </div>
  );

  const types = ['ALL', ...Array.from(new Set(capabilities.map(c => c.type)))];
  const filtered = selectedType === 'ALL' ? capabilities : capabilities.filter(c => c.type === selectedType);

  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out pb-20">

      {/* HERO */}
      <section className="bg-gradient-to-b from-[#0D1322] to-[#070B14] border-b border-slate-200 px-6 py-12 md:px-12">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <div className="flex items-center gap-2 text-brand-600 font-bold text-xs uppercase tracking-widest mb-2">
              <ShieldCheck className="w-4 h-4" /> Verified Evidence Profile
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Capability Passport</h1>
            <p className="text-slate-500 text-sm">Every signal below is derived from real project evidence, not self-reported claims.</p>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1 justify-end">
                <Award className="w-3 h-3" /> Evidence Signal
              </div>
              <div className={`text-5xl font-black tabular-nums ${compositeSignal ? 'text-brand-600' : 'text-slate-600'}`}>
                {compositeSignal != null ? compositeSignal.toFixed(1) : '—'}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Projects</div>
              <div className="text-5xl font-black text-slate-900">{projectCount}</div>
            </div>
            <div className="text-right">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Signals</div>
              <div className="text-5xl font-black text-slate-900">{capabilities.length}</div>
            </div>
          </div>
        </div>
      </section>

      {/* TYPE FILTER */}
      <div className="max-w-[1400px] mx-auto px-6 md:px-12 py-6 flex items-center gap-2 overflow-x-auto">
        {types.map(t => (
          <button key={t}
            onClick={() => setSelectedType(t)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
              selectedType === t
                ? 'bg-brand-50 text-brand-600 border border-brand-200'
                : 'text-slate-500 hover:text-slate-900 bg-white border border-slate-200'
            }`}>
            {t === 'ALL' ? 'All Types' : t.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {/* CAPABILITIES GRID */}
      <div className="max-w-[1400px] mx-auto px-6 md:px-12 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((cap, i) => {
            const status = STATUS_CONFIG[cap.verificationStatus];
            return (
              <div key={i} className="bg-white border border-slate-200 rounded-2xl p-6 hover:border-slate-200 transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200/50 flex items-center justify-center text-brand-600">
                      {TYPE_ICONS[cap.type] || <Code2 className="w-4 h-4" />}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">{cap.name}</h3>
                      <p className="text-[11px] text-slate-500 uppercase tracking-wider">{cap.type.replace(/_/g, ' ')}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${status.color}`}>
                    {status.label}
                  </span>
                </div>

                {/* Confidence bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-slate-500 font-medium">Confidence</span>
                    <span className="text-slate-900 font-bold tabular-nums">{cap.confidence}%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        cap.verificationStatus === 'SUPPORTED' ? 'bg-brand-500' :
                        cap.verificationStatus === 'PARTIALLY_SUPPORTED' ? 'bg-amber-500' : 'bg-slate-600'
                      }`}
                      style={{ width: `${cap.confidence}%` }}
                    />
                  </div>
                </div>

                {/* Metadata */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <div className="text-slate-500 mb-0.5">Evidence count</div>
                    <div className="text-slate-900 font-bold">{cap.evidenceCount}</div>
                  </div>
                  <div>
                    <div className="text-slate-500 mb-0.5">Projects</div>
                    <div className="text-slate-900 font-bold">{cap.projectCount}</div>
                  </div>
                </div>

                {cap.projects.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <div className="text-[10px] text-slate-600 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Demonstrated in
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {cap.projects.slice(0, 2).map((p, j) => (
                        <span key={j} className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 truncate max-w-[140px]">{p}</span>
                      ))}
                    </div>
                  </div>
                )}

                {cap.lastDemonstrated && (
                  <div className="mt-3 flex items-center gap-1.5 text-[10px] text-slate-600">
                    <Clock className="w-3 h-3" />
                    Last seen: {new Date(cap.lastDemonstrated).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* TECHNICAL PRACTICE EVIDENCE SECTION */}
        {data?.technicalPractice && data.technicalPractice.evidences.length > 0 && (
          <div className="mt-12">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="flex items-center gap-2 text-brand-600 font-bold text-xs uppercase tracking-widest mb-1">
                  <Code2 className="w-4 h-4" /> Sandboxed Execution Evidence
                </div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Technical Practice Evidence</h2>
                <p className="text-slate-500 text-xs mt-1">
                  Verified test suite runs executed in isolated environments — proving real algorithmic and programming competence.
                </p>
              </div>

              <div className="flex items-center gap-4 bg-white border border-slate-200 rounded-xl px-4 py-2">
                <div className="text-center">
                  <div className="text-[10px] text-slate-500 uppercase font-bold">Solved</div>
                  <div className="text-sm font-black text-emerald-600">{data.technicalPractice.completedChallenges}</div>
                </div>
                <div className="h-6 w-px bg-slate-100" />
                <div className="text-center">
                  <div className="text-[10px] text-slate-500 uppercase font-bold">Pass Rate</div>
                  <div className="text-sm font-black text-slate-900">{data.technicalPractice.overallPassRate}%</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.technicalPractice.evidences.map((pe) => (
                <div key={pe.id} className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-slate-200 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 mb-0.5">{pe.challengeTitle}</h4>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-brand-50 text-brand-600 border border-brand-200">
                          {pe.language}
                        </span>
                        <span className="text-[10px] text-slate-500 uppercase font-bold">
                          {pe.difficulty}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-600 border border-emerald-200">
                      VERIFIED
                    </span>
                  </div>

                  <div className="mb-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-500">Tests Passed</span>
                      <span className="text-emerald-600 font-bold font-mono">{pe.testsPassed} / {pe.testsTotal} ({Math.round(pe.passRate * 100)}%)</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500 rounded-full" 
                        style={{ width: `${Math.round(pe.passRate * 100)}%` }} 
                      />
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-200 flex flex-wrap gap-1">
                    {pe.skillsDemonstrated?.map((s, idx) => (
                      <span key={idx} className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Disclaimer */}
        <div className="mt-10 bg-white border border-slate-200 rounded-2xl p-6">
          <div className="flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-slate-900 mb-1">About Capability Evidence</p>
              <p className="text-xs text-slate-500 leading-relaxed">
                Every capability shown here is derived from static analysis of your actual project code.
                Confidence levels reflect how strongly the evidence supports the capability — not how skilled you are overall.
                Upload more projects to expand and strengthen your profile.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
