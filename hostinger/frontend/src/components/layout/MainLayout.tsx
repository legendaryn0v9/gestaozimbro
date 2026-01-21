import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { MobileHeader } from './MobileHeader';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <MobileHeader />
      <div className="hidden lg:block">
        <Sidebar />
      </div>
      <main className="pt-14 lg:pt-0 lg:ml-64 p-4 lg:p-8">
        {children}
      </main>
    </div>
  );
}
