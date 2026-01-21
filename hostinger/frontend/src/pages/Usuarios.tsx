import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '../components/layout/MainLayout';
import { useAuth } from '../lib/auth';
import { useAllUsersWithRoles, useIsAdmin, useIsDono, useUpdateUserRole, useUpdateUserSector, useDeleteUser } from '../hooks/useUserRoles';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import { Users, Trash2, Crown, Star, Wine, UtensilsCrossed, Loader2, Plus } from 'lucide-react';
import { users } from '../lib/api';
import { useToast } from '../hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { useLogAdminAction } from '../hooks/useAdminActions';
import { BrandingManager } from '@/components/users/BrandingManager';
import { EditAvatarDialog } from '@/components/users/EditAvatarDialog';
import { EditUserDialog } from '@/components/users/EditUserDialog';

export default function Usuarios() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin } = useIsAdmin();
  const { isDono } = useIsDono();
  const { data: allUsers = [], isLoading } = useAllUsersWithRoles();
  const updateRole = useUpdateUserRole();
  const updateSector = useUpdateUserSector();
  const deleteUser = useDeleteUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const logAction = useLogAdminAction();

  // Create employee state
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newEmployee, setNewEmployee] = useState({
    full_name: '',
    phone: '',
    password: '',
    sector: 'bar' as 'bar' | 'cozinha',
  });

  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
    }
  }, [isAdmin, navigate]);

  const handleCreateEmployee = async () => {
    if (!newEmployee.full_name || !newEmployee.phone || !newEmployee.password) {
      toast({
        title: 'Preencha todos os campos',
        variant: 'destructive',
      });
      return;
    }

    setCreating(true);
    try {
      const response = await users.create({
        full_name: newEmployee.full_name,
        phone: newEmployee.phone,
        password: newEmployee.password,
        sector: newEmployee.sector,
        role: 'funcionario',
      });

      if (!response.success) {
        throw new Error(response.error || 'Erro ao criar funcionário');
      }

      // Log the action
      logAction.mutate({
        actionType: 'create_employee',
        targetUserName: newEmployee.full_name,
        details: { sector: newEmployee.sector },
      });

      toast({
        title: 'Funcionário criado com sucesso!',
        description: `${newEmployee.full_name} foi adicionado ao sistema.`,
      });

      // Reset form and close dialog
      setNewEmployee({ full_name: '', phone: '', password: '', sector: 'bar' });
      setCreateDialogOpen(false);

      // Refresh the user list
      queryClient.invalidateQueries({ queryKey: ['users-with-roles'] });
    } catch (error: any) {
      console.error('Error creating employee:', error);
      toast({
        title: 'Erro ao criar funcionário',
        description: error.message || 'Tente novamente',
        variant: 'destructive',
      });
    } finally {
      setCreating(false);
    }
  };

  const handleRoleChange = (userId: string, newRole: string, userName: string, oldRole: string) => {
    updateRole.mutate({ userId, newRole: newRole as any, userName, oldRole: oldRole as any });
  };

  const handleSectorChange = (userId: string, newSector: string, userName: string, oldSector: string | null) => {
    const sector = newSector === 'todos' ? null : newSector as 'bar' | 'cozinha';
    updateSector.mutate({ userId, sector, userName, oldSector });
  };

  const handleDeleteUser = (userId: string, userName: string) => {
    if (!confirm(`Tem certeza que deseja excluir "${userName}"?`)) return;
    deleteUser.mutate({ userId, userName });
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getSectorIcon = (sector: string | null) => {
    if (sector === 'bar') return <Wine className="w-4 h-4" />;
    if (sector === 'cozinha') return <UtensilsCrossed className="w-4 h-4" />;
    return null;
  };

  // Show all users EXCEPT the admin that formats data (the hidden super admin)
  const filteredUsers = allUsers.filter(u => u.full_name?.toLowerCase() !== 'admin');

  if (!isAdmin) return null;

  return (
    <MainLayout>
      <div className="animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-amber flex items-center justify-center">
              <Users className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-display font-bold text-gradient">Usuários</h1>
              <p className="text-sm text-muted-foreground">Gerencie os usuários do sistema</p>
            </div>
          </div>

          {/* Create Employee Button */}
          {isAdmin && (
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-amber text-primary-foreground">
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Funcionário
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Criar Novo Funcionário</DialogTitle>
                  <DialogDescription>
                    Preencha os dados do novo funcionário
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Nome Completo</Label>
                    <Input
                      id="fullName"
                      placeholder="Nome do funcionário"
                      value={newEmployee.full_name}
                      onChange={(e) => setNewEmployee(prev => ({ ...prev, full_name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      placeholder="(99) 99999-9999"
                      value={newEmployee.phone}
                      onChange={(e) => setNewEmployee(prev => ({ ...prev, phone: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Senha</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Senha de acesso"
                      value={newEmployee.password}
                      onChange={(e) => setNewEmployee(prev => ({ ...prev, password: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sector">Setor</Label>
                    <Select
                      value={newEmployee.sector}
                      onValueChange={(v) => setNewEmployee(prev => ({ ...prev, sector: v as 'bar' | 'cozinha' }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bar">Bar</SelectItem>
                        <SelectItem value="cozinha">Cozinha</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2 justify-end mt-6">
                    <Button
                      variant="outline"
                      onClick={() => setCreateDialogOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleCreateEmployee}
                      disabled={creating}
                      className="bg-gradient-amber text-primary-foreground"
                    >
                      {creating ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Criando...
                        </>
                      ) : (
                        'Criar Funcionário'
                      )}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {isDono && (
          <div className="mb-6 glass rounded-2xl p-4 md:p-6">
            <BrandingManager />
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-16">
            <Users className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Nenhum usuário cadastrado</h3>
            <p className="text-muted-foreground">Clique em "Novo Funcionário" para adicionar</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredUsers.map((u) => (
              <div key={u.id} className="glass rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex items-center gap-3 flex-1">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={u.avatar_url || undefined} />
                    <AvatarFallback className={
                      u.role === 'dono' ? 'bg-purple-500/20 text-purple-500' :
                      u.role === 'admin' ? 'bg-amber-500/20 text-amber-500' :
                      'bg-blue-500/20 text-blue-500'
                    }>
                      {getInitials(u.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{u.full_name}</p>
                    <p className="text-sm text-muted-foreground truncate">{u.phone || u.email}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Avatar edit */}
                  {(isDono || user?.id === u.id) && (
                    <EditAvatarDialog
                      userId={u.id}
                      userName={u.full_name}
                      currentAvatarUrl={u.avatar_url || null}
                    />
                  )}

                  {/* Edit user info (Dono only) */}
                  {isDono && (
                    <EditUserDialog
                      userId={u.id}
                      userName={u.full_name}
                      userPhone={u.phone}
                      userSector={u.sector}
                    />
                  )}

                  {/* Role Badge */}
                  <Badge className={
                    u.role === 'dono' ? 'bg-purple-500/20 text-purple-500 border-purple-500/50' :
                    u.role === 'admin' ? 'bg-amber-500/20 text-amber-500 border-amber-500/50' :
                    'bg-blue-500/20 text-blue-500 border-blue-500/50'
                  }>
                    {u.role === 'dono' && <Star className="w-3 h-3 mr-1" />}
                    {u.role === 'admin' && <Crown className="w-3 h-3 mr-1" />}
                    {u.role === 'dono' ? 'Dono' : u.role === 'admin' ? 'Gestor' : 'Funcionário'}
                  </Badge>

                  {/* Sector Badge */}
                  {u.role === 'funcionario' && u.sector && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      {getSectorIcon(u.sector)}
                      {u.sector === 'bar' ? 'Bar' : 'Cozinha'}
                    </Badge>
                  )}

                  {/* Sector Select for funcionarios */}
                  {isDono && u.role === 'funcionario' && (
                    <Select
                      value={u.sector || 'todos'}
                      onValueChange={(v) => handleSectorChange(u.id, v, u.full_name, u.sector)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos</SelectItem>
                        <SelectItem value="bar">Bar</SelectItem>
                        <SelectItem value="cozinha">Cozinha</SelectItem>
                      </SelectContent>
                    </Select>
                  )}

                  {/* Role Select for dono */}
                  {isDono && (
                    <Select
                      value={u.role}
                      onValueChange={(v) => handleRoleChange(u.id, v, u.full_name, u.role)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="funcionario">Funcionário</SelectItem>
                        <SelectItem value="admin">Gestor</SelectItem>
                        <SelectItem value="dono">Dono</SelectItem>
                      </SelectContent>
                    </Select>
                  )}

                  {/* Delete Button */}
                  {isDono && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:bg-destructive/10"
                      onClick={() => handleDeleteUser(u.id, u.full_name)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
