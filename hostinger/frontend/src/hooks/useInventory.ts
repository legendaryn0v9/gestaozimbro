import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventory, movements, history, InventoryItem, StockMovement, ProductEditHistory } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useToast } from './use-toast';

export type SectorType = 'bar' | 'cozinha';
export type MovementType = 'entrada' | 'saida' | 'edicao';
export type UnitType = 'unidade' | 'kg' | 'litro' | 'caixa' | 'pacote';

export type { InventoryItem, StockMovement };

export function useInventoryItems(sector?: SectorType) {
  return useQuery({
    queryKey: ['inventory-items', sector],
    queryFn: async () => {
      const result = await inventory.list(sector);
      if (result.error) throw new Error(result.error);
      return result.data as InventoryItem[];
    },
  });
}

export function useStockMovements(date?: string) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['stock-movements', date, user?.id],
    queryFn: async () => {
      const result = await movements.list({ date });
      if (result.error) throw new Error(result.error);
      return result.data as StockMovement[];
    },
    enabled: !!user,
  });
}

export function useMovementDates() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['movement-dates', user?.id],
    queryFn: async () => {
      const result = await movements.getDates();
      if (result.error) throw new Error(result.error);
      return result.data as string[];
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
      // Buscar todas as saídas e calcular ranking
      const result = await movements.list({ type: 'saida', limit: 1000 });
      if (result.error) throw new Error(result.error);
      
      const ranking = new Map<string, { name: string; total: number }>();
      
      result.data?.forEach((movement) => {
        const userId = movement.user_id;
        const name = movement.profiles?.full_name || movement.user_name || 'Desconhecido';
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

// Hook to fetch product edit history
export function useProductEditHistory(date?: string) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['product-edit-history', date, user?.id],
    queryFn: async () => {
      const result = await history.list(date);
      if (result.error) throw new Error(result.error);
      return result.data as ProductEditHistory[];
    },
    enabled: !!user,
  });
}

export function useAddItem() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (item: Omit<InventoryItem, 'id' | 'created_at' | 'updated_at'>) => {
      const result = await inventory.create(item);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
      toast({
        title: 'Item adicionado!',
        description: 'O item foi adicionado ao estoque.',
      });
    },
    onError: (error: Error) => {
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
      const result = await inventory.update(id, { ...item, changes });
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
      queryClient.invalidateQueries({ queryKey: ['product-edit-history'] });
      toast({
        title: 'Item atualizado!',
        description: 'O item foi atualizado com sucesso.',
      });
    },
    onError: (error: Error) => {
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
      const result = await inventory.delete(id);
      if (result.error) throw new Error(result.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
      toast({
        title: 'Item removido!',
        description: 'O item foi removido do estoque.',
      });
    },
    onError: (error: Error) => {
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
      const result = await movements.create({
        item_id: itemId,
        movement_type: movementType,
        quantity,
        notes,
      });
      
      if (result.error) {
        if (result.error.includes('insuficiente')) {
          throw new Error('Quantidade insuficiente em estoque');
        }
        throw new Error(result.error);
      }
      
      return result.data;
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
    onError: (error: Error) => {
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
      const result = await movements.delete(movement.id);
      if (result.error) throw new Error(result.error);
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
    onError: (error: Error) => {
      toast({
        title: 'Erro ao cancelar movimentação',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
