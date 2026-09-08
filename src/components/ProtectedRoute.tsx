import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth, Role } from '../context/AuthContext';

interface ProtectedRouteProps {
  allowedRoles?: Role[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#f8fafc]">
        <div className="text-emerald-600 font-semibold text-lg animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="flex flex-col h-screen w-full items-center justify-center bg-[#f8fafc] text-slate-800">
        <h1 className="text-3xl font-bold text-rose-600 mb-4">Access Denied</h1>
        <p className="text-slate-600">You do not have permission to view this page.</p>
        <button 
          onClick={() => window.history.back()}
          className="mt-6 px-4 py-2 bg-slate-200 hover:bg-slate-300 rounded text-sm font-medium"
        >
          Go Back
        </button>
      </div>
    );
  }

  return <Outlet />;
};

export default ProtectedRoute;
