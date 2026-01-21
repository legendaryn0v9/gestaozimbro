import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { branding, uploads, BrandingSettings } from '@/lib/api';
import { useAuth } from '@/lib/auth';

export function useBranding() {
  // Branding is needed on /auth as well, so don't require user.
  return useQuery({
    queryKey: ['branding'],
    queryFn: async () => {
      const res = await branding.get();
      if (res.error) throw new Error(res.error);
      return res.data as BrandingSettings;
    },
    staleTime: 10_000,
    retry: 0,
  });
}

export function useUploadLogo() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ type, file }: { type: 'dashboard' | 'login'; file: File }) => {
      if (!user) throw new Error('Usuário não autenticado');
      const res = await uploads.uploadLogo(type, file);
      if (res.error) throw new Error(res.error);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branding'] });
    },
  });
}
