import { useAuth } from '../lib/auth';

export function useUserSector() {
  const { user } = useAuth();
  
  const sector = (user?.sector as 'bar' | 'cozinha') || null;
  
  return {
    sector,
    isLoading: false,
    canAccessBar: sector === 'bar' || sector === null, // null = admin/todos
    canAccessCozinha: sector === 'cozinha' || sector === null,
  };
}
