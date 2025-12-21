import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { isAuthenticated, getToken, getTokenPayload } from '../../utils/auth';
import { Loader2 } from 'lucide-react';

/**
 * Admin Route Protection Component (HOC)
 * 
 * Protects admin routes by:
 * - Checking if user is authenticated
 * - Verifying user has admin role
 * - Redirecting non-admin users to home page
 * 
 * Requirements: 1.3 - WHEN a non-admin user attempts to access admin routes 
 *                     THEN the Admin_System SHALL return a 403 Forbidden response
 *                     (client-side: redirect to home page)
 */
const AdminRoute = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const checkAdminAccess = () => {
      // Check if user is authenticated
      if (!isAuthenticated()) {
        setIsLoading(false);
        setIsAdmin(false);
        return;
      }

      // Get token and decode to check role
      const token = getToken();
      const payload = getTokenPayload(token);

      if (payload && payload.role === 'admin') {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }

      setIsLoading(false);
    };

    checkAdminAccess();
  }, [location.pathname]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Verifying access...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated()) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Redirect to home if not admin
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  // Render children if admin
  return children;
};

/**
 * Higher-Order Component wrapper for admin route protection
 * Can be used to wrap components directly
 * 
 * Usage:
 * const ProtectedAdminPage = withAdminRoute(AdminPage);
 */
export const withAdminRoute = (WrappedComponent) => {
  return function AdminProtectedComponent(props) {
    return (
      <AdminRoute>
        <WrappedComponent {...props} />
      </AdminRoute>
    );
  };
};

export default AdminRoute;
