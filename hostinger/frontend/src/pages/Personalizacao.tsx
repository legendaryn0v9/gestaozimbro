import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Palette } from 'lucide-react';

import { MainLayout } from '@/components/layout/MainLayout';
import { BrandingManager } from '@/components/users/BrandingManager';
import { useIsDono } from '@/hooks/useUserRoles';

export default function Personalizacao() {
  const navigate = useNavigate();
  const { isDono } = useIsDono();

  useEffect(() => {
    if (!isDono) {
      navigate('/');
    }
  }, [isDono, navigate]);

  if (!isDono) return null;

  return (
    <MainLayout>
      <div className="animate-fade-in">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-amber flex items-center justify-center">
            <Palette className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-gradient">Personalização</h1>
            <p className="text-sm text-muted-foreground">Ajuste nome e logos do sistema (apenas Dono).</p>
          </div>
        </div>

        <div className="glass rounded-2xl p-4 md:p-6">
          <BrandingManager />
        </div>
      </div>
    </MainLayout>
  );
}
