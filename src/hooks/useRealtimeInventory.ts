import { useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useRealtimeInventory() {
  const queryClient = useQueryClient();

  // Force refetch all inventory-related queries
  const invalidateAllInventory = useCallback(() => {
    console.log('Invalidating all inventory queries...');
    // Invalidate with exact: false to match all queries starting with these keys
    queryClient.invalidateQueries({ queryKey: ['inventory-items'], refetchType: 'all' });
    queryClient.invalidateQueries({ queryKey: ['stock-movements'], refetchType: 'all' });
    queryClient.invalidateQueries({ queryKey: ['movement-dates'], refetchType: 'all' });
    queryClient.invalidateQueries({ queryKey: ['employee-ranking'], refetchType: 'all' });
  }, [queryClient]);

  useEffect(() => {
    console.log('Setting up realtime subscription...');
    
    // Subscribe to inventory_items changes
    const inventoryChannel = supabase
      .channel('inventory-realtime-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'inventory_items',
        },
        (payload) => {
          console.log('Inventory item changed:', payload);
          // Force immediate refetch of all inventory queries
          invalidateAllInventory();
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
          // Force immediate refetch of all related queries
          invalidateAllInventory();
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to realtime updates');
        }
        if (status === 'CHANNEL_ERROR') {
          console.error('Error subscribing to realtime channel');
        }
      });

    return () => {
      console.log('Cleaning up realtime subscription...');
      supabase.removeChannel(inventoryChannel);
    };
  }, [queryClient, invalidateAllInventory]);
}
