import { MainLayout } from '@/components/layout/MainLayout';
import { useAllUsersWithRoles, useUpdateUserRole, useIsAdmin, AppRole } from '@/hooks/useUserRoles';
import { useAuth } from '@/lib/auth';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, Shield, UserCheck, Crown } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { CreateEmployeeDialog } from '@/components/users/CreateEmployeeDialog';
import { EditAvatarDialog } from '@/components/users/EditAvatarDialog';

export default function Usuarios() {
  const { user } = useAuth();
  const { isAdmin, isLoading: isLoadingRole } = useIsAdmin();
  const { data: users = [], isLoading } = useAllUsersWithRoles();
  const updateRole = useUpdateUserRole();

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
    return <Navigate to="/dashboard" replace />;
  }

  const handleRoleChange = (userId: string, newRole: AppRole) => {
    updateRole.mutate({ userId, newRole });
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <MainLayout>
      <div className="animate-fade-in">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-display font-bold text-gradient">Gerenciar Usuários</h1>
              <p className="text-muted-foreground">Gerencie os cargos e fotos dos funcionários</p>
            </div>
          </div>
          <CreateEmployeeDialog />
        </div>

        <div className="glass rounded-xl p-6">
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
                  className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar className={`h-12 w-12 border-2 ${
                        u.role === 'admin' 
                          ? 'border-amber-500/50' 
                          : 'border-blue-500/50'
                      }`}>
                        <AvatarImage src={u.avatar_url || undefined} alt={u.full_name} />
                        <AvatarFallback className={
                          u.role === 'admin' 
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
                      <p className="text-sm text-muted-foreground">{u.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {u.id === user?.id ? (
                      <Badge variant="outline" className="border-primary text-primary">
                        Você
                      </Badge>
                    ) : (
                      <Select
                        value={u.role}
                        onValueChange={(value) => handleRoleChange(u.id, value as AppRole)}
                        disabled={updateRole.isPending}
                      >
                        <SelectTrigger className="w-36 bg-input border-border">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">
                            <div className="flex items-center gap-2">
                              <Crown className="w-4 h-4 text-amber-500" />
                              Gerente
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
                    
                    <Badge className={
                      u.role === 'admin' 
                        ? 'bg-amber-500/20 text-amber-500 border-amber-500/50' 
                        : 'bg-blue-500/20 text-blue-500 border-blue-500/50'
                    }>
                      {u.role === 'admin' ? 'Gerente' : 'Funcionário'}
                    </Badge>
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
