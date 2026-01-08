import { Menu, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Sidebar } from './Sidebar';
import { useState } from 'react';

export function MobileHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="lg:hidden fixed top-0 left-0 right-0 z-50 h-14 bg-sidebar border-b border-sidebar-border flex items-center px-4">
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
        <div className="w-8 h-8 rounded-lg bg-gradient-amber flex items-center justify-center">
          <Package className="w-4 h-4 text-primary-foreground" />
        </div>
        <h1 className="font-display font-bold text-sidebar-foreground">Bar Estoque</h1>
      </div>
    </header>
  );
}
