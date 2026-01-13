import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';

export interface AdminAction {
  id: string;
  user_id: string;
  action_type: string;
  target_user_id: string | null;
  target_user_name: string | null;
  details: Record<string, any> | null;
  created_at: string;
  profiles?: {
    full_name: string;
    avatar_url: string | null;
  };
}

export function useAdminActions(date?: string) {
  return useQuery({
    queryKey: ['admin-actions', date],
    queryFn: async () => {
      let query = supabase
        .from('admin_actions')
        .select('*')
        .order('created_at', { ascending: false });

      if (date) {
        const startOfDay = `${date}T00:00:00`;
        const endOfDay = `${date}T23:59:59`;
        query = query.gte('created_at', startOfDay).lte('created_at', endOfDay);
      }

      const { data: actions, error } = await query;
      
      if (error) throw error;

      // Get unique user IDs to fetch profiles
      const userIds = [...new Set(actions.map(a => a.user_id))];
      
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      return actions.map(action => ({
        ...action,
        profiles: profileMap.get(action.user_id),
      })) as AdminAction[];
    },
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

      const { data, error } = await supabase
        .from('admin_actions')
        .insert({
          user_id: user.id,
          action_type: actionType,
          target_user_id: targetUserId || null,
          target_user_name: targetUserName || null,
          details: details || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
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
  };
  return icons[actionType] || '📋';
}
