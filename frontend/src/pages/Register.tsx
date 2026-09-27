import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Mail, Lock, User, Briefcase, Eye, EyeOff, ArrowRight } from 'lucide-react';

export default function Register() {
  const [firstName, setFirstName] = useState('');
  const [lastName,  setLastName]  = useState('');
  const [email,     setEmail]     = useState('');
  const [password,  setPassword]  = useState('');
  const [showPass,  setShowPass]  = useState(false);
  const [role,      setRole]      = useState('CANDIDATE');
  const [track,     setTrack]     = useState('TECHNICAL');
  const [error,     setError]     = useState('');
  const [loading,   setLoading]   = useState(false);

  const { login } = useAuth();
  const navigate  = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/register', {
        firstName,
        lastName,
        email,
        password,
        role,
        ...(role === 'CANDIDATE' ? { track } : {}),
      });
      if (res.data.success) {
        login(res.data.data);
        const r = res.data.data.role;
        if (r === 'RECRUITER') navigate('/recruiter');
        else if (r === 'EXPERT') navigate('/expert');
        else navigate('/candidate');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  const roleOptions = [
    { value: 'CANDIDATE', label: 'Candidate / Talent', sub: 'Showcase your work' },
    { value: 'RECRUITER', label: 'Recruiter / Employer', sub: 'Find verified talent' },
    { value: 'EXPERT',    label: 'Reviewer / Expert', sub: 'Evaluate submissions' },
  ];

  return (
    <div className="min-h-screen bg-[#F4F7FB] flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-[480px]">
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center shadow-sm">
            <ShieldCheck className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-[20px] font-bold text-slate-900 tracking-tight">ProofHire</span>
        </div>
        <h2 className="mt-2 text-center text-[24px] font-semibold text-slate-900 tracking-tight">
          Create your account
        </h2>
        <p className="mt-2 text-center text-[14px] text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500 transition-colors">
            Sign in
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-[480px]">
        <div className="bg-white py-8 px-4 shadow-sm border border-slate-200 sm:rounded-xl sm:px-10">
          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-[13px] flex items-start gap-2">
              <div className="w-4 h-4 rounded-full bg-red-200 flex items-center justify-center mt-0.5 shrink-0 text-red-600 font-bold text-[10px]">!</div>
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-5">
            {/* Name row */}
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-[13px] font-medium text-slate-700 mb-1.5">First name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    required
                    className="w-full bg-white border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-[14px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                    placeholder="John"
                  />
                </div>
              </div>
              <div className="flex-1">
                <label className="block text-[13px] font-medium text-slate-700 mb-1.5">Last name</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  required
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-[14px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  placeholder="Doe"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-[13px] font-medium text-slate-700 mb-1.5">Email address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="w-full bg-white border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-[14px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-[13px] font-medium text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="w-full bg-white border border-slate-300 rounded-lg pl-9 pr-10 py-2 text-[14px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  placeholder="Min. 8 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Role */}
            <div>
              <label className="block text-[13px] font-medium text-slate-700 mb-2">I am a...</label>
              <div className="space-y-2">
                {roleOptions.map(opt => (
                  <label
                    key={opt.value}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      role === opt.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={opt.value}
                      checked={role === opt.value}
                      onChange={() => setRole(opt.value)}
                      className="accent-blue-600 w-4 h-4 shrink-0"
                    />
                    <div>
                      <p className={`text-[13px] font-medium ${role === opt.value ? 'text-blue-900' : 'text-slate-900'}`}>
                        {opt.label}
                      </p>
                      <p className={`text-[12px] ${role === opt.value ? 'text-blue-700' : 'text-slate-500'}`}>
                        {opt.sub}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Track (candidates only) */}
            {role === 'CANDIDATE' && (
              <div>
                <label className="block text-[13px] font-medium text-slate-700 mb-1.5">Your track</label>
                <div className="relative">
                  <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <select
                    value={track}
                    onChange={e => setTrack(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg pl-9 pr-8 py-2 text-[14px] text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors appearance-none cursor-pointer"
                  >
                    <option value="TECHNICAL">Technical (Developer, Data, DevOps...)</option>
                    <option value="NON_TECHNICAL">Non-Technical (PM, Design, Analytics...)</option>
                  </select>
                </div>
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-[14px] font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    Creating account...
                  </span>
                ) : (
                  <>Create account <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </div>
          </form>

          <p className="mt-6 text-center text-[12px] text-slate-500">
            By signing up you agree to our{' '}
            <a href="#" className="font-medium text-slate-600 hover:text-slate-900 underline">Terms of Service</a>
            {' '}and{' '}
            <a href="#" className="font-medium text-slate-600 hover:text-slate-900 underline">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  );
}
