import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { admin, AdminAction } from '../lib/api';
import { useAuth } from '../lib/auth';

export type { AdminAction };

export function useAdminActions(date?: string) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['admin-actions', date],
    queryFn: async () => {
      const result = await admin.getActions(date);
      if (result.error) throw new Error(result.error);
      return result.data as AdminAction[];
    },
    enabled: !!user,
  });
}

export function useLogAdminAction() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      actionType,
      targetUserId,
      targetUserName,
      details,
    }: {
      actionType: string;
      targetUserId?: string;
      targetUserName?: string;
      details?: Record<string, any>;
    }) => {
      if (!user) throw new Error('User not authenticated');

      const result = await admin.logAction({
        action_type: actionType,
        target_user_id: targetUserId,
        details: details ? JSON.stringify(details) : undefined,
      });
      
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-actions'] });
    },
  });
}

export function getActionLabel(actionType: string): string {
  const labels: Record<string, string> = {
    'create_employee': 'Criou funcionário',
    'update_employee': 'Editou funcionário',
    'delete_employee': 'Excluiu funcionário',
    'update_role': 'Alterou cargo',
    'update_sector': 'Alterou setor',
    'update_avatar': 'Alterou foto',
    'update_password': 'Alterou senha',
  };
  return labels[actionType] || actionType;
}

export function getActionIcon(actionType: string): string {
  const icons: Record<string, string> = {
    'create_employee': '👤',
    'update_employee': '✏️',
    'delete_employee': '🗑️',
    'update_role': '👑',
    'update_sector': '🏢',
    'update_avatar': '📷',
    'update_password': '🔐',
  };
  return icons[actionType] || '📋';
}
