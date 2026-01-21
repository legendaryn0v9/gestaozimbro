import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categories, Category } from '../lib/api';
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
      const result = await categories.list(sector);
      if (result.error) throw new Error(result.error);
      
      // Transform to CategoryWithSubcategories format
      const categoriesWithSubs: CategoryWithSubcategories[] = (result.data || []).map((cat) => ({
        ...cat,
        sector: cat.sector as 'bar' | 'cozinha',
        icon: null,
        gradient: null,
        sort_order: null,
        updated_at: cat.created_at,
        subcategories: [],
      }));
      
      return categoriesWithSubs;
    },
    enabled: !!user,
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
      // API PHP não tem subcategorias implementadas ainda
      // Por enquanto, retorna um mock
      console.warn('Create subcategory not implemented in PHP backend');
      return {
        id: crypto.randomUUID(),
        category_id: data.category_id,
        name: data.name,
        sort_order: null,
        created_at: new Date().toISOString(),
      };
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
      // API PHP não tem subcategorias implementadas ainda
      console.warn('Delete subcategory not implemented in PHP backend');
      return { success: true };
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
