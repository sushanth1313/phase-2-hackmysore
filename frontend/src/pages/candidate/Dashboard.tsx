import {
  CheckCircle2, FileText, Code2, ShieldCheck, Loader2,
  ExternalLink, Target, Briefcase, FolderCheck, Clock,
  TrendingUp, ArrowUpRight, ChevronRight, Users, Award,
  Activity, BookOpen, MessageSquare, Zap
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';

interface EvidenceItem {
  type: string;
  name: string;
  confidence: number;
}

interface ProofItem {
  id: string;
  title: string;
  description: string;
  status: string;
  githubUrl?: string;
  signal?: string | null;
  score?: number | null;
  scores?: {
    codeQuality?: number;
    architecture?: number;
    functionality?: number;
    overallEvidenceScore?: number;
  } | null;
  claimedTechnologies: string[];
  evidenceItems: EvidenceItem[];
  createdAt: string;
}

interface TimelineItemData {
  title: string;
  desc: string;
  type: 'success' | 'action' | 'info';
  date: string;
}

interface DashboardData {
  profileCompletion?: number;
  resumeScore10?: number;
  practice?: {
    solved: number;
    total: number;
  };
  activeChallengesCount?: number;
  activeChallenge?: {
    id: string;
    title: string;
    status: string;
  } | null;
  applicationsCount?: number;
  upcomingInterviewsCount?: number;
  upcomingInterview?: {
    id: string;
    focus: string;
    targetLevel: string;
    status: string;
  } | null;
  verifiedSkillsCount?: number;
  compositeSignal: number | null;
  verifiedProjects: number;
  totalProjects: number;
  peerReviews: number;
  challengesDone: number;
  evidenceSummary: {
    codeEvidence: string;
    architectureDecisions: string;
    challengesDesc: string;
    reviewsDesc: string;
  };
  proofs: ProofItem[];
  timeline: TimelineItemData[];
}

// ── Status badge ─────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase().replace(/_/g, ' ');
  const map: Record<string, { bg: string; color: string }> = {
    verified:        { bg: '#dcfce7', color: '#15803d' },
    completed:       { bg: '#dcfce7', color: '#15803d' },
    'under review':  { bg: '#dbeafe', color: '#1d4ed8' },
    submitted:       { bg: '#dbeafe', color: '#1d4ed8' },
    pending:         { bg: '#fef3c7', color: '#b45309' },
    active:          { bg: '#fef3c7', color: '#b45309' },
    rejected:        { bg: '#fee2e2', color: '#b91c1c' },
  };
  const style = map[s] ?? { bg: '#f1f5f9', color: '#475569' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '2px 10px', borderRadius: 999,
      fontSize: 11, fontWeight: 600,
      background: style.bg, color: style.color,
      whiteSpace: 'nowrap',
    }}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}

