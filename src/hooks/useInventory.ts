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
  inventory_items?: InventoryItem;
  profiles?: { full_name: string; email: string };
}

export function useInventoryItems(sector?: SectorType) {
  return useQuery({
    queryKey: ['inventory-items', sector],
    queryFn: async () => {
      let query = supabase.from('inventory_items').select('*');
      
      if (sector) {
        query = query.eq('sector', sector);
      }
      
      const { data, error } = await query.order('name');
      
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
          inventory_items (id, name, sector, unit),
          profiles (full_name, email)
        `)
        .order('created_at', { ascending: false });
      
      if (date) {
        const startOfDay = `${date}T00:00:00`;
        const endOfDay = `${date}T23:59:59`;
        query = query.gte('created_at', startOfDay).lte('created_at', endOfDay);
      }
      
      const { data, error } = await query.limit(100);
      
      if (error) throw error;
      return data as StockMovement[];
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
      
      // Extract unique dates
      const dates = new Set<string>();
      data?.forEach(m => {
        const date = m.created_at.split('T')[0];
        dates.add(date);
      });
      
      return Array.from(dates);
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
    mutationFn: async ({ id, ...updates }: Partial<InventoryItem> & { id: string }) => {
      const { data, error } = await supabase
        .from('inventory_items')
        .update(updates)
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
      if (!user) throw new Error('Usuário não autenticado');

      // First get the current item
      const { data: item, error: itemError } = await supabase
        .from('inventory_items')
        .select('quantity')
        .eq('id', itemId)
        .single();

      if (itemError) throw itemError;

      // Calculate new quantity
      const currentQty = Number(item.quantity);
      const newQuantity = movementType === 'entrada'
        ? currentQty + quantity
        : currentQty - quantity;

      if (newQuantity < 0) {
        throw new Error('Quantidade insuficiente em estoque');
      }

      // Insert movement
      const { error: movementError } = await supabase
        .from('stock_movements')
        .insert({
          item_id: itemId,
          user_id: user.id,
          movement_type: movementType,
          quantity,
          notes,
        });

      if (movementError) throw movementError;

      // Update item quantity
      const { error: updateError } = await supabase
        .from('inventory_items')
        .update({ quantity: newQuantity })
        .eq('id', itemId);

      if (updateError) throw updateError;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] });
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
      // First, reverse the quantity change
      const { data: item, error: itemError } = await supabase
        .from('inventory_items')
        .select('quantity')
        .eq('id', movement.item_id)
        .single();

      if (itemError) throw itemError;

      const currentQty = Number(item.quantity);
      // Reverse the movement: if it was entrada, subtract; if saida, add back
      const newQuantity = movement.movement_type === 'entrada'
        ? currentQty - Number(movement.quantity)
        : currentQty + Number(movement.quantity);

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
