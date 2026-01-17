import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';

export type SectorType = 'bar' | 'cozinha';
export type MovementType = 'entrada' | 'saida' | 'edicao';
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
  price: number;
  created_at: string;
  updated_at: string;
}

export interface StockMovement {
  id: string;
  item_id: string | null;
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
    price: number;
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
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['stock-movements', date, user?.id],
    queryFn: async () => {
      let query = supabase
        .from('stock_movements')
        .select(`
          *,
          inventory_items(name, sector, unit, price),
          profiles(full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (date) {
        const [y, m, d] = date.split('-').map(Number);
        // Create boundaries in *local* time to match what user sees in the UI
        const startOfDay = new Date(y, (m ?? 1) - 1, d ?? 1, 0, 0, 0, 0);
        const endOfDay = new Date(y, (m ?? 1) - 1, d ?? 1, 23, 59, 59, 999);

        query = query
          .gte('created_at', startOfDay.toISOString())
          .lte('created_at', endOfDay.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;

      return data?.map(movement => {
        // Use snapshot data if item was deleted, otherwise use live data
        const itemData = movement.inventory_items as any;
        const itemName = itemData?.name || (movement as any).item_name_snapshot || 'Item excluído';
        const itemSector = itemData?.sector || (movement as any).item_sector;
        const itemUnit = itemData?.unit || (movement as any).item_unit;
        const itemPrice = itemData?.price ?? (movement as any).item_price ?? 0;
        
        return {
          id: movement.id,
          item_id: movement.item_id,
          user_id: movement.user_id,
          movement_type: movement.movement_type,
          quantity: movement.quantity,
          notes: movement.notes,
          created_at: movement.created_at,
          item_name: itemName,
          user_name: (movement.profiles as any)?.full_name,
          sector: itemSector,
          inventory_items: itemData || {
            name: itemName,
            sector: itemSector,
            unit: itemUnit,
            price: itemPrice,
          },
          profiles: movement.profiles as any,
        };
      }) as StockMovement[];
    },
    enabled: !!user,
  });
}

export function useMovementDates() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['movement-dates', user?.id],
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
    enabled: !!user,
  });
}

export interface EmployeeRanking {
  user_id: string;
  full_name: string;
  total_saidas: number;
}

export function useEmployeeRanking() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['employee-ranking', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stock_movements')
        .select(`
          user_id,
          quantity,
          movement_type,
          profiles(full_name)
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
    enabled: !!user,
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
    mutationFn: async ({ 
      id, 
      changes,
      ...item 
    }: Partial<InventoryItem> & { 
      id: string; 
      changes?: Array<{ field: string; oldValue: string; newValue: string }>;
    }) => {
      const { data, error } = await supabase
        .from('inventory_items')
        .update(item)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Log changes to history if provided
      if (changes && changes.length > 0) {
        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user) {
          const historyRecords = changes.map(change => ({
            item_id: id,
            user_id: userData.user.id,
            item_name_snapshot: data.name,
            field_changed: change.field,
            old_value: change.oldValue,
            new_value: change.newValue,
          }));

          await supabase.from('product_edit_history').insert(historyRecords);
        }
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
      queryClient.invalidateQueries({ queryKey: ['product-edit-history'] });
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

// Hook to fetch product edit history
export function useProductEditHistory(date?: string) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['product-edit-history', date, user?.id],
    queryFn: async () => {
      let query = supabase
        .from('product_edit_history')
        .select(`
          *,
          profiles(full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (date) {
        const [y, m, d] = date.split('-').map(Number);
        const startOfDay = new Date(y, (m ?? 1) - 1, d ?? 1, 0, 0, 0, 0);
        const endOfDay = new Date(y, (m ?? 1) - 1, d ?? 1, 23, 59, 59, 999);

        query = query
          .gte('created_at', startOfDay.toISOString())
          .lte('created_at', endOfDay.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;

      return data?.map(record => ({
        ...record,
        user_name: (record.profiles as any)?.full_name || 'Desconhecido',
      }));
    },
    enabled: !!user,
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
      // Use the atomic database function to record movement and update quantity
      const { data, error } = await supabase.rpc('record_stock_movement', {
        _item_id: itemId,
        _movement_type: movementType,
        _quantity: quantity,
        _notes: notes || null,
      });

      if (error) {
        // Handle specific error messages from the database function
        if (error.message.includes('Estoque insuficiente')) {
          throw new Error('Quantidade insuficiente em estoque');
        }
        if (error.message.includes('Item não encontrado')) {
          throw new Error('Item não encontrado');
        }
        if (error.message.includes('Usuário não autenticado')) {
          throw new Error('Usuário não autenticado');
        }
        throw error;
      }
      
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
