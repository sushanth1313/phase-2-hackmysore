import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, ClipboardList, History, UserCircle,
  Clock, CheckCircle2, ShieldCheck, Loader2, AlertCircle,
  RefreshCw, ChevronRight, FileText, Award, Star,
  ExternalLink, Code2, Users, BarChart2, Edit2, Save, X,
  Check, AlertTriangle, Layers, Calendar, Terminal,
  BookOpen, HelpCircle, ThumbsUp, ThumbsDown, MessageSquare,
  ArrowRight, Search, FileCheck, CheckSquare, Sparkles, Filter, Inbox, Plus
} from 'lucide-react';
import api from '../../api/client';

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface CandidateInfo {
  _id: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  track?: string;
  createdAt: string;
}

interface CandidateProfileInfo {
  headline?: string;
  bio?: string;
  location?: string;
  careerArea?: string;
  targetRole?: string;
  experienceLevel?: string;
  claimedSkills?: string[];
  verifiedSkills?: string[];
  links?: { github?: string; linkedin?: string; portfolio?: string };
}

interface ITimelineEvent {
  title: string;
  category: string;
  description: string;
  date: string;
  evidenceSource?: string;
  status?: string;
}

interface IRequirementMatch {
  requirement: string;
  evidenceFound: string;
  status: 'SUPPORTED' | 'PARTIAL' | 'MISSING';
  gap: string;
  confidence?: string;
}

interface IEvidenceStatement {
  statement: string;
  source: string;
  category: string;
}

interface IEvidenceSummary {
  strengths: IEvidenceStatement[];
  weaknesses: IEvidenceStatement[];
  missingEvidence: IEvidenceStatement[];
  riskConcerns: IEvidenceStatement[];
  areasRequiringAttention: IEvidenceStatement[];
}

interface ISuggestedImprovement {
  id: string;
  category: string;
  title: string;
  description: string;
  evidenceSource: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'PENDING' | 'ACCEPTED' | 'MODIFIED' | 'REJECTED';
  modifiedText?: string;
  rejectionReason?: string;
  expertNote?: string;
}

interface IRubricDimensionAlignment {
  key: string;
  label: string;
  weight: number;
  description: string;
  directEvidence: string[];
  aiInference: string;
  evidenceGaps: string[];
  suggestedScore: number;
  expertScore: number;
  expertComment: string;
  evidenceNote: string;
}

interface IImprovementReport {
  doneWell: string;
  needsImprovement: string;
  criticalGaps: string;
  nextSteps: string[];
}

interface IImprovementSuggestion {
  _id?: string;
  id?: string;
  title: string;
  description: string;
  source: string;
  evidence: string;
  addedBy?: string;
  addedAt?: string;
  status?: string;
}

interface IEvidenceContext {
  review: {
    _id: string;
    expert: string;
    expertId?: string;
    candidate: string;
    candidateId?: string;
    submissionId?: string;
    track: string;
    submissionTitle: string;
    submissionDescription: string;
    status: 'ASSIGNED' | 'IN_REVIEW' | 'COMPLETED' | 'CANCELLED';
    overallScore?: number;
    verificationStatus?: string;
    feedback?: string;
    internalNotes?: string;
    strengths?: string;
    weaknesses?: string;
    improvements?: string;
    whatWasDoneWell?: string;
    whatNeedsImprovement?: string;
    recommendedImprovements?: string;
    expertComments?: string;
    evidenceNotes?: string;
    rubricScores?: any;
    rubric?: any;
    assignedAt: string;
    startedAt?: string;
    completedAt?: string;
    acceptedSuggestions?: any[];
    modifiedSuggestions?: any[];
    rejectedSuggestions?: any[];
    improvementRecommendations?: string[];
    improvementSuggestions?: IImprovementSuggestion[];
    aiAnalysis?: any;
  };
  candidate: CandidateInfo;
  profile: CandidateProfileInfo | null;
  skills: {
    claimedSkills: string[];
    verifiedSkills: string[];
    detectedSkills: string[];
  };
  submission: {
    track: string;
    title: string;
    description: string;
    type: string;
    githubUrl?: string;
    liveDemoUrl?: string;
    uploadPath?: string;
    artifacts?: any[];
    status: string;
  };
  project?: {
    _id: string;
    projectName: string;
    description?: string;
    claimedTechnologies?: string[];
    githubUrl?: string;
    liveDemoUrl?: string;
    status: string;
    uploadPath?: string;
    createdAt: string;
  };
  projectAnalysis?: {
    _id: string;
    scores: any;
    inspections: any;
    verification: any;
    detectedTechnologies: string[];
    createdAt: string;
  };
  projectEvidence?: {
    _id: string;
    scores: any;
    aiAssessment: any;
    skills: any[];
    evidenceItems: any[];
    integritySignals: any;
    updatedAt: string;
  };
  challenge?: {
    _id: string;
    title: string;
    description: string;
    difficulty: string;
    track: string;
    careerArea?: string;
    requirements: string[];
    deliverables: string[];
    evaluationCriteria: string[];
    skillsTargeted: string[];
  };
  resume?: {
    _id: string;
    fileName: string;
    fileSize: number;
    documentType: string;
    extractedText?: string;
    detectedSkills: string[];
    roleRelevantSkills: string[];
    atsScore?: number;
    score10?: number;
    scoreBreakdown?: any;
    aiAssistanceSignals?: any;
    createdAt: string;
  };
  resumeAnalysis?: {
    _id: string;
    overallScore?: number;
    skills?: string[];
    atsCompatibility?: number;
    createdAt: string;
  };
  interview?: {
    _id: string;
    focus: string;
    targetLevel: string;
    status: string;
    turns: any[];
    finalReport?: any;
    detectedSkills: string[];
    startedAt: string;
    completedAt?: string;
  };
  technicalPractice?: {
    practices: any[];
    submissions: any[];
  };
  previousReviews?: {
    peerReviews: any[];
    priorExpertReviews: any[];
  };
  timeline: ITimelineEvent[];
  requirementMatches: IRequirementMatch[];
  evidenceSummary: IEvidenceSummary;
  suggestedImprovements: ISuggestedImprovement[];
  rubricAlignment: IRubricDimensionAlignment[];
  improvementReport: IImprovementReport;
}

// ─── Constants & Weights ──────────────────────────────────────────────────────

const RUBRIC_DIMENSIONS = [
  { key: 'workQuality', label: 'Work Quality', weight: 20, description: 'Depth, accuracy and quality of the deliverable' },
  { key: 'problemSolving', label: 'Problem Solving', weight: 15, description: 'Approach to breaking down and solving the problem' },
  { key: 'domainKnowledge', label: 'Domain Knowledge', weight: 15, description: 'Evidence of relevant domain expertise' },
  { key: 'communication', label: 'Communication', weight: 10, description: 'Clarity and structure of communication' },
  { key: 'documentation', label: 'Documentation', weight: 10, description: 'Quality of supporting documentation' },
  { key: 'creativityAndInitiative', label: 'Creativity & Initiative', weight: 10, description: 'Original thinking and going beyond requirements' },
  { key: 'aiAssessmentAlignment', label: 'AI Assessment / Interview', weight: 10, description: 'Alignment with automated benchmarks and interview signals' },
  { key: 'peerAndExpertReview', label: 'Peer & Expert Review', weight: 10, description: 'Overall impression from an expert perspective' }
];

