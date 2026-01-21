/**
 * Hook de realtime para Hostinger
 * Versão simplificada que usa polling ao invés de WebSocket
 * pois o PHP não suporta realtime como o Supabase
 */

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export function useRealtimeInventory() {
  const queryClient = useQueryClient();

  useEffect(() => {
    // No Hostinger usamos polling (aqui: 5s) para simular atualizações em tempo real
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] });
      queryClient.invalidateQueries({ queryKey: ['movement-dates'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['subcategories'] });
      queryClient.invalidateQueries({ queryKey: ['all-users-roles'] });
      queryClient.invalidateQueries({ queryKey: ['admin-actions'] });
      queryClient.invalidateQueries({ queryKey: ['branding'] });
    }, 5000);

    return () => {
      clearInterval(interval);
    };
  }, [queryClient]);
}
