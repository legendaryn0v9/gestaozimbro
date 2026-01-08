import { Link, useLocation } from 'react-router-dom';
import { 
  Wine, 
  Package, 
  UtensilsCrossed, 
  ClipboardList, 
  TrendingUp, 
  TrendingDown,
  LogOut,
  LayoutDashboard,
  Users,
  Crown,
  User
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useIsAdmin } from '@/hooks/useUserRoles';
import { useCurrentUserProfile } from '@/hooks/useUserProfile';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: Wine, label: 'Bar', path: '/bar' },
  { icon: UtensilsCrossed, label: 'Cozinha', path: '/cozinha' },
  { icon: TrendingUp, label: 'Entrada', path: '/entrada' },
  { icon: TrendingDown, label: 'Saída', path: '/saida' },
  { icon: ClipboardList, label: 'Relatórios', path: '/relatorios' },
];

const adminMenuItems = [
  { icon: Users, label: 'Usuários', path: '/usuarios' },
];

interface SidebarProps {
  onNavigate?: () => void;
}

export function Sidebar({ onNavigate }: SidebarProps) {
  const location = useLocation();
  const { signOut, user } = useAuth();
  const { isAdmin } = useIsAdmin();
  const { data: profile } = useCurrentUserProfile();

  const handleClick = () => {
    onNavigate?.();
  };

  const getInitials = (name: string | undefined) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <aside className="h-full lg:fixed lg:left-0 lg:top-0 lg:h-screen w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
      <div className="p-6 border-b border-sidebar-border hidden lg:block">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-amber flex items-center justify-center">
            <Package className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display font-bold text-lg text-sidebar-foreground">
              Bar Estoque
            </h1>
            <p className="text-xs text-muted-foreground">Gerenciamento</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto pt-6 lg:pt-4">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={handleClick}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-primary'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
              )}
            >
              <item.icon className={cn('w-5 h-5', isActive && 'text-sidebar-primary')} />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}

        {isAdmin && (
          <>
            <div className="pt-4 pb-2">
              <p className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Administração
              </p>
            </div>
            {adminMenuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={handleClick}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
                    isActive
                      ? 'bg-sidebar-accent text-sidebar-primary'
                      : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                  )}
                >
                  <item.icon className={cn('w-5 h-5', isActive && 'text-sidebar-primary')} />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </>
        )}
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <div className="mb-4 px-2">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border-2 border-sidebar-border">
              <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name} />
              <AvatarFallback className={isAdmin ? 'bg-amber-500/20 text-amber-500' : 'bg-blue-500/20 text-blue-500'}>
                {getInitials(profile?.full_name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                {isAdmin ? (
                  <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/50 text-xs">
                    <Crown className="w-3 h-3 mr-1" />
                    Gerente
                  </Badge>
                ) : (
                  <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/50 text-xs">
                    Funcionário
                  </Badge>
                )}
              </div>
              <p className="text-sm font-medium text-sidebar-foreground truncate mt-1">
                {profile?.full_name || user?.email}
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={() => signOut()}
          className="flex items-center gap-3 px-4 py-3 rounded-xl w-full text-sidebar-foreground/70 hover:bg-destructive/10 hover:text-destructive transition-all duration-200"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Sair</span>
        </button>
      </div>
    </aside>
  );
}
