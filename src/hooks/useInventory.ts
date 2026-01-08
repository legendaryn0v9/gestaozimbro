import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryApi, movementsApi } from '@/lib/api';
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
  inventory_items?: InventoryItem;
  profiles?: { full_name: string; email: string };
}

export function useInventoryItems(sector?: SectorType) {
  return useQuery({
    queryKey: ['inventory-items', sector],
    queryFn: async () => {
      const items = await inventoryApi.list(sector);
      return items as InventoryItem[];
    },
  });
}

export function useStockMovements(date?: string) {
  return useQuery({
    queryKey: ['stock-movements', date],
    queryFn: async () => {
      const movements = await movementsApi.list({ limit: 100 });
      
      // Filter by date if provided
      if (date) {
        return movements.filter(m => m.created_at.startsWith(date)) as StockMovement[];
      }
      
      return movements as StockMovement[];
    },
  });
}

export function useMovementDates() {
  return useQuery({
    queryKey: ['movement-dates'],
    queryFn: async () => {
      const movements = await movementsApi.list({ limit: 1000 });
      
      // Extract unique dates
      const dates = new Set<string>();
      movements?.forEach(m => {
        const date = m.created_at.split('T')[0];
        dates.add(date);
      });
      
      return Array.from(dates);
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
      const movements = await movementsApi.list({ type: 'saida', limit: 1000 });

      // Aggregate by user
      const userStats: Record<string, { full_name: string; total: number }> = {};
      
      movements?.forEach(m => {
        const userId = m.user_id;
        const fullName = m.user_name || 'Usuário';
        
        if (!userStats[userId]) {
          userStats[userId] = { full_name: fullName, total: 0 };
        }
        userStats[userId].total += Number(m.quantity);
      });

      // Convert to array and sort
      const ranking: EmployeeRanking[] = Object.entries(userStats)
        .map(([user_id, stats]) => ({
          user_id,
          full_name: stats.full_name,
          total_saidas: stats.total,
        }))
        .sort((a, b) => b.total_saidas - a.total_saidas)
        .slice(0, 5);

      return ranking;
    },
  });
}

export function useAddItem() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (item: Omit<InventoryItem, 'id' | 'created_at' | 'updated_at'>) => {
      return await inventoryApi.create({
        name: item.name,
        description: item.description || undefined,
        quantity: item.quantity,
        min_quantity: item.min_quantity || undefined,
        unit: item.unit,
        sector: item.sector,
        category: item.category || undefined,
        image_url: item.image_url || undefined,
      });
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
      return await inventoryApi.update(id, updates);
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
      await inventoryApi.delete(id);
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

      return await movementsApi.create({
        item_id: itemId,
        movement_type: movementType,
        quantity,
        notes,
      });
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
      await movementsApi.delete(movement.id);
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
