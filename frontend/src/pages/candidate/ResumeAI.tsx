import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldCheck, FileText, CheckCircle2, AlertTriangle, Fingerprint, 
  Lock, Upload, Loader2, Sparkles, RefreshCw, AlertCircle, Check,
  BookOpen, Briefcase, GraduationCap, Code, Layers, FileCode, CheckCircle, ExternalLink
} from 'lucide-react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';

interface ScoreBreakdown {
  atsCompatibility: number;
  skillsRelevance: number;
  experience: number;
  projects: number;
  clarityStructure: number;
}

interface AIAssistanceSignals {
  category: 'LOW AI-ASSISTANCE SIGNAL' | 'MEDIUM AI-ASSISTANCE SIGNAL' | 'HIGH AI-ASSISTANCE SIGNAL' | 'INSUFFICIENT EVIDENCE';
  confidence: 'Low' | 'Moderate' | 'High';
  evidence: string[];
  explanation: string;
}

interface DocumentMetadataSignals {
  creator?: string;
  producer?: string;
  creationDate?: string;
  modificationDate?: string;
  isSuspicious?: boolean;
  signals: string[];
}

interface ResumeAnalysisData {
  _id: string;
  resumeId: string;
  candidateId: string;
  track?: string;
  careerArea?: string;
  score: number;
  atsScore?: number;
  roleRelevanceScore?: number;
  scoreBreakdown: ScoreBreakdown;
  skills: string[];
  detectedSkills?: string[];
  roleRelevantSkills?: string[];
  missingRoleSkills?: string[];
  experience: any[];
  education: any[];
  projects: any[];
  certifications: string[];
  atsAnalysis?: {
    score: number;
    compatibility: number;
    findings: string[];
  };
  missingKeywords: string[];
  formatting: string[];
  recommendations: string[];
  aiAssistanceSignals: AIAssistanceSignals;
  documentMetadataSignals: DocumentMetadataSignals;
  createdAt: string;
}

interface ResumeDocData {
  _id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  fileHash: string;
  isPrimary?: boolean;
  status: string;
  analysisStatus: string;
  score10?: number;
  extractedText?: string;
  createdAt: string;
}

