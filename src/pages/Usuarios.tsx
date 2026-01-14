import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAllUsersWithRoles, useUpdateUserRole, useIsAdmin, useIsDono, useDeleteUser, useUpdateUserSector, AppRole } from '@/hooks/useUserRoles';
import { useAuth } from '@/lib/auth';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Users, Shield, UserCheck, Crown, Trash2, Wine, UtensilsCrossed, Phone, RefreshCw, Star } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { CreateEmployeeDialog } from '@/components/users/CreateEmployeeDialog';
import { EditAvatarDialog } from '@/components/users/EditAvatarDialog';
import { EditEmployeeDialog } from '@/components/users/EditEmployeeDialog';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

export default function Usuarios() {
  const { user } = useAuth();
  const { isAdmin, isLoading: isLoadingRole } = useIsAdmin();
  const { isDono } = useIsDono();
  const { data: users = [], isLoading } = useAllUsersWithRoles();
  const updateRole = useUpdateUserRole();
  const updateSector = useUpdateUserSector();
  const deleteUser = useDeleteUser();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [migratingUser, setMigratingUser] = useState<string | null>(null);

  const handleMigrateToPhone = async (userId: string, phone: string) => {
    if (!phone) {
      toast({
        title: 'Erro',
        description: 'O usuário precisa ter um telefone cadastrado',
        variant: 'destructive',
      });
      return;
    }

    setMigratingUser(userId);
    try {
      const { data, error } = await supabase.functions.invoke('migrate-to-phone', {
        body: { userId, phone },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      toast({
        title: 'Migração concluída!',
        description: 'O usuário agora pode fazer login com telefone.',
      });

      queryClient.invalidateQueries({ queryKey: ['all-users-roles'] });
    } catch (error: any) {
      toast({
        title: 'Erro na migração',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setMigratingUser(null);
    }
  };

  const needsMigration = (email: string) => {
    return !email.endsWith('@funcionario.local');
  };

  // Real-time subscription for profile updates
  useEffect(() => {
    const channel = supabase
      .channel('profiles-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['all-users-roles'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  if (isLoadingRole) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  const handleRoleChange = (userId: string, newRole: AppRole, userName?: string, oldRole?: AppRole) => {
    updateRole.mutate({ userId, newRole, userName, oldRole });
  };

  const handleSectorChange = (userId: string, sector: 'bar' | 'cozinha' | null, userName?: string, oldSector?: string | null) => {
    updateSector.mutate({ userId, sector, userName, oldSector });
  };

  const handleDeleteUser = (userId: string, userName?: string) => {
    deleteUser.mutate({ userId, userName });
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getSectorIcon = (sector: 'bar' | 'cozinha' | null) => {
    if (sector === 'bar') return <Wine className="w-4 h-4 text-amber-500" />;
    if (sector === 'cozinha') return <UtensilsCrossed className="w-4 h-4 text-emerald-500" />;
    return null;
  };

  return (
    <MainLayout>
      <div className="animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-display font-bold text-gradient">Gerenciar Usuários</h1>
              <p className="text-sm text-muted-foreground">Gerencie os cargos, setores e fotos dos funcionários</p>
            </div>
          </div>
          <CreateEmployeeDialog />
        </div>

        <div className="glass rounded-xl p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-6">
            <Shield className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Funcionários ({users.length})</h2>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />
              ))}
            </div>
          ) : users.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Nenhum usuário encontrado
            </p>
          ) : (
            <div className="space-y-3">
              {users.map((u) => (
                <div
                  key={u.id}
                  className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 rounded-lg bg-muted/50 border border-border"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar className={`h-12 w-12 border-2 ${
                        u.role === 'dono' 
                          ? 'border-purple-500/50' 
                          : u.role === 'admin' 
                            ? 'border-amber-500/50' 
                            : 'border-blue-500/50'
                      }`}>
                        <AvatarImage src={u.avatar_url || undefined} alt={u.full_name} />
                        <AvatarFallback className={
                          u.role === 'dono'
                            ? 'bg-gradient-to-br from-purple-500 to-pink-600 text-white'
                            : u.role === 'admin' 
                              ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-white' 
                              : 'bg-gradient-to-br from-blue-500 to-cyan-600 text-white'
                        }>
                          {getInitials(u.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-1 -right-1">
                        <EditAvatarDialog 
                          userId={u.id} 
                          userName={u.full_name} 
                          currentAvatarUrl={u.avatar_url} 
                        />
                      </div>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{u.full_name}</p>
                      {u.phone && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {u.phone}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    {u.id === user?.id ? (
                      <Badge variant="outline" className="border-primary text-primary">
                        Você
                      </Badge>
                    ) : (
                      <>
                        {/* Sector Select - Only for funcionarios */}
                        {u.role === 'funcionario' && (
                          <Select
                            value={u.sector || 'none'}
                            onValueChange={(value) => handleSectorChange(u.id, value === 'none' ? null : value as 'bar' | 'cozinha', u.full_name, u.sector)}
                            disabled={updateSector.isPending}
                          >
                            <SelectTrigger className="w-32 sm:w-36 bg-input border-border">
                              <SelectValue placeholder="Setor" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="bar">
                                <div className="flex items-center gap-2">
                                  <Wine className="w-4 h-4 text-amber-500" />
                                  Bar
                                </div>
                              </SelectItem>
                              <SelectItem value="cozinha">
                                <div className="flex items-center gap-2">
                                  <UtensilsCrossed className="w-4 h-4 text-emerald-500" />
                                  Cozinha
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        )}

                        {/* Role Select - Only for Dono */}
                        {isDono && (
                          <Select
                            value={u.role}
                            onValueChange={(value) => handleRoleChange(u.id, value as AppRole, u.full_name, u.role)}
                            disabled={updateRole.isPending}
                          >
                            <SelectTrigger className="w-32 sm:w-36 bg-input border-border">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="dono">
                                <div className="flex items-center gap-2">
                                  <Star className="w-4 h-4 text-purple-500" />
                                  Dono
                                </div>
                              </SelectItem>
                              <SelectItem value="admin">
                                <div className="flex items-center gap-2">
                                  <Crown className="w-4 h-4 text-amber-500" />
                                  Gestor
                                </div>
                              </SelectItem>
                              <SelectItem value="funcionario">
                                <div className="flex items-center gap-2">
                                  <UserCheck className="w-4 h-4 text-blue-500" />
                                  Funcionário
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        )}

                        {/* Migrate to Phone Button */}
                        {needsMigration(u.email) && u.phone && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleMigrateToPhone(u.id, u.phone!)}
                            disabled={migratingUser === u.id}
                            className="text-primary border-primary hover:bg-primary/10"
                          >
                            {migratingUser === u.id ? (
                              <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                <Phone className="w-4 h-4 mr-1" />
                                Migrar
                              </>
                            )}
                          </Button>
                        )}

                        {/* Edit Employee Button - Only for Dono */}
                        {isDono && (
                          <EditEmployeeDialog user={{
                            id: u.id,
                            full_name: u.full_name,
                            phone: u.phone,
                            sector: u.sector
                          }} />
                        )}

                        {/* Delete Button - Only for Dono */}
                        {isDono && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Excluir usuário</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja excluir <strong>{u.full_name}</strong>? 
                                  Esta ação não pode ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteUser(u.id, u.full_name)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Excluir
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </>
                    )}
                    
                    {/* Badges */}
                    <div className="flex items-center gap-2">
                      {u.sector && u.role === 'funcionario' && (
                        <Badge className={
                          u.sector === 'bar' 
                            ? 'bg-amber-500/20 text-amber-500 border-amber-500/50' 
                            : 'bg-emerald-500/20 text-emerald-500 border-emerald-500/50'
                        }>
                          {getSectorIcon(u.sector)}
                          <span className="ml-1">{u.sector === 'bar' ? 'Bar' : 'Cozinha'}</span>
                        </Badge>
                      )}
                      <Badge className={
                        u.role === 'dono'
                          ? 'bg-purple-500/20 text-purple-500 border-purple-500/50'
                          : u.role === 'admin' 
                            ? 'bg-amber-500/20 text-amber-500 border-amber-500/50' 
                            : 'bg-blue-500/20 text-blue-500 border-blue-500/50'
                      }>
                        {u.role === 'dono' ? 'Dono' : u.role === 'admin' ? 'Gestor' : 'Funcionário'}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
