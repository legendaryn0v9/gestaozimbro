import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../lib/auth';

export function useCurrentUserRole() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['user-role', user?.id],
    queryFn: async () => {
      if (!user) return null;
      return { role: user.role };
    },
    enabled: !!user,
  });
}

export function useIsAdmin() {
  const { user } = useAuth();
  return user?.role === 'admin' || user?.role === 'dono';
}

export function useIsDono() {
  const { user } = useAuth();
  return user?.role === 'dono';
}
