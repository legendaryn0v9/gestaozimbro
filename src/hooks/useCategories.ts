import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Category {
  id: string;
  name: string;
  sector: 'bar' | 'cozinha';
  icon: string | null;
  gradient: string | null;
  sort_order: number | null;
  created_at: string;
  updated_at: string;
}

export interface Subcategory {
  id: string;
  category_id: string;
  name: string;
  sort_order: number | null;
  created_at: string;
}

export interface CategoryWithSubcategories extends Category {
  subcategories: Subcategory[];
}

export function useCategories(sector: 'bar' | 'cozinha') {
  return useQuery({
    queryKey: ['categories', sector],
    queryFn: async () => {
      const { data: categories, error: catError } = await supabase
        .from('categories')
        .select('*')
        .eq('sector', sector)
        .order('sort_order', { ascending: true });

      if (catError) throw catError;

      const { data: subcategories, error: subError } = await supabase
        .from('subcategories')
        .select('*')
        .order('sort_order', { ascending: true });

      if (subError) throw subError;

      // Combine categories with their subcategories
      const categoriesWithSubs: CategoryWithSubcategories[] = (categories || []).map((cat) => ({
        ...cat,
        sector: cat.sector as 'bar' | 'cozinha',
        subcategories: (subcategories || []).filter((sub) => sub.category_id === cat.id),
      }));

      return categoriesWithSubs;
    },
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string; sector: 'bar' | 'cozinha'; icon?: string; gradient?: string }) => {
      const { data: category, error } = await supabase
        .from('categories')
        .insert({
          name: data.name,
          sector: data.sector,
          icon: data.icon || 'Package',
          gradient: data.gradient || 'from-amber-500 to-orange-600',
        })
        .select()
        .single();

      if (error) throw error;
      return category;
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
      const { error } = await supabase
        .from('categories')
        .update({
          name: data.name,
          icon: data.icon,
          gradient: data.gradient,
        })
        .eq('id', data.id);

      if (error) throw error;
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
      const { error } = await supabase.from('categories').delete().eq('id', data.id);
      if (error) throw error;
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
      const { data: subcategory, error } = await supabase
        .from('subcategories')
        .insert({
          category_id: data.category_id,
          name: data.name,
        })
        .select()
        .single();

      if (error) throw error;
      return subcategory;
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
      const { error } = await supabase.from('subcategories').delete().eq('id', data.id);
      if (error) throw error;
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
