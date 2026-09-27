import React, { useState, useEffect } from 'react';
import {
  Target,
  Award,
  Clock,
  ArrowRight,
  CheckCircle2,
  Search,
  Loader2,
  AlertCircle,
  Building2,
  Calendar,
  Check,
  ShieldCheck,
  FileCode2,
  Layers,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { GithubIcon } from '../../components/ui/icons/GithubIcon';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';

export interface Challenge {
  _id: string;
  slug?: string;
  title: string;
  description: string;
  track: 'TECHNICAL' | 'NON_TECHNICAL';
  type: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';
  category?: string;
  domain?: string;
  company: string;
  companyId?: string | null;
  duration?: string;
  estimatedTime?: string;
  deadline?: string;
  skills?: string[];
  skillsTargeted?: string[];
  technologies?: string[];
  requirements?: string[];
  deliverables?: string[];
  evaluationCriteria?: string[];
  starterConstraints?: string;
  tags?: string[];
  status: 'OPEN' | 'DRAFT' | 'CLOSED' | 'ARCHIVED' | 'PUBLISHED' | 'AVAILABLE';
  participationStatus?: 'AVAILABLE' | 'ACCEPTED' | 'IN_PROGRESS' | 'SUBMITTED' | 'UNDER_REVIEW' | 'COMPLETED' | 'VERIFIED' | 'REJECTED';
  candidateStatus?: string;
  submission?: {
    _id?: string;
    status: string;
    score?: number;
    githubUrl?: string;
    workTitle?: string;
    workDescription?: string;
    workUrl?: string;
    documentUrl?: string;
    notes?: string;
    nonTechAnalysis?: any;
    acceptedAt?: string;
    startedAt?: string;
    submittedAt?: string;
  } | null;
  completed?: boolean;
  score?: number;
}

export default function Challenges() {
  const { user } = useAuth();
  const isNonTech = user?.track === 'NON_TECHNICAL';

  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<'ALL' | 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT'>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [viewingChallenge, setViewingChallenge] = useState<Challenge | null>(null);
  const [submittingChallenge, setSubmittingChallenge] = useState<Challenge | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchChallenges = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError(null);
    try {
      const trackParam = isNonTech ? 'NON_TECHNICAL' : 'TECHNICAL';
      const params: Record<string, string> = { track: trackParam };

      const res = await api.get('/candidate/challenges', { params });
      const challengeList: Challenge[] = res.data?.challenges || res.data?.data || [];
      setChallenges(challengeList);
    } catch (err: any) {
      // Fallback to /challenges if /candidate/challenges is unavailable
      try {
        const trackParam = isNonTech ? 'NON_TECHNICAL' : 'TECHNICAL';
        const res = await api.get('/challenges', { params: { track: trackParam } });
        const challengeList: Challenge[] = res.data?.challenges || res.data?.data || [];
        setChallenges(challengeList);
      } catch (fallbackErr: any) {
        setError(fallbackErr.response?.data?.message || err.response?.data?.message || 'Failed to load challenges.');
      }
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchChallenges();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
  };

  const handleResetFilters = () => {
    setSelectedDifficulty('ALL');
    setSelectedStatus('ALL');
    setSearchQuery('');
  };

  // Helper to resolve the authenticated candidate's participation status
  const getParticipationStatus = (c: Challenge): string => {
    if (c.submission?.status) return c.submission.status.toUpperCase();
    if (c.participationStatus) return c.participationStatus.toUpperCase();
    if (c.candidateStatus) return c.candidateStatus.toUpperCase();
    return 'AVAILABLE';
  };

  const handleAccept = async (c: Challenge) => {
    setActionLoadingId(c._id);
    setActionMessage(null);
    try {
      const res = await api.post(`/candidate/challenges/${c._id}/accept`);
      const submissionData = res.data?.participation || res.data?.data || { status: 'ACCEPTED' };

      // Optimistically update local state immediately
      setChallenges(prev => prev.map(item => {
        if (item._id === c._id) {
          return {
            ...item,
            participationStatus: 'ACCEPTED',
            candidateStatus: 'ACCEPTED',
            submission: {
              status: 'ACCEPTED',
              acceptedAt: new Date().toISOString()
            }
          };
        }
        return item;
      }));

      setActionMessage(`Challenge "${c.title}" accepted! You can now start working on it.`);
      // Sync with MongoDB in the background
      fetchChallenges(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to accept challenge.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleStart = async (c: Challenge) => {
    setActionLoadingId(c._id);
    setActionMessage(null);
    try {
      await api.post(`/candidate/challenges/${c._id}/start`);

      // Optimistically update local state immediately
      setChallenges(prev => prev.map(item => {
        if (item._id === c._id) {
          return {
            ...item,
            participationStatus: 'IN_PROGRESS',
            candidateStatus: 'IN_PROGRESS',
            submission: {
              ...(item.submission || {}),
              status: 'IN_PROGRESS',
              startedAt: new Date().toISOString()
            }
          };
        }
        return item;
      }));

      setActionMessage(`Challenge "${c.title}" started! Provide your repository when ready.`);
      setSubmittingChallenge(c);
      fetchChallenges(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to start challenge.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Filter challenges simultaneously by status, difficulty, and search query
  const filteredChallenges = challenges.filter(c => {
    const status = getParticipationStatus(c);

    // Status filter
    if (selectedStatus !== 'ALL') {
      if (selectedStatus === 'SUBMITTED') {
        if (status !== 'SUBMITTED' && status !== 'UNDER_REVIEW') return false;
      } else if (selectedStatus === 'COMPLETED') {
        if (status !== 'COMPLETED' && status !== 'VERIFIED') return false;
      } else if (status !== selectedStatus) {
        return false;
      }
    }

    // Difficulty filter
    if (selectedDifficulty !== 'ALL') {
      if (c.difficulty?.toUpperCase() !== selectedDifficulty.toUpperCase()) return false;
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = c.title?.toLowerCase().includes(q);
      const matchCompany = c.company?.toLowerCase().includes(q);
      const matchDesc = c.description?.toLowerCase().includes(q);
      const matchCategory = c.category?.toLowerCase().includes(q);
      const matchSkills = (c.skills || c.skillsTargeted || []).some(s => s.toLowerCase().includes(q));
      const matchTech = (c.technologies || []).some(t => t.toLowerCase().includes(q));
      if (!matchTitle && !matchCompany && !matchDesc && !matchCategory && !matchSkills && !matchTech) return false;
    }

    return true;
  });

  // Calculate dynamic counts based on the current candidate's real data
  const statusCounts = {
    ALL: challenges.length,
    AVAILABLE: challenges.filter(c => getParticipationStatus(c) === 'AVAILABLE').length,
    ACCEPTED: challenges.filter(c => getParticipationStatus(c) === 'ACCEPTED').length,
    IN_PROGRESS: challenges.filter(c => getParticipationStatus(c) === 'IN_PROGRESS').length,
    SUBMITTED: challenges.filter(c => {
      const s = getParticipationStatus(c);
      return s === 'SUBMITTED' || s === 'UNDER_REVIEW';
    }).length,
    COMPLETED: challenges.filter(c => {
      const s = getParticipationStatus(c);
      return s === 'COMPLETED' || s === 'VERIFIED';
    }).length
  };

  const difficultyCounts = {
    ALL: challenges.length,
    EASY: challenges.filter(c => c.difficulty?.toUpperCase() === 'EASY').length,
    MEDIUM: challenges.filter(c => c.difficulty?.toUpperCase() === 'MEDIUM').length,
    HARD: challenges.filter(c => c.difficulty?.toUpperCase() === 'HARD').length,
    EXPERT: challenges.filter(c => c.difficulty?.toUpperCase() === 'EXPERT').length
  };

  return (
    <div style={{ padding: '28px', maxWidth: 1300, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16, marginBottom: 24 }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <Target style={{ width: 12, height: 12 }} /> {isNonTech ? 'Non-Technical Track • Business & Role Case Studies' : 'Technical Track • Engineering Benchmarks'}
            </span>
          </p>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.025em', marginBottom: 4 }}>{isNonTech ? 'Industry Case Challenges' : 'Engineering Challenges'}</h1>
          <p style={{ fontSize: 13.5, color: '#64748b' }}>
            {isNonTech
              ? 'Real-world business case studies evaluated on strategic reasoning, execution quality, and communication.'
              : 'Real production challenges evaluated by the ProofHire automated analysis pipeline.'}
          </p>
        </div>

        {!loading && challenges.length > 0 && (
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ background: '#fff', border: '1px solid #E5EAF0', borderRadius: 9, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Clock style={{ width: 14, height: 14, color: '#d97706' }} />
              <span style={{ fontSize: 12, color: '#64748b' }}>In Progress:</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{statusCounts.IN_PROGRESS}</span>
            </div>
            <div style={{ background: '#fff', border: '1px solid #E5EAF0', borderRadius: 9, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Award style={{ width: 14, height: 14, color: '#059669' }} />
              <span style={{ fontSize: 12, color: '#64748b' }}>Completed:</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{statusCounts.COMPLETED} / {challenges.length}</span>
            </div>
          </div>
        )}
      </div>

      {actionMessage && (
        <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '12px 16px', borderRadius: 10, fontSize: 13 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#166534' }}>
            <CheckCircle2 style={{ width: 15, height: 15, flexShrink: 0 }} />
            <span>{actionMessage}</span>
          </div>
          <button onClick={() => setActionMessage(null)} style={{ fontSize: 12, color: '#16a34a', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
            Dismiss
          </button>
        </div>
      )}

      {/* Search + Status Filters */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, flex: '1 1 280px', minWidth: 0 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search style={{ width: 14, height: 14, color: '#94a3b8', position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, technology, skills, or company..."
              className="input"
              style={{ paddingLeft: 36, fontSize: 13 }}
            />
          </div>
          {searchQuery && (
            <button type="button" onClick={() => setSearchQuery('')} className="btn btn-secondary" style={{ fontSize: 12, padding: '7px 12px' }}>Clear</button>
          )}
        </form>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {[
            { id: 'ALL', label: 'All', count: statusCounts.ALL },
            { id: 'AVAILABLE', label: 'Available', count: statusCounts.AVAILABLE },
            { id: 'ACCEPTED', label: 'Accepted', count: statusCounts.ACCEPTED },
            { id: 'IN_PROGRESS', label: 'In Progress', count: statusCounts.IN_PROGRESS },
            { id: 'SUBMITTED', label: 'Submitted', count: statusCounts.SUBMITTED },
            { id: 'COMPLETED', label: 'Completed', count: statusCounts.COMPLETED }
          ].map(statusItem => (
            <button key={statusItem.id} onClick={() => setSelectedStatus(statusItem.id)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '6px 12px', borderRadius: 7, fontSize: 12.5, fontWeight: 600,
                cursor: 'pointer', whiteSpace: 'nowrap', border: 'none',
                background: selectedStatus === statusItem.id ? '#2563eb' : '#fff',
                color: selectedStatus === statusItem.id ? '#fff' : '#64748b',
                boxShadow: selectedStatus === statusItem.id ? 'none' : '0 0 0 1px #E5EAF0',
                transition: 'all 0.12s',
              }}>
              {statusItem.label}
              <span style={{
                fontSize: 10.5, padding: '1px 6px', borderRadius: 999, fontWeight: 700,
                background: selectedStatus === statusItem.id ? 'rgba(255,255,255,0.2)' : '#f1f5f9',
                color: selectedStatus === statusItem.id ? '#fff' : '#94a3b8',
              }}>{statusItem.count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Difficulty Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginRight: 4 }}>Difficulty:</span>
          {(['ALL', 'EASY', 'MEDIUM', 'HARD', 'EXPERT'] as const).map(diff => {
            const diffColors: Record<string, { active: string; text: string }> = {
              ALL: { active: '#2563eb', text: '#fff' },
              EASY: { active: '#dcfce7', text: '#15803d' },
              MEDIUM: { active: '#dbeafe', text: '#1d4ed8' },
              HARD: { active: '#fef3c7', text: '#b45309' },
              EXPERT: { active: '#ede9fe', text: '#7c3aed' },
            };
            const dc = diffColors[diff];
            const isActive = selectedDifficulty === diff;
            return (
              <button key={diff} onClick={() => setSelectedDifficulty(diff)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '5px 12px', borderRadius: 999, fontSize: 12, fontWeight: 700,
                  cursor: 'pointer', border: 'none',
                  background: isActive ? (diff === 'ALL' ? dc.active : dc.active) : '#f1f5f9',
                  color: isActive ? dc.text : '#94a3b8',
                  transition: 'all 0.12s',
                }}>
                <span>{diff}</span>
                <span style={{ fontSize: 10.5, opacity: 0.8 }}>({difficultyCounts[diff]})
                </span>
              </button>);
          })}
        </div>

        {(selectedDifficulty !== 'ALL' || selectedStatus !== 'ALL' || searchQuery !== '') && (
          <button onClick={handleResetFilters}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12.5, fontWeight: 600, color: '#2563eb', background: '#eff6ff', border: '1px solid #bfdbfe', padding: '6px 12px', borderRadius: 8, cursor: 'pointer' }}>
            <RotateCcw style={{ width: 12, height: 12 }} />
            Reset Filters
          </button>
        )}
      </div>

      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 24px', gap: 12 }}>
          <Loader2 style={{ width: 28, height: 28, color: '#2563eb' }} className="animate-spin" />
          <p style={{ fontSize: 13.5, color: '#64748b' }}>Loading challenges...</p>
        </div>
      )}

      {!loading && error && (
        <div style={{ padding: 32, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, textAlign: 'center', maxWidth: 480, margin: '0 auto' }}>
          <AlertCircle style={{ width: 28, height: 28, color: '#ef4444', margin: '0 auto 8px' }} />
          <p style={{ fontSize: 13.5, color: '#991b1b', fontWeight: 500 }}>{error}</p>
          <button onClick={() => fetchChallenges()} className="btn btn-danger" style={{ fontSize: 13, marginTop: 16, padding: '7px 16px', borderRadius: 8 }}>Retry</button>
        </div>
      )}

      {!loading && !error && filteredChallenges.length === 0 && (
        <div style={{ textAlign: 'center', padding: '64px 24px', background: '#fff', border: '1px solid #E5EAF0', borderRadius: 12, maxWidth: 480, margin: '0 auto' }}>
          <Target style={{ width: 36, height: 36, color: '#cbd5e1', margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: 16, fontWeight: 600, color: '#0f172a', marginBottom: 6 }}>No challenges found</h3>
          <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 16 }}>Try adjusting your search or filters.</p>
          <button onClick={handleResetFilters} className="btn btn-secondary" style={{ fontSize: 13, padding: '7px 16px', borderRadius: 8, display: 'inline-flex', gap: 5 }}>
            <RotateCcw style={{ width: 13, height: 13 }} /> Reset Filters
          </button>
        </div>
      )}

      {!loading && !error && filteredChallenges.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {filteredChallenges.map(challenge => {
            const status = getParticipationStatus(challenge);
            const isAvailable = status === 'AVAILABLE';
            const isAccepted = status === 'ACCEPTED';
            const isInProgress = status === 'IN_PROGRESS';
            const isSubmitted = status === 'SUBMITTED' || status === 'UNDER_REVIEW';
            const isCompleted = status === 'COMPLETED' || status === 'VERIFIED';

            const diffStyle: Record<string, { bg: string; color: string }> = {
              EASY: { bg: '#dcfce7', color: '#15803d' },
              MEDIUM: { bg: '#dbeafe', color: '#1d4ed8' },
              HARD: { bg: '#fef3c7', color: '#b45309' },
              EXPERT: { bg: '#ede9fe', color: '#7c3aed' },
            };
            const ds = diffStyle[challenge.difficulty] ?? { bg: '#f1f5f9', color: '#475569' };

            const statusStyle: Record<string, { bg: string; color: string }> = {
              COMPLETED: { bg: '#dcfce7', color: '#15803d' },
              VERIFIED: { bg: '#dcfce7', color: '#15803d' },
              SUBMITTED: { bg: '#dbeafe', color: '#1d4ed8' },
              UNDER_REVIEW: { bg: '#dbeafe', color: '#1d4ed8' },
              IN_PROGRESS: { bg: '#fef3c7', color: '#b45309' },
              ACCEPTED: { bg: '#eff6ff', color: '#2563eb' },
              AVAILABLE: { bg: '#f1f5f9', color: '#64748b' },
            };
            const ss = statusStyle[status] ?? { bg: '#f1f5f9', color: '#64748b' };

            return (
              <div key={challenge._id}
                style={{ background: '#fff', border: '1px solid #E5EAF0', borderRadius: 12, padding: '20px', display: 'flex', flexDirection: 'column', gap: 0, transition: 'box-shadow 0.15s, border-color 0.15s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'; (e.currentTarget as HTMLDivElement).style.borderColor = '#bfdbfe'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; (e.currentTarget as HTMLDivElement).style.borderColor = '#E5EAF0'; }}>
                <div>
                  {/* Badges */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 999, fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', background: ds.bg, color: ds.color }}>
                      {challenge.difficulty}
                    </span>
                    <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 999, fontSize: 10.5, fontWeight: 600, background: ss.bg, color: ss.color }}>
                      {status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 4, lineHeight: 1.3 }}>{challenge.title}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#64748b', marginBottom: 10 }}>
                    <Building2 style={{ width: 12, height: 12 }} />
                    <span>{challenge.company || 'ProofHire Systems'}</span>
                    {challenge.category && <><span>·</span><span>{challenge.category}</span></>}
                  </div>

                  <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: 12 }}>
                    {challenge.description}
                  </p>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 14 }}>
                    {(challenge.technologies || challenge.skills || challenge.skillsTargeted || ['Algorithms']).slice(0, 4).map((item, idx) => (
                      <span key={idx} style={{ background: '#f1f5f9', color: '#475569', fontSize: 11, fontWeight: 500, padding: '2px 8px', borderRadius: 5 }}>{item}</span>
                    ))}
                    {((challenge.technologies || challenge.skills || []).length > 4) && (
                      <span style={{ fontSize: 11, color: '#94a3b8', padding: '2px 4px' }}>+{(challenge.technologies || challenge.skills || []).length - 4}</span>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, color: '#94a3b8', paddingTop: 12, borderTop: '1px solid #f1f5f9', marginBottom: 14 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock style={{ width: 12, height: 12 }} />{challenge.duration || challenge.estimatedTime || '3-5 hrs'}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Calendar style={{ width: 12, height: 12 }} />Open</span>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 4 }}>
                  <button onClick={() => setViewingChallenge(challenge)}
                    style={{ flex: 1, padding: '8px 12px', background: '#f8fafc', border: '1px solid #E5EAF0', color: '#475569', fontSize: 12.5, fontWeight: 600, borderRadius: 8, cursor: 'pointer', transition: 'all 0.12s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#f1f5f9'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#f8fafc'; }}>
                    View Details
                  </button>

                  {isAvailable && (
                    <button onClick={() => handleAccept(challenge)} disabled={actionLoadingId === challenge._id}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: '#2563eb', color: '#fff', fontSize: 12.5, fontWeight: 700, borderRadius: 8, border: 'none', cursor: 'pointer', opacity: actionLoadingId === challenge._id ? 0.6 : 1 }}>
                      {actionLoadingId === challenge._id ? <Loader2 style={{ width: 13, height: 13 }} className="animate-spin" /> : <Check style={{ width: 13, height: 13 }} />}
                      Accept
                    </button>
                  )}

                  {isAccepted && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: '#2563eb', background: '#eff6ff', border: '1px solid #bfdbfe', padding: '4px 10px', borderRadius: 6 }}>Accepted</span>
                      <button onClick={() => handleStart(challenge)} disabled={actionLoadingId === challenge._id}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 12px', background: '#d97706', color: '#fff', fontSize: 12, fontWeight: 700, borderRadius: 8, border: 'none', cursor: 'pointer', opacity: actionLoadingId === challenge._id ? 0.6 : 1 }}>
                        {actionLoadingId === challenge._id ? <Loader2 style={{ width: 12, height: 12 }} className="animate-spin" /> : <ArrowRight style={{ width: 12, height: 12 }} />}
                        {isNonTech ? 'Start' : 'Start'}
                      </button>
                    </div>
                  )}

                  {isInProgress && (
                    <button onClick={() => setSubmittingChallenge(challenge)}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '8px 14px', background: '#7c3aed', color: '#fff', fontSize: 12.5, fontWeight: 700, borderRadius: 8, border: 'none', cursor: 'pointer' }}>
                      {isNonTech ? 'Continue' : 'Submit Solution'}
                    </button>
                  )}

                  {isSubmitted && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: '#1d4ed8', background: '#dbeafe', padding: '4px 10px', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <CheckCircle2 style={{ width: 11, height: 11 }} /> Submitted
                      </span>
                      <button onClick={() => setSubmittingChallenge(challenge)}
                        style={{ padding: '6px 10px', background: '#f1f5f9', color: '#64748b', fontSize: 12, fontWeight: 500, borderRadius: 7, border: 'none', cursor: 'pointer' }}>
                        {isNonTech ? 'View' : 'Update Repo'}
                      </button>
                    </div>
                  )}

                  {isCompleted && (
                    <button onClick={() => setSubmittingChallenge(challenge)}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 12px', background: '#dcfce7', color: '#15803d', fontSize: 12, fontWeight: 700, borderRadius: 8, border: 'none', cursor: 'pointer' }}>
                      <CheckCircle2 style={{ width: 13, height: 13 }} />
                      {isNonTech ? 'View Submission' : (challenge.score ? `${challenge.score}% Verified` : 'Verified ✓')}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}



{/* View Challenge Details Modal */ }
{
  viewingChallenge && (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: '#fff', border: '1px solid #E5EAF0', borderRadius: 16, maxWidth: 680, width: '100%', padding: 28, boxShadow: '0 20px 60px rgba(0,0,0,0.15)', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {viewingChallenge.category || viewingChallenge.domain || 'Engineering'} · {viewingChallenge.difficulty}
            </span>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', marginTop: 4 }}>{viewingChallenge.title}</h2>
            <p style={{ fontSize: 12.5, color: '#64748b', display: 'flex', alignItems: 'center', gap: 5, marginTop: 3 }}>
              <Building2 style={{ width: 13, height: 13 }} /> {viewingChallenge.company || 'ProofHire Systems Lab'}
            </p>
          </div>
          <button onClick={() => setViewingChallenge(null)} style={{ fontSize: 18, color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer', padding: 4, lineHeight: 1 }}>✕</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, fontSize: 13, color: '#475569' }}>
          <div>
            <h4 style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Description</h4>
            <p style={{ background: '#f8fafc', padding: 16, borderRadius: 12, border: '1px solid #E5EAF0', whiteSpace: 'pre-line', lineHeight: 1.6 }}>
              {viewingChallenge.description}
            </p>
          </div>

          {viewingChallenge.starterConstraints && (
            <div>
              <h4 style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Constraints & Architecture</h4>
              <p style={{ background: '#fef2f2', color: '#991b1b', padding: 12, borderRadius: 8, border: '1px solid #fecaca' }}>
                {viewingChallenge.starterConstraints}
              </p>
            </div>
          )}

          {viewingChallenge.requirements && viewingChallenge.requirements.length > 0 && (
            <div>
              <h4 style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <FileCode2 style={{ width: 14, height: 14, color: '#2563eb' }} /> Requirements
              </h4>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {viewingChallenge.requirements.map((req, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, background: '#f8fafc', border: '1px solid #E5EAF0', padding: '8px 12px', borderRadius: 8 }}>
                    <span style={{ color: '#2563eb', fontWeight: 700 }}>•</span>
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {viewingChallenge.deliverables && viewingChallenge.deliverables.length > 0 && (
            <div>
              <h4 style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Layers style={{ width: 14, height: 14, color: '#d97706' }} /> Deliverables
              </h4>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {viewingChallenge.deliverables.map((del, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, background: '#fffbeb', border: '1px solid #fde68a', color: '#92400e', padding: '8px 12px', borderRadius: 8 }}>
                    <span style={{ color: '#d97706', fontWeight: 700 }}>✓</span>
                    <span>{del}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {viewingChallenge.evaluationCriteria && viewingChallenge.evaluationCriteria.length > 0 && (
            <div>
              <h4 style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <ShieldCheck style={{ width: 14, height: 14, color: '#059669' }} /> Evaluation Criteria
              </h4>
              <ul style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 8 }}>
                {viewingChallenge.evaluationCriteria.map((c, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', padding: '8px 12px', borderRadius: 8 }}>
                    <ShieldCheck style={{ width: 14, height: 14, color: '#059669', flexShrink: 0 }} />
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, paddingTop: 16 }}>
            <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, border: '1px solid #E5EAF0' }}>
              <span style={{ color: '#94a3b8', display: 'block', marginBottom: 4, fontSize: 11 }}>Estimated Duration</span>
              <span style={{ fontWeight: 700, color: '#0f172a' }}>{viewingChallenge.duration || viewingChallenge.estimatedTime || '4-6 hours'}</span>
            </div>
            <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, border: '1px solid #E5EAF0' }}>
              <span style={{ color: '#94a3b8', display: 'block', marginBottom: 4, fontSize: 11 }}>Track & Verification</span>
              <span style={{ fontWeight: 700, color: '#059669' }}>Technical Production</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, paddingTop: 24, marginTop: 24, borderTop: '1px solid #E5EAF0' }}>
          <button onClick={() => setViewingChallenge(null)} style={{ padding: '8px 16px', background: 'none', border: 'none', color: '#64748b', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            Close
          </button>

          {getParticipationStatus(viewingChallenge) === 'AVAILABLE' && (
            <button onClick={() => { handleAccept(viewingChallenge); setViewingChallenge(null); }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#2563eb', color: '#fff', fontSize: 13, fontWeight: 700, borderRadius: 8, border: 'none', cursor: 'pointer' }}>
              <Check style={{ width: 14, height: 14 }} /> Accept Challenge
            </button>
          )}

          {getParticipationStatus(viewingChallenge) === 'ACCEPTED' && (
            <button onClick={() => { handleStart(viewingChallenge); setViewingChallenge(null); }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#d97706', color: '#fff', fontSize: 13, fontWeight: 700, borderRadius: 8, border: 'none', cursor: 'pointer' }}>
              <ArrowRight style={{ width: 14, height: 14 }} /> Start Challenge
            </button>
          )}

          {getParticipationStatus(viewingChallenge) === 'IN_PROGRESS' && (
            <button onClick={() => { const c = viewingChallenge; setViewingChallenge(null); setSubmittingChallenge(c); }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#7c3aed', color: '#fff', fontSize: 13, fontWeight: 700, borderRadius: 8, border: 'none', cursor: 'pointer' }}>
              Submit Solution
            </button>
          )}

          {(getParticipationStatus(viewingChallenge) === 'SUBMITTED' || getParticipationStatus(viewingChallenge) === 'UNDER_REVIEW') && (
            <button onClick={() => { const c = viewingChallenge; setViewingChallenge(null); setSubmittingChallenge(c); }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#f1f5f9', color: '#475569', fontSize: 13, fontWeight: 700, borderRadius: 8, border: '1px solid #E5EAF0', cursor: 'pointer' }}>
              Update Solution
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

{/* Challenge Submission Modal */ }
{
  submittingChallenge && (
    <ChallengeModal
      challenge={submittingChallenge}
      onClose={() => setSubmittingChallenge(null)}
      onSubmitSuccess={() => {
        setSubmittingChallenge(null);
        fetchChallenges(false);
        setActionMessage('Challenge solution submitted successfully! Verification in progress.');
      }}
    />
  )
}
    </div >
  );
}

function ChallengeModal({
  challenge,
  onClose,
  onSubmitSuccess
}: {
  challenge: Challenge;
  onClose: () => void;
  onSubmitSuccess: () => void;
}) {
  const isNonTech = challenge.track === 'NON_TECHNICAL';

  // Non-tech submission state
  const [workTitle, setWorkTitle] = useState(challenge.submission?.workTitle || challenge.title || '');
  const [workUrl, setWorkUrl] = useState(challenge.submission?.workUrl || challenge.submission?.documentUrl || '');
  const [documentUrl, setDocumentUrl] = useState(challenge.submission?.documentUrl || '');
  const [workDescription, setWorkDescription] = useState(challenge.submission?.workDescription || challenge.submission?.notes || '');

  // Tech submission state
  const [githubUrl, setGithubUrl] = useState(challenge.submission?.githubUrl || '');
  const [notes, setNotes] = useState(challenge.submission?.notes || '');

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const nonTechAnalysis = challenge.submission?.nonTechAnalysis;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isNonTech) {
      if (!workTitle.trim()) {
        setSubmitError('Please provide a title for your proof of work.');
        return;
      }
      if (!workUrl.trim() && !documentUrl.trim() && !workDescription.trim()) {
        setSubmitError('Please provide a document or portfolio URL, or write your deliverable.');
        return;
      }
    } else {
      if (!githubUrl.trim()) {
        setSubmitError('Please provide a GitHub repository URL.');
        return;
      }
    }

    setSubmitting(true);
    setSubmitError(null);
    try {
      if (isNonTech) {
        await api.post(`/candidate/challenges/${challenge._id}/submit`, {
          workTitle,
          workDescription,
          workUrl: workUrl || documentUrl,
          documentUrl: documentUrl || workUrl,
          notes: workDescription
        });
      } else {
        await api.post(`/candidate/challenges/${challenge._id}/submit`, { githubUrl, notes });
      }
      onSubmitSuccess();
    } catch (err: any) {
      setSubmitError(err.response?.data?.message || 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (isNonTech) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        <div style={{ background: '#fff', border: '1px solid #E5EAF0', borderRadius: 16, maxWidth: 680, width: '100%', padding: 28, boxShadow: '0 20px 60px rgba(0,0,0,0.15)', maxHeight: '90vh', overflowY: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
            <div>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Proof of Work Submission · {challenge.category || 'Non-Technical'}
              </span>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', marginTop: 4 }}>{challenge.title}</h2>
            </div>
            <button onClick={onClose} style={{ fontSize: 18, color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer', padding: 4, lineHeight: 1 }}>✕</button>
          </div>

          {/* AI Work Analysis if already submitted */}
          {nonTechAnalysis && (
            <div style={{ marginBottom: 24, padding: 20, borderRadius: 12, background: '#f8fafc', border: '1px solid #bfdbfe' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Sparkles style={{ width: 14, height: 14 }} /> AI Work Analysis Complete
                </span>
                <span style={{ fontSize: 20, fontWeight: 900, color: '#0f172a', fontFamily: 'monospace' }}>
                  {nonTechAnalysis.overallScore || '8.4'} <span style={{ fontSize: 13, color: '#64748b' }}>/ 10</span>
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))', gap: 8, textAlign: 'center', marginBottom: 16 }}>
                {['Understanding', 'Quality', 'Creativity', 'Completeness', 'Communication'].map((metric, i) => {
                  const values = [nonTechAnalysis.problemUnderstanding || 8.5, nonTechAnalysis.qualityOfWork || 8.2, nonTechAnalysis.creativity || 8.7, nonTechAnalysis.completeness || 8.1, nonTechAnalysis.communication || 8.4];
                  return (
                    <div key={metric} style={{ padding: 10, borderRadius: 8, background: '#fff', border: '1px solid #E5EAF0' }}>
                      <span style={{ fontSize: 10.5, color: '#64748b', display: 'block', marginBottom: 4 }}>{metric}</span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{values[i]}/10</span>
                    </div>
                  )
                })}
              </div>
              {nonTechAnalysis.summary && (
                <p style={{ fontSize: 13, color: '#475569', fontStyle: 'italic', borderTop: '1px solid #E5EAF0', paddingTop: 12, margin: 0, lineHeight: 1.5 }}>
                  "{nonTechAnalysis.summary}"
                </p>
              )}
            </div>
          )}

          <p style={{ fontSize: 13, color: '#475569', background: '#f8fafc', padding: '12px 16px', borderRadius: 8, border: '1px solid #E5EAF0', marginBottom: 24, lineHeight: 1.5 }}>
            Submit your case study, campaign plan, or deliverable (PDF, DOCX, Figma, or Google Docs link).
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6, display: 'block' }}>
                Deliverable / Work Title <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input type="text" value={workTitle} onChange={e => setWorkTitle(e.target.value)} placeholder="e.g. 30-Day Go-To-Market Campaign Strategy" required
                className="input" style={{ width: '100%', fontSize: 13.5 }} />
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6, display: 'block' }}>
                Work / Portfolio / Document URL
              </label>
              <input type="url" value={workUrl} onChange={e => setWorkUrl(e.target.value)} placeholder="https://docs.google.com/... or Figma / Notion / Drive link"
                className="input" style={{ width: '100%', fontSize: 13.5 }} />
              <span style={{ fontSize: 11.5, color: '#94a3b8', display: 'block', marginTop: 4 }}>
                Provide a link to your Google Doc, PDF, slide deck, or design prototype.
              </span>
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6, display: 'block' }}>
                Deliverable Summary & Strategic Notes
              </label>
              <textarea value={workDescription} onChange={e => setWorkDescription(e.target.value)} rows={4} placeholder="Outline your problem approach, key metrics, strategic frameworks used, and expected business impact..."
                className="input" style={{ width: '100%', fontSize: 13.5, resize: 'none' }} />
            </div>

            {submitError && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#991b1b', background: '#fef2f2', border: '1px solid #fecaca', padding: '12px 16px', borderRadius: 8, fontSize: 13, fontWeight: 500 }}>
                <AlertCircle style={{ width: 16, height: 16, flexShrink: 0 }} />
                {submitError}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, paddingTop: 16 }}>
              <button type="button" onClick={onClose} style={{ padding: '8px 16px', background: 'none', border: 'none', color: '#64748b', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                Close
              </button>
              <button type="submit" disabled={submitting}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#2563eb', color: '#fff', fontSize: 13, fontWeight: 700, borderRadius: 8, border: 'none', cursor: 'pointer', opacity: submitting ? 0.6 : 1 }}>
                {submitting ? <Loader2 style={{ width: 14, height: 14 }} className="animate-spin" /> : null}
                {submitting ? 'Submitting...' : 'Submit Proof of Work'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: '#fff', border: '1px solid #E5EAF0', borderRadius: 16, maxWidth: 600, width: '100%', padding: 28, boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Submit Technical Challenge</span>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', marginTop: 4 }}>{challenge.title}</h2>
          </div>
          <button onClick={onClose} style={{ fontSize: 18, color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer', padding: 4, lineHeight: 1 }}>✕</button>
        </div>

        <p style={{ fontSize: 13, color: '#475569', background: '#f8fafc', padding: '12px 16px', borderRadius: 8, border: '1px solid #E5EAF0', marginBottom: 24, lineHeight: 1.5 }}>
          Provide your GitHub repository containing the working implementation and architectural specification.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
              <GithubIcon style={{ width: 14, height: 14 }} /> GitHub Repository URL <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input type="url" value={githubUrl} onChange={e => setGithubUrl(e.target.value)} placeholder="https://github.com/yourusername/your-solution" required
              className="input" style={{ width: '100%', fontSize: 13.5 }} />
          </div>

          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6, display: 'block' }}>
              Technical Notes & Architecture Decisions
            </label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Detail your trade-offs, concurrency handling, database schema decisions, or setup instructions..."
              className="input" style={{ width: '100%', fontSize: 13.5, resize: 'none' }} />
          </div>

          {submitError && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#991b1b', background: '#fef2f2', border: '1px solid #fecaca', padding: '12px 16px', borderRadius: 8, fontSize: 13, fontWeight: 500 }}>
              <AlertCircle style={{ width: 16, height: 16, flexShrink: 0 }} />
              {submitError}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, paddingTop: 16 }}>
            <button type="button" onClick={onClose} style={{ padding: '8px 16px', background: 'none', border: 'none', color: '#64748b', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              Cancel
            </button>
            <button type="submit" disabled={submitting}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#2563eb', color: '#fff', fontSize: 13, fontWeight: 700, borderRadius: 8, border: 'none', cursor: 'pointer', opacity: submitting ? 0.6 : 1 }}>
              {submitting ? <Loader2 style={{ width: 14, height: 14 }} className="animate-spin" /> : null}
              {submitting ? 'Submitting...' : 'Submit for Verification'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
