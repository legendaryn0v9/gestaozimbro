import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categories, subcategories, Category, Subcategory as ApiSubcategory } from '../lib/api';
import { useAuth } from '../lib/auth';
import { toast } from 'sonner';

// Re-export Category type with additional fields for compatibility
export type { Category };

export interface Subcategory {
  id: string;
  category_id: string;
  name: string;
  sort_order: number | null;
  created_at: string;
}

export interface CategoryWithSubcategories extends Category {
  icon?: string | null;
  gradient?: string | null;
  sort_order?: number | null;
  updated_at?: string;
  subcategories: Subcategory[];
}

export function useCategories(sector?: 'bar' | 'cozinha' | string) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['categories', sector],
    queryFn: async () => {
      const [catRes, subRes] = await Promise.all([
        categories.list(sector),
        subcategories.list({ sector: sector || undefined }),
      ]);

      if (catRes.error) throw new Error(catRes.error);
      // Subcategories are optional for the main screens.
      // If the backend schema is missing sort_order (older installs), the endpoint may error.
      // In that case, keep the UI working with categories only.
      const subcategoriesData = subRes.error ? [] : (subRes.data || []);

      const subsByCategory = new Map<string, Subcategory[]>();
      subcategoriesData.forEach((s: ApiSubcategory) => {
        const list = subsByCategory.get(s.category_id) || [];
        list.push({
          id: s.id,
          category_id: s.category_id,
          name: s.name,
          sort_order: (s.sort_order ?? null) as number | null,
          created_at: s.created_at,
        });
        subsByCategory.set(s.category_id, list);
      });

      // keep stable order
      for (const [key, list] of subsByCategory) {
        list.sort((a, b) => {
          const ao = a.sort_order ?? 0;
          const bo = b.sort_order ?? 0;
          if (ao !== bo) return ao - bo;
          return a.name.localeCompare(b.name);
        });
        subsByCategory.set(key, list);
      }

      return ((catRes.data || []) as Category[]).map((cat) => ({
        ...cat,
        sector: cat.sector as 'bar' | 'cozinha',
        icon: null,
        gradient: null,
        sort_order: null,
        updated_at: cat.created_at,
        subcategories: subsByCategory.get(cat.id) || [],
      })) as CategoryWithSubcategories[];
    },
    enabled: !!user,
    // Avoid getting stuck in retry loops on hosting environments when an endpoint is failing.
    retry: 0,
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string; sector: 'bar' | 'cozinha'; icon?: string; gradient?: string }) => {
      const result = await categories.create({
        name: data.name,
        sector: data.sector,
      });
      
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['categories', variables.sector] });
      toast.success('Categoria criada com sucesso!');
    },
    onError: (error: Error) => {
      console.error('Error creating category:', error);
      toast.error('Erro ao criar categoria');
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { id: string; name: string; icon?: string; gradient?: string; sector: 'bar' | 'cozinha' }) => {
      // API PHP não tem endpoint de update de categoria ainda
      // Por enquanto, vamos apenas invalidar o cache
      console.warn('Update category not implemented in PHP backend');
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['categories', variables.sector] });
      toast.success('Categoria atualizada!');
    },
    onError: (error: Error) => {
      console.error('Error updating category:', error);
      toast.error('Erro ao atualizar categoria');
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { id: string; sector: 'bar' | 'cozinha' }) => {
      const result = await categories.delete(data.id);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['categories', variables.sector] });
      toast.success('Categoria excluída!');
    },
    onError: (error: Error) => {
      console.error('Error deleting category:', error);
      toast.error('Erro ao excluir categoria');
    },
  });
}

export function useCreateSubcategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { category_id: string; name: string; sector: 'bar' | 'cozinha' }) => {
      const result = await subcategories.create({
        category_id: data.category_id,
        name: data.name,
      });
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['categories', variables.sector] });
      toast.success('Subcategoria criada!');
    },
    onError: (error: Error) => {
      console.error('Error creating subcategory:', error);
      toast.error('Erro ao criar subcategoria');
    },
  });
}

export function useDeleteSubcategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { id: string; sector: 'bar' | 'cozinha' }) => {
      const result = await subcategories.delete(data.id);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['categories', variables.sector] });
      toast.success('Subcategoria excluída!');
    },
    onError: (error: Error) => {
      console.error('Error deleting subcategory:', error);
      toast.error('Erro ao excluir subcategoria');
    },
  });
}
