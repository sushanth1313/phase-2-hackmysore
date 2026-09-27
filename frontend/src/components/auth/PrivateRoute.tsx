import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function PrivateRoute({ 
  children, 
  allowedRoles 
}: { 
  children: React.ReactNode,
  allowedRoles?: string[]
}) {
  const { isAuthenticated, user, authLoading } = useAuth();
  const location = useLocation();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#070B14] flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-400 text-xs font-medium tracking-wide">Authenticating session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // If not allowed, redirect to their designated home based on role
    if (user.role === 'RECRUITER') return <Navigate to="/recruiter" replace />;
    if (user.role === 'CANDIDATE') return <Navigate to="/candidate" replace />;
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
