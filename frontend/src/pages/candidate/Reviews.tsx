import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  MessageSquare, Star, CheckCircle2, 
  ShieldCheck, UserCheck, Code2, Loader2, AlertCircle, Plus, Send, X,
  Award, AlertTriangle, ArrowRight, RefreshCw, FileText, Check, ExternalLink
} from 'lucide-react';
import api from '../../api/client';

interface PeerReviewItem {
  _id: string;
  reviewer: {
    _id?: string;
    firstName: string;
    lastName: string;
    role?: string;
  } | string;
  project: {
    _id?: string;
    projectName: string;
  } | string;
  overallRating: number;
  comments: string;
  evidenceConsistency?: string;
  practicalViability?: string;
  createdAt: string;
}

interface ExpertReviewItem {
  _id: string;
  expert?: {
    _id?: string;
    firstName: string;
    lastName: string;
    name?: string;
    role?: string;
    email?: string;
  };
  project?: {
    _id?: string;
    projectName: string;
    description?: string;
    status?: string;
  };
  nonTechProofOfWork?: {
    _id?: string;
    title: string;
    description?: string;
    status?: string;
  };
  challengeSubmission?: {
    _id?: string;
    workTitle?: string;
    track?: string;
    status?: string;
  };
  submissionTitle?: string;
  track?: string;
  status: 'UNASSIGNED' | 'ASSIGNED' | 'IN_REVIEW' | 'COMPLETED' | 'CANCELLED';
  overallScore?: number;
  verificationStatus?: 'VERIFIED' | 'PARTIALLY_VERIFIED' | 'NEEDS_RESUBMISSION' | 'NEEDS_REVIEW' | 'INSUFFICIENT_EVIDENCE';
  strengths?: string;
  weaknesses?: string;
  improvements?: string;
  whatWasDoneWell?: string;
  whatNeedsImprovement?: string;
  recommendedImprovements?: string;
  expertComments?: string;
  feedback?: string;
  rubric?: Record<string, { score: number; comment?: string }>;
  rubricScores?: Record<string, any>;
  completedAt?: string;
  createdAt: string;
}

interface ProjectOption {
  _id: string;
  projectName: string;
}

const RUBRIC_DIMS = [
  { key: 'workQuality', label: 'Work Quality', weight: '20%' },
  { key: 'problemSolving', label: 'Problem Solving', weight: '15%' },
  { key: 'domainKnowledge', label: 'Domain Knowledge', weight: '15%' },
  { key: 'communication', label: 'Communication', weight: '10%' },
  { key: 'documentation', label: 'Documentation', weight: '10%' },
  { key: 'creativityAndInitiative', label: 'Creativity & Initiative', weight: '10%' },
  { key: 'aiAssessmentAlignment', label: 'AI Assessment Alignment', weight: '10%' },
  { key: 'peerAndExpertReview', label: 'Peer & Expert Review', weight: '10%' }
];

