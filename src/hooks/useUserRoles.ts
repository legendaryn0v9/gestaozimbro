import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';

export type AppRole = 'admin' | 'funcionario';

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
  role: AppRole;
  role_id: string;
}

export function useCurrentUserRole() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['user-role', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      // The user object from PHP API already contains the role
      return {
        id: '',
        user_id: user.id,
        role: user.role || 'funcionario',
        created_at: '',
      } as UserRole;
    },
    enabled: !!user,
  });
}

export function useIsAdmin() {
  const { user } = useAuth();
  return {
    isAdmin: user?.role === 'admin',
    isLoading: false,
  };
}

export function useAllUsersWithRoles() {
  return useQuery({
    queryKey: ['all-users-roles'],
    queryFn: async () => {
      const users = await usersApi.list();

      const usersWithRoles: UserWithRole[] = users.map(user => ({
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: (user.role as AppRole) || 'funcionario',
        role_id: '',
      }));

      return usersWithRoles;
    },
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string; newRole: AppRole }) => {
      await usersApi.updateRole(userId, newRole);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-users-roles'] });
      queryClient.invalidateQueries({ queryKey: ['user-role'] });
      toast({
        title: 'Cargo atualizado!',
        description: 'O cargo do usuário foi alterado com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao atualizar cargo',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
