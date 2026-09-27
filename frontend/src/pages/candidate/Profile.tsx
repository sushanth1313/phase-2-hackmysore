import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  User, Code2, Award, Shield, Edit2, Save, X, Loader2, AlertCircle, 
  CheckCircle2, Globe, Mail, MapPin, Phone, ShieldCheck, FileText, 
  BrainCircuit, Terminal, ExternalLink, Briefcase, Clock, Star, 
  Plus, Trash2, Camera, Sparkles
} from 'lucide-react';
import { GithubIcon } from '../../components/ui/icons/GithubIcon';
import { LinkedinIcon } from '../../components/ui/icons/LinkedinIcon';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';

interface IdentityData {
  fullName: string;
  firstName: string;
  lastName: string;
  email: string;
  profilePhoto: string;
  headline: string;
  location: string;
  phone: string;
  bio: string;
  links: {
    github: string;
    linkedin: string;
    portfolio: string;
  };
}

interface EducationItem {
  institution: string;
  degree: string;
  field: string;
  year?: string;
  description?: string;
}

interface ExperienceItem {
  title: string;
  company: string;
  location?: string;
  duration?: string;
  description?: string;
}

interface CareerData {
  careerArea?: string;
  currentStatus: string;
  targetRole: string;
  preferredRoles: string[];
  preferredDomains: string[];
  experienceLevel: string;
  availability: string;
}

interface VerifiedSkill {
  name: string;
  confidence: number;
  evidence: string;
  type: string;
  verificationStatus: string;
}

interface ProjectData {
  _id: string;
  name: string;
  description: string;
  techStack: string[];
  detectedTech: string[];
  githubUrl?: string;
  demoUrl?: string;
  verificationStatus: string;
  analysisStatus: string;
  overallScore: number | null;
  scoreBreakdown?: any;
  evidenceCount: number;
  createdAt: string;
}

interface ResumeData {
  _id: string;
  fileName: string;
  uploadDate: string;
  analysisStatus: string;
  atsScore: number | null;
  scoreBreakdown?: {
    atsCompatibility?: number;
    skillsRelevance?: number;
    experience?: number;
    projects?: number;
    clarityAndStructure?: number;
  };
  analysisDate: string;
  aiAssistanceSignal: string;
  aiAssistanceSignals?: any;
  analysisUrl: string;
}

interface PracticeData {
  hasSubmissions: boolean;
  problemsSolved: number;
  breakdown: {
    easy: number;
    medium: number;
    hard: number;
  };
  languagesUsed: string[];
  topics: string[];
  accuracy: number;
  recentSubmissions: Array<{
    _id: string;
    challengeTitle: string;
    difficulty: string;
    language: string;
    status: string;
    passedTests: number;
    totalTests: number;
    executionTimeMs: number;
    submittedAt: string;
  }>;
}

interface AIInterviewData {
  hasInterviews: boolean;
  interviewsCompleted: number;
  totalSessions: number;
  averageScore: number | null;
  domains: string[];
  languages: string[];
  recentInterview?: {
    _id: string;
    focus: string;
    language: string;
    status: string;
    score: number | null;
    startedAt: string;
    completedAt?: string;
  } | null;
  latestStatus: string;
}

interface ReviewData {
  _id: string;
  reviewerName: string;
  reviewerRole: string;
  projectName: string;
  overallRating: number;
  comments: string;
  verificationStatus: string;
  createdAt: string;
}

interface CapabilitySummary {
  verifiedSkillsCount: number;
  claimedSkillsCount: number;
  verifiedProjectsCount: number;
  totalProjectsCount: number;
  practiceSolvedCount: number;
  interviewsCompletedCount: number;
  reviewsCount: number;
}

interface ProfilePayload {
  identity: IdentityData;
  career: CareerData;
  education?: EducationItem[];
  experience?: ExperienceItem[];
  skills: {
    claimed: string[];
    verified: VerifiedSkill[];
    otherDetectedSkills?: string[];
  };
  projects: ProjectData[];
  proofOfWork?: any[];
  resume: ResumeData | null;
  technicalPractice?: PracticeData | null;
  aiInterview: AIInterviewData;
  reviews: ReviewData[];
  capabilitySummary: CapabilitySummary;
}