function calculateWeightedScore(rubric: Record<string, { score: number }>): number {
  const weights: Record<string, number> = {
    workQuality: 0.20, problemSolving: 0.15, domainKnowledge: 0.15,
    communication: 0.10, documentation: 0.10, creativityAndInitiative: 0.10,
    aiAssessmentAlignment: 0.10, peerAndExpertReview: 0.10
  };
  let total = 0;
  for (const [dim, weight] of Object.entries(weights)) {
    total += (rubric[dim]?.score ?? 0) * weight;
  }
  return Math.round(total * 10) / 10;
}

// ─── Status Badges ────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status?: string }) {
  if (!status) return null;
  const map: Record<string, string> = {
    ASSIGNED: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    IN_REVIEW: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    COMPLETED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    CANCELLED: 'bg-slate-700 text-slate-400 border-slate-600',
    VERIFIED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    PARTIALLY_VERIFIED: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    NEEDS_RESUBMISSION: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    NEEDS_REVIEW: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    INSUFFICIENT_EVIDENCE: 'bg-red-500/10 text-red-400 border-red-500/20',
    SUPPORTED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    PARTIAL: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    MISSING: 'bg-red-500/10 text-red-400 border-red-500/20',
    TECHNICAL: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    NON_TECHNICAL: 'bg-purple-500/10 text-purple-400 border-purple-500/20'
  };
  return (
    <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${map[status] || 'bg-slate-700 text-slate-400 border-slate-600'}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}

function EmptyState({ icon: Icon, title, sub }: { icon: React.ElementType; title: string; sub: string }) {
  return (
    <div className="text-center py-16 bg-slate-900/30 border border-slate-800 rounded-xl">
      <Icon className="w-12 h-12 text-slate-600 mx-auto mb-3" />
      <h3 className="text-lg font-medium text-white">{title}</h3>
      <p className="text-slate-400 text-sm mt-1">{sub}</p>
    </div>
  );
}

// ─── 1. Dashboard Tab ─────────────────────────────────────────────────────────

