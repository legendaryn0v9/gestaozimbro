import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../lib/auth';
import { users, User } from '../lib/api';
import { useToast } from './use-toast';

export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export function useCurrentUserProfile(userId?: string) {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;
  
  return useQuery({
    queryKey: ['user-profile', targetUserId],
    queryFn: async () => {
      if (!targetUserId) return null;
      
      // If it's the current user, return from auth context
      if (user && user.id === targetUserId) {
        return {
          id: user.id,
          full_name: user.full_name,
          email: user.email,
          avatar_url: user.avatar_url || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as UserProfile;
      }
      
      // Otherwise fetch from API
      const result = await users.list();
      if (result.error) throw new Error(result.error);
      
      const foundUser = result.data?.find((u: User) => u.id === targetUserId);
      if (!foundUser) return null;
      
      return {
        id: foundUser.id,
        full_name: foundUser.full_name,
        email: foundUser.email,
        avatar_url: foundUser.avatar_url || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as UserProfile;
    },
    enabled: !!targetUserId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
    retryDelay: 1000,
  });
}

export function useUpdateProfileAvatar() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ userId, avatarUrl }: { userId: string; avatarUrl: string | null }) => {
      // PHP backend doesn't have a dedicated avatar endpoint yet
      // We update the user with the avatar URL
      const result = await users.update(userId, { avatar_url: avatarUrl } as any);
      if (result.error) throw new Error(result.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      queryClient.invalidateQueries({ queryKey: ['all-users-roles'] });
      toast({
        title: 'Foto atualizada!',
        description: 'A foto do perfil foi atualizada com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao atualizar foto',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Note: This function is a stub for Hostinger.
// Real file upload would need a PHP backend endpoint for file storage.
// For now, it returns a placeholder or uses an external image URL.
export async function uploadAvatar(userId: string, file: File): Promise<string> {
  // In a real implementation, you would:
  // 1. Create a PHP endpoint to handle file uploads
  // 2. Send the file via FormData
  // 3. Store the file on the server and return the URL
  
  // For now, we'll convert to base64 data URL for small images
  // or throw an error if the file is too large
  
  const maxSizeMB = 1;
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  
  if (file.size > maxSizeBytes) {
    throw new Error(`O arquivo é muito grande. Máximo permitido: ${maxSizeMB}MB`);
  }
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      // Return base64 data URL
      resolve(reader.result as string);
    };
    reader.onerror = () => {
      reject(new Error('Erro ao processar a imagem'));
    };
    reader.readAsDataURL(file);
  });
}
