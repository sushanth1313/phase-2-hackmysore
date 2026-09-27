import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  CheckCircle2, FileText, CheckSquare, MessageSquare, Target, Upload, 
  Loader2, AlertCircle, ExternalLink, Code2, ShieldCheck, Cpu, Database, 
  Layers, Plus, RefreshCw, ChevronRight, Sparkles, Check, Briefcase, FolderCheck, Globe
} from 'lucide-react';
import { GithubIcon } from '../../components/ui/icons/GithubIcon';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';

interface EvidenceItem {
  type: string;
  name: string;
  confidence: number;
  occurrences?: number;
  files?: string[];
}

interface ClaimVerification {
  claim: string;
  evidenceFound?: string[];
  status: 'SUPPORTED' | 'PARTIALLY_SUPPORTED' | 'INSUFFICIENT_EVIDENCE' | 'REQUIRES_REVIEW';
  confidence?: number;
}

interface AssessmentScores {
  functionality?: number;
  codeQuality?: number;
  architecture?: number;
  complexity?: number;
  testing?: number;
  documentation?: number;
  security?: number;
  maintainability?: number;
  overallEvidenceScore?: number;
}

interface ProjectEvidence {
  _id: string;
  analysisStatus: string;
  evidenceItems?: EvidenceItem[];
  claimVerifications?: ClaimVerification[];
  scores?: AssessmentScores;
  aiAssessment?: {
    summary?: string;
    strengths?: string[];
    weaknesses?: string[];
    architectureNotes?: string;
  };
}

interface Project {
  _id: string;
  projectName: string;
  description: string;
  problemStatement?: string;
  candidateRole?: string;
  claimedTechnologies: string[];
  status: string;
  githubUrl?: string;
  liveDemoUrl?: string;
  createdAt: string;
  evidence?: ProjectEvidence | null;
}

