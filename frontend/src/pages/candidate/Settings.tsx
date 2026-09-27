import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, User, Bell, Check, Save, Loader2, AlertCircle 
} from 'lucide-react';
import { GithubIcon } from '../../components/ui/icons/GithubIcon';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';

export default function StudentSettings() {
  const { user } = useAuth();
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [email] = useState(user?.email || '');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [githubConnected, setGithubConnected] = useState(true);
  const [notifyOnReview, setNotifyOnReview] = useState(true);
  const [notifyOnRecruiterInquiry, setNotifyOnRecruiterInquiry] = useState(true);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError('');
      const res = await api.put('/candidate/profile', { firstName, lastName });
      if (res.data?.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out px-6 md:px-12 py-8 max-w-[1000px] mx-auto">
      
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-brand-600 font-bold text-xs uppercase tracking-widest mb-1">
          <SettingsIcon className="w-4 h-4" /> Account Configuration
        </div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Profile & Security Settings</h1>
        <p className="text-slate-500 text-sm mt-1">
          Manage your verified developer profile, proof-of-work integrations, and platform credentials.
        </p>
      </div>

      {saved && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-500/30 text-emerald-600 flex items-center gap-3 text-sm">
          <Check className="w-5 h-5 shrink-0" />
          <span>Profile settings successfully saved and updated in the database!</span>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-500/30 text-rose-600 flex items-center gap-3 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-8">
        
        {/* Profile Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8">
          <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
            <User className="w-5 h-5 text-brand-600" /> Personal Information
          </h2>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  First Name
                </label>
                <input 
                  type="text" 
                  value={firstName} 
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  placeholder="Enter first name"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-brand-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Last Name
                </label>
                <input 
                  type="text" 
                  value={lastName} 
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Enter last name"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Email Address (Read-only)
              </label>
              <input 
                type="email" 
                value={email} 
                disabled 
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-500 cursor-not-allowed"
              />
            </div>

            <div className="pt-2">
              <button 
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 rounded-lg font-bold bg-brand-600 hover:bg-brand-500 text-white transition-all flex items-center gap-2 text-xs disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </form>
        </div>

        {/* Connected Accounts */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8">
          <h2 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
            <GithubIcon className="w-5 h-5 text-brand-600" /> Evidence Integrations
          </h2>
          <p className="text-xs text-slate-500 mb-6">
            Connect repositories to power automated code analysis, git commit verification, and architectural review signals.
          </p>

          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-slate-100 text-slate-900">
                <GithubIcon className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">GitHub Integration</h4>
                <p className="text-xs text-slate-500">
                  {githubConnected ? 'Connected to verified developer account' : 'No repository connected'}
                </p>
              </div>
            </div>

            <button 
              onClick={() => setGithubConnected(!githubConnected)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                githubConnected 
                  ? 'border-emerald-500/30 text-emerald-600 bg-emerald-50 hover:bg-emerald-500/20' 
                  : 'border-brand-200 text-brand-600 bg-brand-50 hover:bg-brand-50'
              }`}
            >
              {githubConnected ? 'Connected ✓' : 'Connect GitHub'}
            </button>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8">
          <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
            <Bell className="w-5 h-5 text-brand-600" /> Alert Preferences
          </h2>

          <div className="space-y-4">
            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
              <span className="text-sm text-slate-600 font-medium">Recruiter job offers & technical inquiries</span>
              <input 
                type="checkbox" 
                checked={notifyOnRecruiterInquiry} 
                onChange={(e) => setNotifyOnRecruiterInquiry(e.target.checked)}
                className="w-4 h-4 accent-brand-500 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
              <span className="text-sm text-slate-600 font-medium">Peer code reviews and architecture evaluations</span>
              <input 
                type="checkbox" 
                checked={notifyOnReview} 
                onChange={(e) => setNotifyOnReview(e.target.checked)}
                className="w-4 h-4 accent-brand-500 cursor-pointer"
              />
            </label>
          </div>
        </div>

      </div>

    </div>
  );
}
