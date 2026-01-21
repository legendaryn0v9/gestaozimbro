import { useAuth } from '../lib/auth';

export function useUserSector() {
  const { user } = useAuth();

  // IMPORTANT: only 'funcionario' has a fixed sector restriction.
  // Admin/Dono (gestor) must be able to access BOTH sectors.
  const sector = user?.role === 'funcionario'
    ? ((user?.sector as 'bar' | 'cozinha') || null)
    : null;
  
  return {
    sector,
    isLoading: false,
    canAccessBar: sector === 'bar' || sector === null, // null = admin/todos
    canAccessCozinha: sector === 'cozinha' || sector === null,
  };
}
