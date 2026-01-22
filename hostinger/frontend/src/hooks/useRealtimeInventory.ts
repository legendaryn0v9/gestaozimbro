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
    // IMPORTANTE (iPhone/iOS): polling agressivo + blur/backdrop-filter pode causar travamentos
    // e até “crash” do WebView. Aqui fazemos polling mais leve e só quando a aba está visível.
    const intervalMs = 4000;

    let timeoutId: number | undefined;
    let destroyed = false;

    const invalidate = () => {
      // Só faz sentido atualizar se a aba estiver visível.
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;

      // Somente dados do inventário (evita tempestade de requests em telas que não precisam)
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] });
      queryClient.invalidateQueries({ queryKey: ['movement-dates'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['subcategories'] });
      queryClient.invalidateQueries({ queryKey: ['branding'] });
    };

    const tick = () => {
      if (destroyed) return;
      invalidate();
      timeoutId = window.setTimeout(tick, intervalMs);
    };

    // Primeira atualização um pouco depois do mount (evita pico logo após navegar)
    timeoutId = window.setTimeout(tick, intervalMs);

    const onVisibility = () => {
      // Ao voltar pra aba, atualiza na hora.
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
