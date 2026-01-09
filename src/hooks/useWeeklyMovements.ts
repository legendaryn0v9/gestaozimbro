import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { format, subDays } from 'date-fns';

interface DailyMovement {
  date: string;
  dateLabel: string;
  entradas: number;
  saidas: number;
  valorEntradas: number;
  valorSaidas: number;
}

export function useWeeklyMovements() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['weekly-movements', user?.id],
    queryFn: async () => {
      const today = new Date();
      const sevenDaysAgo = subDays(today, 6);
      
      const { data, error } = await supabase
        .from('stock_movements')
        .select(`
          created_at,
          movement_type,
          quantity,
          inventory_items(price)
        `)
        .gte('created_at', sevenDaysAgo.toISOString())
        .lte('created_at', today.toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Group by day
      const dailyData = new Map<string, DailyMovement>();
      
      // Initialize all 7 days
      for (let i = 6; i >= 0; i--) {
        const date = subDays(today, i);
        const dateStr = format(date, 'yyyy-MM-dd');
        const dateLabel = format(date, 'dd/MM');
        dailyData.set(dateStr, {
          date: dateStr,
          dateLabel,
          entradas: 0,
          saidas: 0,
          valorEntradas: 0,
          valorSaidas: 0,
        });
      }

      // Aggregate movements
      data?.forEach(movement => {
        const dateStr = format(new Date(movement.created_at), 'yyyy-MM-dd');
        const existing = dailyData.get(dateStr);
        
        if (existing) {
          const price = Number((movement.inventory_items as any)?.price) || 0;
          const value = price * Number(movement.quantity);
          
          if (movement.movement_type === 'entrada') {
            existing.entradas += Number(movement.quantity);
            existing.valorEntradas += value;
          } else {
            existing.saidas += Number(movement.quantity);
            existing.valorSaidas += value;
          }
        }
      });

      return Array.from(dailyData.values());
    },
    enabled: !!user,
  });
}

export function useTotalStockValue() {
  return useQuery({
    queryKey: ['total-stock-value'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('quantity, price');

      if (error) throw error;

      const totalValue = data?.reduce((sum, item) => {
        return sum + (Number(item.quantity) * Number(item.price));
      }, 0) || 0;

      const totalItems = data?.reduce((sum, item) => sum + Number(item.quantity), 0) || 0;

      return { totalValue, totalItems };
    },
  });
}
