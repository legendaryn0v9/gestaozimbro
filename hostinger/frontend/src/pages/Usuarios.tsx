import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '../components/layout/MainLayout';
import { useAuth } from '../lib/auth';
import { useAllUsersWithRoles, useIsAdmin, useIsDono, useUpdateUserRole, useUpdateUserSector, useDeleteUser } from '../hooks/useUserRoles';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import { Users, Trash2, Crown, Star, Wine, UtensilsCrossed, Loader2 } from 'lucide-react';
import { users } from '../lib/api';
import { useToast } from '../hooks/use-toast';

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

  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
    }
  }, [isAdmin, navigate]);

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

  // Filter out the current user and admin user
  const filteredUsers = allUsers.filter(u => u.id !== user?.id && u.full_name?.toLowerCase() !== 'admin');

  if (!isAdmin) return null;

  return (
    <MainLayout>
      <div className="animate-fade-in">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-amber flex items-center justify-center">
            <Users className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-gradient">Usuários</h1>
            <p className="text-sm text-muted-foreground">Gerencie os usuários do sistema</p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-16">
            <Users className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Nenhum usuário cadastrado</h3>
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
