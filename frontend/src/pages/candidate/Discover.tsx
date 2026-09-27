import React, { useState, useEffect } from 'react';
import { 
  Briefcase, Search, MapPin, Clock, ArrowRight, CheckCircle2, 
  Loader2, AlertCircle, Filter, Bookmark, BookmarkCheck, Star, 
  Building2, Users, FileText, X, Check, Calendar, Globe
} from 'lucide-react';
import api from '../../api/client';

interface Job {
  _id: string;
  title: string;
  description: string;
  company?: string;
  companyLogo?: string;
  industry?: string;
  location?: string;
  type?: string;
  workMode?: string;
  salary?: string;
  skills: string[];
  requirements?: string[];
  requiredScore?: number;
  status: string;
  deadline?: string;
  createdAt: string;
  applications?: number;
  applied?: boolean;
  matchScore?: number;
}

interface CompanyItem {
  name: string;
  logo?: string;
  industry?: string;
  location?: string;
  size?: string;
  activeJobsCount: number;
  hiringStatus: 'HIRING_NOW' | 'OPEN';
  jobs: Job[];
}

interface ResumeOption {
  _id: string;
  fileName: string;
  isPrimary?: boolean;
  score10?: number;
  uploadedAt?: string;
  createdAt: string;
}

const JOB_TYPES = ['All Types', 'FULL_TIME', 'PART_TIME', 'CONTRACT', 'REMOTE'];
const SORT_OPTIONS = ['Newest', 'Best Match', 'Company'];

