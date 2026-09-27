import React, { useState } from 'react';
import { Settings as SettingsIcon, Building, Link2, Check, Save, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';

export default function RecruiterSettings() {
  const { user } = useAuth();
  const [orgName, setOrgName] = useState(user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'Acme Engineering');
  const [hiringDomain, setHiringDomain] = useState('Distributed Systems & Full Stack Infrastructure');
  const [greenhouseLinked, setGreenhouseLinked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError('');
      // Update profile
      const parts = orgName.split(' ');
      const firstName = parts[0] || 'Recruiter';
      const lastName = parts.slice(1).join(' ') || '';

      const res = await api.put('/candidate/profile', { firstName, lastName });
      if (res.data?.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out px-6 md:px-12 py-8 max-w-[1000px] mx-auto">
      
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-brand-400 font-bold text-xs uppercase tracking-widest mb-1">
          <SettingsIcon className="w-4 h-4" /> Recruiter Workspace Settings
        </div>
        <h1 className="text-3xl font-black text-white tracking-tight">Organization & Workspace Configuration</h1>
        <p className="text-slate-400 text-sm mt-1">
          Configure hiring criteria, verified evidence sync, and recruiter profile settings.
        </p>
      </div>

      {saved && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-3 text-sm">
          <Check className="w-5 h-5 shrink-0" />
          <span>Organization settings successfully saved and updated!</span>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center gap-3 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-8">
        
        {/* Organization Information */}
        <div className="bg-[#0D1322] border border-slate-800/80 rounded-2xl p-6 sm:p-8">
          <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <Building className="w-5 h-5 text-brand-400" /> Company Profile
          </h2>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Company / Recruiter Name
                </label>
                <input 
                  type="text" 
                  value={orgName} 
                  onChange={(e) => setOrgName(e.target.value)}
                  required
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Primary Engineering Domain
                </label>
                <input 
                  type="text" 
                  value={hiringDomain} 
                  onChange={(e) => setHiringDomain(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Recruiter Admin Email (Read-only)
              </label>
              <input 
                type="email" 
                value={user?.email || ''} 
                disabled 
                className="w-full bg-slate-900/50 border border-slate-800/80 rounded-lg px-3.5 py-2.5 text-sm text-slate-500 cursor-not-allowed"
              />
            </div>

            <div className="pt-2">
              <button 
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 rounded-lg font-bold bg-brand-600 hover:bg-brand-500 text-white transition-all flex items-center gap-2 text-xs cursor-pointer disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? 'Saving...' : 'Save Configuration'}
              </button>
            </div>
          </form>
        </div>

        {/* ATS Integrations */}
        <div className="bg-[#0D1322] border border-slate-800/80 rounded-2xl p-6 sm:p-8">
          <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
            <Link2 className="w-5 h-5 text-brand-400" /> ATS Pipeline Webhooks
          </h2>
          <p className="text-xs text-slate-400 mb-6">
            Export shortlisted candidates with verified technical capabilities directly into your ATS pipeline.
          </p>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <div>
                <h4 className="text-sm font-bold text-white">Greenhouse Integration</h4>
                <p className="text-xs text-slate-400">Push verified proof dossiers into Greenhouse candidate cards</p>
              </div>
              <button 
                type="button"
                onClick={() => setGreenhouseLinked(!greenhouseLinked)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                  greenhouseLinked 
                    ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10' 
                    : 'border-slate-700 text-slate-300 bg-slate-800 hover:bg-slate-700'
                }`}
              >
                {greenhouseLinked ? 'Connected ✓' : 'Connect'}
              </button>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
