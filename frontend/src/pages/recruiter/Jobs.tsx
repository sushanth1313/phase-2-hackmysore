import React, { useState, useEffect } from 'react';
import { Briefcase, Plus, Users, CheckCircle2, MapPin, Clock, ArrowRight, X, Loader2, AlertCircle } from 'lucide-react';
import api from '../../api/client';

interface Job {
  _id: string;
  title: string;
  department?: string;
  location?: string;
  locationType: string;
  type: string;
  seniority: string;
  requiredSkills: string[];
  preferredSkills: string[];
  minCapabilitySignal: number;
  applicantCount: number;
  status: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'FILLED' | 'CLOSED';
  createdAt: string;
}

const defaultForm = {
  title: '',
  department: '',
  description: '',
  location: '',
  locationType: 'REMOTE',
  type: 'FULL_TIME',
  seniority: 'SENIOR',
  requiredSkills: '',
  preferredSkills: '',
  minCapabilitySignal: 0
};

export default function RecruiterJobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const fetchJobs = async () => {
    setLoading(true); setError(null);
    try {
      const res = await api.get('/recruiter/jobs');
      setJobs(res.data?.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load jobs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchJobs(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setSaveError(null);
    try {
      await api.post('/recruiter/jobs', {
        ...form,
        requiredSkills: form.requiredSkills.split(',').map(s => s.trim()).filter(Boolean),
        preferredSkills: form.preferredSkills.split(',').map(s => s.trim()).filter(Boolean),
      });
      setShowForm(false);
      setForm(defaultForm);
      fetchJobs();
    } catch (err: any) {
      setSaveError(err.response?.data?.message || 'Failed to create job.');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = async (id: string) => {
    try {
      await api.put(`/recruiter/jobs/${id}`, { status: 'CLOSED' });
      fetchJobs();
    } catch { /* ignore */ }
  };

  const statusColor: Record<string, string> = {
    ACTIVE: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    DRAFT: 'text-slate-500 bg-slate-100 border-slate-200',
    PAUSED: 'text-amber-600 bg-amber-50 border-amber-200',
    FILLED: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    CLOSED: 'text-slate-500 bg-slate-50 border-slate-200'
  };

  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out px-6 md:px-12 py-8 max-w-[1400px] mx-auto">

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-brand-600 font-bold text-xs uppercase tracking-widest mb-1">
            <Briefcase className="w-4 h-4" /> Hiring Opportunities
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Active Jobs</h1>
          <p className="text-slate-500 text-sm mt-1">Post positions and match them against verified engineering capabilities.</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-sm bg-white text-slate-900 hover:bg-slate-200 transition-colors"
        >
          <Plus className="w-4 h-4" /> Post Job
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24">
          <Loader2 className="w-8 h-8 text-brand-500 animate-spin mb-3" />
          <p className="text-slate-500 text-sm">Loading jobs...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white border border-red-500/20 rounded-2xl">
          <AlertCircle className="w-8 h-8 text-red-400 mb-3" />
          <p className="text-slate-900 font-bold mb-1">Failed to load jobs</p>
          <p className="text-slate-500 text-sm mb-4">{error}</p>
          <button onClick={fetchJobs} className="px-4 py-2 bg-brand-600 text-slate-900 text-sm font-bold rounded-lg">Retry</button>
        </div>
      ) : jobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white border border-slate-200 rounded-2xl">
          <Briefcase className="w-12 h-12 text-slate-600 mb-4" />
          <p className="text-slate-900 font-bold mb-1">No jobs posted yet</p>
          <p className="text-slate-500 text-sm mb-6">Post your first job to start matching against verified candidates.</p>
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-sm bg-white text-slate-900 hover:bg-slate-200 transition-colors">
            <Plus className="w-4 h-4" /> Post Your First Job
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.map(job => (
            <div key={job._id} className="bg-white border border-slate-200 rounded-2xl p-6 hover:border-slate-200 transition-colors">
              <div className="flex flex-col md:flex-row justify-between gap-4">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${statusColor[job.status]}`}>
                      {job.status}
                    </span>
                    <span className="text-xs text-slate-500">{job.seniority} · {job.type.replace('_', ' ')}</span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-1">{job.title}</h3>
                  {job.department && <p className="text-sm text-slate-500 mb-2">{job.department}</p>}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mb-4">
                    {job.location && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{job.location}</span>}
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{new Date(job.createdAt).toLocaleDateString()}</span>
                    <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{job.applicantCount} applicants</span>
                  </div>
                  {job.requiredSkills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {job.requiredSkills.map((skill, i) => (
                        <span key={i} className="text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">{skill}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2 shrink-0 justify-start">
                  {job.status === 'ACTIVE' && (
                    <button
                      onClick={() => handleClose(job._id)}
                      className="px-4 py-2 rounded-lg text-xs font-bold border border-slate-200 text-slate-500 hover:text-slate-900 hover:border-slate-600 transition-colors"
                    >
                      Close Job
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Job Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full p-6 shadow-2xl my-8">
            <div className="flex justify-between items-start mb-6">
              <div>
                <span className="text-[10px] font-bold text-brand-600 uppercase tracking-widest">New Opportunity</span>
                <h2 className="text-xl font-bold text-slate-900">Post a Job</h2>
              </div>
              <button onClick={() => setShowForm(false)} className="text-slate-500 hover:text-slate-900 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Job Title *</label>
                  <input required value={form.title} onChange={e => setForm({...form, title: e.target.value})}
                    placeholder="e.g. Senior Backend Engineer" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-brand-500" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Department</label>
                  <input value={form.department} onChange={e => setForm({...form, department: e.target.value})}
                    placeholder="e.g. Platform Engineering" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-brand-500" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Location</label>
                  <input value={form.location} onChange={e => setForm({...form, location: e.target.value})}
                    placeholder="e.g. Remote, New York" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-brand-500" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Seniority</label>
                  <select value={form.seniority} onChange={e => setForm({...form, seniority: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-brand-500">
                    {['JUNIOR','MID','SENIOR','LEAD','STAFF','PRINCIPAL'].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Work Type</label>
                  <select value={form.locationType} onChange={e => setForm({...form, locationType: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-brand-500">
                    {['REMOTE','HYBRID','ONSITE'].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Description *</label>
                  <textarea required value={form.description} onChange={e => setForm({...form, description: e.target.value})}
                    rows={4} placeholder="Role responsibilities, team context, mission..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-brand-500 resize-none" />
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Required Skills (comma-separated)</label>
                  <input value={form.requiredSkills} onChange={e => setForm({...form, requiredSkills: e.target.value})}
                    placeholder="Go, Kafka, PostgreSQL, Kubernetes" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-brand-500" />
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Preferred Skills (comma-separated)</label>
                  <input value={form.preferredSkills} onChange={e => setForm({...form, preferredSkills: e.target.value})}
                    placeholder="Rust, gRPC, Terraform" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-brand-500" />
                </div>
              </div>

              {saveError && (
                <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />{saveError}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg text-xs font-bold text-slate-500 hover:text-slate-900">Cancel</button>
                <button type="submit" disabled={saving}
                  className="px-5 py-2 rounded-lg text-xs font-bold bg-white text-slate-900 hover:bg-slate-200 disabled:opacity-60 flex items-center gap-2 transition-colors">
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  {saving ? 'Posting...' : 'Post Job'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