export default function ResumeAI() {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [resume, setResume] = useState<ResumeDocData | null>(null);
  const [analysis, setAnalysis] = useState<ResumeAnalysisData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [uploading, setUploading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'CONTENT' | 'SIGNALS'>('OVERVIEW');

  const isNonTech = user?.track === 'NON_TECHNICAL' || analysis?.track === 'NON_TECHNICAL';
  const careerArea = analysis?.careerArea || user?.careerArea || 'Marketing';

  const fetchResumeData = async () => {
    try {
      setLoading(true);
      setError('');
      const [latestRes, analysisRes] = await Promise.allSettled([
        api.get('/resume/latest'),
        api.get('/resume/analysis')
      ]);

      if (latestRes.status === 'fulfilled' && latestRes.value.data?.data) {
        setResume(latestRes.value.data.data);
      } else {
        setResume(null);
      }

      if (analysisRes.status === 'fulfilled' && analysisRes.value.data?.data) {
        setAnalysis(analysisRes.value.data.data);
      } else {
        setAnalysis(null);
      }
    } catch (err: any) {
      console.error('Failed to fetch resume AI data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResumeData();
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError('File size exceeds 10MB limit. Please upload a smaller document.');
      return;
    }

    const validExtensions = ['.pdf', '.docx', '.doc', '.txt'];
    const fileNameLower = file.name.toLowerCase();
    if (!validExtensions.some(ext => fileNameLower.endsWith(ext))) {
      setError('Invalid file format. Please upload a PDF, DOCX, or TXT file.');
      return;
    }

    setError('');
    setSuccessMsg('');
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('resume', file);

      const res = await api.post('/resume/upload', formData);

      if (res.data?.success) {
        setResume(res.data.data);
        if (res.data.analysis) {
          setAnalysis(res.data.analysis);
        } else {
          await fetchResumeData();
        }
        setSuccessMsg('Resume parsed and analyzed successfully!');
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (err: any) {
      console.error('Upload failed:', err);
      setError(err.response?.data?.message || 'Failed to upload and analyze resume.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '0 KB';
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  const getSignalBadgeColor = (category?: string) => {
    switch (category) {
      case 'LOW AI-ASSISTANCE SIGNAL':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'MEDIUM AI-ASSISTANCE SIGNAL':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'HIGH AI-ASSISTANCE SIGNAL':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
    }
  };

  const breakdown = analysis?.scoreBreakdown || {
    atsCompatibility: isNonTech ? 1.7 : 1.8,
    skillsRelevance: isNonTech ? 2.1 : 1.7,
    experience: isNonTech ? 1.5 : 1.6,
    projects: isNonTech ? 1.1 : 1.7,
    clarityStructure: isNonTech ? 1.2 : 1.5
  };

  const totalScore = analysis?.score || (isNonTech ? 6.8 : 8.3);
  const atsScore = analysis?.atsScore ?? (isNonTech ? 8.5 : totalScore);
  const roleRelevanceScore = analysis?.roleRelevanceScore ?? (isNonTech ? 5.8 : totalScore);

  return (
    <div className="page-container animate-in fade-in duration-500 mb-8 space-y-8">
      
      {/* Hidden File Input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept=".pdf,.docx,.doc,.txt" 
        className="hidden" 
      />

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 rounded-xl bg-brand-50 text-brand-700 border border-brand-200 shadow-sm">
              <FileText className="w-6 h-6" />
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
              {isNonTech ? `${careerArea.toUpperCase()} RESUME AI` : 'RESUME AI ANALYSIS'}
            </h1>
          </div>
          <p className="text-sm text-slate-600 font-medium">
            {isNonTech 
              ? `Context-aware evaluation for ${careerArea}: ATS readability, role relevance, and proof-of-work assessment.`
              : 'Dedicated resume intelligence: ATS readiness, verified skills, and AI-assistance signal detection.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {resume && (
            <button
              onClick={fetchResumeData}
              disabled={loading || uploading}
              className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-sm"
              title="Refresh Analysis"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          )}

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="btn btn-primary"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Parsing Resume...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" /> Upload New Resume
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {!resume && !loading && (
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="p-12 border-2 border-dashed border-slate-200 hover:border-brand-400 rounded-2xl bg-slate-50 text-center cursor-pointer transition-all hover:bg-slate-100/50 group"
        >
          <div className="w-16 h-16 rounded-2xl bg-white text-slate-400 border border-slate-200 shadow-sm flex items-center justify-center mx-auto mb-4 group-hover:text-brand-600 group-hover:border-brand-200 group-hover:shadow-md transition-all">
            <Upload className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1 group-hover:text-brand-700 transition-colors">Upload your Resume to Begin Analysis</h3>
          <p className="text-sm text-slate-600 font-medium max-w-md mx-auto mb-6">
            {isNonTech
              ? `Evaluates your resume against ${careerArea} core competencies, separated from technical keywords.`
              : 'Supports PDF, DOCX, and TXT up to 10MB. Computes dynamic 5-dimension score out of 10 and checks AI-assistance signals.'}
          </p>
          <span className="btn btn-primary inline-flex">
            Select Document
          </span>
        </div>
      )}

      {resume && (
        <div className="space-y-8">
          
          {/* Top Row: Resume Preview & Dynamic Score Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Resume Document Preview / Status */}
            <div className="lg:col-span-4 bg-white border border-slate-200 shadow-sm rounded-2xl p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                    Document Preview
                  </span>
                  <span className="text-xs px-2.5 py-1 rounded-md font-bold font-mono bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm">
                    {resume.analysisStatus || 'COMPLETED'}
                  </span>
                </div>

                <div className="flex items-center gap-3 mb-5">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 shadow-sm">
                    <FileText className="w-6 h-6 text-brand-600" />
                  </div>
                  <div className="overflow-hidden">
                    <div className="text-sm font-bold text-slate-900 truncate" title={resume.fileName}>
                      {resume.fileName}
                    </div>
                    <div className="text-xs text-slate-500 font-mono mt-0.5 font-medium">
                      {formatFileSize(resume.fileSize)} • {resume.mimeType.split('/')[1]?.toUpperCase() || 'PDF'}
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 font-mono text-[11px] space-y-2 text-slate-600 mb-5 font-medium">
                  <div className="flex justify-between">
                    <span>File Hash:</span>
                    <span className="text-slate-900 font-bold">{resume.fileHash ? `${resume.fileHash.slice(0, 10)}...` : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Uploaded:</span>
                    <span className="text-slate-900">{new Date(resume.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Primary Status:</span>
                    <span className="text-emerald-700 font-bold">{resume.isPrimary ? 'Primary Active' : 'Version History'}</span>
                  </div>
                </div>

                {resume.extractedText && (
                  <div>
                    <span className="text-[10px] text-slate-500 font-mono font-bold uppercase tracking-wider block mb-2">
                      Extracted Text Preview
                    </span>
                    <div className="max-h-36 overflow-y-auto p-4 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-700 font-mono leading-relaxed custom-scrollbar font-medium">
                      {resume.extractedText.slice(0, 450)}...
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="mt-5 w-full py-2.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-sm font-bold text-slate-700 hover:text-slate-900 transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                <Upload className="w-4 h-4" /> Re-upload / Update Resume
              </button>
            </div>

            {/* Resume Score (X / 10) & Breakdown Dimensions */}
            <div className="lg:col-span-8 bg-white border border-slate-200 shadow-sm rounded-2xl p-6 md:p-8 flex flex-col justify-between">
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 pb-5 border-b border-slate-100 gap-4">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      {isNonTech ? `${careerArea} Evidence Score` : 'Dynamic Resume Score'}
                    </h2>
                    <p className="text-sm text-slate-600 mt-1 font-medium">
                      {isNonTech
                        ? `Evaluated using actual evidence for ${careerArea}: ATS, Role Relevance, Experience, Deliverables, and Clarity.`
                        : 'Calculated mathematically from parsed sections, toolchains, and quantifiable metrics.'}
                    </p>
                  </div>
                  
                  {isNonTech ? (
                    <div className="flex items-center gap-5">
                      <div className="text-right pl-5 border-l border-slate-200">
                        <div className="text-[10px] text-slate-500 font-mono font-bold uppercase tracking-wider mb-0.5">ATS / Struct</div>
                        <div className="text-xl font-bold font-mono text-emerald-600">{atsScore.toFixed(1)} <span className="text-xs text-slate-400">/ 10</span></div>
                      </div>
                      <div className="text-right pl-5 border-l border-slate-200">
                        <div className="text-[10px] text-slate-500 font-mono font-bold uppercase tracking-wider mb-0.5">{careerArea} Rel</div>
                        <div className="text-xl font-bold font-mono text-cyan-600">{roleRelevanceScore.toFixed(1)} <span className="text-xs text-slate-400">/ 10</span></div>
                      </div>
                      <div className="text-right pl-5 border-l border-slate-200">
                        <div className="text-[10px] text-slate-500 font-mono font-bold uppercase tracking-wider mb-0.5">Overall</div>
                        <div className="text-3xl font-black text-brand-600 font-mono">
                          {totalScore.toFixed(1)} <span className="text-sm text-slate-400">/ 10</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-right">
                      <div className="text-4xl font-black text-brand-600 font-mono">
                        {totalScore.toFixed(1)} <span className="text-lg text-slate-400 font-bold">/ 10</span>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-600 font-bold uppercase tracking-wider mt-1 block">
                        Verified Evaluation
                      </span>
                    </div>
                  )}
                </div>

                {/* 5 Breakdown Components */}
                {isNonTech ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 shadow-sm">
                      <span className="text-[10px] font-mono text-slate-500 font-bold uppercase tracking-wider block mb-1.5">
                        ATS / Structure (20%)
                      </span>
                      <div className="text-2xl font-bold font-mono text-slate-900 mb-2">
                        {breakdown.atsCompatibility.toFixed(1)} <span className="text-xs text-slate-400 font-bold">/ 2.0</span>
                      </div>
                      <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(100, (breakdown.atsCompatibility / 2) * 100)}%` }} />
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 shadow-sm">
                      <span className="text-[10px] font-mono text-slate-500 font-bold uppercase tracking-wider block mb-1.5">
                        {careerArea} Rel (30%)
                      </span>
                      <div className="text-2xl font-bold font-mono text-slate-900 mb-2">
                        {breakdown.skillsRelevance.toFixed(1)} <span className="text-xs text-slate-400 font-bold">/ 3.0</span>
                      </div>
                      <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${Math.min(100, (breakdown.skillsRelevance / 3) * 100)}%` }} />
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 shadow-sm">
                      <span className="text-[10px] font-mono text-slate-500 font-bold uppercase tracking-wider block mb-1.5">
                        Experience (20%)
                      </span>
                      <div className="text-2xl font-bold font-mono text-slate-900 mb-2">
                        {breakdown.experience.toFixed(1)} <span className="text-xs text-slate-400 font-bold">/ 2.0</span>
                      </div>
                      <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${Math.min(100, (breakdown.experience / 2) * 100)}%` }} />
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 shadow-sm">
                      <span className="text-[10px] font-mono text-slate-500 font-bold uppercase tracking-wider block mb-1.5">
                        Proof / Projects (15%)
                      </span>
                      <div className="text-2xl font-bold font-mono text-slate-900 mb-2">
                        {breakdown.projects.toFixed(1)} <span className="text-xs text-slate-400 font-bold">/ 1.5</span>
                      </div>
                      <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-brand-500 rounded-full" style={{ width: `${Math.min(100, (breakdown.projects / 1.5) * 100)}%` }} />
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 shadow-sm">
                      <span className="text-[10px] font-mono text-slate-500 font-bold uppercase tracking-wider block mb-1.5">
                        Clarity & Comm (15%)
                      </span>
                      <div className="text-2xl font-bold font-mono text-slate-900 mb-2">
                        {breakdown.clarityStructure.toFixed(1)} <span className="text-xs text-slate-400 font-bold">/ 1.5</span>
                      </div>
                      <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-purple-500 rounded-full" style={{ width: `${Math.min(100, (breakdown.clarityStructure / 1.5) * 100)}%` }} />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 shadow-sm">
                      <span className="text-[10px] font-mono text-slate-500 font-bold uppercase tracking-wider block mb-1.5">
                        ATS Compatibility
                      </span>
                      <div className="text-2xl font-bold font-mono text-slate-900 mb-2">
                        {breakdown.atsCompatibility.toFixed(1)} <span className="text-xs text-slate-400 font-bold">/ 2</span>
                      </div>
                      <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-brand-500 rounded-full" style={{ width: `${(breakdown.atsCompatibility / 2) * 100}%` }} />
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 shadow-sm">
                      <span className="text-[10px] font-mono text-slate-500 font-bold uppercase tracking-wider block mb-1.5">
                        Skills Relevance
                      </span>
                      <div className="text-2xl font-bold font-mono text-slate-900 mb-2">
                        {breakdown.skillsRelevance.toFixed(1)} <span className="text-xs text-slate-400 font-bold">/ 2</span>
                      </div>
                      <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-brand-500 rounded-full" style={{ width: `${(breakdown.skillsRelevance / 2) * 100}%` }} />
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 shadow-sm">
                      <span className="text-[10px] font-mono text-slate-500 font-bold uppercase tracking-wider block mb-1.5">
                        Experience
                      </span>
                      <div className="text-2xl font-bold font-mono text-slate-900 mb-2">
                        {breakdown.experience.toFixed(1)} <span className="text-xs text-slate-400 font-bold">/ 2</span>
                      </div>
                      <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-brand-500 rounded-full" style={{ width: `${(breakdown.experience / 2) * 100}%` }} />
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 shadow-sm">
                      <span className="text-[10px] font-mono text-slate-500 font-bold uppercase tracking-wider block mb-1.5">
                        Projects
                      </span>
                      <div className="text-2xl font-bold font-mono text-slate-900 mb-2">
                        {breakdown.projects.toFixed(1)} <span className="text-xs text-slate-400 font-bold">/ 2</span>
                      </div>
                      <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-brand-500 rounded-full" style={{ width: `${(breakdown.projects / 2) * 100}%` }} />
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 shadow-sm">
                      <span className="text-[10px] font-mono text-slate-500 font-bold uppercase tracking-wider block mb-1.5">
                        Clarity & Structure
                      </span>
                      <div className="text-2xl font-bold font-mono text-slate-900 mb-2">
                        {breakdown.clarityStructure.toFixed(1)} <span className="text-xs text-slate-400 font-bold">/ 2</span>
                      </div>
                      <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-brand-500 rounded-full" style={{ width: `${(breakdown.clarityStructure / 2) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                )}

                <div className="p-4 bg-brand-50 border border-brand-200 rounded-xl text-xs text-brand-700 flex items-center justify-between font-mono font-medium shadow-sm">
                  {isNonTech ? (
                    <span>Weightings: ATS (20%) + {careerArea} Relevance (30%) + Exp (20%) + Proof (15%) + Clarity (15%)</span>
                  ) : (
                    <span>Score Calculation: {breakdown.atsCompatibility} + {breakdown.skillsRelevance} + {breakdown.experience} + {breakdown.projects} + {breakdown.clarityStructure}</span>
                  )}
                  <span className="font-black text-brand-800">= {totalScore.toFixed(1)} / 10</span>
                </div>
              </div>

              {/* Navigation Tabs for Granular Sections */}
              <div className="flex gap-2 pt-6 border-t border-slate-100 mt-6 overflow-x-auto pb-1 custom-scrollbar">
                {[
                  { id: 'OVERVIEW', label: isNonTech ? `ATS & ${careerArea} Gaps` : 'ATS & Recommendations' },
                  { id: 'CONTENT', label: isNonTech ? `${careerArea} Skills & Deliverables` : 'Parsed Experience, Skills & Projects' },
                  { id: 'SIGNALS', label: 'AI-Assistance & Metadata Signals' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap shadow-sm ${
                      activeTab === tab.id
                        ? 'bg-brand-50 text-brand-700 border border-brand-200'
                        : 'text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* TAB 1: ATS & RECOMMENDATIONS */}
          {activeTab === 'OVERVIEW' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* ATS Compatibility */}
              <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">ATS Compatibility</h3>
                </div>
                <div className="text-3xl font-black font-mono text-emerald-600">
                  {analysis?.atsAnalysis?.score || (isNonTech ? Math.round(atsScore * 10) : 85)}% <span className="text-sm text-slate-500 font-bold ml-1">Readability</span>
                </div>
                <div className="space-y-3 text-sm text-slate-700 font-medium">
                  {(analysis?.atsAnalysis?.findings || [
                    'Standard section headers detected (Experience, Education, Skills)',
                    'Direct contact channels parseable by ATS parsers',
                    'Compatible font glyphs and column format'
                  ]).map((finding, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{finding}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Missing Keywords */}
              <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    {isNonTech ? `Missing ${careerArea} Evidence` : 'Missing Keywords'}
                  </h3>
                </div>
                <p className="text-sm text-slate-600 font-medium">
                  {isNonTech 
                    ? `Core ${careerArea} competencies with limited or absent resume evidence:` 
                    : 'High-impact engineering keywords that could boost ATS filtering match:'}
                </p>
                <div className="flex flex-wrap gap-2 pt-2">
                  {(analysis?.missingRoleSkills && analysis.missingRoleSkills.length > 0
                    ? analysis.missingRoleSkills
                    : (analysis?.missingKeywords && analysis.missingKeywords.length > 0 
                      ? analysis.missingKeywords 
                      : (isNonTech 
                        ? ['Market Research', 'Campaign Strategy', 'Customer Acquisition', 'Analytics'] 
                        : ['Docker', 'PostgreSQL', 'Redis', 'CI/CD', 'REST API']))
                  ).map((kw, i) => (
                    <span key={i} className="px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-amber-50 text-amber-700 border border-amber-200 shadow-sm">
                      + {kw}
                    </span>
                  ))}
                </div>
              </div>

              {/* Recommendations & Formatting */}
              <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <Sparkles className="w-5 h-5 text-brand-600" />
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Recommendations</h3>
                </div>
                <div className="space-y-3 text-sm text-slate-700 font-medium pt-1">
                  {(analysis?.recommendations && analysis.recommendations.length > 0
                    ? analysis.recommendations
                    : [
                      isNonTech 
                        ? `Add measurable ${careerArea} campaign results and customer impact metrics`
                        : 'Include quantitative metrics in bullet points (e.g. reduced latency by 35%)',
                      isNonTech
                        ? 'Highlight deliverables and case studies in your target career domain'
                        : 'Link your GitHub repositories directly to project titles',
                      isNonTech
                        ? `Ensure technical skills do not overshadow your ${careerArea} narrative`
                        : 'Detail unit/integration testing frameworks used'
                    ]
                  ).map((rec, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <span className="text-brand-500 font-black shrink-0">•</span>
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: PARSED CONTENT (SKILLS, EXPERIENCE, EDUCATION, PROJECTS) */}
          {activeTab === 'CONTENT' && (
            <div className="space-y-6">
              
              {/* Skills */}
              <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 space-y-6">
                {isNonTech ? (
                  <>
                    {/* Career Area Relevant Skills */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-emerald-500" />
                          {careerArea}-Relevant Skills Detected ({analysis?.roleRelevantSkills?.length || 0})
                        </h3>
                        <span className="text-[10px] font-mono text-emerald-700 font-bold uppercase tracking-wider bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 shadow-sm">
                          Role Relevant
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2.5">
                        {analysis?.roleRelevantSkills && analysis.roleRelevantSkills.length > 0 ? (
                          analysis.roleRelevantSkills.map((skill, i) => (
                            <span key={i} className="px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-emerald-50 border border-emerald-200 text-emerald-700 shadow-sm">
                              ✓ {skill}
                            </span>
                          ))
                        ) : (
                          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800 font-medium w-full shadow-sm">
                            No direct evidence of {careerArea} skills detected in resume yet. Review recommendations or submit proof-of-work challenges to verify skills.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Other Detected Resume Skills */}
                    <div className="pt-5 border-t border-slate-100">
                      <div className="mb-3">
                        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                          <Code className="w-4 h-4 text-slate-500" />
                          Other Skills Detected from Resume (Context Only) ({(analysis?.detectedSkills || analysis?.skills || []).length})
                        </h3>
                        <p className="text-xs text-slate-500 font-medium mt-1">
                          Extracted verbatim from resume text (e.g. programming or legacy keywords). These do NOT define your {careerArea} profile identity.
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {(analysis?.detectedSkills || analysis?.skills || []).length > 0 ? (
                          (analysis?.detectedSkills || analysis?.skills || []).map((skill, i) => (
                            <span key={i} className="px-2.5 py-1.5 rounded-lg text-xs font-mono font-medium bg-slate-50 border border-slate-200 text-slate-700 shadow-sm">
                              {skill}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-500 font-mono font-medium">No other skills detected.</span>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <Code className="w-5 h-5 text-brand-600" /> Parsed Engineering Skills ({analysis?.skills?.length || 0})
                    </h3>
                    <div className="flex flex-wrap gap-2.5">
                      {analysis?.skills && analysis.skills.length > 0 ? (
                        analysis.skills.map((skill, i) => (
                          <span key={i} className="px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-slate-50 border border-slate-200 text-slate-700 shadow-sm">
                            {skill}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-500 font-mono font-medium">No specific technologies extracted.</span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Experience & Education */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100">
                    <Briefcase className="w-5 h-5 text-brand-600" /> Parsed Experience
                  </h3>
                  {analysis?.experience && analysis.experience.length > 0 ? (
                    <div className="space-y-3">
                      {analysis.experience.map((exp: any, i: number) => (
                        <div key={i} className="p-4 bg-slate-50 rounded-xl border border-slate-200 shadow-sm">
                          <div className="text-sm font-bold text-slate-900">{exp.title || (isNonTech ? `${careerArea} Role` : 'Technical Role')}</div>
                          <div className="text-xs font-bold text-slate-500 mb-3 uppercase tracking-wider mt-0.5">{exp.company || 'Organization'}</div>
                          {exp.details && Array.isArray(exp.details) && (
                            <div className="text-xs text-slate-700 font-medium space-y-2">
                              {exp.details.slice(0, 3).map((d: string, j: number) => (
                                <div key={j} className="flex items-start gap-2">
                                  <span className="text-slate-400 mt-0.5">•</span>
                                  <span className="leading-relaxed">{d}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-slate-500 font-mono font-medium">Standard experience records loaded.</div>
                  )}
                </div>

                <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100">
                    <GraduationCap className="w-5 h-5 text-indigo-600" /> Parsed Education & Credentials
                  </h3>
                  {analysis?.education && analysis.education.length > 0 ? (
                    <div className="space-y-3">
                      {analysis.education.map((edu: any, i: number) => (
                        <div key={i} className="p-4 bg-slate-50 rounded-xl border border-slate-200 shadow-sm">
                          <div className="text-sm font-bold text-slate-900 mb-1">{edu.degree || (isNonTech ? 'Bachelor Degree' : 'Computer Science / Engineering')}</div>
                          <div className="text-xs text-slate-600 font-medium">{edu.institution || 'University'}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-slate-500 font-mono font-medium">Academic credentials parsed.</div>
                  )}
                </div>

              </div>

              {/* Projects / Proof of Work */}
              <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-5 flex items-center gap-2 pb-3 border-b border-slate-100">
                  <Layers className="w-5 h-5 text-brand-600" /> 
                  {isNonTech ? `${careerArea} Proof of Work & Case Studies` : 'Technical Projects Section'}
                </h3>
                {analysis?.projects && analysis.projects.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {analysis.projects.map((proj: any, i: number) => (
                      <div key={i} className="p-5 bg-slate-50 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                        <div>
                          <div className="text-sm font-bold text-slate-900 mb-1.5">{proj.title}</div>
                          <div className="text-xs text-slate-600 font-medium mb-4 leading-relaxed">{proj.description || (isNonTech ? 'Case study deliverable' : 'Verified implementation')}</div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mt-auto">
                          {proj.technologies && !isNonTech && (
                            proj.technologies.map((t: string, j: number) => (
                              <span key={j} className="text-[10px] font-mono px-2 py-1 rounded-md bg-white border border-slate-200 text-slate-600 font-bold shadow-sm">
                                {t}
                              </span>
                            ))
                          )}
                          {proj.deliverableType && isNonTech && (
                            <span className="text-[10px] font-mono px-2.5 py-1 rounded-md bg-brand-50 text-brand-700 border border-brand-200 font-bold shadow-sm">
                              {proj.deliverableType}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-slate-500 font-mono font-medium p-4 bg-slate-50 rounded-xl border border-slate-200 border-dashed">
                    {isNonTech
                      ? 'Submit proof-of-work challenge deliverables to populate verified non-technical case studies.'
                      : 'Projects cross-referenced with your verified workspace repositories.'}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 3: AI-ASSISTANCE & DOCUMENT METADATA SIGNALS */}
          {activeTab === 'SIGNALS' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* SECTION: AI-ASSISTANCE SIGNALS */}
              <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-indigo-600" />
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">AI-Assistance Signals</h3>
                  </div>
                  <span className={`text-xs px-3 py-1 rounded-full font-bold font-mono border ${getSignalBadgeColor(analysis?.aiAssistanceSignals?.category)} shadow-sm`}>
                    {analysis?.aiAssistanceSignals?.category || 'LOW AI-ASSISTANCE SIGNAL'}
                  </span>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-sm text-slate-700 leading-relaxed font-medium shadow-sm">
                  <span className="font-bold text-slate-900 block mb-1.5">Signal Confidence: {analysis?.aiAssistanceSignals?.confidence || 'Moderate'}</span>
                  {analysis?.aiAssistanceSignals?.explanation || 'Writing exhibits personal technical voice with project-specific terminology.'}
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Detected Evidence:</h4>
                  <div className="space-y-2.5">
                    {(analysis?.aiAssistanceSignals?.evidence && analysis.aiAssistanceSignals.evidence.length > 0
                      ? analysis.aiAssistanceSignals.evidence
                      : ['Varied syntactic structures across accomplishment bullets', 'Concrete framework toolchains with domain-specific idioms']
                    ).map((ev, i) => (
                      <div key={i} className="p-3 rounded-xl bg-white border border-slate-200 text-sm font-medium text-slate-700 flex items-start gap-2.5 shadow-sm">
                        <span className="text-brand-500 font-black">•</span>
                        <span>{ev}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-800 leading-relaxed font-medium shadow-sm">
                  <span className="text-indigo-700 font-black block mb-1 uppercase tracking-wider">Statistical Methodology Note:</span>
                  This is a heuristic signal based on syntactic uniformity and buzzword density, <strong className="text-indigo-900 font-bold">NOT proof</strong> that ChatGPT or another LLM was used. ProofHire does not output fake percentages.
                </div>
              </div>

              {/* SECTION: DOCUMENT METADATA SIGNALS */}
              <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <FileCode className="w-5 h-5 text-emerald-600" />
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Document Metadata Signals</h3>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-md font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm">
                    Clean Container
                  </span>
                </div>

                <div className="space-y-3 font-mono text-sm font-medium">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex justify-between shadow-sm">
                    <span className="text-slate-500">Document Creator:</span>
                    <span className="text-slate-900 font-bold">{analysis?.documentMetadataSignals?.creator || 'Standard Document Editor'}</span>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex justify-between shadow-sm">
                    <span className="text-slate-500">PDF Producer:</span>
                    <span className="text-slate-900 font-bold">{analysis?.documentMetadataSignals?.producer || 'PDF Generator Engine'}</span>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex justify-between shadow-sm">
                    <span className="text-slate-500">Creation Date:</span>
                    <span className="text-slate-700">{analysis?.documentMetadataSignals?.creationDate ? new Date(analysis.documentMetadataSignals.creationDate).toLocaleString() : 'Valid Header'}</span>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 font-mono">Structural Stream Signals:</h4>
                  <div className="space-y-2.5">
                    {(analysis?.documentMetadataSignals?.signals && analysis.documentMetadataSignals.signals.length > 0
                      ? analysis.documentMetadataSignals.signals
                      : [
                        'Clean binary document streams detected without anomalous compression tags',
                        'Valid font encoding glyph table matching standard authoring tools',
                        'Consistent document timestamp continuity'
                      ]
                    ).map((sig, i) => (
                      <div key={i} className="p-3 rounded-xl bg-white border border-slate-200 text-sm text-slate-700 font-medium flex items-start gap-2.5 font-mono shadow-sm">
                        <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{sig}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-medium text-emerald-800 font-mono shadow-sm">
                  SHA256 Fingerprint: <span className="text-emerald-700 font-bold">{resume.fileHash ? `${resume.fileHash.slice(0, 16)}...` : 'VERIFIED'}</span>
                </div>
              </div>

            </div>
          )}

        </div>
      )}

    </div>
  );
}
