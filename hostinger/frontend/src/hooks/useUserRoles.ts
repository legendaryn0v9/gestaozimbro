import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { users, admin, User } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useToast } from './use-toast';

export type AppRole = 'admin' | 'funcionario' | 'dono';

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

export interface UserWithRole {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  phone: string | null;
  sector: 'bar' | 'cozinha' | null;
  role: AppRole;
  role_id: string;
}

export function useCurrentUserRole() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['user-role', user?.id],
    queryFn: async () => {
      if (!user) return null;
      return { 
        id: user.id,
        user_id: user.id,
        role: user.role as AppRole,
        created_at: new Date().toISOString(),
      } as UserRole;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useIsAdmin() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'dono';
  return { isAdmin, isLoading: false };
}

export function useIsDono() {
  const { user } = useAuth();
  const isDono = user?.role === 'dono';
  return { isDono, isLoading: false };
}

export function useIsGestorOrDono() {
  const { user } = useAuth();
  const isGestorOrDono = user?.role === 'admin' || user?.role === 'dono';
  return { isGestorOrDono, isLoading: false };
}

export function useCurrentRole() {
  const { user } = useAuth();
  return {
    role: (user?.role as AppRole) || null,
    isLoading: false,
  };
}

export function useAllUsersWithRoles() {
  return useQuery({
    queryKey: ['all-users-roles'],
    queryFn: async () => {
      const result = await users.list();
      if (result.error) throw new Error(result.error);
      
      return (result.data || []).map((user: User) => ({
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        avatar_url: user.avatar_url || null,
        phone: user.phone || null,
        sector: (user.sector as 'bar' | 'cozinha') || null,
        role: (user.role as AppRole) || 'funcionario',
        role_id: user.id,
      })) as UserWithRole[];
    },
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ userId, newRole, userName, oldRole }: { userId: string; newRole: AppRole; userName?: string; oldRole?: AppRole }) => {
      const result = await users.updateRole(userId, newRole);
      if (result.error) throw new Error(result.error);
      
      // Log the action
      if (user) {
        await admin.logAction({
          action_type: 'update_role',
          target_user_id: userId,
          details: JSON.stringify({ old_role: oldRole, new_role: newRole, user_name: userName }),
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-users-roles'] });
      queryClient.invalidateQueries({ queryKey: ['user-role'] });
      queryClient.invalidateQueries({ queryKey: ['admin-actions'] });
      toast({
        title: 'Cargo atualizado!',
        description: 'O cargo do usuário foi alterado com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao atualizar cargo',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateUserSector() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ userId, sector, userName, oldSector }: { userId: string; sector: 'bar' | 'cozinha' | null; userName?: string; oldSector?: string | null }) => {
      const result = await users.update(userId, { sector: sector || undefined });
      if (result.error) throw new Error(result.error);
      
      // Log the action
      if (user) {
        await admin.logAction({
          action_type: 'update_sector',
          target_user_id: userId,
          details: JSON.stringify({ old_sector: oldSector, new_sector: sector, user_name: userName }),
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-users-roles'] });
      queryClient.invalidateQueries({ queryKey: ['user-sector'] });
      queryClient.invalidateQueries({ queryKey: ['admin-actions'] });
      toast({
        title: 'Setor atualizado!',
        description: 'O setor do funcionário foi alterado com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao atualizar setor',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ userId, userName }: { userId: string; userName?: string }) => {
      // Log the action before deleting
      if (user) {
        await admin.logAction({
          action_type: 'delete_employee',
          target_user_id: userId,
          details: JSON.stringify({ user_name: userName }),
        });
      }
      
      const result = await users.delete(userId);
      if (result.error) throw new Error(result.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-users-roles'] });
      queryClient.invalidateQueries({ queryKey: ['admin-actions'] });
      toast({
        title: 'Usuário excluído!',
        description: 'O usuário foi removido do sistema.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao excluir usuário',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
