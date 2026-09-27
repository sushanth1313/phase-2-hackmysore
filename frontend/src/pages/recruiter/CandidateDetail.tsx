import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, CheckCircle2, Award, Loader2, AlertCircle, ExternalLink, Bookmark, BookmarkCheck } from 'lucide-react';
import api from '../../api/client';

interface CandidateProfile {
  profile: { id: string; firstName: string; lastName: string; email: string; role: string };
  skills: { name: string; confidence: number; type: string; projectCount: number; verificationStatus: string }[];
  projects: { project: any; scores: any; analysisStatus: string; analyzedAt: string }[];
  projectCount: number;
}

export default function CandidateDetail() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<CandidateProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shortlisted, setShortlisted] = useState(false);
  const [shortlisting, setShortlisting] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetch = async () => {
      setLoading(true); setError(null);
      try {
        const res = await api.get(`/recruiter/candidates/${id}`);
        setData(res.data?.data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load candidate profile.');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  const handleShortlist = async () => {
    setShortlisting(true);
    try {
      await api.post('/recruiter/shortlists', { candidateId: id });
      setShortlisted(true);
    } catch (err: any) {
      if (err.response?.status === 409) setShortlisted(true);
    } finally {
      setShortlisting(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <Loader2 className="w-8 h-8 text-brand-500 animate-spin mb-3" />
      <p className="text-slate-400 text-sm">Loading candidate profile...</p>
    </div>
  );

  if (error || !data) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6">
      <AlertCircle className="w-10 h-10 text-red-400 mb-4" />
      <p className="text-white font-bold text-lg mb-2">Unable to load profile</p>
      <p className="text-slate-400 text-sm mb-6">{error || 'Candidate not found.'}</p>
      <Link to="/recruiter/talent" className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white text-sm font-bold rounded-lg">
        <ArrowLeft className="w-4 h-4" /> Back to Talent Discovery
      </Link>
    </div>
  );

  const { profile, skills, projects, projectCount } = data;
  const topSkills = skills.filter(s => s.verificationStatus === 'SUPPORTED').slice(0, 10);
  const compositeSignal = topSkills.length > 0
    ? Math.round(topSkills.reduce((s, k) => s + k.confidence, 0) / topSkills.length * 10) / 10
    : null;

  const groupedSkills = skills.reduce<Record<string, typeof skills>>((acc, s) => {
    const type = s.type || 'OTHER';
    if (!acc[type]) acc[type] = [];
    acc[type].push(s);
    return acc;
  }, {});

  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out pb-20">

      {/* HERO */}
      <section className="bg-gradient-to-b from-[#0D1322] to-[#070B14] border-b border-slate-800/50 px-6 py-10 md:px-12">
        <div className="max-w-[1400px] mx-auto">
          <Link to="/recruiter/talent" className="flex items-center gap-2 text-slate-500 hover:text-white text-sm mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Talent Discovery
          </Link>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-800 border border-slate-600 flex items-center justify-center font-black text-3xl text-white">
                {profile.firstName[0]}
              </div>
              <div>
                <h1 className="text-4xl font-black text-white mb-1">{profile.firstName} {profile.lastName}</h1>
                <div className="flex items-center gap-3 mt-2">
                  {projectCount > 0 ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Evidence Available
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-slate-500 text-xs font-bold uppercase tracking-wider">
                      <ShieldCheck className="w-3.5 h-3.5" /> Pending Analysis
                    </span>
                  )}
                  <span className="text-sm text-slate-400">{projectCount} analyzed project{projectCount !== 1 ? 's' : ''}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {compositeSignal !== null && (
                <div className="text-right">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1 justify-end">
                    <Award className="w-3 h-3" /> Evidence Signal
                  </div>
                  <div className="text-5xl font-black text-brand-400 tabular-nums">{compositeSignal.toFixed(1)}</div>
                </div>
              )}
              <button
                onClick={handleShortlist}
                disabled={shortlisted || shortlisting}
                className={`px-5 py-3 rounded-xl font-bold flex items-center gap-2 transition-colors ${
                  shortlisted
                    ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 cursor-default'
                    : 'bg-white text-slate-900 hover:bg-slate-200'
                }`}
              >
                {shortlisting ? <Loader2 className="w-4 h-4 animate-spin" /> :
                 shortlisted ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                {shortlisted ? 'Shortlisted' : 'Shortlist'}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* BODY */}
      <div className="max-w-[1400px] mx-auto px-6 md:px-12 py-10 grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* LEFT — Capabilities */}
        <div className="lg:col-span-2 space-y-8">
          <section>
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-5">Verified Capabilities</h2>

            {skills.length === 0 ? (
              <div className="bg-[#0D1322] border border-slate-800/80 rounded-2xl p-8 text-center">
                <ShieldCheck className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <p className="text-white font-bold mb-1">No analyzed evidence yet</p>
                <p className="text-slate-400 text-sm">This candidate hasn't submitted projects for analysis yet.</p>
              </div>
            ) : (
              Object.entries(groupedSkills).map(([type, typeSkills]) => (
                <div key={type} className="bg-[#0D1322] border border-slate-800/80 rounded-2xl p-6 mb-4">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">{type.replace('_', ' ')}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {typeSkills.sort((a, b) => b.confidence - a.confidence).map((skill, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="flex-1">
                          <div className="flex justify-between text-xs mb-1.5">
                            <span className="text-slate-200 font-bold">{skill.name}</span>
                            <span className={`font-bold text-xs ${
                              skill.verificationStatus === 'SUPPORTED' ? 'text-emerald-400' :
                              skill.verificationStatus === 'PARTIALLY_SUPPORTED' ? 'text-amber-400' :
                              'text-slate-500'
                            }`}>{skill.confidence}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-800 rounded-full">
                            <div className={`h-full rounded-full ${
                              skill.verificationStatus === 'SUPPORTED' ? 'bg-brand-500' :
                              skill.verificationStatus === 'PARTIALLY_SUPPORTED' ? 'bg-amber-500' :
                              'bg-slate-600'
                            }`} style={{ width: `${skill.confidence}%` }} />
                          </div>
                        </div>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          skill.verificationStatus === 'SUPPORTED'
                            ? 'text-emerald-400 bg-emerald-500/10'
                            : skill.verificationStatus === 'PARTIALLY_SUPPORTED'
                            ? 'text-amber-400 bg-amber-500/10'
                            : 'text-slate-500 bg-slate-800'
                        }`}>
                          {skill.verificationStatus === 'SUPPORTED' ? 'SUPPORTED' :
                           skill.verificationStatus === 'PARTIALLY_SUPPORTED' ? 'PARTIAL' : 'WEAK'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </section>

          {/* Projects */}
          {projects.length > 0 && (
            <section>
              <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-5">Analyzed Projects</h2>
              <div className="space-y-4">
                {projects.map((p, i) => (
                  <div key={i} className="bg-[#0D1322] border border-slate-800/80 rounded-2xl p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-white mb-1">{p.project?.projectName || 'Untitled Project'}</h3>
                        {p.project?.description && <p className="text-slate-400 text-sm">{p.project.description}</p>}
                      </div>
                      {p.project?.githubUrl && (
                        <a href={p.project.githubUrl} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors">
                          <ExternalLink className="w-3.5 h-3.5" /> GitHub
                        </a>
                      )}
                    </div>
                    {p.scores && (
                      <div className="grid grid-cols-4 gap-3">
                        {Object.entries(p.scores).filter(([k]) => k !== 'overallEvidenceScore').map(([key, val]) => (
                          <div key={key} className="text-center">
                            <div className="text-xl font-black text-white">{String(val) || '—'}</div>
                            <div className="text-[10px] text-slate-500 uppercase tracking-wider">{key.replace(/([A-Z])/g, ' $1').trim()}</div>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="mt-3 pt-3 border-t border-slate-800/50">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        p.analysisStatus === 'COMPLETED' ? 'text-emerald-400 bg-emerald-500/10' :
                        p.analysisStatus === 'FAILED' ? 'text-red-400 bg-red-500/10' :
                        'text-amber-400 bg-amber-500/10'
                      }`}>{p.analysisStatus}</span>
                      {p.analyzedAt && <span className="text-xs text-slate-600 ml-3">Analyzed {new Date(p.analyzedAt).toLocaleDateString()}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* RIGHT — Summary */}
        <div className="space-y-6">
          <div className="bg-[#0D1322] border border-slate-800/80 rounded-2xl p-6">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Profile Summary</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Analyzed Projects</span>
                <span className="text-white font-bold">{projectCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Verified Signals</span>
                <span className="text-white font-bold">{skills.filter(s => s.verificationStatus === 'SUPPORTED').length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Evidence Signal</span>
                <span className="font-black text-brand-400">{compositeSignal !== null ? compositeSignal.toFixed(1) : '—'}</span>
              </div>
            </div>
          </div>

          <div className="bg-[#0D1322] border border-amber-500/20 rounded-2xl p-5">
            <p className="text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">Verification Note</p>
            <p className="text-slate-400 text-xs leading-relaxed">
              Capability scores are derived from actual codebase evidence — not self-reported claims. Confidence levels reflect detection certainty, not proficiency ranking.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
