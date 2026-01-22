import { ReactNode, useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { MobileHeader } from './MobileHeader';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent flash of unstyled content by using inline style until mounted
  if (!mounted) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: 'hsl(30, 10%, 8%)' }}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-12 h-12 rounded-xl bg-gradient-amber animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <MobileHeader />
      <div className="hidden lg:block">
        <Sidebar />
      </div>
      {/*
        pt-14 compensates the fixed MobileHeader height.
        On desktop we still need top padding; previously lg:pt-0 was overriding p-8 and
        causing content to stick to the top.
      */}
      <main className="pt-16 lg:pt-8 lg:ml-64 p-4 lg:p-8">
        {children}
      </main>
    </div>
  );
}
