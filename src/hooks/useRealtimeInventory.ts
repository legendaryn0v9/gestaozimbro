import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useRealtimeInventory() {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Subscribe to inventory_items changes
    const inventoryChannel = supabase
      .channel('inventory-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'inventory_items',
        },
        (payload) => {
          console.log('Inventory item changed:', payload);
          // Invalidate all inventory queries to refresh data
          queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'stock_movements',
        },
        (payload) => {
          console.log('Stock movement changed:', payload);
          // Invalidate movement queries
          queryClient.invalidateQueries({ queryKey: ['stock-movements'] });
          queryClient.invalidateQueries({ queryKey: ['movement-dates'] });
          queryClient.invalidateQueries({ queryKey: ['employee-ranking'] });
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
      });

    return () => {
      supabase.removeChannel(inventoryChannel);
    };
  }, [queryClient]);
}