export default function CandidateProfile() {
  const { user } = useAuth();
  const isNonTech = user?.track === 'NON_TECHNICAL';
  const [data, setData] = useState<ProfilePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit Form State
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    headline: '',
    bio: '',
    location: '',
    phone: '',
    github: '',
    linkedin: '',
    portfolio: '',
    careerArea: '',
    currentStatus: 'Actively Looking',
    targetRole: '',
    experienceLevel: 'Mid-Senior (3-5 years)',
    availability: 'Immediately',
    preferredDomainsInput: '',
    claimedSkills: [] as string[],
    newSkillInput: '',
    education: [] as EducationItem[],
    experience: [] as ExperienceItem[],
    newEdu: { institution: '', degree: '', field: '', year: '', description: '' },
    newExp: { title: '', company: '', location: '', duration: '', description: '' }
  });

  const fetchProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/candidate/profile');
      if (res.data?.success && res.data?.data) {
        const payload: ProfilePayload = res.data.data;
        setData(payload);
        populateForm(payload);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load profile.');
    } finally {
      setLoading(false);
    }
  };

  const populateForm = (payload: ProfilePayload) => {
    const id = payload.identity;
    const car = payload.career;
    setForm({
      firstName: id.firstName || '',
      lastName: id.lastName || '',
      headline: id.headline || '',
      bio: id.bio || '',
      location: id.location || '',
      phone: id.phone || '',
      github: id.links?.github || '',
      linkedin: id.links?.linkedin || '',
      portfolio: id.links?.portfolio || '',
      careerArea: car.careerArea || (user?.careerArea || ''),
      currentStatus: car.currentStatus || 'Actively Looking',
      targetRole: car.targetRole || '',
      experienceLevel: car.experienceLevel || 'Mid-Senior (3-5 years)',
      availability: car.availability || 'Immediately',
      preferredDomainsInput: (car.preferredDomains || []).join(', '),
      claimedSkills: payload.skills.claimed || [],
      newSkillInput: '',
      education: payload.education || [],
      experience: payload.experience || [],
      newEdu: { institution: '', degree: '', field: '', year: '', description: '' },
      newExp: { title: '', company: '', location: '', duration: '', description: '' }
    });
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const domains = form.preferredDomainsInput
        .split(',')
        .map(d => d.trim())
        .filter(Boolean);

      const updates: any = {
        firstName: form.firstName,
        lastName: form.lastName,
        headline: form.headline,
        bio: form.bio,
        location: form.location,
        phone: form.phone,
        github: form.github,
        linkedin: form.linkedin,
        portfolio: form.portfolio,
        careerArea: form.careerArea,
        currentStatus: form.currentStatus,
        targetRole: form.targetRole,
        experienceLevel: form.experienceLevel,
        availability: form.availability,
        preferredDomains: domains,
        claimedSkills: form.claimedSkills,
        education: form.education,
        experience: form.experience
      };

      const res = await api.patch('/candidate/profile', updates);
      if (res.data?.success) {
        setSaveSuccess(true);
        setEditing(false);
        await fetchProfile();
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (data) {
      populateForm(data);
    }
    setEditing(false);
  };

  const handleAddSkill = () => {
    const trimmed = form.newSkillInput.trim();
    if (trimmed && !form.claimedSkills.includes(trimmed)) {
      setForm(prev => ({
        ...prev,
        claimedSkills: [...prev.claimedSkills, trimmed],
        newSkillInput: ''
      }));
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setForm(prev => ({
      ...prev,
      claimedSkills: prev.claimedSkills.filter(s => s !== skillToRemove)
    }));
  };

  const handleAddEducation = () => {
    if (form.newEdu.institution.trim() && form.newEdu.degree.trim()) {
      setForm(prev => ({
        ...prev,
        education: [...prev.education, { ...prev.newEdu }],
        newEdu: { institution: '', degree: '', field: '', year: '', description: '' }
      }));
    }
  };

  const handleRemoveEducation = (index: number) => {
    setForm(prev => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index)
    }));
  };

  const handleAddExperience = () => {
    if (form.newExp.title.trim() && form.newExp.company.trim()) {
      setForm(prev => ({
        ...prev,
        experience: [...prev.experience, { ...prev.newExp }],
        newExp: { title: '', company: '', location: '', duration: '', description: '' }
      }));
    }
  };

  const handleRemoveExperience = (index: number) => {
    setForm(prev => ({
      ...prev,
      experience: prev.experience.filter((_, i) => i !== index)
    }));
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoUploading(true);
    setPhotoError(null);
    try {
      const formData = new FormData();
      formData.append('photo', file);

      const res = await api.post('/candidate/profile/photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data?.success) {
        await fetchProfile();
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err: any) {
      setPhotoError(err.response?.data?.message || 'Failed to upload photo. Ensure storage directory is configured.');
    } finally {
      setPhotoUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 min-h-[60vh]">
        <Loader2 className="w-10 h-10 text-brand-500 animate-spin mb-4" />
        <p className="text-slate-500 text-sm font-medium">Loading candidate profile from database...</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex flex-col items-center justify-center py-24 m-8 bg-white border border-red-500/20 rounded-2xl">
        <AlertCircle className="w-10 h-10 text-red-400 mb-3" />
        <p className="text-slate-900 font-bold text-lg mb-1">Failed to load candidate profile</p>
        <p className="text-slate-500 text-sm mb-4">{error}</p>
        <button onClick={fetchProfile} className="px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white text-sm font-bold rounded-lg transition-colors">
          Retry
        </button>
      </div>
    );
  }

  const identity = data!.identity;
  const career = data!.career;
  const skills = data!.skills;
  const projects = data!.projects;
  const resume = data!.resume;
  const technicalPractice = data!.technicalPractice;
  const aiInterview = data!.aiInterview;
  const reviews = data!.reviews;
  const cap = data!.capabilitySummary;

  const photoSrc = identity.profilePhoto 
    ? (identity.profilePhoto.startsWith('http') ? identity.profilePhoto : `http://localhost:8080${identity.profilePhoto}`)
    : null;

  return (
    <div className="w-full animate-in fade-in duration-500 px-6 md:px-12 py-8 max-w-[1440px] mx-auto space-y-8">
      {/* Toast Notification */}
      {saveSuccess && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-500 text-slate-900 px-5 py-3 rounded-xl font-bold shadow-xl flex items-center gap-2 animate-in slide-in-from-right">
          <CheckCircle2 className="w-5 h-5" /> Changes saved to MongoDB
        </div>
      )}

      {/* Header & Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2 text-brand-600 font-bold text-xs uppercase tracking-widest mb-1.5">
            <User className="w-4 h-4" /> Real Candidate Profile
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            {editing ? 'Edit Candidate Profile' : identity.fullName || 'Candidate Profile'}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {identity.headline || career.targetRole || (isNonTech ? 'Marketing & Business Strategy' : 'Software Engineer')} · {identity.email}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {editing ? (
            <>
              <button
                onClick={handleCancel}
                disabled={saving}
                className="px-4 py-2 rounded-lg text-sm font-bold text-slate-500 hover:text-slate-900 border border-slate-200 hover:border-slate-500 transition-colors flex items-center gap-1.5"
              >
                <X className="w-4 h-4" /> Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-5 py-2 rounded-lg text-sm font-bold bg-brand-600 hover:bg-brand-500 text-white transition-colors flex items-center gap-1.5 disabled:opacity-60 shadow-lg shadow-brand-500/20"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? 'Saving...' : 'Save Profile'}
              </button>
            </>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="px-5 py-2 rounded-lg text-sm font-bold bg-slate-100 hover:bg-slate-700 text-slate-700 border border-slate-200 transition-colors flex items-center gap-1.5"
            >
              <Edit2 className="w-4 h-4" /> Edit Profile
            </button>
          )}
        </div>
      </div>

      {photoError && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {photoError}
        </div>
      )}

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: Identity, Career & Capability Summary (4 cols) */}
        <div className="lg:col-span-4 space-y-6">

          {/* 1. IDENTITY CARD */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 relative overflow-hidden">
            <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
              {/* Profile Photo */}
              <div className="relative group shrink-0">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-500/20 to-brand-700/20 border border-brand-200 flex items-center justify-center overflow-hidden">
                  {photoSrc ? (
                    <img src={photoSrc} alt={identity.fullName} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-3xl font-black text-brand-600">
                      {(identity.firstName || 'C')[0]?.toUpperCase()}
                    </span>
                  )}
                </div>
                {/* Upload Photo Button Overlay */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={photoUploading}
                  className="absolute inset-0 bg-black/60 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-slate-900 text-[10px] font-bold gap-1 cursor-pointer"
                  title="Upload profile photo"
                >
                  {photoUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                  <span>{photoUploading ? 'Uploading' : 'Change'}</span>
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/png,image/jpeg,image/webp,image/jpg"
                  className="hidden"
                  onChange={handlePhotoUpload}
                />
              </div>

              <div className="flex-1 text-center sm:text-left">
                {editing ? (
                  <div className="space-y-2">
                    <input
                      value={form.firstName}
                      onChange={e => setForm(p => ({ ...p, firstName: e.target.value }))}
                      placeholder="First name"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-900 focus:outline-none focus:border-brand-500"
                    />
                    <input
                      value={form.lastName}
                      onChange={e => setForm(p => ({ ...p, lastName: e.target.value }))}
                      placeholder="Last name"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-900 focus:outline-none focus:border-brand-500"
                    />
                  </div>
                ) : (
                  <>
                    <h2 className="text-xl font-bold text-slate-900">{identity.fullName}</h2>
                    <p className="text-xs text-brand-600 font-medium mt-0.5">{identity.headline || (isNonTech ? 'Non-Technical Candidate' : 'Technical Candidate')}</p>
                    <div className="flex items-center gap-1.5 mt-2 justify-center sm:justify-start">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-brand-50 text-brand-600 border border-brand-200 uppercase tracking-wider">
                        {career.currentStatus}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Headline (Edit Mode) */}
            {editing && (
              <div className="mb-4">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Headline</label>
                <input
                  value={form.headline}
                  onChange={e => setForm(p => ({ ...p, headline: e.target.value }))}
                  placeholder={isNonTech ? "e.g. Marketing Lead | Brand Strategist" : "e.g. C++ Systems Engineer | Distributed Systems"}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-brand-500"
                />
              </div>
            )}

            {/* Bio */}
            <div className="mb-5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">About / Bio</label>
              {editing ? (
                <textarea
                  value={form.bio}
                  onChange={e => setForm(p => ({ ...p, bio: e.target.value }))}
                  placeholder={isNonTech ? "Describe your background, domain focus, and key accomplishments..." : "Describe your background and technical focus..."}
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-brand-500 resize-none placeholder:text-slate-600"
                />
              ) : (
                <p className="text-xs text-slate-600 leading-relaxed">
                  {identity.bio || 'No bio provided. Edit profile to introduce yourself.'}
                </p>
              )}
            </div>

            {/* Contact & Social Links */}
            <div className="space-y-2.5 pt-4 border-t border-slate-200 text-xs">
              {/* Email (Read-Only) */}
              <div className="flex items-center gap-2 text-slate-500">
                <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span className="truncate">{identity.email}</span>
              </div>

              {/* Location */}
              {editing ? (
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <input
                    value={form.location}
                    onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
                    placeholder="Location (e.g. Seattle, WA)"
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-900 focus:outline-none focus:border-brand-500"
                  />
                </div>
              ) : (
                identity.location && (
                  <div className="flex items-center gap-2 text-slate-500">
                    <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>{identity.location}</span>
                  </div>
                )
              )}

              {/* Phone */}
              {editing ? (
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <input
                    value={form.phone}
                    onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                    placeholder="Phone number"
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-900 focus:outline-none focus:border-brand-500"
                  />
                </div>
              ) : (
                identity.phone && (
                  <div className="flex items-center gap-2 text-slate-500">
                    <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>{identity.phone}</span>
                  </div>
                )
              )}

              {/* GitHub */}
              {editing ? (
                <div className="flex items-center gap-2">
                  <GithubIcon className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <input
                    value={form.github}
                    onChange={e => setForm(p => ({ ...p, github: e.target.value }))}
                    placeholder={isNonTech ? "Work/Portfolio link" : "GitHub URL / username"}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-900 focus:outline-none focus:border-brand-500"
                  />
                </div>
              ) : (
                identity.links.github && (
                  <div className="flex items-center gap-2 text-slate-500">
                    <GithubIcon className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <a href={identity.links.github.startsWith('http') ? identity.links.github : `https://github.com/${identity.links.github}`} target="_blank" rel="noreferrer" className="text-brand-600 hover:underline truncate">
                      {identity.links.github}
                    </a>
                  </div>
                )
              )}

              {/* LinkedIn */}
              {editing ? (
                <div className="flex items-center gap-2">
                  <LinkedinIcon className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <input
                    value={form.linkedin}
                    onChange={e => setForm(p => ({ ...p, linkedin: e.target.value }))}
                    placeholder="LinkedIn URL / username"
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-900 focus:outline-none focus:border-brand-500"
                  />
                </div>
              ) : (
                identity.links.linkedin && (
                  <div className="flex items-center gap-2 text-slate-500">
                    <LinkedinIcon className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <a href={identity.links.linkedin.startsWith('http') ? identity.links.linkedin : `https://linkedin.com/in/${identity.links.linkedin}`} target="_blank" rel="noreferrer" className="text-brand-600 hover:underline truncate">
                      {identity.links.linkedin}
                    </a>
                  </div>
                )
              )}

              {/* Portfolio */}
              {editing ? (
                <div className="flex items-center gap-2">
                  <Globe className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <input
                    value={form.portfolio}
                    onChange={e => setForm(p => ({ ...p, portfolio: e.target.value }))}
                    placeholder="Portfolio URL"
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-900 focus:outline-none focus:border-brand-500"
                  />
                </div>
              ) : (
                identity.links.portfolio && (
                  <div className="flex items-center gap-2 text-slate-500">
                    <Globe className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <a href={identity.links.portfolio.startsWith('http') ? identity.links.portfolio : `https://${identity.links.portfolio}`} target="_blank" rel="noreferrer" className="text-brand-600 hover:underline truncate">
                      {identity.links.portfolio}
                    </a>
                  </div>
                )
              )}
            </div>
          </div>

          {/* 2. CAREER & PREFERENCES CARD */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-brand-600" /> Career Profile
            </h3>

            {editing ? (
              <div className="space-y-3.5 text-xs">
                {isNonTech && (
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Career Area</label>
                    <select
                      value={form.careerArea}
                      onChange={e => setForm(p => ({ ...p, careerArea: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900 focus:outline-none focus:border-brand-500"
                    >
                      <option value="">Select Career Area</option>
                      {['Marketing', 'HR', 'Finance', 'Sales', 'UI/UX', 'Product', 'Content', 'Business Analyst', 'Operations'].map(a => (
                        <option key={a} value={a}>{a}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Status</label>
                  <select
                    value={form.currentStatus}
                    onChange={e => setForm(p => ({ ...p, currentStatus: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900 focus:outline-none focus:border-brand-500"
                  >
                    <option value="Actively Looking">Actively Looking</option>
                    <option value="Open to Offers">Open to Offers</option>
                    <option value="Not Looking">Not Looking</option>
                    <option value="Exploring Opportunities">Exploring Opportunities</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Target Role</label>
                  <input
                    value={form.targetRole}
                    onChange={e => setForm(p => ({ ...p, targetRole: e.target.value }))}
                    placeholder={isNonTech ? "e.g. Marketing Lead, Business Analyst, HR Specialist" : "e.g. C++ Systems Engineer"}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900 focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Experience Level</label>
                  <input
                    value={form.experienceLevel}
                    onChange={e => setForm(p => ({ ...p, experienceLevel: e.target.value }))}
                    placeholder="e.g. Mid-Senior (3-5 years)"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900 focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Availability</label>
                  <input
                    value={form.availability}
                    onChange={e => setForm(p => ({ ...p, availability: e.target.value }))}
                    placeholder="e.g. Immediately, 2 Weeks"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900 focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Preferred Domains (comma separated)</label>
                  <input
                    value={form.preferredDomainsInput}
                    onChange={e => setForm(p => ({ ...p, preferredDomainsInput: e.target.value }))}
                    placeholder={isNonTech ? "e.g. Content Strategy, Brand Marketing, Consumer Research" : "e.g. Data Structures & Algorithms, Backend Engineering"}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900 focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                {isNonTech && (
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-200">
                    <span className="text-slate-500 font-medium">Career Area</span>
                    <span className="text-brand-600 font-bold">{career.careerArea || user?.careerArea || 'Not specified'}</span>
                  </div>
                )}
                <div className="flex justify-between items-center py-1.5 border-b border-slate-200">
                  <span className="text-slate-500 font-medium">Target Role</span>
                  <span className="text-slate-900 font-bold">{career.targetRole || 'Not specified'}</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-slate-200">
                  <span className="text-slate-500 font-medium">Experience Level</span>
                  <span className="text-slate-600 font-semibold">{career.experienceLevel}</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-slate-200">
                  <span className="text-slate-500 font-medium">Availability</span>
                  <span className="text-emerald-600 font-semibold">{career.availability}</span>
                </div>
                {career.preferredDomains && career.preferredDomains.length > 0 && (
                  <div className="pt-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Preferred Domains</span>
                    <div className="flex flex-wrap gap-1.5">
                      {career.preferredDomains.map((d, i) => (
                        <span key={i} className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-600 text-[11px]">
                          {d}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 3. CAPABILITY PASSPORT SUMMARY (REAL AGGREGATION, NO RANDOM SCORES) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-600" /> Evidence Summary
              </h3>
              <Link to="/candidate/passport" className="text-[11px] text-brand-600 hover:text-brand-600 font-bold flex items-center gap-1">
                Capability Passport <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                <div className="text-xl font-black text-emerald-600">{cap.verifiedSkillsCount}</div>
                <div className="text-[10px] text-slate-500 font-semibold uppercase mt-0.5">Verified Skills</div>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                <div className="text-xl font-black text-brand-600">{cap.verifiedProjectsCount}</div>
                <div className="text-[10px] text-slate-500 font-semibold uppercase mt-0.5">{isNonTech ? 'Proof of Work' : 'Verified Projects'}</div>
              </div>
              {!isNonTech && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                  <div className="text-xl font-black text-amber-600">{cap.practiceSolvedCount}</div>
                  <div className="text-[10px] text-slate-500 font-semibold uppercase mt-0.5">Practice Solved</div>
                </div>
              )}
              <div className={`bg-slate-50 border border-slate-200 rounded-xl p-3 text-center ${isNonTech ? 'col-span-2' : ''}`}>
                <div className="text-xl font-black text-purple-400">{cap.interviewsCompletedCount}</div>
                <div className="text-[10px] text-slate-500 font-semibold uppercase mt-0.5">Interviews Done</div>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 text-center mt-3">
              Formal capability scores are computed strictly in the Capability Passport from verified artifacts.
            </p>
          </div>

        </div>

        {/* RIGHT COLUMN: Real Data Sections (8 cols) */}
        <div className="lg:col-span-8 space-y-6">

          {/* 1. SKILLS: STRICT SEPARATION OF CLAIMED VS VERIFIED */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" /> Verified Skills
                </h3>
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Evidence-Grounded
                </span>
              </div>

              {skills.verified.length === 0 ? (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500">
                  <p>No verified skills yet. Skills become verified when validated through automated static project repository analysis or passed sandboxed technical practice test suites.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {skills.verified.map((v, i) => (
                    <div key={i} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">{v.name}</span>
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 uppercase">
                            VERIFIED
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1 font-mono">{v.evidence}</p>
                      </div>
                      <span className="text-xs font-mono font-bold text-emerald-600">{v.confidence}%</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-slate-500" /> Claimed Skills
                </h3>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  Self-Reported
                </span>
              </div>

              {editing ? (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input
                      value={form.newSkillInput}
                      onChange={e => setForm(p => ({ ...p, newSkillInput: e.target.value }))}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddSkill(); } }}
                      placeholder="Add a claimed skill (e.g. C++, Java, React)..."
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-brand-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddSkill}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-700 text-slate-900 text-xs font-bold rounded-lg flex items-center gap-1 border border-slate-200"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {form.claimedSkills.map(s => (
                      <span key={s} className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-xs text-slate-700 flex items-center gap-1.5">
                        {s}
                        <button type="button" onClick={() => handleRemoveSkill(s)} className="text-slate-500 hover:text-red-400">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                skills.claimed.length === 0 ? (
                  <p className="text-xs text-slate-500">No claimed skills added. Click Edit Profile to add skills you possess.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {skills.claimed.map((s, i) => (
                      <span key={i} className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center gap-2">
                        <span>{s}</span>
                        <span className="text-[9px] font-mono text-slate-500 uppercase">CLAIMED</span>
                      </span>
                    ))}
                  </div>
                )
              )}
            </div>

            {/* OTHER SKILLS DETECTED FROM RESUME (NON-TECH ONLY) */}
            {isNonTech && skills.otherDetectedSkills && skills.otherDetectedSkills.length > 0 && (
              <div className="pt-4 border-t border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold text-slate-500 flex items-center gap-2">
                    Other Skills Detected from Resume
                  </h3>
                  <span className="text-[10px] text-slate-500 font-mono">Context Only</span>
                </div>
                <p className="text-[11px] text-slate-500 mb-3">
                  These technical/tool skills were detected from your resume file. In ProofHire, they remain available for context but do not define your non-technical career identity.
                </p>
                <div className="flex flex-wrap gap-2">
                  {skills.otherDetectedSkills.map((s, i) => (
                    <span key={i} className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-500 font-mono">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 2. EDUCATION SECTION */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Award className="w-4 h-4 text-brand-600" /> Education
              </h3>
            </div>

            {editing ? (
              <div className="space-y-4">
                {form.education.map((edu, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-start justify-between gap-3">
                    <div>
                      <div className="font-bold text-slate-900 text-xs">{edu.degree} in {edu.field}</div>
                      <div className="text-[11px] text-slate-500">{edu.institution} {edu.year ? `· ${edu.year}` : ''}</div>
                      {edu.description && <p className="text-[11px] text-slate-500 mt-1">{edu.description}</p>}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveEducation(idx)}
                      className="text-slate-500 hover:text-red-400 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Add Education</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <input
                      placeholder="Degree (e.g. Bachelor of Business Admin)"
                      value={form.newEdu.degree}
                      onChange={e => setForm(p => ({ ...p, newEdu: { ...p.newEdu, degree: e.target.value } }))}
                      className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900"
                    />
                    <input
                      placeholder="Institution (e.g. University of Washington)"
                      value={form.newEdu.institution}
                      onChange={e => setForm(p => ({ ...p, newEdu: { ...p.newEdu, institution: e.target.value } }))}
                      className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900"
                    />
                    <input
                      placeholder="Field of Study (e.g. Marketing, Finance)"
                      value={form.newEdu.field}
                      onChange={e => setForm(p => ({ ...p, newEdu: { ...p.newEdu, field: e.target.value } }))}
                      className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900"
                    />
                    <input
                      placeholder="Year (e.g. 2024)"
                      value={form.newEdu.year}
                      onChange={e => setForm(p => ({ ...p, newEdu: { ...p.newEdu, year: e.target.value } }))}
                      className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddEducation}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-700 text-slate-900 text-xs font-bold rounded-lg flex items-center gap-1 border border-slate-200 mt-2"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Education
                  </button>
                </div>
              </div>
            ) : (
              (!data?.education || data.education.length === 0) ? (
                <p className="text-xs text-slate-500">No education entries added. Click Edit Profile to add your background.</p>
              ) : (
                <div className="space-y-3">
                  {data.education.map((edu, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                      <div className="font-bold text-slate-900 text-xs">{edu.degree} in {edu.field}</div>
                      <div className="text-[11px] text-brand-600 mt-0.5">{edu.institution} {edu.year ? `· Class of ${edu.year}` : ''}</div>
                      {edu.description && <p className="text-xs text-slate-500 mt-1">{edu.description}</p>}
                    </div>
                  ))}
                </div>
              )
            )}
          </div>

          {/* 3. EXPERIENCE SECTION */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-emerald-600" /> Experience & Internships
              </h3>
            </div>

            {editing ? (
              <div className="space-y-4">
                {form.experience.map((exp, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-start justify-between gap-3">
                    <div>
                      <div className="font-bold text-slate-900 text-xs">{exp.title} at {exp.company}</div>
                      <div className="text-[11px] text-slate-500">{exp.duration || ''} {exp.location ? `· ${exp.location}` : ''}</div>
                      {exp.description && <p className="text-[11px] text-slate-500 mt-1">{exp.description}</p>}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveExperience(idx)}
                      className="text-slate-500 hover:text-red-400 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Add Experience</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <input
                      placeholder="Role Title (e.g. Marketing Intern, Associate)"
                      value={form.newExp.title}
                      onChange={e => setForm(p => ({ ...p, newExp: { ...p.newExp, title: e.target.value } }))}
                      className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900"
                    />
                    <input
                      placeholder="Company / Organization"
                      value={form.newExp.company}
                      onChange={e => setForm(p => ({ ...p, newExp: { ...p.newExp, company: e.target.value } }))}
                      className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900"
                    />
                    <input
                      placeholder="Duration (e.g. Jun 2023 - Dec 2023)"
                      value={form.newExp.duration}
                      onChange={e => setForm(p => ({ ...p, newExp: { ...p.newExp, duration: e.target.value } }))}
                      className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900"
                    />
                    <input
                      placeholder="Location (e.g. Remote, New York)"
                      value={form.newExp.location}
                      onChange={e => setForm(p => ({ ...p, newExp: { ...p.newExp, location: e.target.value } }))}
                      className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900"
                    />
                  </div>
                  <textarea
                    placeholder="Key contributions and achievements..."
                    rows={2}
                    value={form.newExp.description}
                    onChange={e => setForm(p => ({ ...p, newExp: { ...p.newExp, description: e.target.value } }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 resize-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddExperience}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-700 text-slate-900 text-xs font-bold rounded-lg flex items-center gap-1 border border-slate-200 mt-2"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Experience
                  </button>
                </div>
              </div>
            ) : (
              (!data?.experience || data.experience.length === 0) ? (
                <p className="text-xs text-slate-500">No experience records added. Click Edit Profile to list internships or roles.</p>
              ) : (
                <div className="space-y-3">
                  {data.experience.map((exp, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                      <div className="font-bold text-slate-900 text-xs">{exp.title}</div>
                      <div className="text-[11px] text-emerald-600 mt-0.5">{exp.company} {exp.duration ? `· ${exp.duration}` : ''}</div>
                      {exp.description && <p className="text-xs text-slate-500 mt-1">{exp.description}</p>}
                    </div>
                  ))}
                </div>
              )
            )}
          </div>

          {/* 4. PROOF OF WORK / PROJECTS */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Code2 className="w-4 h-4 text-brand-600" /> {isNonTech ? 'Non-Technical Proof of Work' : 'Candidate Projects'}
              </h3>
              <Link to={isNonTech ? "/candidate/challenges" : "/candidate/projects"} className="text-xs text-brand-600 hover:text-brand-600 font-bold flex items-center gap-1">
                {isNonTech ? 'Browse Challenges' : 'Manage Projects'} <ExternalLink className="w-3 h-3" />
              </Link>
            </div>

            {projects.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <Code2 className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-sm text-slate-500">
                  {isNonTech ? 'No proof of work submitted yet.' : 'No verified projects yet.'}
                </p>
                <Link to={isNonTech ? "/candidate/challenges" : "/candidate/projects"} className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded-lg transition-colors">
                  {isNonTech ? 'Browse Non-Tech Case Studies' : 'Upload Project for AI Verification'}
                </Link>
              </div>
            ) : (
              <div className="space-y-3.5">
                {projects.map(p => (
                  <div key={p._id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="font-bold text-slate-900 text-sm">{p.name}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                          p.verificationStatus === 'COMPLETED' || p.verificationStatus === 'VERIFIED' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-amber-50 text-amber-600 border border-amber-200'
                        }`}>
                          {p.verificationStatus}
                        </span>
                        {p.overallScore != null && (
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-brand-50 text-brand-600 border border-brand-200">
                            Score: {p.overallScore}/100
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-2">{p.description || 'No deliverable notes provided.'}</p>
                      
                      {/* Non-tech skills / tech stack */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {(p.detectedTech?.length ? p.detectedTech : p.techStack).slice(0, 5).map((tech, idx) => (
                          <span key={idx} className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {p.githubUrl && (
                        <a
                          href={p.githubUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 rounded-lg bg-slate-100 hover:bg-slate-700 text-slate-600 transition-colors"
                          title="View Repository"
                        >
                          <GithubIcon className="w-4 h-4" />
                        </a>
                      )}
                      {(p.demoUrl || (p as any).documentUrl) && (
                        <a
                          href={p.demoUrl || (p as any).documentUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-700 text-slate-600 text-xs font-bold transition-colors flex items-center gap-1.5"
                        >
                          <ExternalLink className="w-3.5 h-3.5" /> Deliverable Link
                        </a>
                      )}
                      {!isNonTech && (
                        <Link
                          to={`/candidate/projects/${p._id}/analysis`}
                          className="px-3.5 py-1.5 rounded-lg bg-brand-600/20 hover:bg-brand-600/30 text-brand-600 border border-brand-200 text-xs font-bold transition-colors flex items-center gap-1.5"
                        >
                          Project AI Analysis <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 5. RESUME AI RECORD */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-brand-600" /> Resume AI Record
              </h3>
              <Link to="/candidate/resume-ai" className="text-xs text-brand-600 hover:text-brand-600 font-bold flex items-center gap-1">
                View Resume Analysis <ExternalLink className="w-3 h-3" />
              </Link>
            </div>

            {resume ? (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-brand-600" />
                    <span className="text-xs font-bold text-slate-900 font-mono">{resume.fileName}</span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Uploaded: {new Date(resume.uploadDate).toLocaleDateString()} · Status: <span className="text-emerald-600 font-semibold">{resume.analysisStatus}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center gap-1.5 pt-1">
                    <span>AI-Assistance Signal:</span>
                    <span className={`font-bold px-1.5 py-0.2 rounded text-[10px] uppercase ${
                      resume.aiAssistanceSignal === 'LOW' ? 'bg-emerald-500/20 text-emerald-600' :
                      resume.aiAssistanceSignal === 'MEDIUM' ? 'bg-amber-500/20 text-amber-600' :
                      resume.aiAssistanceSignal === 'HIGH' ? 'bg-red-500/20 text-red-400' :
                      'bg-slate-100 text-slate-500'
                    }`}>
                      {resume.aiAssistanceSignal}
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-2xl font-black text-brand-600 font-mono">
                    {resume.atsScore != null ? Number(resume.atsScore).toFixed(1) : '—'} <span className="text-xs text-slate-500 font-normal">/ 10</span>
                  </div>
                  <div className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">
                    {isNonTech ? 'Role-Aware ATS Score' : 'ATS Explainable Score'}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <p className="text-xs text-slate-500">No resume analyzed yet.</p>
                <Link to="/candidate/resume-ai" className="inline-block px-4 py-1.5 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded-lg transition-colors">
                  Upload & Analyze Resume
                </Link>
              </div>
            )}
          </div>

          {/* 6. TECHNICAL PRACTICE (STRICTLY SUPPRESSED FOR NON-TECH CANDIDATES) */}
          {!isNonTech && technicalPractice && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-emerald-600" /> Technical Practice Statistics
                </h3>
                <Link to="/candidate/practice" className="text-xs text-brand-600 hover:text-brand-600 font-bold flex items-center gap-1">
                  Open Code Arena <ExternalLink className="w-3 h-3" />
                </Link>
              </div>

              {!technicalPractice.hasSubmissions ? (
                <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <Terminal className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-sm text-slate-500">No technical practice submissions yet.</p>
                  <Link to="/candidate/practice" className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-900 text-xs font-bold rounded-lg transition-colors">
                    Start Technical Practice
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Real Statistics Breakdown */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                      <div className="text-xl font-black text-slate-900">{technicalPractice.problemsSolved}</div>
                      <div className="text-[10px] text-slate-500 uppercase font-semibold">Problems Solved</div>
                    </div>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                      <div className="text-xl font-black text-emerald-600">{technicalPractice.accuracy}%</div>
                      <div className="text-[10px] text-slate-500 uppercase font-semibold">Test Pass Rate</div>
                    </div>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                      <div className="text-sm font-bold text-slate-700 mt-1">
                        <span className="text-emerald-600">{technicalPractice.breakdown.easy}E</span> · 
                        <span className="text-amber-600 mx-1">{technicalPractice.breakdown.medium}M</span> · 
                        <span className="text-red-400">{technicalPractice.breakdown.hard}H</span>
                      </div>
                      <div className="text-[10px] text-slate-500 uppercase font-semibold mt-1">Difficulty</div>
                    </div>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                      <div className="text-xs font-bold text-slate-600 mt-1 capitalize truncate">
                        {technicalPractice.languagesUsed.join(', ') || 'C++'}
                      </div>
                      <div className="text-[10px] text-slate-500 uppercase font-semibold mt-1">Languages Used</div>
                    </div>
                  </div>

                  {/* Recent Submissions */}
                  {technicalPractice.recentSubmissions?.length > 0 && (
                    <div className="space-y-2 pt-2">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Recent Code Submissions</span>
                      {technicalPractice.recentSubmissions.map(sub => (
                        <div key={sub._id} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">{sub.challengeTitle}</span>
                            <span className="text-[10px] text-slate-500 uppercase font-mono">{sub.language}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-[11px] text-slate-500">{sub.passedTests}/{sub.totalTests} tests</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                              sub.status === 'PASSED' ? 'bg-emerald-500/20 text-emerald-600' : 'bg-red-500/20 text-red-400'
                            }`}>
                              {sub.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 7. AI INTERVIEW HISTORY (TRACK-AWARE) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <BrainCircuit className="w-4 h-4 text-purple-400" /> 
                {isNonTech ? 'AI Behavioral & Domain Interview History' : 'AI Technical Interview History'}
              </h3>
              <Link to="/candidate/interview" className="text-xs text-brand-600 hover:text-brand-600 font-bold flex items-center gap-1">
                {isNonTech ? 'Take Domain Interview' : 'Take AI Interview'} <ExternalLink className="w-3 h-3" />
              </Link>
            </div>

            {!aiInterview.hasInterviews ? (
              <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <BrainCircuit className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-sm text-slate-500">No interviews completed yet.</p>
                <Link to="/candidate/interview" className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-slate-900 text-xs font-bold rounded-lg transition-colors">
                  {isNonTech ? 'Start AI Domain Interview' : 'Start AI Technical Interview'}
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                    <div className="text-xl font-black text-slate-900">{aiInterview.interviewsCompleted}</div>
                    <div className="text-[10px] text-slate-500 uppercase font-semibold">Completed</div>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                    <div className="text-xl font-black text-purple-400">
                      {aiInterview.averageScore != null ? `${aiInterview.averageScore}/100` : '—'}
                    </div>
                    <div className="text-[10px] text-slate-500 uppercase font-semibold">Average Score</div>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                    <div className="text-xs font-bold text-slate-600 mt-1 truncate">
                      {isNonTech ? 'Strategy & Reasoning' : (aiInterview.languages.join(', ') || 'C++')}
                    </div>
                    <div className="text-[10px] text-slate-500 uppercase font-semibold mt-1">
                      {isNonTech ? 'Format' : 'Language'}
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                    <div className="text-xs font-bold text-purple-300 mt-1 truncate">
                      {aiInterview.domains.slice(0, 1).join(', ') || (isNonTech ? 'Business Strategy' : 'Systems')}
                    </div>
                    <div className="text-[10px] text-slate-500 uppercase font-semibold mt-1">Focus Domain</div>
                  </div>
                </div>

                {aiInterview.recentInterview && (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-slate-900">Recent Session: {aiInterview.recentInterview.focus || (isNonTech ? 'Domain Case Interview' : 'Technical Interview')}</div>
                      <div className="text-slate-500 text-[11px]">
                        Track: {isNonTech ? 'Non-Technical Domain' : `Language: ${aiInterview.recentInterview.language}`} · Date: {new Date(aiInterview.recentInterview.startedAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-right">
                      {aiInterview.recentInterview.score != null && (
                        <div className="text-sm font-bold text-purple-400">{aiInterview.recentInterview.score}/100</div>
                      )}
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 uppercase">
                        {aiInterview.recentInterview.status}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 6. REVIEWS */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6">
            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-600" /> Peer & Expert Reviews
            </h3>

            {reviews.length === 0 ? (
              <p className="text-xs text-slate-500">No reviews recorded yet.</p>
            ) : (
              <div className="space-y-3">
                {reviews.map(r => (
                  <div key={r._id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{r.reviewerName}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-500 uppercase font-mono">
                          {r.reviewerRole}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-amber-600 font-bold font-mono">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-600" />
                        <span>{r.overallRating}/5</span>
                      </div>
                    </div>
                    <p className="text-slate-600">{r.comments}</p>
                    <div className="text-[10px] text-slate-500">
                      Project: {r.projectName} · {new Date(r.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
