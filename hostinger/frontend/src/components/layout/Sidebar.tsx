import { Link, useLocation } from 'react-router-dom';
import { useMemo } from 'react';
import { 
  Wine, 
  UtensilsCrossed, 
  ClipboardList, 
  TrendingUp, 
  TrendingDown,
  LogOut,
  LayoutDashboard,
  Users,
  Crown,
  Star,
} from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { useIsAdmin, useIsDono } from '../../hooks/useUserRoles';
import { useUserSector } from '../../hooks/useUserSector';
import { cn } from '../../lib/utils';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { useBranding } from '@/hooks/useBranding';

const baseMenuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/', sector: null },
  { icon: Wine, label: 'Bar', path: '/bar', sector: 'bar' as const },
  { icon: UtensilsCrossed, label: 'Cozinha', path: '/cozinha', sector: 'cozinha' as const },
  { icon: TrendingUp, label: 'Entrada', path: '/entrada', sector: null },
  { icon: TrendingDown, label: 'Saída', path: '/saida', sector: null },
  { icon: ClipboardList, label: 'Relatórios', path: '/relatorios', sector: null },
];

const adminMenuItems = [
  { icon: Users, label: 'Usuários', path: '/usuarios' },
];

interface SidebarProps {
  onNavigate?: () => void;
}

export function Sidebar({ onNavigate }: SidebarProps) {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { isAdmin } = useIsAdmin();
  const { isDono } = useIsDono();
  const { sector } = useUserSector();
  const { data: branding } = useBranding();

  const handleClick = () => {
    onNavigate?.();
  };

  // Filter menu items based on user's sector
  const menuItems = useMemo(() => {
    return baseMenuItems.filter((item) => {
      if (item.sector === null) return true;
      if (isAdmin) return true;
      return sector === item.sector;
    });
  }, [sector, isAdmin]);

  const getInitials = (name: string | undefined) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <aside className="h-full lg:fixed lg:left-0 lg:top-0 lg:h-screen w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
      <div className="p-6 border-b border-sidebar-border hidden lg:block">
        <div className="flex flex-col items-center justify-center gap-2">
          {branding?.dashboard_logo_url ? (
            <img
              src={branding.dashboard_logo_url}
              alt="Logo"
              className="w-12 h-auto"
              loading="lazy"
            />
          ) : (
            <h1 className="font-display font-bold text-2xl text-sidebar-foreground">Zimbro</h1>
          )}
          <div className="text-sm font-medium text-sidebar-foreground/80 text-center leading-tight">
            {branding?.system_name || 'Sistema Zimbro'}
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
              <AvatarImage src={user?.avatar_url || undefined} alt={user?.full_name} />
              <AvatarFallback className={
                isDono 
                  ? 'bg-purple-500/20 text-purple-500' 
                  : isAdmin 
                    ? 'bg-amber-500/20 text-amber-500' 
                    : 'bg-blue-500/20 text-blue-500'
              }>
                {getInitials(user?.full_name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                {isDono ? (
                  <Badge className="bg-purple-500/20 text-purple-500 border-purple-500/50 text-xs">
                    <Star className="w-3 h-3 mr-1" />
                    Dono
                  </Badge>
                ) : isAdmin ? (
                  <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/50 text-xs">
                    <Crown className="w-3 h-3 mr-1" />
                    Gestor
                  </Badge>
                ) : (
                  <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/50 text-xs">
                    Funcionário
                  </Badge>
                )}
              </div>
              <p className="text-sm font-medium text-sidebar-foreground truncate mt-1">
                {user?.full_name || user?.email}
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
