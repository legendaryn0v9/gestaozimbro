import { Link, useLocation } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
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
  Palette,
  Sun,
  Moon,
} from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { useIsAdmin, useIsDono } from '../../hooks/useUserRoles';
import { useUserSector } from '../../hooks/useUserSector';
import { cn } from '../../lib/utils';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { useBranding } from '@/hooks/useBranding';
import { Button } from '../ui/button';
import { useTheme } from 'next-themes';

// Menu items definidos estaticamente para evitar problemas de cache/renderização
const MENU_ITEMS = {
  PAINEL: 'Painel',
  BAR: 'Bar',
  COZINHA: 'Cozinha',
  ENTRADA: 'Entrada',
  SAIDA: 'Saída',
  RELATORIOS: 'Relatórios',
} as const;

const baseMenuItems = [
  { icon: LayoutDashboard, label: MENU_ITEMS.PAINEL, path: '/', sector: null },
  { icon: Wine, label: MENU_ITEMS.BAR, path: '/bar', sector: 'bar' as const },
  { icon: UtensilsCrossed, label: MENU_ITEMS.COZINHA, path: '/cozinha', sector: 'cozinha' as const },
  { icon: TrendingUp, label: MENU_ITEMS.ENTRADA, path: '/entrada', sector: null },
  { icon: TrendingDown, label: MENU_ITEMS.SAIDA, path: '/saida', sector: null },
  { icon: ClipboardList, label: MENU_ITEMS.RELATORIOS, path: '/relatorios', sector: null },
];

const adminMenuItems: Array<{ icon: any; label: string; path: string; donoOnly?: boolean }> = [
  { icon: Users, label: 'Usuários', path: '/usuarios' },
  { icon: Palette, label: 'Personalização', path: '/personalizacao', donoOnly: true },
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
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

        {(isAdmin || isDono) && (
          <>
            <div className="pt-4 pb-2">
              <p className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Administração
              </p>
            </div>
            {adminMenuItems.filter((item) => !item.donoOnly || isDono).map((item) => {
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
        {/* Tema (acima e separado por linha) */}
        <div className="mb-4 px-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setTheme((mounted && theme === 'light') ? 'dark' : 'light')}
            aria-label="Alternar cor do fundo (tema claro/escuro)"
            className="w-full justify-center"
          >
            {(mounted && theme === 'light') ? (
              <Sun className="w-4 h-4 mr-2" />
            ) : (
              <Moon className="w-4 h-4 mr-2" />
            )}
            {(mounted && theme === 'light') ? 'Fundo branco' : 'Fundo escuro'}
          </Button>
        </div>

        <div className="border-t border-sidebar-border mb-4" />

        {/* Usuário (centralizado) */}
        <div className="mb-4 px-2 flex flex-col items-center text-center">
          <Avatar className="h-12 w-12 border-2 border-sidebar-border">
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

          <p className="text-sm font-medium text-sidebar-foreground mt-3">
            {user?.full_name || user?.email}
          </p>

          <div className="mt-2">
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
