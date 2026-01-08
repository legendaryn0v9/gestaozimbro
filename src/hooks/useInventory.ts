import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';

export type SectorType = 'bar' | 'cozinha';
export type MovementType = 'entrada' | 'saida';
export type UnitType = 'unidade' | 'kg' | 'litro' | 'caixa' | 'pacote';

export interface InventoryItem {
  id: string;
  name: string;
  description: string | null;
  sector: SectorType;
  unit: UnitType;
  quantity: number;
  min_quantity: number | null;
  category: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface StockMovement {
  id: string;
  item_id: string;
  user_id: string;
  movement_type: MovementType;
  quantity: number;
  notes: string | null;
  created_at: string;
  item_name?: string;
  user_name?: string;
  sector?: string;
  inventory_items?: {
    name: string;
    sector: SectorType;
    unit: UnitType;
  };
  profiles?: {
    full_name: string;
  };
}

export function useInventoryItems(sector?: SectorType) {
  return useQuery({
    queryKey: ['inventory-items', sector],
    queryFn: async () => {
      let query = supabase
        .from('inventory_items')
        .select('*')
        .order('category')
        .order('name');

      if (sector) {
        query = query.eq('sector', sector);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as InventoryItem[];
    },
  });
}

export function useStockMovements(date?: string) {
  return useQuery({
    queryKey: ['stock-movements', date],
    queryFn: async () => {
      let query = supabase
        .from('stock_movements')
        .select(`
          *,
          inventory_items!inner(name, sector, unit),
          profiles!inner(full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (date) {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);
        
        query = query
          .gte('created_at', startOfDay.toISOString())
          .lte('created_at', endOfDay.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;

      return data?.map(movement => ({
        id: movement.id,
        item_id: movement.item_id,
        user_id: movement.user_id,
        movement_type: movement.movement_type,
        quantity: movement.quantity,
        notes: movement.notes,
        created_at: movement.created_at,
        item_name: (movement.inventory_items as any)?.name,
        user_name: (movement.profiles as any)?.full_name,
        sector: (movement.inventory_items as any)?.sector,
        inventory_items: movement.inventory_items as any,
        profiles: movement.profiles as any,
      })) as StockMovement[];
    },
  });
}

export function useMovementDates() {
  return useQuery({
    queryKey: ['movement-dates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stock_movements')
        .select('created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const uniqueDates = [...new Set(
        data?.map(m => new Date(m.created_at).toISOString().split('T')[0])
      )];

      return uniqueDates;
    },
  });
}

export interface EmployeeRanking {
  user_id: string;
  full_name: string;
  total_saidas: number;
}

export function useEmployeeRanking() {
  return useQuery({
    queryKey: ['employee-ranking'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stock_movements')
        .select(`
          user_id,
          quantity,
          movement_type,
          profiles!inner(full_name)
        `)
        .eq('movement_type', 'saida');

      if (error) throw error;

      const ranking = new Map<string, { name: string; total: number }>();

      data?.forEach(movement => {
        const userId = movement.user_id;
        const name = (movement.profiles as any)?.full_name || 'Desconhecido';
        const current = ranking.get(userId) || { name, total: 0 };
        current.total += Number(movement.quantity);
        ranking.set(userId, current);
      });

      return Array.from(ranking.entries())
        .map(([user_id, data]) => ({ 
          user_id, 
          full_name: data.name, 
          total_saidas: data.total 
        }))
        .sort((a, b) => b.total_saidas - a.total_saidas)
        .slice(0, 5);
    },
  });
}

export function useAddItem() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (item: Omit<InventoryItem, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('inventory_items')
        .insert(item)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
      toast({
        title: 'Item adicionado!',
        description: 'O item foi adicionado ao estoque.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao adicionar item',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateItem() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...item }: Partial<InventoryItem> & { id: string }) => {
      const { data, error } = await supabase
        .from('inventory_items')
        .update(item)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
      toast({
        title: 'Item atualizado!',
        description: 'O item foi atualizado com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao atualizar item',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteItem() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('inventory_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
      toast({
        title: 'Item removido!',
        description: 'O item foi removido do estoque.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao remover item',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useAddMovement() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      itemId,
      movementType,
      quantity,
      notes,
    }: {
      itemId: string;
      movementType: MovementType;
      quantity: number;
      notes?: string;
    }) => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      // Get current item quantity
      const { data: item, error: itemError } = await supabase
        .from('inventory_items')
        .select('quantity')
        .eq('id', itemId)
        .single();

      if (itemError) throw itemError;

      // Calculate new quantity
      const currentQty = Number(item.quantity);
      const movementQty = Number(quantity);
      const newQuantity = movementType === 'entrada'
        ? currentQty + movementQty
        : currentQty - movementQty;

      if (newQuantity < 0) {
        throw new Error('Quantidade insuficiente em estoque');
      }

      // Update item quantity
      const { error: updateError } = await supabase
        .from('inventory_items')
        .update({ quantity: newQuantity })
        .eq('id', itemId);

      if (updateError) throw updateError;

      // Insert movement
      const { data, error } = await supabase
        .from('stock_movements')
        .insert({
          item_id: itemId,
          user_id: user.id,
          movement_type: movementType,
          quantity: movementQty,
          notes: notes || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] });
      queryClient.invalidateQueries({ queryKey: ['movement-dates'] });
      queryClient.invalidateQueries({ queryKey: ['employee-ranking'] });
      toast({
        title: variables.movementType === 'entrada' ? 'Entrada registrada!' : 'Saída registrada!',
        description: 'A movimentação foi registrada com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao registrar movimentação',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useCancelMovement() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (movement: StockMovement) => {
      // Get current item quantity
      const { data: item, error: itemError } = await supabase
        .from('inventory_items')
        .select('quantity')
        .eq('id', movement.item_id)
        .single();

      if (itemError) throw itemError;

      // Calculate reversed quantity
      const currentQty = Number(item.quantity);
      const movementQty = Number(movement.quantity);
      const newQuantity = movement.movement_type === 'entrada'
        ? currentQty - movementQty
        : currentQty + movementQty;

      if (newQuantity < 0) {
        throw new Error('Não é possível cancelar: resultaria em estoque negativo');
      }

      // Update item quantity
      const { error: updateError } = await supabase
        .from('inventory_items')
        .update({ quantity: newQuantity })
        .eq('id', movement.item_id);

      if (updateError) throw updateError;

      // Delete the movement
      const { error: deleteError } = await supabase
        .from('stock_movements')
        .delete()
        .eq('id', movement.id);

      if (deleteError) throw deleteError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] });
      queryClient.invalidateQueries({ queryKey: ['movement-dates'] });
      queryClient.invalidateQueries({ queryKey: ['employee-ranking'] });
      toast({
        title: 'Movimentação cancelada!',
        description: 'A movimentação foi revertida com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao cancelar movimentação',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
