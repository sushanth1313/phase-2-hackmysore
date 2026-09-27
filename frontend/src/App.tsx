import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppShell from './components/layout/AppShell';
import PrivateRoute from './components/auth/PrivateRoute';
import ErrorBoundary from './components/ui/ErrorBoundary';

// Public Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';

// Candidate Pages
import CandidateDashboard from './pages/candidate/Dashboard';
import ProofOfWork from './pages/candidate/ProofOfWork';
import Challenges from './pages/candidate/Challenges';
import Reviews from './pages/candidate/Reviews';
import CapabilityPassport from './pages/candidate/CapabilityPassport';
import AIInterview from './pages/candidate/AIInterview';
import TechnicalPractice from './pages/candidate/TechnicalPractice';
import ResumeIntelligence from './pages/candidate/ResumeIntelligence';
import ResumeAI from './pages/candidate/ResumeAI';
import ProjectAnalysis from './pages/candidate/ProjectAnalysis';
import CandidateSettings from './pages/candidate/Settings';

import CandidateDiscover from './pages/candidate/Discover';
import CandidateProfile from './pages/candidate/Profile';
import CandidateMessages from './pages/candidate/Messages';

// Recruiter Pages
import RecruiterDashboard from './pages/recruiter/Dashboard';
import TalentDiscovery from './pages/recruiter/TalentDiscovery';
import CandidateDetail from './pages/recruiter/CandidateDetail';
import RecruiterJobs from './pages/recruiter/Jobs';
import RecruiterShortlists from './pages/recruiter/Shortlists';
import RecruiterMessages from './pages/recruiter/Messages';
import RecruiterSettings from './pages/recruiter/Settings';
import HiringPipeline from './pages/recruiter/Pipeline';