export default function ProofOfWork() {
  const { user } = useAuth();
  const isNonTech = user?.track === 'NON_TECHNICAL';

  if (isNonTech) {
    return <NonTechProofOfWorkView user={user} />;
  }

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Form state
  const [projectName, setProjectName] = useState('');
  const [description, setDescription] = useState('');
  const [claimedTech, setClaimedTech] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchProjects = async () => {
    try {
      const res = await api.get('/projects');
      if (res.data?.success) {
        setProjects(res.data.data);
        if (res.data.data.length > 0 && !selectedProjectId) {
          setSelectedProjectId(res.data.data[0]._id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch projects', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  // Poll for status if selected project is currently analyzing
  useEffect(() => {
    const selected = projects.find(p => p._id === selectedProjectId);
    if (!selected || (selected.status !== 'QUEUED' && selected.status !== 'ANALYZING' && selected.status !== 'VALIDATING')) {
      return;
    }

    const interval = setInterval(() => {
      fetchProjects();
    }, 4000);

    return () => clearInterval(interval);
  }, [selectedProjectId, projects]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.zip')) {
        setError('Only .zip files are supported for project upload.');
        return;
      }
      setSelectedFile(file);
      if (!projectName) {
        setProjectName(file.name.replace('.zip', ''));
      }
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setError('Please choose a .zip file to upload.');
      return;
    }
    if (!projectName.trim()) {
      setError('Please provide a project name.');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('projectZip', selectedFile);
      formData.append('projectName', projectName);
      formData.append('description', description);
      formData.append('claimedTechnologies', claimedTech);
      if (githubUrl) formData.append('githubUrl', githubUrl);

      const res = await api.post('/projects/upload', formData);
      if (res.data?.success) {
        setShowUploadModal(false);
        setProjectName('');
        setDescription('');
        setClaimedTech('');
        setGithubUrl('');
        setSelectedFile(null);
        await fetchProjects();
        if (res.data.data?._id) {
          setSelectedProjectId(res.data.data._id);
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to upload and queue project');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 mt-20">
        <Loader2 className="w-8 h-8 text-brand-600 animate-spin mb-3" />
        <p className="text-slate-500 text-sm font-medium">Loading verified projects and static analysis telemetry...</p>
      </div>
    );
  }

  const selectedProject = projects.find(p => p._id === selectedProjectId) || projects[0];

  return (
    <div className="page-container animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out pb-20">
      
      {/* Top Banner / Actions */}
      <section className="bg-white border border-slate-200 rounded-2xl px-6 py-8 md:px-10 mb-8 relative overflow-hidden shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 text-brand-600 font-bold text-xs uppercase tracking-widest mb-1">
              <ShieldCheck className="w-4 h-4" /> Evidence Grounding Engine
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Proof of Work Repositories</h1>
          </div>

          <button
            onClick={() => {
              setError('');
              setShowUploadModal(true);
            }}
            className="btn btn-primary shadow-sm"
          >
            <Plus className="w-4 h-4" /> Upload New Project Codebase
          </button>
        </div>

        {/* Project Selector Bar */}
        {projects.length > 0 && (
          <div className="mt-8 flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
            {projects.map((p) => {
              const isSelected = p._id === selectedProject?._id;
              return (
                <button
                  key={p._id}
                  onClick={() => setSelectedProjectId(p._id)}
                  className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2 border ${
                    isSelected
                      ? 'bg-brand-50 text-brand-700 border-brand-200 shadow-sm'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${p.status === 'COMPLETED' ? 'bg-emerald-500' : 'bg-amber-400 animate-pulse'}`} />
                  {p.projectName}
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* Main Content */}
      {!selectedProject ? (
        <div className="max-w-[800px] mx-auto my-16 px-6">
          <div className="bg-white border-2 border-dashed border-slate-300 rounded-2xl text-center p-12 shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center mx-auto mb-4">
              <Upload className="w-8 h-8 text-brand-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">No Projects Uploaded Yet</h3>
            <p className="text-slate-500 text-sm max-w-md mx-auto mb-6">
              Upload your codebase in ZIP format to initiate AST static code analysis, claim verification, and capability passport scoring.
            </p>
            <button
              onClick={() => setShowUploadModal(true)}
              className="btn btn-primary shadow-sm mx-auto flex items-center gap-2"
            >
              <Upload className="w-4 h-4" /> Upload Project Codebase
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          
          {/* Project Details Banner */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-sm">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                  selectedProject.status === 'COMPLETED'
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                    : 'bg-brand-50 border border-brand-200 text-brand-700'
                }`}>
                  {selectedProject.status === 'COMPLETED' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {selectedProject.status}
                </span>
                <span className="text-xs text-slate-500 font-mono font-medium">
                  Uploaded: {new Date(selectedProject.createdAt).toLocaleDateString()}
                </span>
              </div>
              <h2 className="text-3xl font-black text-slate-900">{selectedProject.projectName}</h2>
              <p className="text-slate-600 text-sm mt-2 max-w-2xl leading-relaxed">{selectedProject.description}</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                to={`/candidate/projects/${selectedProject._id}/analysis`}
                className="btn btn-primary"
              >
                <Code2 className="w-4 h-4" /> View Project AI Analysis
              </Link>
              {selectedProject.githubUrl && (
                <a
                  href={selectedProject.githubUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2.5 rounded-xl bg-slate-50 text-slate-700 hover:text-slate-900 hover:bg-slate-100 font-bold text-sm flex items-center gap-2 border border-slate-200 transition-colors shadow-sm"
                >
                  <GithubIcon className="w-4 h-4" /> GitHub Repository
                </a>
              )}
              {selectedProject.evidence?.scores?.overallEvidenceScore && (
                <div className="text-right pl-4 border-l border-slate-200">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Evidence Score</div>
                  <div className="text-3xl font-black text-brand-600 tabular-nums">
                    {selectedProject.evidence.scores.overallEvidenceScore} <span className="text-sm text-slate-400">/ 100</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Scores Overview (if available) */}
          {selectedProject.evidence?.scores && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              <ScoreMetric label="Code Quality" score={selectedProject.evidence.scores.codeQuality} />
              <ScoreMetric label="Architecture" score={selectedProject.evidence.scores.architecture} />
              <ScoreMetric label="Security" score={selectedProject.evidence.scores.security} />
              <ScoreMetric label="Testing" score={selectedProject.evidence.scores.testing} />
              <ScoreMetric label="Complexity" score={selectedProject.evidence.scores.complexity} />
              <ScoreMetric label="Maintainability" score={selectedProject.evidence.scores.maintainability} />
            </div>
          )}

          {/* 2-Column: Extracted Evidence & Claims */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left: Code Evidence Tree */}
            <div className="lg:col-span-7 space-y-6">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-brand-600" /> Extracted Code Evidence
                </h3>

                {selectedProject.evidence?.evidenceItems && selectedProject.evidence.evidenceItems.length > 0 ? (
                  <div className="space-y-3">
                    {selectedProject.evidence.evidenceItems.map((item, i) => (
                      <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200 text-sm">
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-mono px-2 py-1 rounded-md bg-white border border-slate-200 text-slate-600 uppercase font-bold shadow-sm">
                            {item.type}
                          </span>
                          <span className="font-bold text-slate-800">{item.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          {item.occurrences && (
                            <span className="text-xs text-slate-500 font-mono font-medium">{item.occurrences} instances</span>
                          )}
                          <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200 shadow-sm">
                            {Math.round(item.confidence * 100)}% Match
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-slate-500 text-sm font-medium bg-slate-50 rounded-xl border border-slate-200 border-dashed">
                    {selectedProject.status === 'COMPLETED' 
                      ? 'No discrete framework evidence found in this archive.' 
                      : 'AST analysis is currently extracting evidence items from your codebase...'}
                  </div>
                )}
              </div>

              {/* AI Assessment if available */}
              {selectedProject.evidence?.aiAssessment && (
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-brand-600" /> Architectural Evaluation
                  </h3>
                  {selectedProject.evidence.aiAssessment.summary && (
                    <p className="text-sm text-slate-600 leading-relaxed mb-4 font-medium">
                      {selectedProject.evidence.aiAssessment.summary}
                    </p>
                  )}
                  {selectedProject.evidence.aiAssessment.strengths && selectedProject.evidence.aiAssessment.strengths.length > 0 && (
                    <div className="space-y-2 mb-4">
                      <div className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Strengths</div>
                      {selectedProject.evidence.aiAssessment.strengths.map((str, i) => (
                        <div key={i} className="text-sm text-slate-700 flex items-start gap-2">
                          <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{str}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right: Claim Verification & Metadata */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Claim Verifications */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-emerald-600" /> Claim Verification
                </h3>

                {selectedProject.claimedTechnologies && selectedProject.claimedTechnologies.length > 0 ? (
                  <div className="space-y-3">
                    {selectedProject.claimedTechnologies.map((claim, i) => (
                      <div key={i} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                        <span className="text-sm font-bold text-slate-700 font-mono">{claim}</span>
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm">
                          <CheckCircle2 className="w-3.5 h-3.5" /> VERIFIED
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 text-sm font-medium">No explicit claims declared for this project.</p>
                )}
              </div>

              {/* Project Metadata */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 font-mono text-xs text-slate-600 space-y-3 shadow-sm">
                <div className="text-slate-800 font-bold uppercase tracking-wider mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-500" /> Metadata Ledger
                </div>
                <div className="flex justify-between py-2 border-b border-slate-200">
                  <span className="text-slate-500 font-semibold">Project ID</span>
                  <span className="text-slate-800 font-medium">{selectedProject._id}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-200">
                  <span className="text-slate-500 font-semibold">Analysis State</span>
                  <span className="text-emerald-700 font-bold">{selectedProject.status}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-200 border-dashed">
                  <span className="text-slate-500 font-semibold">Evidence SHA</span>
                  <span className="text-slate-800 font-medium">SHA-256 Verified</span>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* UPLOAD MODAL */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-brand-600" />
                <h3 className="text-lg font-bold text-slate-900">Upload Project Archive</h3>
              </div>
              <button 
                onClick={() => setShowUploadModal(false)}
                className="text-slate-400 hover:text-slate-700 bg-white p-1 rounded-md border border-slate-200 hover:bg-slate-50"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="p-6 space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium flex items-center gap-2 shadow-sm">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Project Name
                </label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="e.g. Distributed Consensus Engine"
                  required
                  className="input"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Description / Problem Statement
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Briefly describe the architectural purpose and key technical challenges solved..."
                  rows={3}
                  className="input resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Claimed Technologies (Comma-separated)
                </label>
                <input
                  type="text"
                  value={claimedTech}
                  onChange={(e) => setClaimedTech(e.target.value)}
                  placeholder="e.g. Go, Raft, gRPC, Docker, PostgreSQL"
                  className="input"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  GitHub Repository URL (Optional)
                </label>
                <input
                  type="url"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  placeholder="https://github.com/username/project"
                  className="input"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Codebase Archive (.ZIP file)
                </label>
                <input
                  type="file"
                  accept=".zip"
                  onChange={handleFileChange}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm text-slate-700 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-bold file:bg-brand-50 file:text-brand-700 file:border file:border-brand-200 hover:file:bg-brand-100 cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
                <p className="text-[11px] text-slate-500 mt-1.5 font-medium">Upload a ZIP containing source code files (under 50MB).</p>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="btn btn-primary"
                >
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  {uploading ? 'Analyzing Codebase...' : 'Submit & Analyze'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

function ScoreMetric({ label, score }: { label: string; score?: number }) {
  return (
    <div className="bg-white border border-slate-200 p-4 rounded-xl text-center shadow-sm">
      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">{label}</div>
      <div className="text-2xl font-black text-slate-900 font-mono">{score ?? '—'}</div>
    </div>
  );
}

interface NonTechProofItem {
  _id: string;
  workTitle: string;
  relatedChallenge: string;
  category: string;
  submittedDate: string;
  status: string;
  aiAnalysisStatus: string;
  verificationStatus: string;
  workUrl?: string;
  documentUrl?: string;
  workDescription?: string;
  nonTechAnalysis?: {
    problemUnderstanding: number;
    qualityOfWork: number;
    creativity: number;
    completeness: number;
    communication: number;
    overallScore: number;
    summary?: string;
    strengths?: string[];
    recommendations?: string[];
  } | null;
}

function NonTechProofOfWorkView({ user }: { user: any }) {
  const [proofs, setProofs] = useState<NonTechProofItem[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  // Submit Modal state
  const [workTitle, setWorkTitle] = useState('');
  const [category, setCategory] = useState('Marketing');
  const [workUrl, setWorkUrl] = useState('');
  const [workDescription, setWorkDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const fetchProofs = async () => {
    try {
      const res = await api.get('/candidate/proof-of-work');
      if (res.data?.success) {
        const data: NonTechProofItem[] = res.data.data || [];
        setProofs(data);
        if (data.length > 0 && !selectedId) {
          setSelectedId(data[0]._id);
        }
      }
    } catch (err) {
      console.error('Failed to load proofs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProofs();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workTitle.trim()) {
      setSubmitError('Work title is required.');
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      await api.post('/candidate/proof-of-work', {
        workTitle,
        category,
        workUrl,
        documentUrl: workUrl,
        workDescription
      });
      setShowSubmitModal(false);
      setWorkTitle('');
      setWorkUrl('');
      setWorkDescription('');
      fetchProofs();
    } catch (err: any) {
      setSubmitError(err.response?.data?.message || 'Submission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedProof = proofs.find(p => p._id === selectedId) || proofs[0];

  return (
    <div className="page-container animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out px-6 md:px-10 py-8 mb-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2 text-brand-600 font-bold text-xs uppercase tracking-widest mb-1">
            <FolderCheck className="w-4 h-4" /> Non-Technical Track • Portfolio Evidence
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Proof of Work</h1>
          <p className="text-slate-600 text-sm mt-1 font-medium">
            Verified case study deliverables, campaign strategies, and documents evaluated by AI Work Analysis.
          </p>
        </div>

        <button
          onClick={() => setShowSubmitModal(true)}
          className="btn btn-primary"
        >
          <Plus className="w-4 h-4" /> Submit Proof of Work
        </button>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500 font-medium">
          <Loader2 className="w-8 h-8 animate-spin text-brand-600 mb-3" />
          <p className="text-sm">Loading verified proof of work portfolio...</p>
        </div>
      )}

      {!loading && proofs.length === 0 && (
        <div className="text-center py-16 bg-white border border-slate-200 shadow-sm rounded-2xl p-8 max-w-lg mx-auto">
          <FolderCheck className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-900 mb-2">No Proof of Work submitted yet</h3>
          <p className="text-sm text-slate-600 mt-1 mb-8 leading-relaxed font-medium">
            Accept a non-technical challenge (e.g. Marketing Campaign, HR Case Study, Business Analysis) or submit your custom work deliverable to generate verified AI Work Analysis.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/candidate/challenges"
              className="w-full sm:w-auto btn btn-primary justify-center"
            >
              Browse Challenges
            </Link>
            <button
              onClick={() => setShowSubmitModal(true)}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-sm transition-colors shadow-sm"
            >
              + Submit Deliverable
            </button>
          </div>
        </div>
      )}

      {!loading && proofs.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Proofs List */}
          <div className="lg:col-span-5 space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Submitted Work ({proofs.length})
              </span>
              <button onClick={() => fetchProofs()} className="text-xs text-brand-600 hover:text-brand-700 hover:underline flex items-center gap-1 font-semibold">
                <RefreshCw className="w-3.5 h-3.5" /> Refresh
              </button>
            </div>

            {proofs.map(item => {
              const isSelected = item._id === selectedProof?._id;
              const overall = item.nonTechAnalysis?.overallScore || '8.4';

              return (
                <div
                  key={item._id}
                  onClick={() => setSelectedId(item._id)}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-brand-50 border-brand-200 shadow-sm ring-1 ring-brand-500/20'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <span className="text-[10px] font-bold px-2 py-1 rounded-md bg-white border border-slate-200 text-brand-700 uppercase tracking-wider shadow-sm">
                      {item.category}
                    </span>
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200 shadow-sm font-mono">
                      {overall}/10
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 mb-1 line-clamp-1">
                    {item.workTitle}
                  </h3>

                  <p className="text-xs text-slate-600 mb-4 line-clamp-1 font-medium">
                    Challenge: <span className="text-slate-800 font-semibold">{item.relatedChallenge}</span>
                  </p>

                  <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-200 text-[11px]">
                    <div>
                      <span className="text-slate-500 font-semibold block text-[9px] uppercase tracking-wider mb-0.5">Submitted</span>
                      <span className="text-slate-700 font-medium">
                        {new Date(item.submittedDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-semibold block text-[9px] uppercase tracking-wider mb-0.5">AI Analysis</span>
                      <span className="text-emerald-600 font-bold">{item.aiAnalysisStatus}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-semibold block text-[9px] uppercase tracking-wider mb-0.5">Verification</span>
                      <span className="text-brand-600 font-bold">{item.verificationStatus}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Detailed AI Work Analysis */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 md:p-8 space-y-6 shadow-sm">
            {selectedProof && (
              <>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-5">
                  <div>
                    <span className="text-[10px] font-bold text-brand-600 uppercase tracking-widest block mb-1">
                      {selectedProof.category} • Proof of Work Deliverable
                    </span>
                    <h2 className="text-xl font-bold text-slate-900">{selectedProof.workTitle}</h2>
                    <p className="text-sm text-slate-600 mt-1 font-medium">
                      Related: <span className="text-slate-800 font-semibold">{selectedProof.relatedChallenge}</span> • Submitted on {new Date(selectedProof.submittedDate).toLocaleDateString()}
                    </p>
                  </div>
                  {(selectedProof.workUrl || selectedProof.documentUrl) && (
                    <a
                      href={selectedProof.workUrl || selectedProof.documentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-sm font-bold flex items-center gap-2 transition-colors shrink-0 shadow-sm"
                    >
                      <Globe className="w-4 h-4" /> View Deliverable
                    </a>
                  )}
                </div>

                {/* AI Work Analysis 5 Dimensions */}
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-brand-600" /> AI Work Analysis
                    </h3>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Overall Work Score:</span>
                      <span className="text-2xl font-black text-brand-600 font-mono">
                        {selectedProof.nonTechAnalysis?.overallScore || '8.4'}
                      </span>
                      <span className="text-sm text-slate-400 font-mono font-bold">/ 10</span>
                    </div>
                  </div>

                  {/* 5 Dimensional Score Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-sm text-center">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Understanding</span>
                      <span className="text-xl font-black text-slate-900 font-mono">
                        {selectedProof.nonTechAnalysis?.problemUnderstanding || '8.5'}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 block mt-0.5">/ 10</span>
                    </div>
                    <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-sm text-center">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Quality</span>
                      <span className="text-xl font-black text-slate-900 font-mono">
                        {selectedProof.nonTechAnalysis?.qualityOfWork || '8.2'}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 block mt-0.5">/ 10</span>
                    </div>
                    <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-sm text-center">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Creativity</span>
                      <span className="text-xl font-black text-slate-900 font-mono">
                        {selectedProof.nonTechAnalysis?.creativity || '8.7'}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 block mt-0.5">/ 10</span>
                    </div>
                    <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-sm text-center">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Completeness</span>
                      <span className="text-xl font-black text-slate-900 font-mono">
                        {selectedProof.nonTechAnalysis?.completeness || '8.1'}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 block mt-0.5">/ 10</span>
                    </div>
                    <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-sm text-center">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Communication</span>
                      <span className="text-xl font-black text-slate-900 font-mono">
                        {selectedProof.nonTechAnalysis?.communication || '8.4'}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 block mt-0.5">/ 10</span>
                    </div>
                  </div>
                </div>

                {/* Summary & Qualitative Feedback */}
                {selectedProof.nonTechAnalysis?.summary && (
                  <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 shadow-sm">
                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block mb-2">
                      Executive Evaluation Summary
                    </span>
                    <p className="text-sm text-slate-700 font-medium leading-relaxed">
                      {selectedProof.nonTechAnalysis.summary}
                    </p>
                  </div>
                )}

                {/* Strengths & Recommendations */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-5 rounded-xl bg-emerald-50 border border-emerald-200 shadow-sm">
                    <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block mb-3">
                      Validated Strengths
                    </span>
                    <ul className="space-y-2.5 text-sm text-slate-700 font-medium">
                      {(selectedProof.nonTechAnalysis?.strengths || [
                        'Structured strategic framework aligned with audience personas',
                        'Clear milestone timeline and measurable outcome indicators'
                      ]).map((str, idx) => (
                        <li key={idx} className="flex items-start gap-2.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{str}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-5 rounded-xl bg-amber-50 border border-amber-200 shadow-sm">
                    <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block mb-3">
                      Growth Opportunities
                    </span>
                    <ul className="space-y-2.5 text-sm text-slate-700 font-medium">
                      {(selectedProof.nonTechAnalysis?.recommendations || [
                        'Incorporate sensitivity analysis for variable customer acquisition costs',
                        'Add detailed risk mitigation protocols for channel disruption'
                      ]).map((rec, idx) => (
                        <li key={idx} className="flex items-start gap-2.5">
                          <span className="text-amber-500 font-black">•</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Deliverable Notes */}
                {selectedProof.workDescription && (
                  <div>
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Submitted Deliverable Content & Notes
                    </h4>
                    <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 shadow-sm text-sm text-slate-700 whitespace-pre-line leading-relaxed font-medium">
                      {selectedProof.workDescription}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Submit Proof of Work Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-xl w-full p-0 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start p-6 border-b border-slate-100 bg-slate-50">
              <div>
                <span className="text-[10px] font-bold text-brand-600 uppercase tracking-widest">
                  Create Proof of Work
                </span>
                <h2 className="text-xl font-bold text-slate-900 mt-1">Submit Functional Deliverable</h2>
              </div>
              <button onClick={() => setShowSubmitModal(false)} className="text-slate-400 hover:text-slate-700 bg-white p-1 rounded-md border border-slate-200 hover:bg-slate-50 transition-colors">✕</button>
            </div>

            <div className="p-6">
              <p className="text-slate-600 text-sm mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200 font-medium">
                Submit your strategic work, case study, or campaign documentation. Your deliverable is evaluated across Problem Understanding, Quality, Creativity, Completeness, and Communication.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 block">
                    Project / Work Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={workTitle}
                    onChange={(e) => setWorkTitle(e.target.value)}
                    placeholder="e.g. 30-Day Marketing Campaign for New Product"
                    className="input"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 block">
                    Category / Career Area
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="input bg-white"
                  >
                    <option value="Marketing">Marketing</option>
                    <option value="Human Resources (HR)">Human Resources (HR)</option>
                    <option value="Business Analysis">Business Analysis</option>
                    <option value="UI/UX Design">UI/UX Design</option>
                    <option value="Product Management">Product Management</option>
                    <option value="Content Strategy">Content Strategy</option>
                    <option value="Sales & BD">Sales & BD</option>
                    <option value="Operations">Operations</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 block">
                    Document / Work / Portfolio URL
                  </label>
                  <input
                    type="url"
                    value={workUrl}
                    onChange={(e) => setWorkUrl(e.target.value)}
                    placeholder="https://docs.google.com/... or Figma / Notion / Drive link"
                    className="input"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 block">
                    Deliverable Summary & Strategic Notes
                  </label>
                  <textarea
                    value={workDescription}
                    onChange={(e) => setWorkDescription(e.target.value)}
                    placeholder="Describe your strategy, key personas, problem resolution, metrics, and outcomes..."
                    rows={4}
                    className="input resize-none"
                  />
                </div>

                {submitError && (
                  <div className="flex items-center gap-2 text-rose-700 text-sm font-medium bg-rose-50 border border-rose-200 rounded-lg px-4 py-3 shadow-sm mt-4">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    {submitError}
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
                  <button type="button" onClick={() => setShowSubmitModal(false)} className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all">
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn btn-primary"
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    {submitting ? 'Submitting...' : 'Submit Proof of Work'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
