import React, { useState, useEffect } from 'react';
import { Users, Bookmark, ArrowRight, Trash2, Loader2, AlertCircle, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../api/client';

interface ShortlistedCandidate {
  _id: string;
  candidate: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  job?: { title: string };
  notes?: string;
  addedAt: string;
  skills: string[];
  projectCount: number;
}

export default function RecruiterShortlists() {
  const [shortlist, setShortlist] = useState<ShortlistedCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const fetchShortlist = async () => {
    setLoading(true); setError(null);
    try {
      const res = await api.get('/recruiter/shortlists');
      setShortlist(res.data?.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load shortlist.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchShortlist(); }, []);

  const handleRemove = async (id: string) => {
    setRemovingId(id);
    try {
      await api.delete(`/recruiter/shortlists/${id}`);
      setShortlist(prev => prev.filter(s => s._id !== id));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to remove from shortlist.');
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out px-6 md:px-12 py-8 max-w-[1400px] mx-auto">

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-brand-600 font-bold text-xs uppercase tracking-widest mb-1">
            <Bookmark className="w-4 h-4" /> Curated Engineering Talent
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Talent Shortlists</h1>
          <p className="text-slate-500 text-sm mt-1">
            Engineers saved for team review, based on verified proof of work.
          </p>
        </div>
        {!loading && (
          <div className="bg-white border border-slate-200 rounded-lg px-4 py-2 flex items-center gap-2">
            <Users className="w-4 h-4 text-brand-600" />
            <span className="text-xs text-slate-500">Total Shortlisted:</span>
            <span className="text-sm font-bold text-slate-900">{shortlist.length} Candidates</span>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24">
          <Loader2 className="w-8 h-8 text-brand-500 animate-spin mb-3" />
          <p className="text-slate-500 text-sm">Loading shortlist...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white border border-red-500/20 rounded-2xl">
          <AlertCircle className="w-8 h-8 text-red-400 mb-3" />
          <p className="text-slate-900 font-bold mb-1">Failed to load shortlist</p>
          <p className="text-slate-500 text-sm mb-4">{error}</p>
          <button onClick={fetchShortlist} className="px-4 py-2 bg-brand-600 text-slate-900 text-sm font-bold rounded-lg">Retry</button>
        </div>
      ) : shortlist.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white border border-slate-200 rounded-2xl">
          <Bookmark className="w-12 h-12 text-slate-600 mb-4" />
          <p className="text-slate-900 font-bold mb-1">No candidates shortlisted yet</p>
          <p className="text-slate-500 text-sm mb-6">Browse talent and shortlist engineers that match your requirements.</p>
          <Link to="/recruiter/talent"
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-sm bg-white text-slate-900 hover:bg-slate-200 transition-colors">
            Discover Talent <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {shortlist.map(entry => (
            <div key={entry._id} className="bg-white border border-slate-200 rounded-2xl p-6 hover:border-slate-200 transition-colors group">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 border border-slate-600 flex items-center justify-center font-bold text-slate-900 text-lg shrink-0">
                    {entry.candidate?.firstName?.[0] || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="text-lg font-bold text-slate-900">
                        {entry.candidate?.firstName} {entry.candidate?.lastName}
                      </h3>
                      {entry.projectCount > 0 && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <ShieldCheck className="w-3 h-3" /> {entry.projectCount} Analyzed
                        </span>
                      )}
                    </div>
                    {entry.job && <p className="text-xs text-slate-500 mb-2">For: {entry.job.title}</p>}
                    {entry.notes && <p className="text-xs text-slate-500 italic mb-3">"{entry.notes}"</p>}
                    {entry.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {entry.skills.map((skill, i) => (
                          <span key={i} className="text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">{skill}</span>
                        ))}
                      </div>
                    )}
                    {entry.skills.length === 0 && (
                      <p className="text-xs text-slate-600 italic">No analyzed projects yet — capabilities pending.</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    to={`/recruiter/candidate/${entry.candidate?._id}`}
                    className="px-4 py-2 rounded-lg text-xs font-bold bg-white text-slate-900 hover:bg-slate-200 transition-colors flex items-center gap-1.5 opacity-0 group-hover:opacity-100"
                  >
                    View Profile <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                  <button
                    onClick={() => handleRemove(entry._id)}
                    disabled={removingId === entry._id}
                    className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-40"
                  >
                    {removingId === entry._id
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <Trash2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-200 text-xs text-slate-600">
                Added {new Date(entry.addedAt).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
