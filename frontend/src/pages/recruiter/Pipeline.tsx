import { useState, useEffect } from 'react';
import { Users, Briefcase, GitMerge, ChevronRight, Search, Loader2, AlertCircle, MessageSquare, Eye, User2, Star, CheckCircle2, Clock, XCircle } from 'lucide-react';
import api from '../../api/client';

type Stage = 'APPLIED' | 'SHORTLISTED' | 'INTERVIEWING' | 'OFFERED' | 'HIRED' | 'REJECTED';

const STAGES: { key: Stage; label: string; color: string; bgColor: string; borderColor: string }[] = [
  { key: 'APPLIED', label: 'Applied', color: 'text-blue-400', bgColor: 'bg-blue-500/10', borderColor: 'border-blue-500/30' },
  { key: 'SHORTLISTED', label: 'Shortlisted', color: 'text-amber-400', bgColor: 'bg-amber-500/10', borderColor: 'border-amber-500/30' },
  { key: 'INTERVIEWING', label: 'Interviewing', color: 'text-purple-400', bgColor: 'bg-purple-500/10', borderColor: 'border-purple-500/30' },
  { key: 'OFFERED', label: 'Offered', color: 'text-indigo-400', bgColor: 'bg-indigo-500/10', borderColor: 'border-indigo-500/30' },
  { key: 'HIRED', label: 'Hired', color: 'text-emerald-400', bgColor: 'bg-emerald-500/10', borderColor: 'border-emerald-500/30' },
  { key: 'REJECTED', label: 'Rejected', color: 'text-red-400', bgColor: 'bg-red-500/10', borderColor: 'border-red-500/30' }
];

const STAGE_ICONS: Record<Stage, any> = {
  APPLIED: Clock,
  SHORTLISTED: Star,
  INTERVIEWING: MessageSquare,
  OFFERED: Briefcase,
  HIRED: CheckCircle2,
  REJECTED: XCircle
};

interface Application {
  _id: string;
  candidate: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    track?: string;
  };
  job?: {
    title: string;
    _id: string;
  };
  status: Stage;
  capabilityScore?: number;
  appliedAt: string;
  notes?: string;
}

