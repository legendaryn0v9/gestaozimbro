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
    // No Hostinger usamos polling a cada 30 segundos 
    // para simular atualizações em tempo real
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] });
    }, 30000);

    return () => {
      clearInterval(interval);
    };
  }, [queryClient]);
}