// Expert Pages
import ExpertDashboard from './pages/expert/ExpertDashboard';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <div className="min-h-screen bg-[#F4F7FB] text-slate-800 font-sans selection:bg-blue-100 selection:text-blue-900">
          <Routes>
            {/* Public Entry Routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* ========================================================= */}
            {/* CANDIDATE ROUTES (Both /candidate/* and top-level aliases)  */}
            {/* ========================================================= */}
            <Route path="/candidate" element={
              <PrivateRoute allowedRoles={['CANDIDATE']}>
                <AppShell role="candidate"><CandidateDashboard /></AppShell>
              </PrivateRoute>
            } />
            <Route path="/candidate/dashboard" element={<Navigate to="/candidate" replace />} />
            <Route path="/dashboard" element={<Navigate to="/candidate" replace />} />

            <Route path="/candidate/proof" element={
              <PrivateRoute allowedRoles={['CANDIDATE']}>
                <AppShell role="candidate"><ProofOfWork /></AppShell>
              </PrivateRoute>
            } />
            <Route path="/proof-of-work" element={<Navigate to="/candidate/proof" replace />} />

            <Route path="/candidate/challenges" element={
              <PrivateRoute allowedRoles={['CANDIDATE']}>
                <AppShell role="candidate"><Challenges /></AppShell>
              </PrivateRoute>
            } />
            <Route path="/challenges" element={<Navigate to="/candidate/challenges" replace />} />

            <Route path="/candidate/reviews" element={
              <PrivateRoute allowedRoles={['CANDIDATE']}>
                <AppShell role="candidate"><Reviews /></AppShell>
              </PrivateRoute>
            } />
            <Route path="/reviews" element={<Navigate to="/candidate/reviews" replace />} />

            <Route path="/candidate/passport" element={
              <PrivateRoute allowedRoles={['CANDIDATE']}>
                <AppShell role="candidate"><CapabilityPassport /></AppShell>
              </PrivateRoute>
            } />
            <Route path="/capability-passport" element={<Navigate to="/candidate/passport" replace />} />

            <Route path="/candidate/interview" element={
              <PrivateRoute allowedRoles={['CANDIDATE']}>
                <AppShell role="candidate"><AIInterview /></AppShell>
              </PrivateRoute>
            } />
            <Route path="/candidate/interviews" element={<Navigate to="/candidate/interview" replace />} />
            <Route path="/ai-interview" element={<Navigate to="/candidate/interview" replace />} />

            <Route path="/candidate/practice" element={
              <PrivateRoute allowedRoles={['CANDIDATE']}>
                <AppShell role="candidate"><TechnicalPractice /></AppShell>
              </PrivateRoute>
            } />
            <Route path="/technical-practice" element={<Navigate to="/candidate/practice" replace />} />

            {/* Resume AI - dedicated route */}
            <Route path="/candidate/resume-ai" element={
              <PrivateRoute allowedRoles={['CANDIDATE']}>
                <AppShell role="candidate"><ResumeAI /></AppShell>
              </PrivateRoute>
            } />
            <Route path="/candidate/resume" element={<Navigate to="/candidate/resume-ai" replace />} />
            <Route path="/resume-ai" element={<Navigate to="/candidate/resume-ai" replace />} />
            <Route path="/resume-intelligence" element={<Navigate to="/candidate/resume-ai" replace />} />

            <Route path="/candidate/discover" element={
              <PrivateRoute allowedRoles={['CANDIDATE']}>
                <AppShell role="candidate"><CandidateDiscover /></AppShell>
              </PrivateRoute>
            } />
            <Route path="/candidate/companies" element={
              <PrivateRoute allowedRoles={['CANDIDATE']}>
                <AppShell role="candidate"><CandidateDiscover initialTab="companies" /></AppShell>
              </PrivateRoute>
            } />
            <Route path="/discover" element={<Navigate to="/candidate/discover" replace />} />
            <Route path="/companies" element={<Navigate to="/candidate/companies" replace />} />

            {/* Projects & Project Analysis */}
            <Route path="/candidate/projects" element={
              <PrivateRoute allowedRoles={['CANDIDATE']}>
                <AppShell role="candidate"><ProofOfWork /></AppShell>
              </PrivateRoute>
            } />
            <Route path="/candidate/projects/:id/analysis" element={
              <PrivateRoute allowedRoles={['CANDIDATE']}>
                <AppShell role="candidate"><ProjectAnalysis /></AppShell>
              </PrivateRoute>
            } />
            <Route path="/projects" element={<Navigate to="/candidate/projects" replace />} />


            <Route path="/candidate/messages" element={
              <PrivateRoute allowedRoles={['CANDIDATE']}>
                <AppShell role="candidate"><CandidateMessages /></AppShell>
              </PrivateRoute>
            } />

            <Route path="/candidate/notifications" element={
              <PrivateRoute allowedRoles={['CANDIDATE']}>
                <AppShell role="candidate"><div className="p-8"><h1 className="text-2xl font-bold text-white mb-4">Notifications</h1><p className="text-slate-400">You have no new notifications.</p></div></AppShell>
              </PrivateRoute>
            } />

            <Route path="/candidate/profile" element={
              <PrivateRoute allowedRoles={['CANDIDATE']}>
                <AppShell role="candidate"><CandidateProfile /></AppShell>
              </PrivateRoute>
            } />

            <Route path="/candidate/settings" element={
              <PrivateRoute allowedRoles={['CANDIDATE']}>
                <AppShell role="candidate"><CandidateSettings /></AppShell>
              </PrivateRoute>
            } />
            <Route path="/settings" element={<Navigate to="/candidate/settings" replace />} />

            {/* ========================================================= */}
            {/* RECRUITER ROUTES                                          */}
            {/* ========================================================= */}
            <Route path="/recruiter" element={
              <PrivateRoute allowedRoles={['RECRUITER']}>
                <AppShell role="recruiter"><RecruiterDashboard /></AppShell>
              </PrivateRoute>
            } />
            <Route path="/recruiter/dashboard" element={<Navigate to="/recruiter" replace />} />

            <Route path="/recruiter/talent" element={
              <PrivateRoute allowedRoles={['RECRUITER']}>
                <AppShell role="recruiter"><TalentDiscovery /></AppShell>
              </PrivateRoute>
            } />
            <Route path="/recruiter/discover" element={<Navigate to="/recruiter/talent" replace />} />
            <Route path="/recruiter/candidates" element={<Navigate to="/recruiter/talent" replace />} />

            <Route path="/recruiter/candidate/:id" element={
              <PrivateRoute allowedRoles={['RECRUITER']}>
                <AppShell role="recruiter"><CandidateDetail /></AppShell>
              </PrivateRoute>
            } />

            <Route path="/recruiter/search" element={<Navigate to="/recruiter/talent" replace />} />

            <Route path="/recruiter/shortlists" element={
              <PrivateRoute allowedRoles={['RECRUITER']}>
                <AppShell role="recruiter"><RecruiterShortlists /></AppShell>
              </PrivateRoute>
            } />

            <Route path="/recruiter/jobs" element={
              <PrivateRoute allowedRoles={['RECRUITER']}>
                <AppShell role="recruiter"><RecruiterJobs /></AppShell>
              </PrivateRoute>
            } />

            <Route path="/recruiter/messages" element={
              <PrivateRoute allowedRoles={['RECRUITER']}>
                <AppShell role="recruiter"><RecruiterMessages /></AppShell>
              </PrivateRoute>
            } />

            <Route path="/recruiter/pipeline" element={
              <PrivateRoute allowedRoles={['RECRUITER']}>
                <AppShell role="recruiter"><HiringPipeline /></AppShell>
              </PrivateRoute>
            } />

            <Route path="/recruiter/company" element={
              <PrivateRoute allowedRoles={['RECRUITER']}>
                <AppShell role="recruiter"><div className="p-8"><h1 className="text-2xl font-bold text-white mb-4">Company Profile</h1><p className="text-slate-400">Manage your company details.</p></div></AppShell>
              </PrivateRoute>
            } />

            <Route path="/recruiter/settings" element={
              <PrivateRoute allowedRoles={['RECRUITER']}>
                <AppShell role="recruiter"><RecruiterSettings /></AppShell>
              </PrivateRoute>
            } />
            <Route path="/recruiter/profile" element={<Navigate to="/recruiter/settings" replace />} />

            {/* ========================================================= */}
            {/* EXPERT ROUTES                                             */}
            {/* ========================================================= */}
            <Route path="/expert/*" element={
              <PrivateRoute allowedRoles={['EXPERT']}>
                <AppShell role="expert"><ExpertDashboard /></AppShell>
              </PrivateRoute>
            } />

            {/* ========================================================= */}
            {/* ADMIN ROUTES                                              */}
            {/* ========================================================= */}
            <Route path="/admin" element={
              <PrivateRoute allowedRoles={['ADMIN']}>
                <AppShell role="admin"><AdminDashboard /></AppShell>
              </PrivateRoute>
            } />
            <Route path="/admin/dashboard" element={<Navigate to="/admin" replace />} />
            <Route path="/admin/health" element={<Navigate to="/admin" replace />} />
            <Route path="/admin/analytics" element={<Navigate to="/admin" replace />} />
            <Route path="/admin/users" element={<Navigate to="/admin" replace />} />
            <Route path="/admin/reports" element={<Navigate to="/admin" replace />} />
            <Route path="/admin/challenges" element={<Navigate to="/admin" replace />} />
            <Route path="/admin/projects" element={<Navigate to="/admin" replace />} />
            <Route path="/admin/reviews" element={<Navigate to="/admin" replace />} />
            <Route path="/admin/security" element={<Navigate to="/admin" replace />} />

            {/* Global Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
