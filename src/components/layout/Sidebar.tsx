import { Link, useLocation } from 'react-router-dom';
import { 
  Wine, 
  Package, 
  UtensilsCrossed, 
  ClipboardList, 
  TrendingUp, 
  TrendingDown,
  LogOut,
  LayoutDashboard
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { cn } from '@/lib/utils';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: Wine, label: 'Bar', path: '/bar' },
  { icon: UtensilsCrossed, label: 'Cozinha', path: '/cozinha' },
  { icon: TrendingUp, label: 'Entrada', path: '/entrada' },
  { icon: TrendingDown, label: 'Saída', path: '/saida' },
  { icon: ClipboardList, label: 'Relatórios', path: '/relatorios' },
];

export function Sidebar() {
  const location = useLocation();
  const { signOut, user } = useAuth();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
      <div className="p-6 border-b border-sidebar-border">
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

      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
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
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <div className="mb-4 px-4">
          <p className="text-sm text-muted-foreground">Logado como</p>
          <p className="text-sm font-medium text-sidebar-foreground truncate">
            {user?.email}
          </p>
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
