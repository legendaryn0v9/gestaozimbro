import { useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAllUsersWithRoles, useUpdateUserRole, useIsAdmin, useIsDono, useDeleteUser, useUpdateUserSector, AppRole } from '@/hooks/useUserRoles';
import { useAuth } from '@/lib/auth';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Users, Crown, Trash2, Phone, Star } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { CreateEmployeeDialog } from '@/components/users/CreateEmployeeDialog';
import { EditAvatarDialog } from '@/components/users/EditAvatarDialog';
import { EditEmployeeDialog } from '@/components/users/EditEmployeeDialog';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

// Default avatars based on role
const DEFAULT_GESTOR_AVATAR = 'https://klltuuwzedbhkbykayyn.supabase.co/storage/v1/object/public/avatars/404ae1ce-6bf0-41d4-a479-2c97f7d97841-1768175055101.png';
const DEFAULT_FUNCIONARIO_AVATAR = 'https://klltuuwzedbhkbykayyn.supabase.co/storage/v1/object/public/avatars/aec0fc98-9144-4c29-a90b-6d812539e670-1768175022612.png';

export default function Usuarios() {
  const { user } = useAuth();
  const { isAdmin, isLoading: isLoadingRole } = useIsAdmin();
  const { isDono } = useIsDono();
  const { data: users = [], isLoading } = useAllUsersWithRoles();
  const updateRole = useUpdateUserRole();
  const updateSector = useUpdateUserSector();
  const deleteUser = useDeleteUser();
  const queryClient = useQueryClient();

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

  const handleRoleChange = async (userId: string, newRole: AppRole, userName?: string, oldRole?: AppRole) => {
    // Update avatar based on new role
    const newAvatarUrl = newRole === 'admin' ? DEFAULT_GESTOR_AVATAR : 
                         newRole === 'funcionario' ? DEFAULT_FUNCIONARIO_AVATAR : 
                         null;
    
    if (newAvatarUrl && newRole !== 'dono') {
      await supabase
        .from('profiles')
        .update({ avatar_url: newAvatarUrl })
        .eq('id', userId);
    }
    
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

  // Filter out the hidden super admin user (full_name === 'admin')
  const filteredUsers = users.filter(u => u.full_name.toLowerCase() !== 'admin');

  const donoUsers = filteredUsers.filter((u) => u.role === 'dono');
  const gestorUsers = filteredUsers.filter((u) => u.role === 'admin');
  const funcionarioUsers = filteredUsers.filter((u) => u.role === 'funcionario');

  const SectionHeader = ({ title, count }: { title: string; count: number }) => (
    <div className="flex items-center justify-between px-1 pt-6 pb-3">
      <h2 className="text-sm tracking-widest text-muted-foreground font-display">{title}</h2>
      <span className="text-xs text-muted-foreground tabular-nums">{count}</span>
    </div>
  );

  return (
    <MainLayout>
      <div className="animate-fade-in">
        <header className="mb-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/15 border border-border flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-display font-bold text-gradient">Gerencie os Usuários</h1>
                <p className="text-xs sm:text-sm text-muted-foreground">Cargos, setores e fotos</p>
              </div>
            </div>
          </div>

          <div className="mt-5">
            <div className="w-full sm:w-auto">
              <CreateEmployeeDialog />
            </div>
          </div>
        </header>

        <main className="glass rounded-xl p-4 sm:p-6">

          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />
              ))}
            </div>
          ) : filteredUsers.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Nenhum usuário encontrado
            </p>
          ) : (
            <div>
              <div className="text-xs text-muted-foreground mb-2">{filteredUsers.length} usuário(s)</div>

              {donoUsers.length > 0 && (
                <section>
                  <SectionHeader title="DONO" count={donoUsers.length} />
                  <div className="space-y-4">
                    {donoUsers.map((u) => {
                      const isSelf = u.id === user?.id;
                      const canDelete = isDono && !isSelf;
                      return (
                        <div key={u.id} className="rounded-xl border border-border bg-card/50 p-4 shadow-[var(--shadow-card)]">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-14 w-14 border border-border">
                                <AvatarImage src={u.avatar_url || undefined} alt={u.full_name} />
                                <AvatarFallback className="bg-muted">{getInitials(u.full_name)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-display text-lg leading-none">{u.full_name}</p>
                                  {/* remove marcador de usuário logado */}
                                </div>
                                {u.phone && (
                                  <p className="mt-1 text-sm text-muted-foreground flex items-center gap-1">
                                    <Phone className="w-3.5 h-3.5" />
                                    {u.phone}
                                  </p>
                                )}
                              </div>
                            </div>

                            <Badge variant="roleOwner">
                              <Star className="w-3.5 h-3.5 mr-1" />
                              DONO
                            </Badge>
                          </div>

                          <div className="mt-5 flex items-center justify-center gap-3">
                            {isDono && (
                              <EditAvatarDialog userId={u.id} userName={u.full_name} currentAvatarUrl={u.avatar_url} />
                            )}
                            {isDono && (
                              <EditEmployeeDialog user={{ id: u.id, full_name: u.full_name, phone: u.phone, sector: u.sector }} />
                            )}

                            {isDono && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    disabled={!canDelete}
                                    className="h-9 w-9 text-destructive hover:bg-destructive/10 disabled:opacity-40"
                                    aria-label="Excluir usuário"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Excluir usuário</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Tem certeza que deseja excluir <strong>{u.full_name}</strong>? Esta ação não pode ser desfeita.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteUser(u.id, u.full_name)}
                                      disabled={!canDelete}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Excluir
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {gestorUsers.length > 0 && (
                <section>
                  <SectionHeader title="GESTORES" count={gestorUsers.length} />
                  <div className="space-y-4">
                    {gestorUsers.map((u) => {
                      const isSelf = u.id === user?.id;
                      const canManageRole = isDono && !isSelf;
                      const canDelete = isDono && !isSelf;
                      return (
                        <div key={u.id} className="rounded-xl border border-border bg-card/50 p-4 shadow-[var(--shadow-card)]">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-14 w-14 border border-border">
                                <AvatarImage src={u.avatar_url || undefined} alt={u.full_name} />
                                <AvatarFallback className="bg-muted">{getInitials(u.full_name)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-display text-lg leading-none">{u.full_name}</p>
                                  {/* remove marcador de usuário logado */}
                                </div>
                                {u.phone && (
                                  <p className="mt-1 text-sm text-muted-foreground flex items-center gap-1">
                                    <Phone className="w-3.5 h-3.5" />
                                    {u.phone}
                                  </p>
                                )}
                              </div>
                            </div>

                            <Badge variant="roleManager">
                              <Crown className="w-3.5 h-3.5 mr-1" />
                              GESTOR
                            </Badge>
                          </div>

                           <div className="mt-4 grid grid-cols-2 gap-3">
                             {isDono && (
                               <Select
                                 value={u.role}
                                 onValueChange={(value) => handleRoleChange(u.id, value as AppRole, u.full_name, u.role)}
                                 disabled={updateRole.isPending || isSelf || !canManageRole}
                               >
                                 <SelectTrigger className="w-full bg-input border-border">
                                   <SelectValue placeholder="Cargo" />
                                 </SelectTrigger>
                                 <SelectContent>
                                   <SelectItem value="admin">Gestor</SelectItem>
                                   <SelectItem value="funcionario">Funcionário</SelectItem>
                                 </SelectContent>
                               </Select>
                             )}

                             {isDono && (
                               <Select
                                 value={u.sector || 'none'}
                                 onValueChange={(value) => handleSectorChange(u.id, value === 'none' ? null : (value as 'bar' | 'cozinha'), u.full_name, u.sector)}
                                 disabled={updateSector.isPending || isSelf}
                               >
                                 <SelectTrigger className="w-full bg-input border-border">
                                   <SelectValue placeholder="Setor" />
                                 </SelectTrigger>
                                 <SelectContent>
                                   <SelectItem value="bar">Bar</SelectItem>
                                   <SelectItem value="cozinha">Cozinha</SelectItem>
                                   <SelectItem value="none">Sem setor</SelectItem>
                                 </SelectContent>
                               </Select>
                             )}

                             <div className="flex items-center justify-center gap-3 sm:justify-end sm:col-span-2">
                              {isDono && (
                                <EditAvatarDialog userId={u.id} userName={u.full_name} currentAvatarUrl={u.avatar_url} />
                              )}
                              {isDono && (
                                <EditEmployeeDialog user={{ id: u.id, full_name: u.full_name, phone: u.phone, sector: u.sector }} />
                              )}
                              {isDono && (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      disabled={!canDelete}
                                      className="h-9 w-9 text-destructive hover:bg-destructive/10 disabled:opacity-40"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Excluir usuário</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Tem certeza que deseja excluir <strong>{u.full_name}</strong>? Esta ação não pode ser desfeita.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleDeleteUser(u.id, u.full_name)}
                                        disabled={!canDelete}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      >
                                        Excluir
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {funcionarioUsers.length > 0 && (
                <section>
                  <SectionHeader title="FUNCIONÁRIOS" count={funcionarioUsers.length} />
                  <div className="space-y-4">
                    {funcionarioUsers.map((u) => {
                      const isSelf = u.id === user?.id;
                      return (
                        <div key={u.id} className="rounded-xl border border-border bg-card/50 p-4 shadow-[var(--shadow-card)]">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-14 w-14 border border-border">
                                <AvatarImage src={u.avatar_url || undefined} alt={u.full_name} />
                                <AvatarFallback className="bg-muted">{getInitials(u.full_name)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-display text-lg leading-none">{u.full_name}</p>
                                  {/* remove marcador de usuário logado */}
                                </div>
                                {u.phone && (
                                  <p className="mt-1 text-sm text-muted-foreground flex items-center gap-1">
                                    <Phone className="w-3.5 h-3.5" />
                                    {u.phone}
                                  </p>
                                )}
                              </div>
                            </div>

                            <Badge variant="roleEmployee" className="px-3 whitespace-nowrap min-w-[10.5rem] justify-center">
                              FUNCIONÁRIO
                            </Badge>
                          </div>

                          <div className="mt-4 grid grid-cols-2 gap-3">
                            {isDono && (
                              <Select
                                value={u.role}
                                onValueChange={(value) => handleRoleChange(u.id, value as AppRole, u.full_name, u.role)}
                                disabled={updateRole.isPending || isSelf}
                              >
                                <SelectTrigger className="w-full bg-input border-border">
                                  <SelectValue placeholder="Cargo" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="admin">Gestor</SelectItem>
                                  <SelectItem value="funcionario">Funcionário</SelectItem>
                                </SelectContent>
                              </Select>
                            )}

                            <Select
                              value={u.sector || 'none'}
                              onValueChange={(value) => handleSectorChange(u.id, value === 'none' ? null : (value as 'bar' | 'cozinha'), u.full_name, u.sector)}
                              disabled={updateSector.isPending || isSelf}
                            >
                              <SelectTrigger className="w-full bg-input border-border">
                                <SelectValue placeholder="Setor" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="bar">
                                  Bar
                                </SelectItem>
                                <SelectItem value="cozinha">
                                  Cozinha
                                </SelectItem>
                                <SelectItem value="none">Sem setor</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="mt-5 flex items-center justify-center gap-3 flex-nowrap">
                            {isDono && (
                              <EditEmployeeDialog user={{ id: u.id, full_name: u.full_name, phone: u.phone, sector: u.sector }} />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}
            </div>
          )}
        </main>
      </div>
    </MainLayout>
  );
}