export default function HiringPipeline() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedStage, setSelectedStage] = useState<Stage | 'ALL'>('ALL');
  const [movingId, setMovingId] = useState<string | null>(null);

  const fetchApplications = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/recruiter/pipeline');
      setApplications(res.data?.data || []);
    } catch (err: any) {
      if (err.response?.status === 404) {
        // Pipeline not implemented yet — show empty state
        setApplications([]);
      } else {
        setError(err.response?.data?.message || 'Failed to load pipeline.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const moveCandidate = async (appId: string, newStage: Stage) => {
    setMovingId(appId);
    try {
      await api.patch(`/recruiter/pipeline/${appId}/stage`, { stage: newStage });
      setApplications(prev => prev.map(a => a._id === appId ? { ...a, status: newStage } : a));
    } catch (err: any) {
      console.error('Move failed:', err.response?.data?.message);
    } finally {
      setMovingId(null);
    }
  };

  const filtered = applications.filter(a => {
    const nameMatch = search
      ? `${a.candidate.firstName} ${a.candidate.lastName} ${a.job?.title || ''}`.toLowerCase().includes(search.toLowerCase())
      : true;
    const stageMatch = selectedStage === 'ALL' || a.status === selectedStage;
    return nameMatch && stageMatch;
  });

  const stageCounts = STAGES.reduce((acc, s) => {
    acc[s.key] = applications.filter(a => a.status === s.key).length;
    return acc;
  }, {} as Record<Stage, number>);

  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out px-6 md:px-12 py-8 max-w-[1400px] mx-auto">

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-brand-400 font-bold text-xs uppercase tracking-widest mb-1">
          <GitMerge className="w-4 h-4" /> Recruitment
        </div>
        <h1 className="text-3xl font-black text-white tracking-tight">Hiring Pipeline</h1>
        <p className="text-slate-400 text-sm mt-1">Track candidates through each stage of your hiring process.</p>
      </div>

      {/* Stage pills */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setSelectedStage('ALL')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all border ${selectedStage === 'ALL' ? 'bg-brand-600 text-white border-brand-500' : 'text-slate-400 border-slate-700 hover:border-slate-500'}`}
        >
          All ({applications.length})
        </button>
        {STAGES.map(s => {
          const Icon = STAGE_ICONS[s.key];
          return (
            <button
              key={s.key}
              onClick={() => setSelectedStage(s.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all border flex items-center gap-1.5 ${selectedStage === s.key ? `${s.bgColor} ${s.color} ${s.borderColor}` : 'text-slate-400 border-slate-700 hover:border-slate-500'}`}
            >
              <Icon className="w-3 h-3" /> {s.label} ({stageCounts[s.key] || 0})
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by candidate name or job title..."
          className="w-full max-w-md bg-[#0D1322] border border-slate-800 rounded-lg pl-9 pr-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-brand-500 placeholder:text-slate-600"
        />
      </div>

      {/* Pipeline Overview Cards */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-8">
        {STAGES.map(s => (
          <div
            key={s.key}
            className={`bg-[#0D1322] border rounded-xl p-4 text-center cursor-pointer transition-all ${selectedStage === s.key ? `${s.borderColor}` : 'border-slate-800/80 hover:border-slate-700'}`}
            onClick={() => setSelectedStage(s.key === selectedStage ? 'ALL' : s.key)}
          >
            <div className={`text-2xl font-black ${s.color}`}>{stageCounts[s.key] || 0}</div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Main Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24">
          <Loader2 className="w-8 h-8 text-brand-500 animate-spin mb-3" />
          <p className="text-slate-400 text-sm">Loading pipeline...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-24 bg-[#0D1322] border border-red-500/20 rounded-2xl">
          <AlertCircle className="w-8 h-8 text-red-400 mb-3" />
          <p className="text-white font-bold mb-1">{error}</p>
          <button onClick={fetchApplications} className="mt-4 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white text-sm font-bold rounded-lg">Retry</button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-[#0D1322] border border-slate-800/80 rounded-2xl">
          <Users className="w-12 h-12 text-slate-600 mb-4" />
          <p className="text-white font-bold mb-1">No candidates in pipeline</p>
          <p className="text-slate-400 text-sm text-center max-w-sm">
            {selectedStage !== 'ALL'
              ? `No candidates in the "${selectedStage}" stage yet.`
              : 'Post jobs and start receiving applications from verified candidates.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(app => {
            const stageInfo = STAGES.find(s => s.key === app.status)!;
            const StageIcon = STAGE_ICONS[app.status];
            const postedAgo = (() => {
              const diff = Date.now() - new Date(app.appliedAt).getTime();
              const days = Math.floor(diff / 86400000);
              if (days === 0) return 'Today';
              if (days === 1) return 'Yesterday';
              return `${days}d ago`;
            })();

            return (
              <div key={app._id} className={`bg-[#0D1322] border ${stageInfo.borderColor} rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4`}>
                {/* Avatar */}
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500/30 to-brand-700/20 border border-brand-500/20 flex items-center justify-center shrink-0">
                  <span className="text-sm font-black text-brand-400">
                    {app.candidate.firstName?.[0]?.toUpperCase() || '?'}
                  </span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-0.5">
                    <span className="font-bold text-white">{app.candidate.firstName} {app.candidate.lastName}</span>
                    {app.candidate.track && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-brand-500/10 text-brand-400 uppercase tracking-wider">
                        {app.candidate.track}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span>{app.candidate.email}</span>
                    {app.job && <><ChevronRight className="w-3 h-3" /><span className="font-medium text-slate-400">{app.job.title}</span></>}
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{postedAgo}</span>
                    {app.capabilityScore !== undefined && (
                      <span className="font-bold text-brand-400">Score: {app.capabilityScore}</span>
                    )}
                  </div>
                </div>

                {/* Stage badge */}
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold uppercase tracking-wider ${stageInfo.color} ${stageInfo.bgColor} ${stageInfo.borderColor} shrink-0`}>
                  <StageIcon className="w-3 h-3" /> {stageInfo.label}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={`/recruiter/candidate/${app.candidate._id}`}
                    className="p-2 rounded-lg border border-slate-700 text-slate-400 hover:text-brand-400 hover:border-brand-500/50 transition-colors"
                    title="View profile"
                  >
                    <Eye className="w-4 h-4" />
                  </a>

                  {/* Move stage dropdown */}
                  <select
                    value={app.status}
                    disabled={movingId === app._id}
                    onChange={e => moveCandidate(app._id, e.target.value as Stage)}
                    className="text-xs bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-slate-300 focus:outline-none focus:border-brand-500 cursor-pointer disabled:opacity-50"
                  >
                    {STAGES.map(s => (
                      <option key={s.key} value={s.key}>{s.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
