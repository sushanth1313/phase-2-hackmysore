import React, { useState, useEffect, useCallback } from 'react';
import { Search, Filter, ShieldCheck, CheckCircle2, ChevronDown, Award, Loader2, AlertCircle, Bookmark, BookmarkCheck, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../api/client';

interface CandidateResult {
  _id: string;
  firstName: string;
  lastName: string;
  compositeSignal: number | null;
  skills: { name: string; confidence: number; count: number }[];
  projectCount: number;
  matchReasons: string[];
  hasEvidence: boolean;
  lastActive: string;
}

export default function TalentDiscovery() {
  const [candidates, setCandidates] = useState<CandidateResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [skillFilter, setSkillFilter] = useState('');
  const [minConfidence, setMinConfidence] = useState(0);
  const [shortlistingId, setShortlistingId] = useState<string | null>(null);
  const [shortlistedIds, setShortlistedIds] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<'signal' | 'projects' | 'recent'>('signal');

  const fetchCandidates = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const params: Record<string, string> = {};
      if (searchInput.trim()) params.search = searchInput.trim();
      if (skillFilter.trim()) params.skills = skillFilter.trim();
      if (minConfidence > 0) params.minConfidence = String(minConfidence);

      const res = await api.get('/recruiter/discover', { params });
      setCandidates(res.data?.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load candidates.');
    } finally {
      setLoading(false);
    }
  }, [searchInput, skillFilter, minConfidence]);

  useEffect(() => { fetchCandidates(); }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCandidates();
  };

  const handleShortlist = async (candidateId: string) => {
    setShortlistingId(candidateId);
    try {
      await api.post('/recruiter/shortlists', { candidateId });
      setShortlistedIds(prev => new Set([...prev, candidateId]));
    } catch (err: any) {
      if (err.response?.status === 409) {
        setShortlistedIds(prev => new Set([...prev, candidateId]));
      }
    } finally {
      setShortlistingId(null);
    }
  };

  const sorted = [...candidates].sort((a, b) => {
    if (sortBy === 'signal') return (b.compositeSignal || 0) - (a.compositeSignal || 0);
    if (sortBy === 'projects') return b.projectCount - a.projectCount;
    return new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime();
  });

  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out pb-20">

      {/* HERO */}
      <section className="bg-gradient-to-b from-[#0D1322] to-[#070B14] border-b border-slate-200 px-6 py-12 md:px-12 md:py-16 relative overflow-hidden">
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-brand-50 rounded-full blur-[120px] pointer-events-none -translate-y-1/2" />
        <div className="max-w-[1400px] mx-auto relative z-10">
          <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight mb-4">
            Find Engineers by What They Can Prove
          </h1>
          <p className="text-slate-500 text-lg mb-8 max-w-2xl">
            Search across verified engineering evidence, architecture decisions, and code quality signals — not just keywords on a resume.
          </p>

          <form onSubmit={handleSearch} className="bg-white border border-slate-200 p-2 rounded-xl flex items-center gap-2 max-w-3xl shadow-2xl shadow-black/40">
            <Search className="w-5 h-5 text-brand-600 ml-3 shrink-0" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by name..."
              className="flex-1 bg-transparent border-none outline-none text-slate-900 px-2 py-3 placeholder:text-slate-500 text-lg"
            />
            <input
              type="text"
              value={skillFilter}
              onChange={(e) => setSkillFilter(e.target.value)}
              placeholder="Skills: Go, Kafka, Redis..."
              className="hidden md:block w-64 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-600 focus:border-brand-500"
            />
            <button type="submit" className="px-6 py-3 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-lg transition-colors">
              Search Evidence
            </button>
          </form>
        </div>
      </section>

      {/* LAYOUT */}
      <div className="max-w-[1400px] mx-auto px-6 md:px-12 py-12 grid grid-cols-1 lg:grid-cols-12 gap-12">

        {/* LEFT: FILTERS */}
        <div className="lg:col-span-3 space-y-8">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-500" /> Filters
            </h2>
            <button
              onClick={() => { setSkillFilter(''); setMinConfidence(0); }}
              className="text-xs text-brand-600 font-semibold cursor-pointer hover:text-brand-600"
            >
              Reset
            </button>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Skill Filter</h3>
              <input
                type="text"
                value={skillFilter}
                onChange={(e) => setSkillFilter(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchCandidates()}
                placeholder="Go, Kafka, React..."
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:border-brand-500 placeholder:text-slate-600"
              />
            </div>

            <div>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Min Confidence Signal</h3>
              <input type="range" min="0" max="90" step="5" value={minConfidence}
                onChange={(e) => setMinConfidence(Number(e.target.value))}
                className="w-full accent-brand-500" />
              <div className="flex justify-between text-xs text-slate-500 mt-2 font-mono">
                <span>Any</span>
                <span>{minConfidence > 0 ? `${minConfidence}%+` : 'Any'}</span>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Verified Evidence</h3>
              <div className="space-y-2 text-xs text-slate-500">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="accent-brand-500 rounded" defaultChecked />
                  Show only analyzed profiles
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: RESULTS */}
        <div className="lg:col-span-9 space-y-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-medium text-slate-500">
              {loading ? 'Searching...' : (
                <>Showing <strong className="text-slate-900">{sorted.length}</strong> matched engineers</>
              )}
            </h2>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="flex items-center gap-2 text-sm text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-md cursor-pointer hover:border-slate-200 focus:outline-none"
            >
              <option value="signal">Sort: Evidence Signal</option>
              <option value="projects">Sort: Project Count</option>
              <option value="recent">Sort: Recently Active</option>
            </select>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-24">
              <Loader2 className="w-8 h-8 text-brand-500 animate-spin mb-3" />
              <p className="text-slate-500 text-sm">Searching evidence graph...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-24 bg-white border border-red-500/20 rounded-2xl">
              <AlertCircle className="w-8 h-8 text-red-400 mb-3" />
              <p className="text-slate-900 font-bold mb-1">Search failed</p>
              <p className="text-slate-500 text-sm mb-4">{error}</p>
              <button onClick={fetchCandidates} className="px-4 py-2 bg-brand-600 text-slate-900 text-sm font-bold rounded-lg">Retry</button>
            </div>
          ) : sorted.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 bg-white border border-slate-200 rounded-2xl">
              <User className="w-12 h-12 text-slate-600 mb-4" />
              <p className="text-slate-900 font-bold mb-1">No matched candidates found</p>
              <p className="text-slate-500 text-sm">Try adjusting your search or filters.</p>
            </div>
          ) : (
            sorted.map(c => (
              <CandidateCard
                key={c._id}
                candidate={c}
                isShortlisted={shortlistedIds.has(c._id)}
                isShortlisting={shortlistingId === c._id}
                onShortlist={() => handleShortlist(c._id)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function CandidateCard({ candidate: c, isShortlisted, isShortlisting, onShortlist }: {
  candidate: CandidateResult;
  isShortlisted: boolean;
  isShortlisting: boolean;
  onShortlist: () => void;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:border-slate-200 transition-colors">

      {/* HEADER */}
      <div className="p-6 md:p-8 flex flex-col md:flex-row justify-between items-start gap-6 border-b border-slate-200 bg-gradient-to-r from-transparent to-slate-800/10">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 border border-slate-600 flex items-center justify-center font-bold text-2xl text-slate-900 shadow-lg">
            {c.firstName[0]}
          </div>
          <div>
            <h3 className="text-2xl font-bold text-slate-900 mb-1">{c.firstName} {c.lastName}</h3>
            <div className="flex items-center gap-3 mt-2">
              {c.hasEvidence ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-50 border border-emerald-200 text-emerald-600 text-xs font-bold uppercase tracking-wider">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Evidence Verified
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-100 border border-slate-200 text-slate-500 text-xs font-bold uppercase tracking-wider">
                  <ShieldCheck className="w-3.5 h-3.5" /> Pending Analysis
                </span>
              )}
              <span className="text-xs text-slate-500 font-mono">{c.projectCount} project{c.projectCount !== 1 ? 's' : ''} analyzed</span>
            </div>
          </div>
        </div>

        <div className="md:text-right shrink-0">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1 md:justify-end">
            <Award className="w-3 h-3" /> Evidence Signal
          </div>
          {c.compositeSignal !== null ? (
            <div className="text-5xl font-black text-brand-600 tabular-nums">{c.compositeSignal.toFixed(1)}</div>
          ) : (
            <div className="text-xl font-bold text-slate-600">—</div>
          )}
        </div>
      </div>

      {/* BODY */}
      <div className="grid grid-cols-1 md:grid-cols-3">
        {/* SKILLS */}
        <div className="p-6 md:p-8 border-b md:border-b-0 md:border-r border-slate-200 md:col-span-1 bg-slate-50/30">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6">Verified Capabilities</h4>
          {c.skills.length === 0 ? (
            <p className="text-xs text-slate-600 italic">No capabilities detected yet. Analysis pending.</p>
          ) : (
            <div className="space-y-4">
              {c.skills.slice(0, 5).map((s, i) => (
                <div key={i}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-slate-600 font-bold">{s.name}</span>
                    <span className="text-slate-500 font-mono">{s.confidence}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-brand-500 rounded-full transition-all" style={{ width: `${s.confidence}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {c.matchReasons.length > 0 && (
            <div className="mt-6 pt-5 border-t border-slate-200 space-y-2">
              {c.matchReasons.map((reason, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-slate-500 leading-relaxed">
                  <CheckCircle2 className="w-3.5 h-3.5 text-brand-600 shrink-0 mt-0.5" />
                  <span>{reason}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ACTIONS */}
        <div className="p-6 md:p-8 md:col-span-2">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6">Proof Evidence</h4>
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div>
              <div className="text-3xl font-black text-slate-900 mb-1">{c.projectCount}</div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Analyzed Projects</div>
            </div>
            <div>
              <div className="text-3xl font-black text-slate-900 mb-1">{c.skills.length}</div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Verified Signals</div>
            </div>
            <div>
              <div className="text-3xl font-black text-slate-900 mb-1">
                {c.skills.filter(s => s.confidence >= 80).length}
              </div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">High-Confidence Skills</div>
            </div>
            <div>
              <div className="text-sm font-bold text-slate-500 mt-1">
                {c.lastActive ? new Date(c.lastActive).toLocaleDateString() : '—'}
              </div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Last Active</div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-5 border-t border-slate-200">
            <Link
              to={`/recruiter/candidate/${c._id}`}
              className="px-6 py-2.5 rounded-lg bg-white text-slate-900 font-bold hover:bg-slate-200 transition-colors text-sm"
            >
              Explore Evidence
            </Link>
            <button
              onClick={onShortlist}
              disabled={isShortlisted || isShortlisting}
              className={`px-6 py-2.5 rounded-lg font-bold text-sm flex items-center gap-2 transition-colors ${
                isShortlisted
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-600 cursor-default'
                  : 'bg-slate-50 border border-slate-200 text-slate-900 hover:bg-slate-100'
              }`}
            >
              {isShortlisting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isShortlisted ? (
                <BookmarkCheck className="w-4 h-4" />
              ) : (
                <Bookmark className="w-4 h-4" />
              )}
              {isShortlisted ? 'Shortlisted' : 'Shortlist Candidate'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
