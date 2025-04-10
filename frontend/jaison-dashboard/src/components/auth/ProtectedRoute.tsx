import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const ProtectedRoute: React.FC = () => {
  const { authState } = useAuth();
  const location = useLocation();

  if (authState.isLoading) {
    // Show loading spinner while checking authentication
    return (
      <div className="auth-container">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!authState.isAuthenticated) {
    // Redirect to login page if not authenticated
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Render child routes if authenticated
  return <Outlet />;
};

export default ProtectedRoute;
