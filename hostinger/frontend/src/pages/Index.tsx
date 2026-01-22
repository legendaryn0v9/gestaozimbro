import { useAuth } from '@/lib/auth';
import { Navigate } from 'react-router-dom';
import { useCurrentUserRole } from '@/hooks/useUserRoles';
import { useState, useEffect } from 'react';
import Dashboard from './Dashboard';

export default function Index() {
  const { user, loading } = useAuth();
  const { data: userRole, isLoading: isLoadingRole } = useCurrentUserRole();
  const [mounted, setMounted] = useState(false);

  // Ensure theme is applied before rendering
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || loading || isLoadingRole) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'hsl(30, 10%, 8%)' }}>
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-amber mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Check if this is the super admin (hidden admin for system formatting)
  const isSuperAdmin = userRole?.role === 'admin' || userRole?.role === 'dono';
  
  if (isSuperAdmin && user?.email === 'admin@superadmin.local') {
    return <Navigate to="/admin-format" replace />;
  }

  return <Dashboard />;
}
