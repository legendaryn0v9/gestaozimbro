import { useAuth } from '@/lib/auth';
import { Navigate } from 'react-router-dom';
import { useCurrentUserRole } from '@/hooks/useUserRoles';
import Dashboard from './Dashboard';

export default function Index() {
  const { user, loading } = useAuth();
  const { data: userRole, isLoading: isLoadingRole } = useCurrentUserRole();

  if (loading || isLoadingRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
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
  const isSuperAdmin = userRole?.role === 'admin' && user?.user_metadata?.is_super_admin === true;
  
  if (isSuperAdmin) {
    return <Navigate to="/admin-format" replace />;
  }

  return <Dashboard />;
}
