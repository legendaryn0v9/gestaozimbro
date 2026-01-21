import { useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useBranding, useUploadLogo } from '@/hooks/useBranding';

function LogoCard({
  title,
  description,
  type,
  currentUrl,
}: {
  title: string;
  description: string;
  type: 'dashboard' | 'login';
  currentUrl: string | null;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const upload = useUploadLogo();
  const [preview, setPreview] = useState<string | null>(null);

  const handlePick = () => inputRef.current?.click();

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxBytes = 3 * 1024 * 1024;
    if (file.size > maxBytes) {
      toast({
        title: 'Arquivo muito grande',
        description: 'Máximo 3MB',
        variant: 'destructive',
      });
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    try {
      await upload.mutateAsync({ type, file });
      toast({
        title: 'Logo atualizada!',
        description: 'Todos os usuários verão em alguns segundos.',
      });
    } catch (err: any) {
      toast({
        title: 'Erro ao enviar logo',
        description: err?.message || 'Tente novamente',
        variant: 'destructive',
      });
      setPreview(null);
    } finally {
      URL.revokeObjectURL(objectUrl);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const url = preview || currentUrl;

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="font-semibold">{title}</div>
          <div className="text-sm text-muted-foreground">{description}</div>
        </div>
        <Button variant="outline" onClick={handlePick} disabled={upload.isPending}>
          <Upload className="w-4 h-4 mr-2" />
          Trocar
        </Button>
      </div>

      <div className="mt-4 rounded-xl border border-border bg-secondary/20 p-4 flex items-center justify-center min-h-24">
        {url ? (
          <img src={url} alt={title} className="max-h-16 w-auto" loading="lazy" />
        ) : (
          <div className="flex items-center gap-2 text-muted-foreground">
            <ImageIcon className="w-5 h-5" />
            <span>Nenhuma logo definida</span>
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={handleChange}
      />
    </Card>
  );
}

export function BrandingManager() {
  const { data } = useBranding();

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-lg font-display font-semibold">Personalização</h2>
        <p className="text-sm text-muted-foreground">Altere as logos do sistema (apenas Dono).</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <LogoCard
          title="Logo do Dashboard"
          description="Aparece na lateral e no topo (mobile)."
          type="dashboard"
          currentUrl={data?.dashboard_logo_url || null}
        />
        <LogoCard
          title="Logo do Login"
          description="Aparece na tela de entrar."
          type="login"
          currentUrl={data?.login_logo_url || null}
        />
      </div>
    </div>
  );
}
