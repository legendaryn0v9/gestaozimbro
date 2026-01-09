import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { useIsAdmin } from '@/hooks/useUserRoles';

export function useLowStockNotifications() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isAdmin } = useIsAdmin();
  const notifiedItems = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!isAdmin) return;

    const channel = supabase
      .channel('inventory-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'inventory_items',
        },
        async (payload) => {
          const newItem = payload.new as any;
          const itemId = newItem.id;
          
          // Check if item is now at or below min_quantity
          if (
            newItem.min_quantity !== null &&
            newItem.quantity <= newItem.min_quantity &&
            !notifiedItems.current.has(itemId)
          ) {
            notifiedItems.current.add(itemId);
            
            toast({
              title: '⚠️ Estoque Baixo!',
              description: `${newItem.name} está com apenas ${newItem.quantity} ${newItem.unit}. Mínimo: ${newItem.min_quantity}`,
              variant: 'destructive',
              duration: 8000,
            });
          }
          
          // If quantity is above min, remove from notified set
          if (newItem.min_quantity !== null && newItem.quantity > newItem.min_quantity) {
            notifiedItems.current.delete(itemId);
          }

          // Invalidate queries to refresh data
          queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAdmin, toast, queryClient]);
}
