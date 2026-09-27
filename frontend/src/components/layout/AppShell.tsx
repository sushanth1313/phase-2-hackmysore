import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Code2, ShieldCheck, BrainCircuit,  
  Briefcase, Users, Settings, Bell, Search, Menu, X,
  Award, FileText, CheckCircle2, MessageSquare, Terminal, 
  Zap, LogOut, LineChart, UserCircle, ClipboardList, History,
  ChevronDown
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

// ── Navigation definitions ──────────────────────────────
const candidateNav = [
  { group: 'Main', items: [
    { name: 'Dashboard',           path: '/candidate',           icon: LayoutDashboard },
    { name: 'Discover',            path: '/candidate/discover',  icon: SearchIcon },
    { name: 'Challenges',          path: '/candidate/challenges',icon: TargetIcon },
    { name: 'Technical Practice',  path: '/candidate/practice',  icon: Terminal },
    { name: 'Projects',            path: '/candidate/projects',  icon: Code2 },
    { name: 'Resume AI',           path: '/candidate/resume-ai', icon: FileText },
    { name: 'AI Interview',        path: '/candidate/interview', icon: BrainCircuit },
    { name: 'Capability Passport', path: '/candidate/passport',  icon: Award },
  ]},
  { group: 'Account', items: [
    { name: 'Messages',  path: '/candidate/messages', icon: MessageSquare },
    { name: 'Profile',   path: '/candidate/profile',  icon: UserCircle },
    { name: 'Settings',  path: '/candidate/settings', icon: Settings },
  ]},
];

const nonTechCandidateNav = [
  { group: 'Main', items: [
    { name: 'Dashboard',           path: '/candidate',           icon: LayoutDashboard },
    { name: 'Discover',            path: '/candidate/discover',  icon: SearchIcon },
    { name: 'Challenges',          path: '/candidate/challenges',icon: TargetIcon },
    { name: 'Projects',            path: '/candidate/projects',  icon: Briefcase },
    { name: 'Resume AI',           path: '/candidate/resume-ai', icon: FileText },
    { name: 'AI Interview',        path: '/candidate/interview', icon: BrainCircuit },
    { name: 'Capability Passport', path: '/candidate/passport',  icon: Award },
  ]},
  { group: 'Account', items: [
    { name: 'Messages', path: '/candidate/messages', icon: MessageSquare },
    { name: 'Profile',  path: '/candidate/profile',  icon: UserCircle },
    { name: 'Settings', path: '/candidate/settings', icon: Settings },
  ]},
];

const recruiterNav = [
  { group: 'Main', items: [
    { name: 'Dashboard',      path: '/recruiter',             icon: LayoutDashboard },
    { name: 'Discover Talent',path: '/recruiter/talent',      icon: SearchIcon },
    { name: 'Jobs',           path: '/recruiter/jobs',        icon: Briefcase },
    { name: 'Shortlisted',    path: '/recruiter/shortlists',  icon: CheckCircle2 },
    { name: 'Hiring Pipeline',path: '/recruiter/pipeline',    icon: ActivityIcon },
  ]},
  { group: 'Account', items: [
    { name: 'Messages',        path: '/recruiter/messages', icon: MessageSquare },
    { name: 'Company Profile', path: '/recruiter/company',  icon: Users },
    { name: 'Settings',        path: '/recruiter/settings', icon: Settings },
  ]},
];

const expertNav = [
  { group: 'Reviews', items: [
    { name: 'Dashboard',        path: '/expert',                icon: LayoutDashboard },
    { name: 'Assigned Reviews', path: '/expert/reviews',        icon: ClipboardList },
    { name: 'Review History',   path: '/expert/review-history', icon: History },
  ]},
  { group: 'Account', items: [
    { name: 'Profile', path: '/expert/profile', icon: UserCircle },
  ]},
];

const adminNav = [
  { group: 'Administration', items: [
    { name: 'Dashboard',   path: '/admin',              icon: LayoutDashboard },
    { name: 'Users',       path: '/admin/users',        icon: Users },
    { name: 'Challenges',  path: '/admin/challenges',   icon: Code2 },
    { name: 'Submissions', path: '/admin/submissions',  icon: FileText },
    { name: 'Reviews',     path: '/admin/reviews',      icon: MessageSquare },
    { name: 'Reports',     path: '/admin/reports',      icon: LineChart },
    { name: 'System',      path: '/admin/system',       icon: Settings },
  ]},
];