export default function Reviews() {
  const [activeTab, setActiveTab] = useState<'EXPERT' | 'PEER'>('EXPERT');

  // Peer reviews state
  const [peerReviews, setPeerReviews] = useState<PeerReviewItem[]>([]);
  const [selectedPeerReview, setSelectedPeerReview] = useState<PeerReviewItem | null>(null);

  // Expert reviews state
  const [expertReviews, setExpertReviews] = useState<ExpertReviewItem[]>([]);
  const [selectedExpertReview, setSelectedExpertReview] = useState<ExpertReviewItem | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Submit Peer Review Modal state
  const [showModal, setShowModal] = useState(false);
  const [projectsToReview, setProjectsToReview] = useState<ProjectOption[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [overallRating, setOverallRating] = useState(5);
  const [comments, setComments] = useState('');
  const [evidenceConsistency, setEvidenceConsistency] = useState('HIGH');
  const [practicalViability, setPracticalViability] = useState('HIGH');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');

  const fetchAllReviews = async () => {
    try {
      setLoading(true);
      setError('');

      const [peerRes, expertRes] = await Promise.all([
        api.get('/candidate/reviews').catch(() => ({ data: { success: false, data: [] } })),
        api.get('/candidate/expert-reviews').catch(() => ({ data: { success: false, data: [] } }))
      ]);

      if (peerRes.data?.success && Array.isArray(peerRes.data.data)) {
        setPeerReviews(peerRes.data.data);
        if (peerRes.data.data.length > 0) {
          setSelectedPeerReview(peerRes.data.data[0]);
        }
      }

      if (expertRes.data?.success && Array.isArray(expertRes.data.data)) {
        setExpertReviews(expertRes.data.data);
        if (expertRes.data.data.length > 0) {
          setSelectedExpertReview(expertRes.data.data[0]);
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch reviews', err);
      setError('Unable to load reviews.');
    } finally {
      setLoading(false);
    }
  };

  const fetchReviewableProjects = async () => {
    try {
      const res = await api.get('/recruiter/talent');
      if (res.data?.success && res.data.data) {
        const found: ProjectOption[] = [];
        res.data.data.forEach((candidate: any) => {
          if (candidate.projects && Array.isArray(candidate.projects)) {
            candidate.projects.forEach((p: any) => {
              found.push({ _id: p._id, projectName: `${p.projectName} (${candidate.name})` });
            });
          }
        });
        setProjectsToReview(found);
        if (found.length > 0) setSelectedProjectId(found[0]._id);
      }
    } catch (e) {
      console.error('Failed to load candidate projects for review', e);
    }
  };

  useEffect(() => {
    fetchAllReviews();
  }, []);

  const openReviewModal = () => {
    fetchReviewableProjects();
    setShowModal(true);
    setSubmitError('');
    setSubmitSuccess('');
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId) {
      setSubmitError('Please select a project to review.');
      return;
    }
    if (!comments.trim()) {
      setSubmitError('Please provide qualitative architectural feedback.');
      return;
    }

    try {
      setSubmitting(true);
      setSubmitError('');
      const res = await api.post('/candidate/reviews', {
        projectId: selectedProjectId,
        overallRating,
        comments,
        evidenceConsistency,
        practicalViability
      });

      if (res.data?.success) {
        setSubmitSuccess('Peer review submitted successfully!');
        setComments('');
        setTimeout(() => {
          setShowModal(false);
          fetchAllReviews();
        }, 1200);
      }
    } catch (err: any) {
      setSubmitError(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full h-full min-h-[60vh] flex flex-col items-center justify-center p-12 mt-20">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3" />
        <p className="text-slate-500 text-sm">Loading engineering and expert architecture reviews...</p>
      </div>
    );
  }

  return (
    <div className="w-full px-6 md:px-12 py-8 max-w-[1400px] mx-auto space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-blue-600 font-semibold text-xs uppercase tracking-widest mb-1">
            <Award className="w-4 h-4" /> ProofHire Verification & Reviews
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Evaluations & Reviews</h1>
          <p className="text-slate-500 text-sm mt-1">
            Verified assessments from industry experts and qualitative architectural reviews from engineering peers.
          </p>
        </div>

        {/* Tab switchers */}
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveTab('EXPERT')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'EXPERT'
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            Expert Reviews ({expertReviews.length})
          </button>
          <button
            onClick={() => setActiveTab('PEER')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'PEER'
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MessageSquare className="w-4 h-4 text-slate-500" />
            Peer Reviews ({peerReviews.length})
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 flex items-center gap-3 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 1: EXPERT REVIEWS VIEW                                */}
      {/* ========================================================= */}
      {activeTab === 'EXPERT' && (
        <div>
          {expertReviews.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center max-w-2xl mx-auto my-8 shadow-sm">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center mx-auto mb-4">
                <ShieldCheck className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">No Expert Reviews Yet</h3>
              <p className="text-slate-500 text-sm max-w-md mx-auto mb-6 leading-relaxed">
                When you submit a project deliverable or challenge solution, it automatically enters the Expert Review queue. A verified industry specialist will evaluate your evidence across 8 dimensions and record formal verification status.
              </p>
              <div className="flex items-center justify-center gap-3">
                <Link
                  to="/candidate/challenges"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors text-sm shadow-sm"
                >
                  Browse Challenges <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/candidate/projects"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors text-sm"
                >
                  Submit Project
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Left Column: Reviews List */}
              <div className="lg:col-span-4 space-y-3">
                {expertReviews.map((rev) => {
                  const title = rev.submissionTitle || 
                    rev.project?.projectName || 
                    rev.nonTechProofOfWork?.title || 
                    rev.challengeSubmission?.workTitle || 
                    'Deliverable';

                  const isSelected = selectedExpertReview?._id === rev._id;
                  const isCompleted = rev.status === 'COMPLETED';
                  const isNeedsResubmission = rev.verificationStatus === 'NEEDS_RESUBMISSION';

                  return (
                    <div
                      key={rev._id}
                      onClick={() => setSelectedExpertReview(rev)}
                      className={`p-5 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-blue-50/50 border-blue-300 ring-1 ring-blue-300 shadow-sm'
                          : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2 mb-2">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          {rev.track || 'TECHNICAL'}
                        </span>
                        {isCompleted && rev.overallScore != null ? (
                          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {rev.overallScore}/100
                          </span>
                        ) : (
                          <span className="text-xs px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-medium">
                            {rev.status.replace(/_/g, ' ')}
                          </span>
                        )}
                      </div>

                      <h3 className="text-sm font-semibold text-slate-900 truncate mb-1">{title}</h3>

                      <div className="flex items-center gap-2 mt-2">
                        {rev.verificationStatus ? (
                          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                            rev.verificationStatus === 'VERIFIED'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : rev.verificationStatus === 'NEEDS_RESUBMISSION'
                              ? 'bg-orange-50 text-orange-700 border border-orange-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {rev.verificationStatus.replace(/_/g, ' ')}
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400">Awaiting Evaluation</span>
                        )}
                        <span className="text-[11px] text-slate-400 ml-auto">
                          {rev.completedAt ? new Date(rev.completedAt).toLocaleDateString() : 'Pending'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Right Column: Selected Expert Review Detail */}
              {selectedExpertReview && (
                <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
                  
                  {/* Header info */}
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-6 border-b border-slate-100">
                    <div>
                      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest block mb-1">
                        Verified Deliverable Audit
                      </span>
                      <h2 className="text-2xl font-bold text-slate-900">
                        {selectedExpertReview.submissionTitle ||
                         selectedExpertReview.project?.projectName ||
                         selectedExpertReview.nonTechProofOfWork?.title ||
                         selectedExpertReview.challengeSubmission?.workTitle ||
                         'Deliverable Assessment'}
                      </h2>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs font-medium text-slate-700">
                          Evaluator: <span className="font-semibold text-blue-600">
                            {selectedExpertReview.expert
                              ? `${selectedExpertReview.expert.firstName || ''} ${selectedExpertReview.expert.lastName || ''}`.trim() || 'Assigned Domain Expert'
                              : 'Assigned Domain Expert'}
                          </span>
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-xs text-slate-500">
                          {selectedExpertReview.completedAt ? `Completed on ${new Date(selectedExpertReview.completedAt).toLocaleDateString()}` : 'Audit in Progress'}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      {selectedExpertReview.overallScore != null ? (
                        <div>
                          <div className="text-3xl font-black text-slate-900 font-mono">
                            {selectedExpertReview.overallScore} <span className="text-lg text-slate-400 font-normal">/ 100</span>
                          </div>
                          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mt-0.5">
                            Expert Rubric Score
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm font-medium text-amber-600 bg-amber-50 px-3 py-1 rounded-lg border border-amber-200">
                          In Review
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Needs Resubmission Banner */}
                  {selectedExpertReview.verificationStatus === 'NEEDS_RESUBMISSION' && (
                    <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl space-y-2">
                      <div className="flex items-center gap-2 text-orange-800 font-semibold text-sm">
                        <AlertTriangle className="w-4 h-4 text-orange-600 shrink-0" />
                        <span>Action Required: Needs Improvement</span>
                      </div>
                      <p className="text-xs text-orange-700 leading-relaxed">
                        The expert evaluator reviewed your deliverable and requested targeted improvements before awarding full verification status. Please review the detailed feedback and recommendations below, refine your deliverable, and resubmit.
                      </p>
                      <div className="pt-2">
                        <Link
                          to="/candidate/challenges"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-medium transition-colors shadow-sm"
                        >
                          Review & Update Deliverable <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  )}

                  {/* Verification Status Banner if Verified */}
                  {selectedExpertReview.verificationStatus === 'VERIFIED' && (
                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                        <div>
                          <h4 className="text-sm font-semibold text-emerald-900">Formally Verified Deliverable</h4>
                          <p className="text-xs text-emerald-700 mt-0.5">
                            This submission meets production standards and all associated competencies have been verified on your Capability Passport.
                          </p>
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-emerald-100 text-emerald-800 font-semibold text-xs rounded-full border border-emerald-300 shrink-0">
                        VERIFIED
                      </span>
                    </div>
                  )}

                  {/* Overall Assessment */}
                  {(selectedExpertReview.expertComments || selectedExpertReview.feedback) && (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                      <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                        Overall Assessment & Feedback
                      </h4>
                      <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
                        {selectedExpertReview.expertComments || selectedExpertReview.feedback}
                      </p>
                    </div>
                  )}

                  {/* What was done well vs What needs improvement */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedExpertReview.whatWasDoneWell && (
                      <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200">
                        <h4 className="text-xs font-semibold text-emerald-800 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-emerald-600" /> What was done well
                        </h4>
                        <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                          {selectedExpertReview.whatWasDoneWell}
                        </p>
                      </div>
                    )}

                    {selectedExpertReview.whatNeedsImprovement && (
                      <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200">
                        <h4 className="text-xs font-semibold text-amber-800 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> What needs improvement
                        </h4>
                        <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                          {selectedExpertReview.whatNeedsImprovement}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Strengths & Weaknesses */}
                  {(selectedExpertReview.strengths || selectedExpertReview.weaknesses) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedExpertReview.strengths && (
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                          <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                            Key Strengths
                          </h4>
                          <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">
                            {selectedExpertReview.strengths}
                          </p>
                        </div>
                      )}
                      {selectedExpertReview.weaknesses && (
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                          <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                            Identified Weaknesses
                          </h4>
                          <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">
                            {selectedExpertReview.weaknesses}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Recommended Improvements */}
                  {(selectedExpertReview.recommendedImprovements || selectedExpertReview.improvements) && (
                    <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-200">
                      <h4 className="text-xs font-semibold text-blue-900 uppercase tracking-wider mb-1.5">
                        Recommended Next Steps & Improvements
                      </h4>
                      <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                        {selectedExpertReview.recommendedImprovements || selectedExpertReview.improvements}
                      </p>
                    </div>
                  )}

                  {/* 8-Dimension Rubric Results */}
                  {selectedExpertReview.rubric && Object.keys(selectedExpertReview.rubric).length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                        8-Dimension Evaluation Results
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {RUBRIC_DIMS.map(d => {
                          const score = selectedExpertReview.rubric?.[d.key]?.score ?? 0;
                          return (
                            <div key={d.key} className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-center">
                              <span className="text-[11px] font-medium text-slate-500 block truncate">{d.label}</span>
                              <span className="text-lg font-bold text-slate-900 font-mono block mt-1">
                                {score}<span className="text-xs text-slate-400 font-normal">/100</span>
                              </span>
                              <span className="text-[10px] text-slate-400 block mt-0.5">{d.weight}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: PEER REVIEWS VIEW                                  */}
      {/* ========================================================= */}
      {activeTab === 'PEER' && (
        <div>
          <div className="flex justify-end mb-6">
            <button
              onClick={openReviewModal}
              className="px-4 py-2 rounded-xl font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors flex items-center gap-2 text-xs shadow-sm"
            >
              <Plus className="w-4 h-4" /> Submit Peer Review
            </button>
          </div>

          {peerReviews.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center max-w-2xl mx-auto my-8 shadow-sm">
              <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">No Peer Reviews Received Yet</h3>
              <p className="text-slate-500 text-sm max-w-md mx-auto mb-6 leading-relaxed">
                When peer engineering reviewers inspect your projects and proofs of work, their qualitative architectural critiques and dimension ratings will appear here.
              </p>
              <button
                onClick={openReviewModal}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors text-sm shadow-sm"
              >
                <Plus className="w-4 h-4" /> Review a Peer's Project
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Review List */}
              <div className="lg:col-span-5 space-y-3">
                {peerReviews.map((rev) => {
                  const reviewerName = typeof rev.reviewer === 'object' && rev.reviewer?.firstName
                    ? `${rev.reviewer.firstName} ${rev.reviewer.lastName || ''}`
                    : 'Peer Reviewer';
                  const projectName = typeof rev.project === 'object' && rev.project?.projectName
                    ? rev.project.projectName
                    : 'Verified Project';

                  const isSelected = selectedPeerReview?._id === rev._id;

                  return (
                    <div 
                      key={rev._id}
                      onClick={() => setSelectedPeerReview(rev)}
                      className={`p-5 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-blue-50/50 border-blue-300 ring-1 ring-blue-300 shadow-sm'
                          : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="text-sm font-semibold text-slate-900">{reviewerName}</h3>
                          <p className="text-xs text-slate-500">Verified Peer Reviewer</p>
                        </div>
                        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {rev.overallRating} / 5
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mb-2 truncate">
                        Project: <span className="text-slate-800 font-medium">{projectName}</span>
                      </p>
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        "{rev.comments}"
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Selected Peer Review Deep-Dive */}
              {selectedPeerReview && (
                <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-8 shadow-sm flex flex-col justify-between space-y-6">
                  <div>
                    <div className="flex justify-between items-start pb-6 border-b border-slate-100 mb-6">
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Target Project</span>
                        <h2 className="text-xl font-bold text-slate-900 mt-1">
                          {typeof selectedPeerReview.project === 'object' && selectedPeerReview.project?.projectName
                            ? selectedPeerReview.project.projectName
                            : 'Verified Project'}
                        </h2>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs font-semibold text-blue-600">
                            {typeof selectedPeerReview.reviewer === 'object' && selectedPeerReview.reviewer?.firstName
                              ? `${selectedPeerReview.reviewer.firstName} ${selectedPeerReview.reviewer.lastName || ''}`
                              : 'Peer Reviewer'}
                          </span>
                          <span className="text-xs text-slate-300">•</span>
                          <span className="text-xs text-slate-500">Architecture Assessment</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-black text-slate-900 font-mono">
                          {selectedPeerReview.overallRating} <span className="text-lg text-slate-400 font-normal">/ 5</span>
                        </div>
                        <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-1 justify-end mt-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> VERIFIED REVIEW
                        </div>
                      </div>
                    </div>

                    {/* Dimensions */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Evidence Consistency</div>
                        <div className="text-base font-bold text-emerald-600 font-mono">
                          {selectedPeerReview.evidenceConsistency || 'HIGH'}
                        </div>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Practical Viability</div>
                        <div className="text-base font-bold text-blue-600 font-mono">
                          {selectedPeerReview.practicalViability || 'HIGH'}
                        </div>
                      </div>
                    </div>

                    {/* Feedback Body */}
                    <div className="mb-6">
                      <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Architectural Assessment</h4>
                      <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
                        {selectedPeerReview.comments}
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500">
                    <span className="flex items-center gap-1.5 text-slate-500">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" /> Recorded on verified candidate ledger
                    </span>
                    <span className="font-mono text-slate-500">
                      {selectedPeerReview.createdAt ? new Date(selectedPeerReview.createdAt).toLocaleDateString() : ''}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* SUBMIT PEER REVIEW MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-xl overflow-hidden shadow-xl animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-bold text-slate-900">Submit Peer Architecture Review</h3>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitReview} className="p-6 space-y-4">
              {submitError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}
              {submitSuccess && (
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{submitSuccess}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Select Project to Review
                </label>
                {projectsToReview.length === 0 ? (
                  <p className="text-xs text-amber-700 bg-amber-50 p-3 rounded-lg border border-amber-200">
                    No other candidate projects currently available in the directory to review.
                  </p>
                ) : (
                  <select
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  >
                    {projectsToReview.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.projectName}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Overall Score Rating (1 - 5)
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setOverallRating(star)}
                      className={`flex-1 py-2 rounded-lg font-mono font-bold text-sm border transition-all ${
                        overallRating >= star
                          ? 'bg-blue-50 border-blue-300 text-blue-700'
                          : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'
                      }`}
                    >
                      ★ {star}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                    Evidence Consistency
                  </label>
                  <select
                    value={evidenceConsistency}
                    onChange={(e) => setEvidenceConsistency(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-500"
                  >
                    <option value="HIGH">HIGH (Strong Evidence)</option>
                    <option value="MODERATE">MODERATE (Partial)</option>
                    <option value="LOW">LOW (Unverified)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                    Practical Viability
                  </label>
                  <select
                    value={practicalViability}
                    onChange={(e) => setPracticalViability(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-500"
                  >
                    <option value="HIGH">HIGH (Production Ready)</option>
                    <option value="MODERATE">MODERATE (Prototype)</option>
                    <option value="LOW">LOW (Incomplete)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Architectural Critique & Notes
                </label>
                <textarea
                  rows={4}
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Provide qualitative feedback regarding code quality, modularity, edge case handling, and system performance..."
                  className="w-full bg-white border border-slate-300 rounded-lg p-3 text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-lg text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {submitting ? 'Submitting Review...' : 'Publish Peer Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