// ── Timeline icon ────────────────────────────────────────
function TimelineIcon({ type }: { type: string }) {
  const map: Record<string, { icon: any; bg: string; color: string }> = {
    success: { icon: CheckCircle2, bg: '#dcfce7', color: '#16a34a' },
    action:  { icon: TrendingUp,   bg: '#dbeafe', color: '#2563eb' },
    info:    { icon: Activity,     bg: '#f1f5f9', color: '#64748b' },
  };
  const { icon: Icon, bg, color } = map[type] ?? map.info;
  return (
    <div style={{ width: 28, height: 28, borderRadius: 999, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <Icon style={{ width: 13, height: 13, color }} />
    </div>
  );
}

// ── Metric card ──────────────────────────────────────────
function MetricCard({ label, value, icon: Icon, iconColor, iconBg, trend }: {
  label: string; value: number | string; icon: any;
  iconColor: string; iconBg: string; trend?: string;
}) {
  return (
    <div style={{
      background: '#fff', border: '1px solid #E5EAF0', borderRadius: 12,
      padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10,
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: '#64748b' }}>{label}</span>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon style={{ width: 15, height: 15, color: iconColor }} />
        </div>
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.03em', lineHeight: 1 }}>{value}</div>
      {trend && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <TrendingUp style={{ width: 11, height: 11, color: '#16a34a' }} />
          <span style={{ fontSize: 11.5, color: '#16a34a', fontWeight: 600 }}>{trend}</span>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════
export default function CandidateDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/candidate/dashboard');
        if (res.data?.success) {
          setData(res.data.data);
        }
      } catch (err) {
        console.error('Failed to fetch dashboard stats', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="w-full h-full min-h-[60vh] flex flex-col items-center justify-center p-12">
        <Loader2 className="w-6 h-6 text-blue-600 animate-spin mb-3" />
        <p className="text-slate-500 text-sm">Loading dashboard...</p>
      </div>
    );
  }

  const isNonTech = user?.track === 'NON_TECHNICAL';
  if (isNonTech) {
    return <NonTechDashboardView data={data} user={user} />;
  }

  const activeChallengesCount = data?.activeChallengesCount ?? 0;
  const verifiedSkillsCount   = data?.verifiedSkillsCount ?? 0;
  const applicationsCount     = data?.applicationsCount ?? 0;
  const upcomingInterviewsCount = data?.upcomingInterviewsCount ?? 0;
  const profileCompletion     = data?.profileCompletion ?? 0;
  const proofs                = data?.proofs ?? [];
  const timeline              = data?.timeline ?? [];
  const firstName             = user?.firstName ?? 'there';

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  // Recommended quick-links
  const recommended = [
    { label: 'Technical Challenge',   sub: 'Test your problem solving skills', icon: Code2,       color: '#2563eb', bg: '#eff6ff',  to: '/candidate/challenges' },
    { label: 'Technical Practice',    sub: 'Practice coding problems',         icon: Target,      color: '#7c3aed', bg: '#f5f3ff',  to: '/candidate/practice'  },
    { label: 'AI Interview Prep',     sub: 'Simulate technical interviews',    icon: Users,       color: '#059669', bg: '#f0fdf4',  to: '/candidate/interview' },
    { label: 'Resume Analysis',       sub: 'Analyze your resume with AI',      icon: FileText,    color: '#d97706', bg: '#fffbeb',  to: '/candidate/resume-ai' },
  ];

  return (
    <div style={{ padding: '28px 28px', maxWidth: 1300, margin: '0 auto' }}>

      {/* ── Greeting header ──────────────────────────── */}
      <div style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 14, color: '#64748b', marginBottom: 2 }}>{greeting},</p>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.025em', marginBottom: 4 }}>
          {firstName} 👋
        </h1>
        <p style={{ fontSize: 14, color: '#64748b' }}>
          Here's an overview of your verified profile and recent activity.
        </p>
      </div>

      {/* ── 2-zone layout ────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24, alignItems: 'start' }}>

        {/* ════════════ MAIN COLUMN ════════════════════ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, minWidth: 0 }}>

          {/* Metrics row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
            <MetricCard label="Applications"   value={applicationsCount}      icon={Briefcase}    iconColor="#2563eb" iconBg="#eff6ff" trend={applicationsCount > 0 ? `${applicationsCount} total` : undefined} />
            <MetricCard label="Verified Skills" value={verifiedSkillsCount}    icon={ShieldCheck}  iconColor="#059669" iconBg="#f0fdf4" trend={verifiedSkillsCount > 0 ? `${verifiedSkillsCount} verified` : undefined} />
            <MetricCard label="Projects"        value={data?.totalProjects ?? 0} icon={FolderCheck} iconColor="#7c3aed" iconBg="#f5f3ff" trend={data?.verifiedProjects ? `${data.verifiedProjects} verified` : undefined} />
            <MetricCard label="Challenges Done" value={data?.challengesDone ?? 0} icon={Target}    iconColor="#d97706" iconBg="#fffbeb" trend={activeChallengesCount > 0 ? `${activeChallengesCount} active` : undefined} />
          </div>

          {/* Passport CTA — shown if profile not complete */}
          {profileCompletion < 100 && (
            <div style={{
              background: 'linear-gradient(135deg, #eff6ff 0%, #f5f3ff 100%)',
              border: '1px solid #bfdbfe', borderRadius: 12,
              padding: '20px 24px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
            }}>
              <div>
                <p style={{ fontSize: 15, fontWeight: 700, color: '#1e40af', marginBottom: 4 }}>Complete your Capability Passport</p>
                <p style={{ fontSize: 13, color: '#3b82f6', marginBottom: 12 }}>
                  Showcase your verified skills, projects and achievements to get noticed by top recruiters.
                </p>
                <Link to="/candidate/passport" className="btn btn-primary" style={{ fontSize: 13, padding: '7px 16px', borderRadius: 8 }}>
                  View Passport
                </Link>
              </div>
              <div style={{
                width: 48, height: 48, borderRadius: 12,
                background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <Award style={{ width: 24, height: 24, color: '#fff' }} />
              </div>
            </div>
          )}

          {/* Current Work ─ projects table */}
          <section>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <h2 style={{ fontSize: 15, fontWeight: 600, color: '#0f172a' }}>Current Work</h2>
              <Link to="/candidate/projects" style={{ fontSize: 13, fontWeight: 500, color: '#2563eb', textDecoration: 'none' }}>View all →</Link>
            </div>

            {proofs.length === 0 ? (
              <div style={{
                background: '#fff', border: '1px solid #E5EAF0', borderRadius: 12,
                padding: '40px 24px', textAlign: 'center',
              }}>
                <FolderCheck style={{ width: 32, height: 32, color: '#cbd5e1', margin: '0 auto 12px' }} />
                <p style={{ fontSize: 14, fontWeight: 500, color: '#0f172a', marginBottom: 4 }}>No projects yet</p>
                <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 16 }}>Submit your first project to begin verification.</p>
                <Link to="/candidate/projects" className="btn btn-primary" style={{ fontSize: 13, padding: '7px 16px', borderRadius: 8 }}>
                  Submit Project
                </Link>
              </div>
            ) : (
              <div style={{ background: '#fff', border: '1px solid #E5EAF0', borderRadius: 12, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #E5EAF0' }}>
                      <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#94a3b8', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Project</th>
                      <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#94a3b8', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Status</th>
                      <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#94a3b8', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Verification</th>
                      <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#94a3b8', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Submitted</th>
                    </tr>
                  </thead>
                  <tbody>
                    {proofs.slice(0, 6).map((proof) => (
                      <tr key={proof.id} style={{ borderBottom: '1px solid #f1f5f9' }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                        <td style={{ padding: '12px 16px' }}>
                          <p style={{ fontWeight: 600, color: '#0f172a', marginBottom: 2 }}>{proof.title}</p>
                          {proof.githubUrl && (
                            <a href={proof.githubUrl} target="_blank" rel="noreferrer"
                              style={{ fontSize: 11.5, color: '#64748b', display: 'flex', alignItems: 'center', gap: 3, textDecoration: 'none' }}
                              onMouseEnter={e => (e.currentTarget.style.color = '#2563eb')}
                              onMouseLeave={e => (e.currentTarget.style.color = '#64748b')}>
                              <ExternalLink style={{ width: 10, height: 10 }} /> Repository
                            </a>
                          )}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <StatusBadge status={proof.status} />
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: '#0f172a' }}>
                          {proof.signal || (proof.score ? (proof.score / 10).toFixed(1) : '—')}
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: 12, color: '#94a3b8' }}>
                          {new Date(proof.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Active Challenge */}
          {data?.activeChallenge && (
            <section>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <h2 style={{ fontSize: 15, fontWeight: 600, color: '#0f172a' }}>Active Challenge</h2>
                <Link to="/candidate/challenges" style={{ fontSize: 13, fontWeight: 500, color: '#2563eb', textDecoration: 'none' }}>View all →</Link>
              </div>
              <div style={{ background: '#fff', border: '1px solid #E5EAF0', borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Target style={{ width: 20, height: 20, color: '#2563eb' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 600, color: '#0f172a', marginBottom: 2 }}>{data.activeChallenge.title}</p>
                  <StatusBadge status={data.activeChallenge.status} />
                </div>
                <Link to={`/candidate/challenges`} className="btn btn-secondary" style={{ fontSize: 12.5, padding: '6px 14px', borderRadius: 8 }}>
                  Continue <ChevronRight style={{ width: 13, height: 13 }} />
                </Link>
              </div>
            </section>
          )}

          {/* Upcoming Interview */}
          {data?.upcomingInterview && (
            <section>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <h2 style={{ fontSize: 15, fontWeight: 600, color: '#0f172a' }}>Upcoming Interview</h2>
              </div>
              <div style={{ background: '#fff', border: '1px solid #E5EAF0', borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Clock style={{ width: 20, height: 20, color: '#7c3aed' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 600, color: '#0f172a', marginBottom: 2 }}>{data.upcomingInterview.focus}</p>
                  <p style={{ fontSize: 12, color: '#64748b' }}>Target: {data.upcomingInterview.targetLevel}</p>
                </div>
                <StatusBadge status={data.upcomingInterview.status} />
              </div>
            </section>
          )}
        </div>

        {/* ════════════ RIGHT PANEL ════════════════════ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Recommended for you */}
          <div style={{ background: '#fff', border: '1px solid #E5EAF0', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: 13.5, fontWeight: 600, color: '#0f172a' }}>Recommended for you</h3>
              <Link to="/candidate/discover" style={{ fontSize: 12, color: '#2563eb', textDecoration: 'none', fontWeight: 500 }}>View all</Link>
            </div>
            <div>
              {recommended.map((r, i) => {
                const Icon = r.icon;
                return (
                  <Link key={i} to={r.to} style={{ textDecoration: 'none' }}>
                    <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: i < recommended.length - 1 ? '1px solid #f8fafc' : 'none', transition: 'background 0.12s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <div style={{ width: 36, height: 36, borderRadius: 9, background: r.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon style={{ width: 16, height: 16, color: r.color }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.label}</p>
                        <p style={{ fontSize: 11.5, color: '#94a3b8' }}>{r.sub}</p>
                      </div>
                      <ChevronRight style={{ width: 14, height: 14, color: '#cbd5e1', flexShrink: 0 }} />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Your Progress */}
          <div style={{ background: '#fff', border: '1px solid #E5EAF0', borderRadius: 12, padding: '16px' }}>
            <h3 style={{ fontSize: 13.5, fontWeight: 600, color: '#0f172a', marginBottom: 14 }}>Your Progress</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              {/* Circular progress */}
              <div style={{ position: 'relative', width: 64, height: 64, flexShrink: 0 }}>
                <svg width="64" height="64" viewBox="0 0 64 64">
                  <circle cx="32" cy="32" r="26" fill="none" stroke="#f1f5f9" strokeWidth="6" />
                  <circle cx="32" cy="32" r="26" fill="none" stroke="#2563eb" strokeWidth="6"
                    strokeDasharray={`${2 * Math.PI * 26}`}
                    strokeDashoffset={`${2 * Math.PI * 26 * (1 - profileCompletion / 100)}`}
                    strokeLinecap="round"
                    transform="rotate(-90 32 32)" />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{profileCompletion}%</span>
                </div>
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 3 }}>Profile Completion</p>
                <p style={{ fontSize: 11.5, color: '#64748b', marginBottom: 10 }}>Complete your profile to unlock more opportunities.</p>
                <Link to="/candidate/profile" className="btn btn-primary" style={{ fontSize: 12, padding: '6px 14px', borderRadius: 7 }}>
                  Complete Profile
                </Link>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div style={{ background: '#fff', border: '1px solid #E5EAF0', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid #f1f5f9' }}>
              <h3 style={{ fontSize: 13.5, fontWeight: 600, color: '#0f172a' }}>Recent Activity</h3>
            </div>
            <div style={{ padding: '12px 16px' }}>
              {timeline.length === 0 ? (
                <p style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center', padding: '12px 0' }}>No recent activity.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {timeline.slice(0, 5).map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <TimelineIcon type={item.type} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 12.5, fontWeight: 600, color: '#0f172a', marginBottom: 1 }}>{item.title}</p>
                        <p style={{ fontSize: 11.5, color: '#64748b', marginBottom: 2 }}>{item.desc}</p>
                        <p style={{ fontSize: 11, color: '#94a3b8' }}>{new Date(item.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Practice progress */}
          {data?.practice && (
            <div style={{ background: '#fff', border: '1px solid #E5EAF0', borderRadius: 12, padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <h3 style={{ fontSize: 13.5, fontWeight: 600, color: '#0f172a' }}>Practice Progress</h3>
                <Link to="/candidate/practice" style={{ fontSize: 12, color: '#2563eb', textDecoration: 'none', fontWeight: 500 }}>Practice →</Link>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 12.5, color: '#64748b' }}>Problems solved</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{data.practice.solved} / {data.practice.total}</span>
              </div>
              <div style={{ height: 6, background: '#f1f5f9', borderRadius: 999, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 999,
                  background: 'linear-gradient(90deg, #2563eb, #60a5fa)',
                  width: `${data.practice.total > 0 ? (data.practice.solved / data.practice.total) * 100 : 0}%`,
                  transition: 'width 0.6s ease',
                }} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// NON-TECH DASHBOARD VIEW
// ══════════════════════════════════════════════════════════
function NonTechDashboardView({ data, user }: { data: DashboardData | null, user: any }) {
  const [careerArea, setCareerArea] = useState<string>(
    user?.careerArea || (data as any)?.careerArea || ''
  );
  const [savingArea, setSavingArea] = useState(false);

  const CAREER_AREAS = [
    'Marketing', 'HR', 'Finance', 'Sales', 'UI/UX', 
    'Product', 'Content', 'Business Analyst', 'Operations'
  ];

  const handleSelectArea = async (area: string) => {
    setSavingArea(true);
    try {
      await api.patch('/candidate/profile', { careerArea: area });
      setCareerArea(area);
      if (user) user.careerArea = area;
    } catch (err) {
      console.error('Failed to save career area', err);
    } finally {
      setSavingArea(false);
    }
  };

  const activeChallengesCount = data?.activeChallengesCount ?? 0;
  const verifiedSkillsCount   = data?.verifiedSkillsCount ?? 0;
  const applicationsCount     = data?.applicationsCount ?? 0;
  const profileCompletion     = data?.profileCompletion ?? 0;
  const proofs                = data?.proofs ?? [];
  const timeline              = data?.timeline ?? [];
  const firstName             = user?.firstName ?? 'there';

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div style={{ padding: '28px 28px', maxWidth: 1300, margin: '0 auto' }}>

      {/* Career area selector */}
      {!careerArea && (
        <div style={{ marginBottom: 24, background: '#fff', border: '1px solid #E5EAF0', borderRadius: 12, padding: '24px' }}>
          <h2 style={{ fontSize: 17, fontWeight: 600, color: '#0f172a', marginBottom: 6 }}>Select your career area</h2>
          <p style={{ fontSize: 13.5, color: '#64748b', marginBottom: 20 }}>
            Choose your discipline to personalize your verification profile and case studies.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
            {CAREER_AREAS.map((area) => (
              <button key={area} disabled={savingArea} onClick={() => handleSelectArea(area)}
                style={{
                  padding: '10px 12px', fontSize: 13.5, fontWeight: 500,
                  color: '#334155', background: '#f8fafc',
                  border: '1px solid #E5EAF0', borderRadius: 9, cursor: 'pointer',
                  transition: 'all 0.15s',
                }}>
                {area}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Greeting */}
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <p style={{ fontSize: 14, color: '#64748b', marginBottom: 2 }}>{greeting},</p>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.025em', marginBottom: 4 }}>
            {firstName} 👋
          </h1>
          <p style={{ fontSize: 14, color: '#64748b' }}>Track your applications, case studies and verification progress.</p>
        </div>
        {careerArea && (
          <div style={{ background: '#fff', border: '1px solid #E5EAF0', borderRadius: 9, padding: '8px 16px', textAlign: 'right' }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>Career Area</p>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{careerArea}</p>
          </div>
        )}
      </div>

      {/* Two-column */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
            <MetricCard label="Active Challenges"    value={activeChallengesCount} icon={Target}    iconColor="#2563eb" iconBg="#eff6ff" />
            <MetricCard label="Submissions"          value={data?.totalProjects ?? 0} icon={FolderCheck} iconColor="#7c3aed" iconBg="#f5f3ff" />
            <MetricCard label="Verified Capabilities" value={verifiedSkillsCount} icon={ShieldCheck} iconColor="#059669" iconBg="#f0fdf4" />
          </div>

          {/* Submissions table */}
          <section>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <h2 style={{ fontSize: 15, fontWeight: 600, color: '#0f172a' }}>Current Submissions</h2>
              <Link to="/candidate/projects" style={{ fontSize: 13, fontWeight: 500, color: '#2563eb', textDecoration: 'none' }}>View all →</Link>
            </div>

            {proofs.length === 0 ? (
              <div style={{ background: '#fff', border: '1px solid #E5EAF0', borderRadius: 12, padding: '40px 24px', textAlign: 'center' }}>
                <FolderCheck style={{ width: 32, height: 32, color: '#cbd5e1', margin: '0 auto 12px' }} />
                <p style={{ fontSize: 14, color: '#94a3b8' }}>No active case studies or submissions yet.</p>
                <Link to="/candidate/projects" className="btn btn-primary" style={{ fontSize: 13, padding: '7px 16px', borderRadius: 8, marginTop: 12, display: 'inline-flex' }}>
                  New Submission
                </Link>
              </div>
            ) : (
              <div style={{ background: '#fff', border: '1px solid #E5EAF0', borderRadius: 12, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #E5EAF0' }}>
                      <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Submission</th>
                      <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                      <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Verification</th>
                    </tr>
                  </thead>
                  <tbody>
                    {proofs.slice(0, 6).map((proof) => (
                      <tr key={proof.id} style={{ borderBottom: '1px solid #f1f5f9' }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                        <td style={{ padding: '12px 16px', fontWeight: 600, color: '#0f172a' }}>{proof.title}</td>
                        <td style={{ padding: '12px 16px' }}><StatusBadge status={proof.status} /></td>
                        <td style={{ padding: '12px 16px', fontWeight: 600, color: '#0f172a' }}>
                          {proof.signal || (proof.score ? (proof.score / 10).toFixed(1) : '—')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        {/* Right panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Progress */}
          <div style={{ background: '#fff', border: '1px solid #E5EAF0', borderRadius: 12, padding: '16px' }}>
            <h3 style={{ fontSize: 13.5, fontWeight: 600, color: '#0f172a', marginBottom: 14 }}>Your Progress</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ position: 'relative', width: 64, height: 64, flexShrink: 0 }}>
                <svg width="64" height="64" viewBox="0 0 64 64">
                  <circle cx="32" cy="32" r="26" fill="none" stroke="#f1f5f9" strokeWidth="6" />
                  <circle cx="32" cy="32" r="26" fill="none" stroke="#2563eb" strokeWidth="6"
                    strokeDasharray={`${2 * Math.PI * 26}`}
                    strokeDashoffset={`${2 * Math.PI * 26 * (1 - profileCompletion / 100)}`}
                    strokeLinecap="round"
                    transform="rotate(-90 32 32)" />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{profileCompletion}%</span>
                </div>
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 3 }}>Profile Completion</p>
                <p style={{ fontSize: 11.5, color: '#64748b' }}>Complete your profile to unlock more opportunities.</p>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div style={{ background: '#fff', border: '1px solid #E5EAF0', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid #f1f5f9' }}>
              <h3 style={{ fontSize: 13.5, fontWeight: 600, color: '#0f172a' }}>Recent Activity</h3>
            </div>
            <div style={{ padding: '12px 16px' }}>
              {timeline.length === 0 ? (
                <p style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center', padding: '12px 0' }}>No recent activity.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {timeline.slice(0, 5).map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <TimelineIcon type={item.type} />
                      <div>
                        <p style={{ fontSize: 12.5, fontWeight: 600, color: '#0f172a', marginBottom: 1 }}>{item.title}</p>
                        <p style={{ fontSize: 11.5, color: '#64748b', marginBottom: 2 }}>{item.desc}</p>
                        <p style={{ fontSize: 11, color: '#94a3b8' }}>{new Date(item.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
