import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';

export function useUserSector() {
  const { user } = useAuth();

  const { data: sector, isLoading } = useQuery({
    queryKey: ['user-sector', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('sector')
        .eq('id', user.id)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching user sector:', error);
        return null;
      }
      
      return data?.sector as 'bar' | 'cozinha' | null;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes cache
    retry: 2,
    retryDelay: 1000,
  });

  return {
    sector,
    isLoading,
    canAccessBar: sector === 'bar' || sector === null, // null = admin/todos
    canAccessCozinha: sector === 'cozinha' || sector === null,
  };
}