// ── Inline SVG icon helpers ──────────────────────────────
function TargetIcon(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" 
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
    </svg>
  );
}
function SearchIcon(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
    </svg>
  );
}
function ActivityIcon(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>
  );
}

// ── Role config ──────────────────────────────────────────
const roleConfig: Record<string, { label: string; accent: string; pill: string }> = {
  candidate: { label: 'Candidate',  accent: '#2563eb', pill: 'bg-blue-50 text-blue-700'   },
  recruiter: { label: 'Recruiter',  accent: '#7c3aed', pill: 'bg-violet-50 text-violet-700' },
  expert:    { label: 'Expert',     accent: '#059669', pill: 'bg-emerald-50 text-emerald-700' },
  admin:     { label: 'Admin',      accent: '#dc2626', pill: 'bg-rose-50 text-rose-700'    },
};

// ── Main AppShell ────────────────────────────────────────
export default function AppShell({ 
  children, 
  role 
}: { 
  children: React.ReactNode; 
  role: 'candidate' | 'recruiter' | 'admin' | 'expert'; 
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();

  const isNonTech = user?.track === 'NON_TECHNICAL';
  let navGroups = isNonTech && role === 'candidate' ? nonTechCandidateNav : candidateNav;
  if (role === 'recruiter') navGroups = recruiterNav;
  if (role === 'admin')     navGroups = adminNav;
  if (role === 'expert')    navGroups = expertNav;

  const cfg = roleConfig[role];
  const userInitials = user
    ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase()
    : 'U';
  const userName = user ? `${user.firstName} ${user.lastName}` : 'Guest';

  return (
    <div className="flex h-screen overflow-hidden font-sans" style={{ background: '#F7F9FC' }}>

      {/* ── Mobile overlay ──────────────────────────────── */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 md:hidden"
          style={{ background: 'rgba(15,23,42,0.35)', backdropFilter: 'blur(4px)' }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ══════════════════════════════════════════════════
          SIDEBAR
      ═════════════════════════════════════════════════════ */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-50 md:z-auto
        w-[232px] flex flex-col shrink-0
        bg-white
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}
        style={{
          borderRight: '1px solid #E5EAF0',
          boxShadow: 'inset -1px 0 0 #E5EAF0',
        }}
      >
        {/* Logo row */}
        <div className="flex items-center gap-3 px-5 shrink-0" style={{ height: 58, borderBottom: '1px solid #F0F3F8' }}>
          <div className="w-[30px] h-[30px] rounded-[8px] flex items-center justify-center shrink-0"
            style={{ background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', boxShadow: '0 2px 8px rgba(37,99,235,0.35)' }}>
            <ShieldCheck className="w-[15px] h-[15px] text-white" strokeWidth={2.5} />
          </div>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.025em' }}>ProofHire</span>
          <button 
            className="ml-auto md:hidden p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Role pill */}
        <div className="px-4 py-2.5 shrink-0">
          <span className={`section-label rounded-md px-2 py-1 ${cfg.pill}`} style={{ fontSize: 10, letterSpacing: '0.06em' }}>
            {cfg.label} Portal
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 pb-4 overflow-y-auto custom-scrollbar" style={{ paddingTop: 4 }}>
          {navGroups.map((group, idx) => (
            <div key={idx} style={{ marginBottom: 20 }}>
              <p className="section-label px-2 mb-2">{group.group}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {group.items.map((item) => {
                  const isBase = ['/candidate', '/recruiter', '/admin', '/expert'].includes(item.path);
                  const isActive = isBase
                    ? location.pathname === item.path
                    : location.pathname === item.path || location.pathname.startsWith(item.path + '/');
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      to={item.path}
                      onClick={() => setSidebarOpen(false)}
                      className={`nav-link ${isActive ? 'active' : ''}`}
                    >
                      <Icon className="w-[15px] h-[15px] shrink-0" />
                      <span>{item.name}</span>
                      {isActive && (
                        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User footer */}
        <div className="shrink-0 p-3" style={{ borderTop: '1px solid #F0F3F8' }}>
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="w-full flex items-center gap-3 p-2.5 rounded-[10px] transition-colors text-left"
              style={{ background: userMenuOpen ? '#f1f5f9' : 'transparent' }}
              onMouseEnter={e => { if (!userMenuOpen) (e.currentTarget as HTMLButtonElement).style.background = '#f8fafc'; }}
              onMouseLeave={e => { if (!userMenuOpen) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
            >
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                style={{ background: `linear-gradient(135deg, ${cfg.accent} 0%, ${cfg.accent}cc 100%)`, boxShadow: `0 2px 6px ${cfg.accent}40` }}>
                {userInitials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-slate-800 truncate leading-tight" style={{ fontSize: 13, fontWeight: 600 }}>{userName}</p>
                <p className="text-slate-400 truncate capitalize" style={{ fontSize: 11 }}>{user?.role?.toLowerCase() ?? role}</p>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {userMenuOpen && (
              <div className="absolute bottom-full left-0 right-0 mb-2 rounded-xl p-1 z-10"
                style={{ background: '#fff', border: '1px solid #E5EAF0', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}>
                <button
                  onClick={() => { logout(); window.location.href = '/login'; }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors"
                  style={{ fontSize: 13, fontWeight: 500 }}
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* ══════════════════════════════════════════════════
          MAIN AREA
      ═════════════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* ── Topbar ──────────────────────────────────── */}
        <header className="shrink-0 flex items-center px-5 gap-4 z-10 bg-white"
          style={{ height: 58, borderBottom: '1px solid #E5EAF0', boxShadow: '0 1px 0 #F0F3F8' }}>
          
          {/* Mobile hamburger */}
          <button 
            className="md:hidden p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Search */}
          <div className="flex-1 max-w-[440px] hidden sm:block">
            <div className="relative">
              <Search className="w-[14px] h-[14px] text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={
                  role === 'recruiter'
                    ? 'Search candidates, skills...'
                    : 'Search challenges, proofs...'
                }
                className="w-full rounded-lg pl-9 pr-4 py-[7px] transition-all"
                style={{
                  background: '#F7F9FC',
                  border: '1px solid #E5EAF0',
                  fontSize: 13,
                  color: '#334155',
                  outline: 'none',
                }}
                onFocus={e => {
                  e.target.style.borderColor = '#93c5fd';
                  e.target.style.background = '#fff';
                  e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)';
                }}
                onBlur={e => {
                  e.target.style.borderColor = '#E5EAF0';
                  e.target.style.background = '#F7F9FC';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {/* ProofAI button */}
            <button className="hidden sm:flex items-center gap-1.5 px-3 py-[6px] rounded-lg transition-colors"
              style={{
                background: '#eff6ff',
                border: '1px solid #bfdbfe',
                color: '#2563eb',
                fontSize: 13,
                fontWeight: 600,
              }}>
              <Zap className="w-3.5 h-3.5" />
              Ask ProofAI
            </button>

            {/* Notifications */}
            <button className="relative p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors">
              <Bell className="w-[18px] h-[18px]" />
              <span className="absolute top-[7px] right-[7px] w-[8px] h-[8px] bg-red-500 rounded-full border-2 border-white" />
            </button>

            {/* User avatar + name */}
            <div className="flex items-center gap-2 pl-2 cursor-pointer group">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                style={{ background: `linear-gradient(135deg, ${cfg.accent} 0%, ${cfg.accent}cc 100%)`, boxShadow: `0 2px 6px ${cfg.accent}40` }}>
                {userInitials}
              </div>
              <div className="hidden md:block text-right">
                <p className="text-slate-800 leading-tight" style={{ fontSize: 13, fontWeight: 600 }}>{user?.firstName ?? 'User'}</p>
                <p className="text-slate-400 leading-tight capitalize" style={{ fontSize: 11 }}>{cfg.label}</p>
              </div>
              <ChevronDown className="hidden md:block w-3.5 h-3.5 text-slate-400" />
            </div>
          </div>
        </header>

        {/* ── Page content ────────────────────────────── */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden" style={{ background: '#F7F9FC' }}>
          <div className="page-enter">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
