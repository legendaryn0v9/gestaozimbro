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
        .single();
      
      if (error) {
        console.error('Error fetching user sector:', error);
        return null;
      }
      
      return data?.sector as 'bar' | 'cozinha' | null;
    },
    enabled: !!user?.id,
  });

  return {
    sector,
    isLoading,
    canAccessBar: sector === 'bar' || sector === null, // null = admin/todos
    canAccessCozinha: sector === 'cozinha' || sector === null,
  };
}