function DashboardTab() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await api.get('/expert/dashboard');
      if (res.data?.success) setData(res.data.data);
      else setError('Failed to load dashboard');
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20">
      <Loader2 className="w-6 h-6 text-blue-600 animate-spin mb-3" />
      <p className="text-slate-500 text-[14px]">Loading dashboard...</p>
    </div>
  );

  if (error) return (
    <div className="p-4 bg-red-50 text-red-600 rounded-lg flex items-center gap-2 border border-red-200">
      <AlertCircle className="w-4 h-4 shrink-0" /> {error}
    </div>
  );

  return (
    <div className="space-y-10 max-w-6xl mx-auto py-8">
      
      {/* Header */}
      <div className="border-b border-slate-200 pb-6">
        <h1 className="text-[28px] font-semibold text-slate-900 tracking-tight">Expert Review Workspace</h1>
        <p className="text-[15px] text-slate-500 mt-1">Evaluate candidate submissions and manage your review pipeline.</p>
      </div>

      {/* Metrics */}
      <section>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div 
            onClick={() => navigate('/expert/reviews')}
            className="border-l-2 border-slate-200 pl-4 cursor-pointer hover:border-blue-300 transition-colors"
          >
            <div className="flex items-center gap-2 mb-1">
              <Inbox className="w-4 h-4 text-slate-400" />
              <span className="text-[13px] font-medium text-slate-500">Available Submissions</span>
            </div>
            <div className="text-3xl font-semibold text-slate-900">{data?.availableSubmissions ?? data?.stats?.availableSubmissions ?? 0}</div>
          </div>
          <div 
            onClick={() => navigate('/expert/reviews')}
            className="border-l-2 border-slate-200 pl-4 cursor-pointer hover:border-blue-300 transition-colors"
          >
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-slate-400" />
              <span className="text-[13px] font-medium text-slate-500">Assigned Reviews</span>
            </div>
            <div className="text-3xl font-semibold text-slate-900">{data?.pendingReviews ?? 0}</div>
          </div>
          <div 
            onClick={() => navigate('/expert/reviews')}
            className="border-l-2 border-blue-500 pl-4 cursor-pointer hover:border-blue-600 transition-colors"
          >
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle className="w-4 h-4 text-blue-500" />
              <span className="text-[13px] font-medium text-slate-500">In Review</span>
            </div>
            <div className="text-3xl font-semibold text-slate-900">{data?.inReviewCount ?? data?.stats?.inReviewCount ?? 0}</div>
          </div>
          <div 
            onClick={() => navigate('/expert/review-history')}
            className="border-l-2 border-slate-200 pl-4 cursor-pointer hover:border-blue-300 transition-colors"
          >
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="w-4 h-4 text-slate-400" />
              <span className="text-[13px] font-medium text-slate-500">Completed Audits</span>
            </div>
            <div className="text-3xl font-semibold text-slate-900">{data?.completedReviews ?? 0}</div>
          </div>
        </div>
      </section>

      {/* Recent Assignments */}
      <section>
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-200">
          <h2 className="text-[15px] font-semibold text-slate-900">Recent Assignments</h2>
          <button onClick={() => navigate('/expert/assigned')} className="text-[13px] font-medium text-blue-600 hover:text-blue-700">
            View all ({data?.pendingReviews ?? 0})
          </button>
        </div>
        
        {data?.recentAssignments?.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-xl border border-slate-200">
            <ClipboardList className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <h3 className="text-[14px] font-medium text-slate-900">No pending reviews</h3>
            <p className="text-[13px] text-slate-500 mt-1">You have no reviews requiring action.</p>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-5 py-3 text-[12px] font-medium text-slate-500">Submission</th>
                  <th className="px-5 py-3 text-[12px] font-medium text-slate-500">Candidate</th>
                  <th className="px-5 py-3 text-[12px] font-medium text-slate-500">Assigned</th>
                  <th className="px-5 py-3 text-[12px] font-medium text-slate-500 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {data?.recentAssignments?.map((r: any) => (
                  <tr key={r._id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-medium text-[14px] text-slate-900">{r.submissionTitle || 'Submission'}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <StatusBadge status={r.status} />
                        <StatusBadge status={r.track} />
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-medium text-[13px] text-slate-900">{r.candidate?.firstName} {r.candidate?.lastName}</p>
                    </td>
                    <td className="px-5 py-4 text-[13px] text-slate-600">
                      {new Date(r.assignedAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => navigate(`/expert/review/${r._id}`)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-[13px] transition-colors"
                      >
                        Evaluate
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Recent Completed */}
      {data?.recentCompletedReviews?.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-200">
            <h2 className="text-[15px] font-semibold text-slate-900">Recently Completed</h2>
            <button onClick={() => navigate('/expert/history')} className="text-[13px] font-medium text-blue-600 hover:text-blue-700">
              Full history
            </button>
          </div>
          
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-5 py-3 text-[12px] font-medium text-slate-500">Submission</th>
                  <th className="px-5 py-3 text-[12px] font-medium text-slate-500">Candidate</th>
                  <th className="px-5 py-3 text-[12px] font-medium text-slate-500">Score</th>
                  <th className="px-5 py-3 text-[12px] font-medium text-slate-500 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {data.recentCompletedReviews.map((r: any) => (
                  <tr key={r._id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-medium text-[14px] text-slate-900">{r.submissionTitle}</p>
                      <div className="mt-1">
                        {r.verificationStatus && <StatusBadge status={r.verificationStatus} />}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-medium text-[13px] text-slate-900">{r.candidate?.firstName} {r.candidate?.lastName}</p>
                      <p className="text-[12px] text-slate-500 mt-0.5">{r.completedAt ? new Date(r.completedAt).toLocaleDateString() : '—'}</p>
                    </td>
                    <td className="px-5 py-4">
                      {r.overallScore != null ? (
                        <span className="font-semibold text-emerald-600 text-[14px]">{r.overallScore}/100</span>
                      ) : (
                        <span className="text-slate-400 text-[13px]">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => navigate(`/expert/review/${r._id}`)}
                        className="inline-flex items-center gap-1 text-[13px] font-medium text-slate-600 hover:text-blue-600 transition-colors"
                      >
                        View Review <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

// ─── 2. Assigned Reviews Tab ──────────────────────────────────────────────────

function AssignedReviewsTab({ onOpenReview }: { onOpenReview: (id: string) => void }) {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterTrack, setFilterTrack] = useState<'ALL' | 'TECHNICAL' | 'NON_TECHNICAL'>('ALL');
  const [viewSubTab, setViewSubTab] = useState<'ASSIGNED' | 'AVAILABLE'>('ASSIGNED');

  // Assignment Modal & Available Submissions State
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [unassignedList, setUnassignedList] = useState<any[]>([]);
  const [loadingUnassigned, setLoadingUnassigned] = useState(false);
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [assignMsg, setAssignMsg] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await api.get('/expert/reviews');
      if (res.data?.success) setReviews(res.data.data);
      else setError('Failed to load assigned reviews');
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to load assigned reviews');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadUnassigned = useCallback(async () => {
    setLoadingUnassigned(true);
    setAssignMsg('');
    try {
      const res = await api.get('/expert/unassigned');
      if (res.data?.success) setUnassignedList(res.data.data);
    } catch (e: any) {
      console.error('Failed to fetch unassigned submissions', e);
    } finally {
      setLoadingUnassigned(false);
    }
  }, []);

  useEffect(() => {
    load();
    loadUnassigned();
  }, [load, loadUnassigned]);

  const handleOpenAssignModal = () => {
    setShowAssignModal(true);
    loadUnassigned();
  };

  const handleAssignToMe = async (item: any) => {
    setAssigningId(item.id);
    setAssignMsg('');
    try {
      const targetId = item.submissionId || item.id || item.reviewId;
      const res = await api.post(`/expert/submissions/${targetId}/assign-me`, {
        track: item.track,
        type: item.type
      });
      if (res.data?.success) {
        setAssignMsg(`"${item.title}" successfully assigned to you!`);
        await load();
        setUnassignedList(prev => prev.filter(u => u.id !== item.id && u.submissionId !== targetId));
        setTimeout(() => {
          setAssignMsg('');
          setViewSubTab('ASSIGNED');
        }, 1200);
      }
    } catch (e: any) {
      alert(e.response?.data?.message || 'Failed to assign review');
    } finally {
      setAssigningId(null);
    }
  };

  const filtered = reviews.filter(r => {
    const matchesTrack = filterTrack === 'ALL' || r.track === filterTrack;
    const q = search.toLowerCase();
    const candidateName = `${r.candidate?.firstName || ''} ${r.candidate?.lastName || ''}`.toLowerCase();
    const title = (r.submissionTitle || '').toLowerCase();
    return matchesTrack && (candidateName.includes(q) || title.includes(q));
  });

  const filteredUnassigned = unassignedList.filter(u => {
    const matchesTrack = filterTrack === 'ALL' || u.track === filterTrack;
    const q = search.toLowerCase();
    const candidateName = `${u.candidate?.firstName || ''} ${u.candidate?.lastName || ''}`.toLowerCase();
    const title = (u.title || '').toLowerCase();
    return matchesTrack && (candidateName.includes(q) || title.includes(q));
  });

  if (loading && reviews.length === 0) return (
    <div className="flex flex-col items-center justify-center py-20">
      <Loader2 className="w-6 h-6 text-blue-600 animate-spin mb-3" />
      <p className="text-[14px] text-slate-500">Loading reviews workspace...</p>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto py-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-[28px] font-semibold text-slate-900 tracking-tight">Review Pipeline</h1>
          <p className="text-[15px] text-slate-500 mt-1">
            Claim available submissions from the candidate queue and evaluate your assigned deliverables.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search candidate or title..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-[13px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 w-[220px]"
            />
          </div>
          
          <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            {(['ALL', 'TECHNICAL', 'NON_TECHNICAL'] as const).map(t => (
              <button
                key={t}
                onClick={() => setFilterTrack(t)}
                className={`px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors ${
                  filterTrack === t ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {t === 'ALL' ? 'All' : t === 'TECHNICAL' ? 'Tech' : 'Non-Tech'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Sub-tab view switcher */}
      <div className="flex items-center gap-2 mb-6 border-b border-slate-200 pb-3">
        <button
          onClick={() => setViewSubTab('ASSIGNED')}
          className={`px-4 py-2 rounded-lg text-[13px] font-medium transition-colors flex items-center gap-2 ${
            viewSubTab === 'ASSIGNED'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          Assigned to Me ({reviews.length})
        </button>
        <button
          onClick={() => {
            setViewSubTab('AVAILABLE');
            loadUnassigned();
          }}
          className={`px-4 py-2 rounded-lg text-[13px] font-medium transition-colors flex items-center gap-2 ${
            viewSubTab === 'AVAILABLE'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
          }`}
        >
          <Inbox className="w-4 h-4" />
          Available Submissions Queue ({unassignedList.length})
        </button>
      </div>

      {assignMsg && (
        <div className="mb-6 p-4 bg-emerald-50 text-emerald-700 rounded-lg flex items-center gap-2 border border-emerald-200 text-[13px]">
          <CheckCircle2 className="w-4 h-4 shrink-0" /> {assignMsg}
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg flex items-center gap-2 border border-red-200 text-[13px]">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {/* VIEW 1: ASSIGNED REVIEWS */}
      {viewSubTab === 'ASSIGNED' && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          {reviews.length === 0 ? (
            <div className="text-center py-12 px-4">
              <ClipboardList className="w-8 h-8 text-slate-300 mx-auto mb-3" />
              <h3 className="text-[15px] font-medium text-slate-900">No submissions currently assigned to you</h3>
              <p className="text-[14px] text-slate-500 mt-1 max-w-sm mx-auto">
                Switch to "Available Submissions Queue" to claim an active candidate deliverable for evaluation.
              </p>
              <button
                onClick={() => setViewSubTab('AVAILABLE')}
                className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[13px] font-medium transition-colors shadow-sm inline-flex items-center gap-1.5"
              >
                <Inbox className="w-4 h-4" /> View Available Submissions
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-[15px] font-medium text-slate-900">No matching reviews</h3>
              <p className="text-[14px] text-slate-500 mt-1">No assigned reviews match your search or filter.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-5 py-3 text-[12px] font-medium text-slate-500">Candidate</th>
                  <th className="px-5 py-3 text-[12px] font-medium text-slate-500">Submission</th>
                  <th className="px-5 py-3 text-[12px] font-medium text-slate-500">Track</th>
                  <th className="px-5 py-3 text-[12px] font-medium text-slate-500">Assigned</th>
                  <th className="px-5 py-3 text-[12px] font-medium text-slate-500">Status</th>
                  <th className="px-5 py-3 text-[12px] font-medium text-slate-500 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => (
                  <tr key={r._id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-medium text-[14px] text-slate-900">{r.candidate?.firstName} {r.candidate?.lastName}</p>
                      <p className="text-[12px] text-slate-500 mt-0.5">{r.candidate?.email}</p>
                    </td>
                    <td className="px-5 py-4 max-w-[200px]">
                      <p className="font-medium text-[14px] text-slate-900 truncate">{r.submissionTitle || 'Submission'}</p>
                      <p className="text-[12px] text-slate-500 truncate mt-0.5">{r.submissionDescription || 'No description provided.'}</p>
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={r.track} />
                    </td>
                    <td className="px-5 py-4 text-[13px] text-slate-600">
                      {new Date(r.assignedAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => onOpenReview(r._id)}
                        className="inline-flex items-center justify-center px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-medium rounded-lg transition-colors border border-blue-600 shadow-sm"
                      >
                        Evaluate
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* VIEW 2: AVAILABLE SUBMISSIONS QUEUE */}
      {viewSubTab === 'AVAILABLE' && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          {loadingUnassigned ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="w-6 h-6 text-blue-600 animate-spin mb-3" />
              <p className="text-[13px] text-slate-500">Checking for available candidate submissions...</p>
            </div>
          ) : unassignedList.length === 0 ? (
            <div className="text-center py-16 px-4">
              <Inbox className="w-8 h-8 text-slate-300 mx-auto mb-3" />
              <h3 className="text-[15px] font-medium text-slate-900">All submissions are currently claimed</h3>
              <p className="text-[14px] text-slate-500 mt-1 max-w-sm mx-auto">
                As soon as a candidate submits a project or challenge deliverable, it will appear here for you to claim.
              </p>
            </div>
          ) : filteredUnassigned.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-[15px] font-medium text-slate-900">No matching submissions</h3>
              <p className="text-[14px] text-slate-500 mt-1">No unassigned submissions match your filter.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-5 py-3 text-[12px] font-medium text-slate-500">Candidate</th>
                  <th className="px-5 py-3 text-[12px] font-medium text-slate-500">Submission Deliverable</th>
                  <th className="px-5 py-3 text-[12px] font-medium text-slate-500">Track</th>
                  <th className="px-5 py-3 text-[12px] font-medium text-slate-500">Type</th>
                  <th className="px-5 py-3 text-[12px] font-medium text-slate-500">Status</th>
                  <th className="px-5 py-3 text-[12px] font-medium text-slate-500 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredUnassigned.map(item => (
                  <tr key={item.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-medium text-[14px] text-slate-900">
                        {item.candidate?.firstName} {item.candidate?.lastName}
                      </p>
                      <p className="text-[12px] text-slate-500 mt-0.5">{item.candidate?.email || 'N/A'}</p>
                    </td>
                    <td className="px-5 py-4 max-w-[220px]">
                      <p className="font-medium text-[14px] text-slate-900 truncate">{item.title}</p>
                      <p className="text-[12px] text-slate-500 truncate mt-0.5">{item.description || 'Candidate deliverable awaiting audit.'}</p>
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={item.track} />
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {item.type?.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        Awaiting Expert Review
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => handleAssignToMe(item)}
                        disabled={assigningId === item.id}
                        className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[13px] font-medium transition-colors shadow-sm disabled:opacity-50"
                      >
                        {assigningId === item.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                        Assign Me
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {showAssignModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-[16px] font-semibold text-slate-900">Assign Candidate Submission</h3>
                <p className="text-[13px] text-slate-500 mt-0.5">Select an unassigned candidate deliverable to evaluate.</p>
              </div>
              <button onClick={() => setShowAssignModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-md hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {assignMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-[13px] flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" /> {assignMsg}
                </div>
              )}

              {loadingUnassigned ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 text-blue-600 animate-spin mb-3" />
                  <p className="text-[13px] text-slate-500">Loading unassigned candidate deliverables...</p>
                </div>
              ) : unassignedList.length === 0 ? (
                <div className="text-center py-12">
                  <ClipboardList className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                  <p className="text-[14px] text-slate-500">All active candidate submissions are currently assigned.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {unassignedList.map(item => (
                    <div key={item.id} className="p-4 bg-white border border-slate-200 rounded-lg flex items-center justify-between gap-4 shadow-sm hover:border-slate-300 transition-colors">
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900 text-[14px] truncate">{item.title}</span>
                          <StatusBadge status={item.track} />
                        </div>
                        <p className="text-[13px] text-slate-500 line-clamp-1">{item.description || 'No description'}</p>
                        <p className="text-[12px] text-slate-400 mt-1">
                          Candidate: <span className="font-medium text-slate-700">{item.candidate?.firstName} {item.candidate?.lastName}</span> ({item.candidate?.email || 'N/A'})
                        </p>
                      </div>
                      <button
                        onClick={() => handleAssignToMe(item)}
                        disabled={assigningId === item.id}
                        className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[13px] font-medium shrink-0 flex items-center gap-1.5 disabled:opacity-50 transition-colors shadow-sm"
                      >
                        {assigningId === item.id && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                        Assign to Me
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button 
                onClick={() => setShowAssignModal(false)} 
                className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-[13px] font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── 3. Comprehensive Evidence-Grounded Review Workbench ──────────────────────

function ReviewWorkbench({ reviewId, onBack }: { reviewId: string; onBack: () => void }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [context, setContext] = useState<IEvidenceContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // AI Evidence Assistant State
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [analyzing, setAnalyzing] = useState(false);

  // Form states: Expert Review
  const [strengths, setStrengths] = useState('');
  const [weaknesses, setWeaknesses] = useState('');
  const [improvements, setImprovements] = useState('');
  const [whatWasDoneWell, setWhatWasDoneWell] = useState('');
  const [whatNeedsImprovement, setWhatNeedsImprovement] = useState('');
  const [recommendedImprovements, setRecommendedImprovements] = useState('');
  const [expertComments, setExpertComments] = useState('');
  const [evidenceNotes, setEvidenceNotes] = useState('');

  // 8-Dimension Rubric
  const [rubric, setRubric] = useState<Record<string, { score: number; comment: string; evidenceNote: string }>>({});
  const [verificationStatus, setVerificationStatus] = useState('PARTIALLY_VERIFIED');
  const [feedback, setFeedback] = useState('');
  const [internalNotes, setInternalNotes] = useState('');

  // Interactive suggestions state
  const [suggestions, setSuggestions] = useState<ISuggestedImprovement[]>([]);
  const [newRecommendation, setNewRecommendation] = useState('');
  const [customRecommendations, setCustomRecommendations] = useState<string[]>([]);

  // Improvement report state
  const [improvementReport, setImprovementReport] = useState<IImprovementReport>({
    doneWell: '',
    needsImprovement: '',
    criticalGaps: '',
    nextSteps: []
  });
  const [newStepText, setNewStepText] = useState('');

  const loadContext = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await api.get(`/expert/reviews/${reviewId}/context`);
      if (res.data?.success) {
        const ctx: IEvidenceContext = res.data.data;
        setContext(ctx);

        // Prepopulate rubric
        const initialRubric: Record<string, { score: number; comment: string; evidenceNote: string }> = {};
        ctx.rubricAlignment.forEach(dim => {
          initialRubric[dim.key] = {
            score: dim.expertScore > 0 ? dim.expertScore : 0,
            comment: dim.expertComment || '',
            evidenceNote: dim.evidenceNote || ''
          };
        });
        setRubric(initialRubric);

        if (ctx.review.strengths) setStrengths(ctx.review.strengths);
        if (ctx.review.weaknesses) setWeaknesses(ctx.review.weaknesses);
        if (ctx.review.improvements) setImprovements(ctx.review.improvements);
        if (ctx.review.whatWasDoneWell) setWhatWasDoneWell(ctx.review.whatWasDoneWell);
        else if ((ctx.review as any).improvementReport?.doneWell) setWhatWasDoneWell((ctx.review as any).improvementReport.doneWell);
        if (ctx.review.whatNeedsImprovement) setWhatNeedsImprovement(ctx.review.whatNeedsImprovement);
        else if ((ctx.review as any).improvementReport?.needsImprovement) setWhatNeedsImprovement((ctx.review as any).improvementReport.needsImprovement);
        if (ctx.review.recommendedImprovements) setRecommendedImprovements(ctx.review.recommendedImprovements);
        if (ctx.review.expertComments) setExpertComments(ctx.review.expertComments);
        else if (ctx.review.feedback) setExpertComments(ctx.review.feedback);
        if (ctx.review.evidenceNotes) setEvidenceNotes(ctx.review.evidenceNotes);
        else if (ctx.review.internalNotes) setEvidenceNotes(ctx.review.internalNotes);

        if (ctx.review.verificationStatus) setVerificationStatus(ctx.review.verificationStatus);
        if (ctx.review.feedback) setFeedback(ctx.review.feedback);
        if (ctx.review.internalNotes) setInternalNotes(ctx.review.internalNotes);

        setSuggestions(ctx.suggestedImprovements || []);
        setCustomRecommendations(ctx.review.improvementRecommendations || []);
        if (ctx.improvementReport) setImprovementReport(ctx.improvementReport);
        if ((ctx.review as any).aiAnalysis) setAiAnalysis((ctx.review as any).aiAnalysis);
      } else {
        setError('Failed to load evidence context');
      }
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to load evidence context');
    } finally {
      setLoading(false);
    }
  }, [reviewId]);

  useEffect(() => { loadContext(); }, [loadContext]);

  const computedScore = calculateWeightedScore(rubric);
  const isCompleted = context?.review?.status === 'COMPLETED';
  const isHistoryMode = location.pathname.includes('/review-history') || isCompleted;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isCompleted) {
      setError('This review has already been submitted and cannot be modified.');
      return;
    }
    if (!verificationStatus) {
      setError('Please choose a Verification Decision.');
      return;
    }
    for (const dim of RUBRIC_DIMENSIONS) {
      const score = rubric[dim.key]?.score;
      if (score === undefined || score < 0 || score > 100) {
        setError(`Please assign a valid score between 0 and 100 for ${dim.label}.`);
        return;
      }
    }

    setSubmitting(true); setError('');
    const accepted = suggestions.filter(s => s.status === 'ACCEPTED').map(s => ({ id: s.id, text: s.title, expertNote: s.expertNote || '' }));
    const modified = suggestions.filter(s => s.status === 'MODIFIED').map(s => ({ id: s.id, originalText: s.title, modifiedText: s.modifiedText || s.title }));
    const rejected = suggestions.filter(s => s.status === 'REJECTED').map(s => ({ id: s.id, text: s.title, reason: s.rejectionReason || '' }));
    const resolvedFeedback = expertComments.trim() || feedback.trim() || 'Review completed successfully.';

    try {
      const res = await api.post(`/expert/reviews/${reviewId}/submit`, {
        rubric,
        verificationStatus,
        strengths: strengths.trim(),
        weaknesses: weaknesses.trim(),
        improvements: (improvements.trim() || recommendedImprovements.trim()),
        whatWasDoneWell: whatWasDoneWell.trim(),
        whatNeedsImprovement: whatNeedsImprovement.trim(),
        recommendedImprovements: (recommendedImprovements.trim() || improvements.trim()),
        expertComments: resolvedFeedback,
        evidenceNotes: evidenceNotes.trim() || internalNotes.trim(),
        feedback: resolvedFeedback,
        internalNotes: evidenceNotes.trim() || internalNotes.trim(),
        acceptedSuggestions: accepted,
        modifiedSuggestions: modified,
        rejectedSuggestions: rejected,
        improvementRecommendations: customRecommendations,
        improvementReport: {
          ...improvementReport,
          doneWell: whatWasDoneWell.trim() || improvementReport.doneWell,
          needsImprovement: whatNeedsImprovement.trim() || improvementReport.needsImprovement
        },
        requirementMatches: context?.requirementMatches,
        evidenceSummarySnapshot: context?.evidenceSummary
      });

      if (res.data?.success) {
        setSuccessMsg(`Review successfully completed! Final Expert Score: ${res.data.data.overallScore}/100.`);
        setTimeout(() => {
          navigate('/expert/review-history');
        }, 1000);
      }
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRunAiAnalysis = async () => {
    setAnalyzing(true);
    try {
      const res = await api.post(`/expert/reviews/${reviewId}/analyze`);
      if (res.data?.success) setAiAnalysis(res.data.data);
    } catch (e: any) {
      alert(e.response?.data?.message || 'Failed to run AI evidence analysis');
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-24 space-y-3">
      <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      <p className="text-slate-900 font-medium">Aggregating Candidate Evidence...</p>
    </div>
  );

  if (error && !context) return (
    <div className="space-y-4 max-w-6xl mx-auto py-8">
      <button onClick={onBack} className="text-[13px] text-blue-600 hover:underline">← Back</button>
      <div className="p-4 bg-red-50 text-red-600 rounded-lg border border-red-200">{error}</div>
    </div>
  );

  if (!context) return null;
  const isNonTech = context.submission.track === 'NON_TECHNICAL';

  return (
    <div className="max-w-[1400px] mx-auto py-8 px-4 sm:px-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-200">
        <div>
          <button onClick={onBack} className="text-[13px] text-slate-500 hover:text-slate-900 mb-2 flex items-center gap-1 transition-colors">← Back to {isHistoryMode ? 'History' : 'Queue'}</button>
          <div className="flex items-center gap-3">
            <h1 className="text-[24px] font-semibold text-slate-900">{context.submission.title}</h1>
            <StatusBadge status={context.review.status} />
            <StatusBadge status={context.submission.track} />
          </div>
          <p className="text-[14px] text-slate-500 mt-1">
            Candidate: <span className="font-medium text-slate-900">{context.candidate.name}</span> ({context.candidate.email})
          </p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-semibold text-slate-900">
            {isCompleted ? `${context.review.overallScore}` : `${computedScore}`}<span className="text-xl text-slate-400">/100</span>
          </div>
          <p className="text-[12px] font-medium text-slate-500 uppercase tracking-wider mt-1">
            {isCompleted ? 'Final Score' : 'Calculated Score'}
          </p>
        </div>
      </div>

      {isCompleted && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2 text-[14px]">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
            <span>This review was completed and verified on <strong>{context.review.completedAt ? new Date(context.review.completedAt).toLocaleString() : ''}</strong>.</span>
          </div>
          <StatusBadge status={context.review.verificationStatus} />
        </div>
      )}
      
      {successMsg && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg flex items-center gap-2 text-[14px]">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" /> {successMsg}
        </div>
      )}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg flex items-center gap-2 text-[14px]">
          <AlertCircle className="w-5 h-5 shrink-0" /> {error}
        </div>
      )}

      {/* 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: EVIDENCE & AI */}
        <div className="lg:col-span-7 space-y-8">
          
          {/* Submission Details */}
          <section className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <h2 className="text-[16px] font-semibold text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-400" /> Submission Evidence
            </h2>
            <div className="space-y-4">
              {context.submission.description && (
                <div>
                  <h3 className="text-[13px] font-medium text-slate-500 mb-1">Description</h3>
                  <p className="text-[14px] text-slate-900 whitespace-pre-wrap">{context.submission.description}</p>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                {context.submission.githubUrl && (
                  <div>
                    <h3 className="text-[13px] font-medium text-slate-500 mb-1">Repository</h3>
                    <a href={context.submission.githubUrl} target="_blank" rel="noopener noreferrer" className="text-[14px] text-blue-600 hover:underline flex items-center gap-1">
                      View Codebase <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
                {context.submission.liveDemoUrl && (
                  <div>
                    <h3 className="text-[13px] font-medium text-slate-500 mb-1">Live URL</h3>
                    <a href={context.submission.liveDemoUrl} target="_blank" rel="noopener noreferrer" className="text-[14px] text-blue-600 hover:underline flex items-center gap-1">
                      View Live Demo <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>

              {((context.submission.artifacts?.length ?? 0) > 0 || context.resume?.fileName) && (
                <div>
                  <h3 className="text-[13px] font-medium text-slate-500 mb-2">Attached Documents</h3>
                  <div className="space-y-2">
                    {context.submission.artifacts?.map((art: any, i: number) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-slate-400" />
                          <span className="text-[13px] font-medium text-slate-900">{art.fileName || 'Document'}</span>
                        </div>
                        {art.fileUrl && <a href={art.fileUrl} target="_blank" rel="noopener noreferrer" className="text-[12px] text-blue-600 hover:underline">View</a>}
                      </div>
                    ))}
                    {context.resume?.fileName && (
                      <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-slate-400" />
                          <span className="text-[13px] font-medium text-slate-900">{context.resume.fileName} (Resume)</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Extracted Skills */}
          <section className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <h2 className="text-[16px] font-semibold text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
              <Code2 className="w-4 h-4 text-slate-400" /> Detected Skills
            </h2>
            <div className="flex flex-wrap gap-2">
              {context.skills.detectedSkills.length === 0 ? (
                <span className="text-[13px] text-slate-500 italic">No skills explicitly detected in telemetry.</span>
              ) : (
                context.skills.detectedSkills.map(s => (
                  <span key={s} className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md text-[13px] border border-slate-200">{s}</span>
                ))
              )}
            </div>
          </section>

          {/* AI Analysis */}
          <section className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
              <h2 className="text-[16px] font-semibold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-slate-400" /> AI Evidence Assistant
              </h2>
              <button
                onClick={handleRunAiAnalysis}
                disabled={analyzing}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-[13px] font-medium transition-colors flex items-center gap-1.5 border border-slate-200"
              >
                {analyzing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                {aiAnalysis ? 'Refresh Analysis' : 'Run Analysis'}
              </button>
            </div>

            {!aiAnalysis && !analyzing && (
              <div className="text-center py-8">
                <p className="text-[14px] text-slate-500 mb-4">Run the AI assistant to aggregate telemetry, parse AST, and identify gaps.</p>
                <button
                  onClick={handleRunAiAnalysis}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[13px] font-medium shadow-sm transition-colors"
                >
                  Analyze Evidence Now
                </button>
              </div>
            )}
            {analyzing && !aiAnalysis && (
              <div className="flex flex-col items-center justify-center py-8">
                <Loader2 className="w-6 h-6 text-blue-600 animate-spin mb-3" />
                <p className="text-[13px] text-slate-500">Processing repository & telemetry...</p>
              </div>
            )}
            
            {aiAnalysis && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-[14px] font-semibold text-slate-900 mb-2">Capabilities Demonstrated</h3>
                  <ul className="list-disc pl-5 space-y-1 text-[13px] text-slate-700">
                    {aiAnalysis.demonstratedCapabilities?.map((c: string, i: number) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-[14px] font-semibold text-slate-900 mb-2">Supporting Evidence Found</h3>
                  <div className="space-y-2">
                    {aiAnalysis.supportingEvidence?.map((e: any, i: number) => (
                      <div key={i} className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-[13px] font-medium text-slate-900">{e.claim}</span>
                          <span className="text-[11px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded">{e.citation}</span>
                        </div>
                        <p className="text-[12px] text-slate-500">{e.source}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-[14px] font-semibold text-slate-900 mb-2">Missing Evidence / Red Flags</h3>
                  {aiAnalysis.missingEvidence?.length > 0 ? (
                    <div className="space-y-2">
                      {aiAnalysis.missingEvidence.map((m: any, i: number) => (
                        <div key={i} className="p-3 bg-red-50 rounded-lg border border-red-100 text-red-900 text-[13px]">
                          <strong>{m.requirement}:</strong> {m.missingReason}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[13px] text-slate-500 italic">No critical missing evidence flagged by AI.</p>
                  )}
                </div>
              </div>
            )}
          </section>
        </div>

        {/* RIGHT COLUMN: EXPERT EVALUATION FORM */}
        <div className="lg:col-span-5">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm sticky top-6">
            <h2 className="text-[18px] font-semibold text-slate-900 mb-6 flex items-center gap-2">
              <Award className="w-5 h-5 text-blue-600" /> Expert Evaluation
            </h2>
            
            <div className="space-y-6">
              {/* Verification Decision */}
              <div>
                <label className="block text-[13px] font-medium text-slate-700 mb-2">Final Verification Decision <span className="text-red-500">*</span></label>
                <select
                  value={verificationStatus}
                  onChange={(e) => setVerificationStatus(e.target.value)}
                  disabled={isCompleted}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-[14px] text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-500"
                >
                  <option value="">Select a decision...</option>
                  <option value="VERIFIED">Verified (Pass)</option>
                  <option value="PARTIALLY_VERIFIED">Partially Verified (Borderline)</option>
                  <option value="NEEDS_RESUBMISSION">Needs Resubmission (Incomplete)</option>
                  <option value="INSUFFICIENT_EVIDENCE">Insufficient Evidence (Fail)</option>
                </select>
              </div>

              {/* Rubric Scoring */}
              <div>
                <label className="block text-[13px] font-medium text-slate-700 mb-3 border-b border-slate-100 pb-2">Rubric Scoring (0-100)</label>
                <div className="space-y-3">
                  {RUBRIC_DIMENSIONS.map(dim => (
                    <div key={dim.key} className="flex items-center justify-between group">
                      <div className="flex-1 pr-4">
                        <p className="text-[13px] font-medium text-slate-900">{dim.label}</p>
                        <p className="text-[11px] text-slate-500">{dim.description}</p>
                      </div>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={rubric[dim.key]?.score ?? ''}
                        onChange={(e) => setRubric(prev => ({
                          ...prev,
                          [dim.key]: { ...prev[dim.key], score: parseInt(e.target.value) || 0 }
                        }))}
                        disabled={isCompleted}
                        className="w-20 text-right bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-[14px] font-mono focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-500"
                        placeholder="0"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Text Feedback */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <div>
                  <label className="block text-[13px] font-medium text-slate-700 mb-1">Overall Assessment / Comments</label>
                  <textarea
                    value={expertComments}
                    onChange={(e) => setExpertComments(e.target.value)}
                    disabled={isCompleted}
                    rows={3}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-slate-50"
                    placeholder="Comprehensive evaluation summary and rationale..."
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[13px] font-medium text-slate-700 mb-1">Key Strengths</label>
                    <textarea
                      value={strengths}
                      onChange={(e) => setStrengths(e.target.value)}
                      disabled={isCompleted}
                      rows={2}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-slate-50"
                      placeholder="Primary strengths observed..."
                    />
                  </div>
                  <div>
                    <label className="block text-[13px] font-medium text-slate-700 mb-1">Key Weaknesses</label>
                    <textarea
                      value={weaknesses}
                      onChange={(e) => setWeaknesses(e.target.value)}
                      disabled={isCompleted}
                      rows={2}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-slate-50"
                      placeholder="Areas of concern or missing depth..."
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[13px] font-medium text-slate-700 mb-1">What was done well?</label>
                    <textarea
                      value={whatWasDoneWell}
                      onChange={(e) => setWhatWasDoneWell(e.target.value)}
                      disabled={isCompleted}
                      rows={2}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-slate-50"
                      placeholder="Specific deliverables or code done well..."
                    />
                  </div>
                  <div>
                    <label className="block text-[13px] font-medium text-slate-700 mb-1">What needs improvement?</label>
                    <textarea
                      value={whatNeedsImprovement}
                      onChange={(e) => setWhatNeedsImprovement(e.target.value)}
                      disabled={isCompleted}
                      rows={2}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-slate-50"
                      placeholder="Specific gaps or errors..."
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-slate-700 mb-1">Recommended Improvements</label>
                  <textarea
                    value={recommendedImprovements}
                    onChange={(e) => setRecommendedImprovements(e.target.value)}
                    disabled={isCompleted}
                    rows={2}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-slate-50"
                    placeholder="Actionable steps the candidate should take to improve..."
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-slate-700 mb-1">Additional Notes / Internal Audit Notes</label>
                  <textarea
                    value={internalNotes}
                    onChange={(e) => setInternalNotes(e.target.value)}
                    disabled={isCompleted}
                    rows={2}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-slate-100"
                    placeholder="Private audit verification notes..."
                  />
                </div>
              </div>

              {!isCompleted && (
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[14px] font-medium shadow-sm transition-colors flex items-center justify-center gap-2 mt-6 disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {submitting ? 'Submitting Review...' : 'Complete & Publish Review'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── 4. Review History Tab ────────────────────────────────────────────────────

function HistoryTab({ onOpenReview }: { onOpenReview: (id: string) => void }) {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterTrack, setFilterTrack] = useState<'ALL' | 'TECHNICAL' | 'NON_TECHNICAL'>('ALL');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await api.get('/expert/review-history');
      if (res.data?.success) setReviews(res.data.data);
      else setError('Failed to load review history');
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to load review history');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = reviews.filter(r => {
    const matchesTrack = filterTrack === 'ALL' || r.track === filterTrack;
    const q = search.toLowerCase();
    const candidateName = `${r.candidate?.firstName || ''} ${r.candidate?.lastName || ''}`.toLowerCase();
    const title = (r.submissionTitle || r.project?.projectName || r.challengeSubmission?.workTitle || r.nonTechProofOfWork?.title || '').toLowerCase();
    return matchesTrack && (candidateName.includes(q) || title.includes(q));
  });

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20">
      <Loader2 className="w-6 h-6 text-blue-600 animate-spin mb-3" />
      <p className="text-[14px] text-slate-500">Loading completed reviews history...</p>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-[28px] font-semibold text-slate-900 tracking-tight">Review History</h1>
          <p className="text-[15px] text-slate-500 mt-1">Archived evaluations and completed candidate audits.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search candidate or title..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-[13px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 w-[240px]"
            />
          </div>
          
          <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            {(['ALL', 'TECHNICAL', 'NON_TECHNICAL'] as const).map(t => (
              <button
                key={t}
                onClick={() => setFilterTrack(t)}
                className={`px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors ${
                  filterTrack === t ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {t === 'ALL' ? 'All' : t === 'TECHNICAL' ? 'Tech' : 'Non-Tech'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg flex items-center gap-2 border border-red-200">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {reviews.length === 0 ? (
          <div className="text-center py-12 px-4">
            <History className="w-8 h-8 text-slate-300 mx-auto mb-3" />
            <h3 className="text-[15px] font-medium text-slate-900">No completed reviews</h3>
            <p className="text-[14px] text-slate-500 mt-1 max-w-sm mx-auto">
              Completed submissions will automatically appear here once you finish evaluating them.
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-[15px] font-medium text-slate-900">No matching reviews</h3>
            <p className="text-[14px] text-slate-500 mt-1">No completed reviews match your search or filter.</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-5 py-3 text-[12px] font-medium text-slate-500">Candidate</th>
                <th className="px-5 py-3 text-[12px] font-medium text-slate-500">Submission</th>
                <th className="px-5 py-3 text-[12px] font-medium text-slate-500">Score</th>
                <th className="px-5 py-3 text-[12px] font-medium text-slate-500">Decision</th>
                <th className="px-5 py-3 text-[12px] font-medium text-slate-500">Completed</th>
                <th className="px-5 py-3 text-[12px] font-medium text-slate-500 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r._id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-4">
                    <p className="font-medium text-[14px] text-slate-900">{r.candidate?.firstName} {r.candidate?.lastName}</p>
                    <p className="text-[12px] text-slate-500 mt-0.5">{r.candidate?.email}</p>
                  </td>
                  <td className="px-5 py-4 max-w-[200px]">
                    <p className="font-medium text-[14px] text-slate-900 truncate">
                      {r.submissionTitle || r.project?.projectName || r.challengeSubmission?.workTitle || r.nonTechProofOfWork?.title || 'Deliverable'}
                    </p>
                    <div className="mt-1">
                      <StatusBadge status={r.track} />
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="font-semibold text-emerald-600 text-[14px]">{r.overallScore ?? '—'}/100</span>
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge status={r.verificationStatus} />
                  </td>
                  <td className="px-5 py-4 text-[13px] text-slate-600">
                    {r.completedAt ? new Date(r.completedAt).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button
                      onClick={() => onOpenReview(r._id)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[13px] font-medium rounded-lg transition-colors border border-slate-200"
                    >
                      View Review <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ─── 5. Expert Profile Tab ────────────────────────────────────────────────────

function ProfileTab() {
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [bio, setBio] = useState('');
  const [expertise, setExpertise] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [savedMsg, setSavedMsg] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await api.get('/expert/profile');
      if (res.data?.success) {
        const d = res.data.data;
        const p = d.profile || d.user || {};
        setProfile(p);
        setStats(d.stats || {});
        setBio(p.bio || '');
        setExpertise(Array.isArray(p.expertise) ? p.expertise.join(', ') : p.expertise || '');
      } else {
        setError('Failed to load profile');
      }
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError(''); setSavedMsg('');
    try {
      const expertiseArr = expertise.split(',').map(s => s.trim()).filter(Boolean);
      const res = await api.patch('/expert/profile', { bio, expertise: expertiseArr });
      if (res.data?.success) {
        setSavedMsg('Profile updated successfully!');
        setTimeout(() => setSavedMsg(''), 2500);
      } else {
        setError(res.data?.message || 'Failed to update profile');
      }
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20">
      <Loader2 className="w-6 h-6 text-blue-600 animate-spin mb-3" />
      <p className="text-[14px] text-slate-500">Loading expert profile...</p>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="mb-8 border-b border-slate-200 pb-6">
        <h1 className="text-[28px] font-semibold text-slate-900 tracking-tight">Expert Profile & Credentials</h1>
        <p className="text-[15px] text-slate-500 mt-1">Manage your domain expertise, credentials, and review telemetry.</p>
      </div>

      {savedMsg && (
        <div className="mb-6 p-4 bg-emerald-50 text-emerald-700 rounded-lg flex items-center gap-2 border border-emerald-200 text-[14px]">
          <CheckCircle2 className="w-4 h-4 shrink-0" /> {savedMsg}
        </div>
      )}
      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg flex items-center gap-2 border border-red-200 text-[14px]">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-[12px] font-medium text-slate-500 uppercase">Assigned</p>
          <p className="text-2xl font-semibold text-slate-900 mt-1">{stats?.totalAssigned ?? 0}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-[12px] font-medium text-slate-500 uppercase">Completed Audits</p>
          <p className="text-2xl font-semibold text-emerald-600 mt-1">{stats?.completedAudits ?? stats?.completed ?? 0}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-[12px] font-medium text-slate-500 uppercase">Pending Audits</p>
          <p className="text-2xl font-semibold text-amber-600 mt-1">{stats?.pendingAudits ?? stats?.pending ?? 0}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-[12px] font-medium text-slate-500 uppercase">Average Score</p>
          <p className="text-2xl font-semibold text-slate-900 mt-1">{stats?.averageScore ? `${stats.averageScore}/100` : '—'}</p>
        </div>
      </div>

      {/* Profile Form */}
      <form onSubmit={handleSave} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-[13px] font-medium text-slate-700 mb-1">Name</label>
            <input
              type="text"
              value={profile?.name || `${profile?.firstName || ''} ${profile?.lastName || ''}`.trim()}
              disabled
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-[14px] text-slate-500 cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-slate-700 mb-1">Email</label>
            <input
              type="text"
              value={profile?.email || ''}
              disabled
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-[14px] text-slate-500 cursor-not-allowed"
            />
          </div>
        </div>

        <div>
          <label className="block text-[13px] font-medium text-slate-700 mb-1">Expertise & Specialties (comma separated)</label>
          <input
            type="text"
            value={expertise}
            onChange={(e) => setExpertise(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            placeholder="Software Engineering, Distributed Systems, Cloud Architecture..."
          />
        </div>

        <div>
          <label className="block text-[13px] font-medium text-slate-700 mb-1">Professional Bio & Credentials</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            placeholder="Senior verification specialist with 10+ years in distributed architecture and peer assessments..."
          />
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[14px] font-medium transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving...' : 'Save Profile Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Main Exported Component with Pathname-Driven Routing ─────────────────────

export default function ExpertDashboard() {
  const location = useLocation();
  const navigate = useNavigate();

  const pathname = location.pathname;

  // Determine active view based on current URL path
  let activeTab: 'DASHBOARD' | 'ASSIGNED' | 'REVIEW' | 'HISTORY' | 'PROFILE' = 'DASHBOARD';
  let activeReviewId: string | null = null;

  if (pathname.includes('/expert/reviews/') || pathname.includes('/expert/review/')) {
    activeTab = 'REVIEW';
    const match = pathname.match(/\/expert\/(?:reviews|review)\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      activeReviewId = match[1];
    }
  } else if (pathname === '/expert/reviews' || pathname === '/expert/assigned') {
    activeTab = 'ASSIGNED';
  } else if (pathname === '/expert/history' || pathname === '/expert/review-history') {
    activeTab = 'HISTORY';
  } else if (pathname === '/expert/profile') {
    activeTab = 'PROFILE';
  } else {
    activeTab = 'DASHBOARD';
  }

  const handleOpenReview = (id: string) => {
    navigate(`/expert/reviews/${id}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'DASHBOARD' && <DashboardTab />}
        {activeTab === 'ASSIGNED' && <AssignedReviewsTab onOpenReview={handleOpenReview} />}
        {activeTab === 'HISTORY' && <HistoryTab onOpenReview={handleOpenReview} />}
        {activeTab === 'PROFILE' && <ProfileTab />}
        {activeTab === 'REVIEW' && activeReviewId && (
          <ReviewWorkbench 
            reviewId={activeReviewId} 
            onBack={() => navigate('/expert/reviews')} 
          />
        )}
      </div>
    </div>
  );
}

