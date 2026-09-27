import { Users, Code2, TrendingUp, Search, Activity, ChevronRight, CheckCircle2, Loader2, Briefcase, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import api from '../../api/client';

export default function RecruiterDashboard() {
  const [stats, setStats] = useState({
    activeCandidates: 0,
    newSubmissions: 0,
    shortlisted: 0,
    avgSignal: 0,
    recentActivity: [] as any[],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/recruiter/dashboard');
        if (res.data?.success) setStats(res.data.data);
      } catch (err) {
        console.error('Failed to fetch recruiter dashboard stats', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
        <p className="text-slate-500 text-[14px]">Loading recruiter overview...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      
      {/* Page header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-[28px] font-semibold text-slate-900 tracking-tight">Recruiter Overview</h1>
          <p className="text-slate-500 text-[15px] mt-1">
            Your pipeline of engineers, verified by actual proof of work.
          </p>
        </div>
        <Link to="/recruiter/talent" className="btn btn-primary self-start md:self-auto">
          <Search className="w-4 h-4" /> Discover Talent
        </Link>
      </div>

      <div className="space-y-10">

        {/* Metric summary (No cards, just dividers) */}
        <section>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-4">
            <div className="border-l-2 border-blue-200 pl-4">
              <p className="text-[13px] font-medium text-slate-500 mb-1">Active Candidates</p>
              <div className="text-3xl font-semibold text-slate-900">{stats.activeCandidates}</div>
              <p className="text-[12px] text-slate-400 mt-1">With verified proof of work</p>
            </div>
            <div className="border-l-2 border-slate-200 pl-4">
              <p className="text-[13px] font-medium text-slate-500 mb-1">New Submissions</p>
              <div className="text-3xl font-semibold text-slate-900">{stats.newSubmissions}</div>
              <p className="text-[12px] text-slate-400 mt-1">Platform-wide projects</p>
            </div>
            <div className="border-l-2 border-slate-200 pl-4">
              <p className="text-[13px] font-medium text-slate-500 mb-1">Shortlisted</p>
              <div className="text-3xl font-semibold text-slate-900">{stats.shortlisted}</div>
              <p className="text-[12px] text-slate-400 mt-1">Across active campaigns</p>
            </div>
            <div className="border-l-2 border-slate-200 pl-4">
              <p className="text-[13px] font-medium text-slate-500 mb-1">Avg Capability Signal</p>
              <div className="text-3xl font-semibold text-slate-900">{stats.avgSignal}</div>
              <p className="text-[12px] text-slate-400 mt-1">Platform average score</p>
            </div>
          </div>
        </section>

        {/* Quick actions using clean panel layout */}
        <section>
          <h2 className="text-[15px] font-semibold text-slate-900 mb-4 pb-2 border-b border-slate-200">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: 'Search Candidates',  to: '/recruiter/talent',    icon: Search,   color: 'text-blue-600',   bg: 'bg-blue-50',   desc: 'Filter by skills & score' },
              { label: 'Manage Jobs',        to: '/recruiter/jobs',      icon: Briefcase,color: 'text-violet-600', bg: 'bg-violet-50', desc: 'Post and manage listings' },
              { label: 'Hiring Pipeline',    to: '/recruiter/pipeline',  icon: Activity, color: 'text-emerald-600',bg: 'bg-emerald-50',desc: 'Track application stages' },
            ].map(({ label, to, icon: Icon, color, bg, desc }) => (
              <Link
                key={label}
                to={to}
                className="flex items-start gap-4 p-4 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200"
              >
                <div className={`w-10 h-10 ${bg} rounded-lg flex items-center justify-center shrink-0`}>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <div>
                  <p className="font-medium text-slate-900 text-[14px]">{label}</p>
                  <p className="text-[13px] text-slate-500 mt-0.5">{desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Live Talent Signals */}
        <section>
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-200">
            <h2 className="text-[15px] font-semibold text-slate-900">Live Talent Signals</h2>
            <Link to="/recruiter/talent" className="text-[13px] font-medium text-blue-600 hover:text-blue-700">View all</Link>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            {stats.recentActivity.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                <Users className="w-8 h-8 text-slate-300 mb-3" />
                <p className="text-slate-900 font-medium text-[15px] mb-1">No activity yet</p>
                <p className="text-slate-500 text-[14px]">
                  Talent signals will appear here as candidates submit projects and complete challenges.
                </p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-5 py-3 text-[12px] font-medium text-slate-500">Candidate</th>
                    <th className="px-5 py-3 text-[12px] font-medium text-slate-500">Signal Event</th>
                    <th className="px-5 py-3 text-[12px] font-medium text-slate-500">Date</th>
                    <th className="px-5 py-3 text-[12px] font-medium text-slate-500"></th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentActivity.map((activity, i) => (
                    <tr key={i} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors group">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 text-xs font-semibold shrink-0">
                            {activity.name?.[0] ?? 'C'}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900 text-[14px]">{activity.name}</p>
                            <p className="text-[12px] text-slate-500">Backend Engineer</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5 text-[14px] font-medium text-slate-900">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                          Profile Created
                        </div>
                        <p className="text-[12px] text-slate-500 mt-0.5">Platform Sign-Up</p>
                      </td>
                      <td className="px-5 py-4 text-[13px] text-slate-600">
                        {new Date(activity.time).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button className="text-[13px] font-medium text-blue-600 hover:text-blue-700 opacity-0 group-hover:opacity-100 transition-opacity">
                          View Passport →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
