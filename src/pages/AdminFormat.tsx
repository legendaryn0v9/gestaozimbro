import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { AlertTriangle, LogOut, Trash2 } from 'lucide-react';
import { useCurrentUserRole } from '@/hooks/useUserRoles';
import logoImg from '@/assets/logo.png';

export default function AdminFormat() {
  const { user, loading, signOut } = useAuth();
  const { data: userRole, isLoading: isLoadingRole } = useCurrentUserRole();
  const [formatPassword, setFormatPassword] = useState('');
  const [isFormatting, setIsFormatting] = useState(false);
  const { toast } = useToast();

  // Check if this is the super admin (hidden admin role)
  const isSuperAdmin = userRole?.role === 'admin' && user?.user_metadata?.is_super_admin === true;

  if (loading || isLoadingRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-amber mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // If not super admin, redirect to home
  if (!isSuperAdmin) {
    return <Navigate to="/" replace />;
  }

  const handleFormatSystem = async () => {
    if (formatPassword !== 'formatar') {
      toast({
        title: 'Senha incorreta',
        description: 'A senha de formatação está incorreta.',
        variant: 'destructive',
      });
      return;
    }

    setIsFormatting(true);
    try {
      // Delete all stock movements (entradas e saidas)
      const { error: movementsError } = await supabase
        .from('stock_movements')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (movementsError) throw movementsError;

      // Delete all product edit history
      const { error: editHistoryError } = await supabase
        .from('product_edit_history')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (editHistoryError) throw editHistoryError;

      // Delete all admin actions
      const { error: adminActionsError } = await supabase
        .from('admin_actions')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (adminActionsError) throw adminActionsError;

      // Reset all inventory quantities to 0
      const { error: inventoryError } = await supabase
        .from('inventory_items')
        .update({ quantity: 0 })
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (inventoryError) throw inventoryError;

      toast({
        title: 'Sistema formatado!',
        description: 'Todas as movimentações, relatórios, edições e ações administrativas foram excluídos. Estoque zerado.',
      });

      setFormatPassword('');
    } catch (error: any) {
      toast({
        title: 'Erro ao formatar',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsFormatting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-dark">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-destructive/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md animate-scale-in">
        <div className="glass rounded-2xl p-8 border-destructive/30">
          <div className="flex flex-col items-center mb-8">
            <img 
              src={logoImg} 
              alt="Logo" 
              className="w-28 h-auto mb-4"
            />
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-6 h-6" />
              <h1 className="text-xl font-bold">Painel de Formatação</h1>
            </div>
            <p className="text-sm text-muted-foreground mt-2 text-center">
              Acesso exclusivo para administração do sistema
            </p>
          </div>

          <div className="space-y-6">
            <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30">
              <h2 className="font-semibold text-destructive flex items-center gap-2 mb-3">
                <Trash2 className="w-5 h-5" />
                Formatar Sistema
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                Esta ação irá excluir permanentemente:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground mb-4">
                <li>Todas as entradas de estoque</li>
                <li>Todas as saídas de estoque</li>
                <li>Todos os históricos de edição</li>
                <li>Todas as ações administrativas</li>
                <li>Zerar quantidade de todos os itens</li>
              </ul>
              <p className="text-xs text-muted-foreground italic">
                Itens, categorias e subcategorias serão mantidos.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="format-password">Digite a senha para formatar:</Label>
              <Input
                id="format-password"
                type="password"
                placeholder="Senha de formatação"
                value={formatPassword}
                onChange={(e) => setFormatPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleFormatSystem()}
                className="bg-input border-border"
              />
            </div>

            <Button
              variant="destructive"
              onClick={handleFormatSystem}
              disabled={isFormatting || !formatPassword}
              className="w-full h-12"
            >
              {isFormatting ? (
                <span className="animate-pulse">Formatando...</span>
              ) : (
                <>
                  <Trash2 className="w-5 h-5 mr-2" />
                  Confirmar Formatação
                </>
              )}
            </Button>

            <Button
              variant="outline"
              onClick={signOut}
              className="w-full"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
