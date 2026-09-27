import React from 'react';
import { ShieldCheck, Users, Code2, AlertTriangle, Activity, Database, CheckCircle2 } from 'lucide-react';

export default function AdminDashboard() {
  const metrics = [
    { label: 'Active Candidates', value: '1,420', change: '+12% this week', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Verified Proofs', value: '4,890', change: '+240 today', icon: Code2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Integrity Consensus', value: '99.98%', change: '0 invalidations', icon: ShieldCheck, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Flagged Submissions', value: '3', change: 'Under manual review', icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50' }
  ];

  const recentEvents = [
    { type: 'PASS_GEN', desc: 'Cryptographic Passport minted for PH-USR-9921', time: '4m ago', status: 'SUCCESS' },
    { type: 'PROOF_VERIFIED', desc: 'In-Memory Cache benchmark verified by node cluster 4', time: '12m ago', status: 'SUCCESS' },
    { type: 'AUDIT_ALERT', desc: 'High LLM stylistic indicator (74%) on candidate resume', time: '28m ago', status: 'REVIEW' },
    { type: 'USER_REGISTER', desc: 'New recruiter onboarded: Acme Platform Infrastructure', time: '1h ago', status: 'SUCCESS' }
  ];

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      
      {/* Header */}
      <div className="mb-8 border-b border-slate-200 pb-6">
        <div className="flex items-center gap-2 text-slate-500 font-semibold text-[11px] uppercase tracking-widest mb-1.5">
          <ShieldCheck className="w-3.5 h-3.5" /> Platform Integrity & Security Core
        </div>
        <h1 className="text-[28px] font-semibold text-slate-900 tracking-tight">Integrity Control Center</h1>
        <p className="text-slate-500 text-[15px] mt-1 max-w-2xl">
          Real-time consensus telemetry, cryptographic proof verification status, and platform audit trails.
        </p>
      </div>

      <div className="space-y-10">
        {/* Metrics Grid */}
        <section>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-4">
            {metrics.map((m, idx) => {
              const Icon = m.icon;
              return (
                <div key={idx} className="border-l-2 border-slate-200 pl-4 hover:border-slate-300 transition-colors">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className={`w-4 h-4 ${m.color}`} />
                    <span className="text-[13px] font-medium text-slate-500 uppercase tracking-wider">{m.label}</span>
                  </div>
                  <div className="text-3xl font-semibold text-slate-900 font-mono tracking-tight">{m.value}</div>
                  <div className="text-[12px] text-slate-500 mt-1">{m.change}</div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Event Stream */}
        <section>
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-200">
            <h2 className="text-[15px] font-semibold text-slate-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-500" /> Platform Security & Verification Stream
            </h2>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-5 py-3 text-[12px] font-medium text-slate-500">Event Type</th>
                  <th className="px-5 py-3 text-[12px] font-medium text-slate-500">Description</th>
                  <th className="px-5 py-3 text-[12px] font-medium text-slate-500 text-right">Time</th>
                </tr>
              </thead>
              <tbody>
                {recentEvents.map((ev, idx) => (
                  <tr key={idx} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-4">
                      <span className={`text-[11px] font-mono font-medium px-2 py-0.5 rounded ${
                        ev.status === 'SUCCESS' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {ev.type}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-[14px] text-slate-900 font-medium">{ev.desc}</span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span className="text-[12px] font-mono text-slate-500">{ev.time}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

    </div>
  );
}
