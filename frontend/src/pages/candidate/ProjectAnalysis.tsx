import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Code2, ShieldCheck, CheckCircle2, AlertCircle, ArrowLeft, 
  Terminal, Layers, FileCode, Cpu, Check, Activity, RefreshCw,
  GitBranch, Database, Lock, AlertTriangle, HelpCircle, FileCheck
} from 'lucide-react';
import api from '../../api/client';

interface ProjectScores {
  codeQuality: number;   // max 15
  architecture: number;  // max 15
  correctness: number;   // max 15
  testing: number;       // max 10
  documentation: number; // max 10
  security: number;      // max 10
  complexity: number;    // max 10
  evidence: number;      // max 15
  overallScore: number;  // total out of 100
}

interface Inspections {
  codeQualityNotes?: string;
  architectureNotes?: string;
  correctnessNotes?: string;
  complexityNotes?: string;
  testingNotes?: string;
  documentationNotes?: string;
  securityNotes?: string;
  errorHandlingNotes?: string;
  apiDesignNotes?: string;
  databaseNotes?: string;
  repoStructureNotes?: string;
  gitHistoryNotes?: string;
  implementationEvidenceNotes?: string;
}

export default function ProjectAnalysis() {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<any>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const [projRes, analysisRes] = await Promise.allSettled([
        api.get(`/projects/${id}`),
        api.get(`/projects/${id}/analysis`)
      ]);

      if (projRes.status === 'fulfilled' && projRes.value.data?.data) {
        setProject(projRes.value.data.data);
      }
      if (analysisRes.status === 'fulfilled' && analysisRes.value.data?.data) {
        setAnalysis(analysisRes.value.data.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load project analysis');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) loadData();
  }, [id]);

  const scores: ProjectScores = analysis?.scores || {
    codeQuality: 0,
    architecture: 0,
    correctness: 0,
    testing: 0,
    documentation: 0,
    security: 0,
    complexity: 0,
    evidence: 0,
    overallScore: 0
  };

  const inspections: Inspections = analysis?.inspections || {};
  const status = analysis?.verification?.status || 'INSUFFICIENT EVIDENCE';
  const isInsufficient = status === 'INSUFFICIENT EVIDENCE';
  const isNeedsReview = status === 'NEEDS REVIEW';

  const statusBadge = isInsufficient ? {
    label: 'INSUFFICIENT EVIDENCE',
    color: 'bg-rose-500/10 text-rose-400 border-rose-500/30'
  } : isNeedsReview ? {
    label: 'NEEDS REVIEW',
    color: 'bg-amber-500/10 text-amber-400 border-amber-500/30'
  } : {
    label: 'VERIFIED',
    color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
  };

  const dimensionCards = [
    { label: 'Code Quality', score: scores.codeQuality, max: 15, desc: 'Syntax, style discipline, idioms' },
    { label: 'Architecture', score: scores.architecture, max: 15, desc: 'Module boundaries, separation' },
    { label: 'Correctness', score: scores.correctness, max: 15, desc: 'Execution flow, lifecycle safety' },
    { label: 'Testing', score: scores.testing, max: 10, desc: 'Automated suites & test assertions' },
    { label: 'Documentation', score: scores.documentation, max: 10, desc: 'README, comments & interface docs' },
    { label: 'Security & Config', score: scores.security, max: 10, desc: 'Input validation, sanitize & secrets' },
    { label: 'Complexity', score: scores.complexity, max: 10, desc: 'Cyclomatic paths, time/space limits' },
    { label: 'Evidence Grounding', score: scores.evidence, max: 15, desc: 'Direct AST verifiable code proofs' }
  ];

  const inspectionItems = [
    { num: '1', title: 'Code Quality', note: inspections.codeQualityNotes || 'Analysis pending source code submission.' },
    { num: '2', title: 'Architecture', note: inspections.architectureNotes || 'Module structure evaluation pending.' },
    { num: '3', title: 'Correctness', note: inspections.correctnessNotes || 'Execution flow validation pending.' },
    { num: '4', title: 'Complexity', note: inspections.complexityNotes || 'Cyclomatic complexity checks pending.' },
    { num: '5', title: 'Testing', note: inspections.testingNotes || 'Test assertions and test suites.' },
    { num: '6', title: 'Documentation', note: inspections.documentationNotes || 'README and code annotations.' },
    { num: '7', title: 'Security', note: inspections.securityNotes || 'Static vulnerability scanning.' },
    { num: '8', title: 'Error Handling', note: inspections.errorHandlingNotes || 'Exception boundaries and recovery.' },
    { num: '9', title: 'API Design', note: inspections.apiDesignNotes || 'Interface contracts and REST endpoints.' },
    { num: '10', title: 'Database Usage', note: inspections.databaseNotes || 'Schema and data layer access.' },
    { num: '11', title: 'Repository Structure', note: inspections.repoStructureNotes || 'Directory layout and modularity.' },
    { num: '12', title: 'Git History', note: inspections.gitHistoryNotes || 'Commit cadence and change discipline.' },
    { num: '13', title: 'Implementation Evidence', note: inspections.implementationEvidenceNotes || 'AST extracted artifacts.' }
  ];

  return (
    <div className="w-full min-h-[calc(100vh-4rem)] p-6 md:p-10 space-y-8 animate-in fade-in duration-500">
      
      {/* Back button and Header */}
      <div>
        <Link 
          to="/candidate/projects" 
          className="inline-flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-white transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Projects
        </Link>

        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2 rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/20">
                <Code2 className="w-6 h-6" />
              </div>
              <h1 className="text-3xl font-black text-white tracking-tight">PROJECT AI ANALYSIS</h1>
            </div>
            <p className="text-sm text-slate-400">
              Deterministic static code inspection, 13-dimension evidence audit, and verified capability scoring.
            </p>
          </div>

          <button
            onClick={loadData}
            disabled={loading}
            className="p-2.5 rounded-xl border border-slate-800 bg-[#0D1322] text-slate-400 hover:text-white transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      {project && (
        <div className="space-y-8">
          
          {/* Top Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="p-6 rounded-2xl bg-[#0D1322] border border-slate-800 space-y-3">
              <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider block">Project Overview</span>
              <div className="text-xl font-bold text-white">{project.projectName}</div>
              <div className="text-xs text-slate-400 leading-relaxed">{project.description || 'Verified engineering project.'}</div>
              {project.githubUrl && (
                <div className="text-xs text-brand-400 font-mono pt-1">
                  Repo: <a href={project.githubUrl} target="_blank" rel="noreferrer" className="underline hover:text-brand-300">{project.githubUrl}</a>
                </div>
              )}
            </div>

            <div className="p-6 rounded-2xl bg-[#0D1322] border border-slate-800 space-y-3">
              <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider block">Verification Status</span>
              <div className="flex items-center gap-2">
                <ShieldCheck className={`w-5 h-5 ${isInsufficient ? 'text-rose-400' : isNeedsReview ? 'text-amber-400' : 'text-emerald-400'}`} />
                <span className={`text-base font-bold font-mono px-2.5 py-0.5 rounded border ${statusBadge.color}`}>
                  {statusBadge.label}
                </span>
              </div>
              <div className="text-xs text-slate-400 leading-relaxed">
                {analysis?.verification?.summary || 'Static code analysis grounded in actual source code evidence.'}
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-[#0D1322] border border-slate-800 space-y-3">
              <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider block">Deterministic Project Score</span>
              <div className="text-4xl font-black font-mono text-brand-400">
                {scores.overallScore} <span className="text-base text-slate-500">/ 100</span>
              </div>
              <div className="text-xs text-slate-400 font-mono">
                Calculated strictly from 8 deterministic dimensions. Isolated from resume and interview.
              </div>
            </div>

          </div>

          {/* Insufficient Evidence Warning Banner if applicable */}
          {isInsufficient && (
            <div className="p-5 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-4 text-rose-300 text-xs leading-relaxed font-mono">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-rose-200 block text-sm mb-1 font-sans">INSUFFICIENT EVIDENCE DETECTED</strong>
                This project has not completed static AST analysis with verified source files. Scores cannot be artificially generated without explicit evidence. Please upload a codebase archive (.zip) on the Proof of Work page to extract real artifacts.
              </div>
            </div>
          )}

          {/* 8-Dimension Deterministic Code Quality Scores */}
          <div className="p-6 md:p-8 rounded-2xl bg-[#0D1322] border border-slate-800 space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                  Deterministic Score Calculation (8 Dimensions)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Every point is traceable to explicit static code evidence. No arbitrary numbers.
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-brand-400 bg-brand-500/10 px-3 py-1 rounded-lg border border-brand-500/20">
                Total: {scores.overallScore} / 100
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {dimensionCards.map((dim, i) => (
                <div key={i} className="p-4 rounded-xl bg-[#070B14] border border-slate-800/80 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">{dim.label}</span>
                    <span className="text-xs font-mono text-slate-500">Max {dim.max}</span>
                  </div>
                  <div className="text-2xl font-black font-mono text-white">
                    {dim.score} <span className="text-xs text-slate-500">/ {dim.max}</span>
                  </div>
                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${dim.score === 0 ? 'bg-slate-700' : 'bg-brand-500'}`} 
                      style={{ width: `${(dim.score / dim.max) * 100}%` }} 
                    />
                  </div>
                  <div className="text-[10px] text-slate-500">{dim.desc}</div>
                </div>
              ))}
            </div>

            <div className="p-3 bg-brand-500/5 border border-brand-500/20 rounded-xl text-xs font-mono text-slate-300 flex justify-between items-center">
              <span>Score Trace: {scores.codeQuality} + {scores.architecture} + {scores.correctness} + {scores.testing} + {scores.documentation} + {scores.security} + {scores.complexity} + {scores.evidence}</span>
              <span className="font-bold text-white">= {scores.overallScore} / 100</span>
            </div>
          </div>

          {/* 13-Dimension Inspection Matrix */}
          <div className="p-6 md:p-8 rounded-2xl bg-[#0D1322] border border-slate-800 space-y-6">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-emerald-400" />
                13-Dimension Project Static Code Inspections
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Comprehensive technical audit inspects repository structure, error boundaries, API contracts, and implementation evidence.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {inspectionItems.map(item => (
                <div key={item.num} className="p-4 rounded-xl bg-[#070B14] border border-slate-800/80 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-white">
                    <span className="w-5 h-5 rounded-full bg-slate-800 text-brand-400 flex items-center justify-center font-mono text-[10px]">
                      {item.num}
                    </span>
                    <span>{item.title}</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed font-mono">
                    {item.note}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Detected Technologies & Evidence Items */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="p-6 rounded-2xl bg-[#0D1322] border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Cpu className="w-4 h-4 text-emerald-400" /> Detected Technologies & Frameworks
              </h3>
              <div className="flex flex-wrap gap-2">
                {(analysis?.detectedTechnologies || project.claimedTechnologies || []).map((t: string, i: number) => (
                  <span key={i} className="px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-[#070B14] border border-slate-700 text-slate-200">
                    {t}
                  </span>
                ))}
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-[#0D1322] border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <FileCode className="w-4 h-4 text-brand-400" /> Extracted Code Artifacts
              </h3>
              {analysis?.evidenceItems && analysis.evidenceItems.length > 0 ? (
                <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                  {analysis.evidenceItems.map((it: any, i: number) => (
                    <div key={i} className="p-2.5 rounded-lg bg-[#070B14] border border-slate-800 flex justify-between items-center text-xs font-mono">
                      <div>
                        <span className="text-white font-bold">{it.name}</span>
                        <span className="text-slate-500 text-[10px] ml-2 uppercase">({it.type})</span>
                      </div>
                      <span className="text-emerald-400 font-bold">{Math.round((it.confidence || 0.8) * 100)}% Match</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 leading-relaxed font-mono">
                  {isInsufficient ? 'No code artifacts extracted. Codebase archive required.' : 'Static code artifacts verified against repository manifest.'}
                </p>
              )}
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
