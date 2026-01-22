/**
 * Polling “quase realtime” específico para dados de usuários no pacote Hostinger.
 *
 * Mantemos separado do polling de inventário para evitar muitas invalidações
 * desnecessárias (principalmente no iPhone, onde isso pode travar a aba).
 */

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export function useRealtimeUsers() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const intervalMs = 4000;

    let timeoutId: number | undefined;
    let destroyed = false;

    const invalidate = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;

      queryClient.invalidateQueries({ queryKey: ['all-users-roles'] });
      queryClient.invalidateQueries({ queryKey: ['admin-actions'] });
    };

    const tick = () => {
      if (destroyed) return;
      invalidate();
      timeoutId = window.setTimeout(tick, intervalMs);
    };

    timeoutId = window.setTimeout(tick, intervalMs);

    const onVisibility = () => {
      invalidate();
    };

    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      destroyed = true;
      if (timeoutId) window.clearTimeout(timeoutId);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [queryClient]);
}