export default function CandidateDiscover({ initialTab = 'jobs' }: { initialTab?: 'jobs' | 'companies' }) {
  const [activeTab, setActiveTab] = useState<'jobs' | 'companies'>(initialTab);
  
  // Jobs State
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [errorJobs, setErrorJobs] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [jobType, setJobType] = useState('All Types');
  const [sortBy, setSortBy] = useState('Newest');
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  // Companies State
  const [companies, setCompanies] = useState<CompanyItem[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<CompanyItem | null>(null);

  // Apply with Resume Modal State
  const [applyModalJob, setApplyModalJob] = useState<Job | null>(null);
  const [resumes, setResumes] = useState<ResumeOption[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<string>('');
  const [submittingApply, setSubmittingApply] = useState(false);
  const [applySuccessMsg, setApplySuccessMsg] = useState<string | null>(null);

  const fetchJobs = async (q = search, type = jobType) => {
    setLoadingJobs(true);
    setErrorJobs(null);
    try {
      const params: any = {};
      if (q.trim()) params.search = q.trim();
      if (type !== 'All Types') params.type = type;
      const res = await api.get('/candidate/jobs', { params });
      setJobs(res.data?.data || []);
    } catch (err: any) {
      setErrorJobs(err.response?.data?.message || 'Failed to load opportunities.');
    } finally {
      setLoadingJobs(false);
    }
  };

  const fetchCompanies = async () => {
    setLoadingCompanies(true);
    try {
      const res = await api.get('/candidate/companies');
      setCompanies(res.data?.data || []);
    } catch (err) {
      console.error('Failed to load companies:', err);
    } finally {
      setLoadingCompanies(false);
    }
  };

  const fetchResumes = async () => {
    try {
      const res = await api.get('/resume/versions');
      const list: ResumeOption[] = res.data?.data || [];
      setResumes(list);
      const primary = list.find(r => r.isPrimary);
      if (primary) {
        setSelectedResumeId(primary._id);
      } else if (list.length > 0) {
        setSelectedResumeId(list[0]._id);
      }
    } catch (e) {
      console.error('Failed to fetch resumes for apply modal:', e);
    }
  };

  useEffect(() => {
    fetchJobs();
    fetchCompanies();
    fetchResumes();
  }, [jobType]);

  const handleOpenApplyModal = (job: Job) => {
    if (job.applied) return;
    setApplyModalJob(job);
    fetchResumes();
  };

  const handleConfirmApply = async () => {
    if (!applyModalJob) return;
    setSubmittingApply(true);
    try {
      await api.post(`/candidate/jobs/${applyModalJob._id}/apply`, {
        resumeId: selectedResumeId || undefined
      });
      setApplySuccessMsg(`Application submitted for ${applyModalJob.title}!`);
      setJobs(prev => prev.map(j => j._id === applyModalJob._id ? { ...j, applied: true } : j));
      
      // Update selectedCompany jobs if open
      if (selectedCompany) {
        setSelectedCompany({
          ...selectedCompany,
          jobs: selectedCompany.jobs.map(j => j._id === applyModalJob._id ? { ...j, applied: true } : j)
        });
      }

      setTimeout(() => {
        setApplyModalJob(null);
        setApplySuccessMsg(null);
      }, 1500);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to submit application.');
    } finally {
      setSubmittingApply(false);
    }
  };

  const toggleSave = (id: string) => {
    setSavedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const sortedJobs = [...jobs].sort((a, b) => {
    if (sortBy === 'Best Match') return (b.matchScore || 0) - (a.matchScore || 0);
    if (sortBy === 'Company') return (a.company || '').localeCompare(b.company || '');
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-brand-600 font-bold text-xs uppercase tracking-widest mb-1">
            <Briefcase className="w-4 h-4" /> Opportunities & Active Hiring
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Discover</h1>
          <p className="text-slate-500 text-sm mt-1">
            Explore active hiring organizations and verified roles matched to your proof-of-work.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveTab('jobs')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'jobs'
                ? 'bg-white text-brand-700 shadow-sm border border-slate-200/50'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>Open Jobs ({jobs.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('companies')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'companies'
                ? 'bg-white text-brand-700 shadow-sm border border-slate-200/50'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Companies Hiring ({companies.length})</span>
          </button>
        </div>
      </div>

      {/* ================= TAB 1: JOBS ================= */}
      {activeTab === 'jobs' && (
        <div className="space-y-6">
          {/* Search + Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <form onSubmit={e => { e.preventDefault(); fetchJobs(); }} className="relative flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search by title, skill, company..."
                  className="input pl-10"
                />
              </div>
              <button type="submit" className="btn btn-primary">
                Search
              </button>
            </form>

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={jobType}
                onChange={e => setJobType(e.target.value)}
                className="input"
              >
                {JOB_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="bg-[#0D1322] border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-brand-500"
              >
                {SORT_OPTIONS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Results count */}
          {!loadingJobs && !errorJobs && (
            <p className="text-xs text-slate-500">{sortedJobs.length} opportunit{sortedJobs.length === 1 ? 'y' : 'ies'} found</p>
          )}

          {/* States */}
          {loadingJobs ? (
            <div className="flex flex-col items-center justify-center py-24">
              <Loader2 className="w-8 h-8 text-brand-500 animate-spin mb-3" />
              <p className="text-slate-500 text-sm font-medium">Loading opportunities matched to your profile...</p>
            </div>
          ) : errorJobs ? (
            <div className="flex flex-col items-center justify-center py-24 bg-white border border-red-200 rounded-2xl shadow-sm">
              <AlertCircle className="w-8 h-8 text-red-500 mb-3" />
              <p className="text-slate-900 font-bold mb-1">Failed to load jobs</p>
              <p className="text-slate-500 text-sm mb-4">{errorJobs}</p>
              <button onClick={() => fetchJobs()} className="btn btn-primary">Retry</button>
            </div>
          ) : sortedJobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 bg-white border border-slate-200 rounded-2xl shadow-sm">
              <Briefcase className="w-12 h-12 text-slate-300 mb-4" />
              <p className="text-slate-900 font-bold mb-1">No opportunities found</p>
              <p className="text-slate-500 text-sm">
                Recruiters will post opportunities as they discover your capability profile.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedJobs.map(job => (
                <JobCard
                  key={job._id}
                  job={job}
                  isSaved={savedIds.has(job._id)}
                  onApply={() => handleOpenApplyModal(job)}
                  onToggleSave={() => toggleSave(job._id)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 2: COMPANIES HIRING NOW ================= */}
      {activeTab === 'companies' && (
        <div className="space-y-6">
          {loadingCompanies ? (
            <div className="flex flex-col items-center justify-center py-24">
              <Loader2 className="w-8 h-8 text-brand-500 animate-spin mb-3" />
              <p className="text-slate-500 text-sm font-medium">Loading hiring organizations...</p>
            </div>
          ) : companies.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 bg-white border border-slate-200 rounded-2xl shadow-sm">
              <Building2 className="w-12 h-12 text-slate-300 mb-4" />
              <p className="text-slate-900 font-bold mb-1">No hiring organizations active</p>
              <p className="text-slate-500 text-sm">Organizations will appear here as soon as published roles are open.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {companies.map((comp) => (
                <div
                  key={comp.name}
                  className="bg-white border border-slate-200 rounded-2xl p-6 hover:border-brand-200 hover:shadow-md transition-all flex flex-col justify-between shadow-sm"
                >
                  <div>
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-900 font-bold text-lg shadow-sm">
                          {comp.logo ? (
                            <img src={comp.logo} alt={comp.name} className="w-8 h-8 object-contain" />
                          ) : (
                            <Building2 className="w-6 h-6 text-brand-600" />
                          )}
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-slate-900">{comp.name}</h3>
                          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                            <span>{comp.industry || 'Technology'}</span>
                            <span>•</span>
                            <span>{comp.location || 'Remote'}</span>
                          </div>
                        </div>
                      </div>

                      <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Hiring Now
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-600 mb-4">
                      <div className="flex items-center gap-1.5 font-medium">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span>{comp.size || '500+ employees'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 font-medium">
                        <Briefcase className="w-3.5 h-3.5 text-brand-600" />
                        <span className="text-slate-900 font-bold">{comp.activeJobsCount} open positions</span>
                      </div>
                    </div>

                    {/* Quick roles pills */}
                    <div className="flex flex-wrap gap-1.5 mb-6">
                      {comp.jobs.map(j => (
                        <span key={j._id} className="text-[11px] px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200 text-slate-700 font-medium">
                          {j.title}
                        </span>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedCompany(comp)}
                    className="w-full py-2.5 rounded-xl bg-slate-50 hover:bg-brand-50 hover:text-brand-700 hover:border-brand-200 text-slate-700 border border-slate-200 text-xs font-bold transition-all flex items-center justify-center gap-2"
                  >
                    View Company Profile & Jobs ({comp.activeJobsCount}) →
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================= MODAL: COMPANY PROFILE & JOBS ================= */}
      {selectedCompany && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: '#fff', border: '1px solid #E5EAF0', borderRadius: 16, width: '100%', maxWidth: 768, maxHeight: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
            <div style={{ padding: '24px', borderBottom: '1px solid #E5EAF0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc' }}>
              <div className="flex items-center gap-4">
                <div style={{ width: 48, height: 48, borderRadius: 12, background: '#fff', border: '1px solid #E5EAF0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#0f172a', fontSize: 18, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  {selectedCompany.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', margin: 0 }}>{selectedCompany.name}</h2>
                  <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0 0', fontWeight: 500 }}>{selectedCompany.industry} • {selectedCompany.location} • {selectedCompany.size}</p>
                </div>
              </div>
              <button onClick={() => setSelectedCompany(null)} style={{ padding: 8, background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                <X style={{ width: 20, height: 20 }} />
              </button>
            </div>

            <div style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <h3 style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94a3b8', margin: 0 }}>
                Active Published Positions ({selectedCompany.jobs.length})
              </h3>
              {selectedCompany.jobs.map(j => (
                <div key={j._id} style={{ padding: '20px', borderRadius: 12, background: '#fff', border: '1px solid #E5EAF0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: 0 }}>{j.title}</h4>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-2 font-medium">
                        <span>{j.workMode || 'Remote'}</span>
                        <span>•</span>
                        <span>{j.salary || '$130k - $180k'}</span>
                        {j.deadline && (
                          <>
                            <span>•</span>
                            <span className="text-amber-600 flex items-center gap-1 font-semibold">
                              <Calendar className="w-3 h-3" /> Deadline: {j.deadline}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleOpenApplyModal(j)}
                      disabled={j.applied}
                      className={`btn ${j.applied ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default shadow-none hover:bg-emerald-50 hover:text-emerald-700' : 'btn-primary'}`}
                      style={{ padding: '6px 12px', fontSize: 12 }}
                    >
                      {j.applied ? '✓ Applied' : 'Apply with Resume'}
                    </button>
                  </div>

                  <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.6, margin: 0 }}>{j.description}</p>

                  {j.requirements && j.requirements.length > 0 && (
                    <div style={{ paddingTop: 12, borderTop: '1px solid #f1f5f9' }}>
                      <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', display: 'block', marginBottom: 6 }}>Key Requirements:</span>
                      <ul style={{ display: 'flex', flexDirection: 'column', gap: 4, margin: 0, padding: 0, listStyle: 'none' }}>
                        {j.requirements.map((req, rIdx) => (
                          <li key={rIdx} className="flex items-center gap-2 text-xs text-slate-600">
                            <span style={{ width: 4, height: 4, borderRadius: 2, background: '#2563eb', flexShrink: 0 }} />
                            {req}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: APPLY WITH RESUME ================= */}
      {applyModalJob && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: '#fff', border: '1px solid #E5EAF0', borderRadius: 16, width: '100%', maxWidth: 500, padding: 24, boxShadow: '0 20px 60px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #E5EAF0', paddingBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: 0 }}>Apply with Resume</h3>
                <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0 0', fontWeight: 500 }}>Position: {applyModalJob.title} at {applyModalJob.company}</p>
              </div>
              <button onClick={() => setApplyModalJob(null)} style={{ padding: 4, background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                <X style={{ width: 16, height: 16 }} />
              </button>
            </div>

            {applySuccessMsg ? (
              <div style={{ padding: 24, borderRadius: 12, background: '#f0fdf4', border: '1px solid #bbf7d0', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <CheckCircle2 style={{ width: 40, height: 40, color: '#22c55e', margin: '0 auto' }} />
                <h4 style={{ fontSize: 16, fontWeight: 700, color: '#166534', margin: 0 }}>Application Submitted!</h4>
                <p style={{ fontSize: 13, color: '#15803d', margin: 0 }}>
                  Your application and verified evidence records have been submitted to {applyModalJob.company}.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#64748b', marginBottom: 8 }}>
                    Select Candidate Resume Document
                  </label>
                  {resumes.length === 0 ? (
                    <div style={{ padding: 16, borderRadius: 12, background: '#fffbeb', border: '1px solid #fde68a', color: '#92400e', fontSize: 13 }}>
                      No resume uploaded yet. Your application will submit your verified Capability Passport.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {resumes.map(r => (
                        <div
                          key={r._id}
                          onClick={() => setSelectedResumeId(r._id)}
                          style={{
                            padding: 12, borderRadius: 12, border: selectedResumeId === r._id ? '2px solid #2563eb' : '1px solid #E5EAF0',
                            background: selectedResumeId === r._id ? '#eff6ff' : '#fff',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer',
                            boxShadow: selectedResumeId === r._id ? '0 2px 4px rgba(37, 99, 235, 0.1)' : 'none'
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <FileText className={`w-5 h-5 ${selectedResumeId === r._id ? 'text-brand-600' : 'text-slate-400'}`} />
                            <div>
                              <div className="font-bold text-sm flex items-center gap-2 text-slate-900">
                                <span>{r.fileName}</span>
                                {r.isPrimary && (
                                  <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 4, background: '#dbeafe', color: '#1d4ed8', fontWeight: 800, letterSpacing: '0.05em' }}>
                                    PRIMARY
                                  </span>
                                )}
                              </div>
                              <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                                Score: {r.score10 ?? 'N/A'}/10 • Uploaded {new Date(r.uploadedAt || r.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                          </div>

                          <div style={{
                            width: 18, height: 18, borderRadius: '50%', border: selectedResumeId === r._id ? 'none' : '1px solid #cbd5e1',
                            background: selectedResumeId === r._id ? '#2563eb' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff'
                          }}>
                            {selectedResumeId === r._id && <Check style={{ width: 12, height: 12 }} />}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ padding: 16, borderRadius: 12, background: '#f8fafc', border: '1px solid #E5EAF0', fontSize: 12, color: '#475569', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>Verified Evidence Package:</div>
                  <div>• Selected Resume Document</div>
                  <div>• Algorithmic Practice Accuracy & Passports</div>
                  <div>• Completed Engineering Challenges</div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, paddingTop: 8 }}>
                  <button onClick={() => setApplyModalJob(null)} className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: 13 }}>
                    Cancel
                  </button>
                  <button onClick={handleConfirmApply} disabled={submittingApply} className="btn btn-primary" style={{ padding: '8px 16px', fontSize: 13 }}>
                    {submittingApply ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    Confirm & Submit
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

function JobCard({
  job,
  isSaved,
  onApply,
  onToggleSave
}: {
  job: Job;
  isSaved: boolean;
  onApply: () => void;
  onToggleSave: () => void;
}) {
  const postedAgo = (() => {
    const diff = Date.now() - new Date(job.createdAt).getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;
    if (days < 30) return `${Math.floor(days / 7)}w ago`;
    return `${Math.floor(days / 30)}mo ago`;
  })();

  return (
    <div className={`bg-white border rounded-2xl p-6 hover:shadow-md transition-all group ${job.applied ? 'border-brand-200 shadow-sm' : 'border-slate-200 hover:border-brand-200'}`}>
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            {job.applied && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-50 border border-emerald-200 text-emerald-700">
                <CheckCircle2 className="w-3 h-3" /> Applied
              </span>
            )}
            {job.matchScore && job.matchScore > 70 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-amber-50 border border-amber-200 text-amber-700">
                <Star className="w-3 h-3" /> {job.matchScore}% Match
              </span>
            )}
          </div>

          <h3 className="text-xl font-bold text-slate-900 mb-1 group-hover:text-brand-600 transition-colors">{job.title}</h3>

          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 mb-3 font-medium">
            {job.company && <span className="font-semibold text-slate-700">{job.company}</span>}
            {job.location && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{job.location}</span>}
            {job.salary && <span className="text-emerald-600 font-semibold">{job.salary}</span>}
            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{postedAgo}</span>
          </div>

          <p className="text-slate-600 text-sm leading-relaxed mb-4 line-clamp-2">{job.description}</p>

          {job.skills && job.skills.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {job.skills.slice(0, 8).map((skill, i) => (
                <span key={i} className="px-2.5 py-1 rounded-md text-xs font-medium bg-slate-50 text-slate-700 border border-slate-200 font-mono">
                  {skill}
                </span>
              ))}
              {job.skills.length > 8 && (
                <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-slate-50 text-slate-500 border border-slate-200">
                  +{job.skills.length - 8} more
                </span>
              )}
            </div>
          )}

          {job.requiredScore && (
            <div className="mt-3 flex items-center gap-2">
              <span className="text-xs text-slate-500">Min. Capability Score:</span>
              <span className="text-xs font-bold text-brand-600">{job.requiredScore}/100</span>
            </div>
          )}
        </div>

        <div className="flex sm:flex-col gap-2 sm:items-end justify-start shrink-0">
          <button
            onClick={onToggleSave}
            className={`p-2.5 rounded-lg border transition-colors ${isSaved ? 'bg-brand-50 border-brand-200 text-brand-600' : 'bg-white border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-50'}`}
            title={isSaved ? 'Unsave' : 'Save'}
          >
            {isSaved ? <BookmarkCheck className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}
          </button>
          <button
            onClick={onApply}
            disabled={job.applied}
            className={`px-5 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${
              job.applied
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default'
                : 'btn btn-primary'
            }`}
          >
            {job.applied ? (
              <><CheckCircle2 className="w-4 h-4" /> Applied</>
            ) : (
              <>Apply with Resume <ArrowRight className="w-4 h-4" /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
