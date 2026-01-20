import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../lib/auth';
import { User } from '../lib/api';

export function useCurrentUserProfile() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      return user as User & { avatar_url?: string };
    },
    enabled: !!user,
  });
}
