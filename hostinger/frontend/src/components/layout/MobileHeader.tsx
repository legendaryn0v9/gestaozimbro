import { Menu } from 'lucide-react';
import { Button } from '../ui/button';
import { Sheet, SheetContent, SheetTrigger } from '../ui/sheet';
import { Sidebar } from './Sidebar';
import { useState } from 'react';
import { useBranding } from '@/hooks/useBranding';

export function MobileHeader() {
  const [open, setOpen] = useState(false);
  const { data: branding } = useBranding();

  return (
    <header className="lg:hidden fixed top-0 left-0 right-0 z-50 h-14 bg-sidebar border-b border-sidebar-border flex items-center justify-between px-4">
      <div className="flex items-center">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-sidebar-foreground">
              <Menu className="w-6 h-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64 bg-sidebar border-sidebar-border">
            <Sidebar onNavigate={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
        
        <div className="flex items-center gap-2 ml-3">
          {branding?.dashboard_logo_url ? (
            <img
              src={branding.dashboard_logo_url}
              alt="Logo"
              className="w-8 h-auto"
              loading="lazy"
            />
          ) : (
            <h1 className="font-display font-bold text-sidebar-foreground">Zimbro</h1>
          )}
          <span className="text-sm font-medium text-sidebar-foreground/80 truncate max-w-[180px]">
            {branding?.system_name || 'Sistema Zimbro'}
          </span>
        </div>
      </div>
    </header>
  );
}
