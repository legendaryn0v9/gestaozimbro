import { useQuery } from '@tanstack/react-query';
import { categories, Category } from '../lib/api';
import { useAuth } from '../lib/auth';

export function useCategories(sector?: string) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['categories', sector],
    queryFn: async () => {
      const result = await categories.list(sector);
      if (result.error) throw new Error(result.error);
      return result.data as Category[];
    },
    enabled: !!user,
  });
}
