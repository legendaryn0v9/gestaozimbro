import { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useBranding, useUpdateSystemName, useUploadLogo } from '@/hooks/useBranding';

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
  const updateSystemName = useUpdateSystemName();
  const { toast } = useToast();
  const [systemName, setSystemName] = useState('');

  useEffect(() => {
    setSystemName((data as any)?.system_name || 'Sistema Zimbro');
  }, [data]);

  const handleSaveSystemName = async () => {
    const trimmed = systemName.trim();
    if (!trimmed) {
      toast({
        title: 'Nome inválido',
        description: 'O nome não pode ficar vazio.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await updateSystemName.mutateAsync({ systemName: trimmed });
      toast({
        title: 'Nome atualizado!',
        description: 'Todos os usuários verão em alguns segundos.',
      });
    } catch (err: any) {
      toast({
        title: 'Erro ao salvar nome',
        description: err?.message || 'Tente novamente',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-lg font-display font-semibold">Personalização</h2>
        <p className="text-sm text-muted-foreground">Altere as logos do sistema (apenas Dono).</p>
      </div>

      <Card className="p-4">
        <div className="flex flex-col md:flex-row md:items-end gap-3">
          <div className="flex-1 space-y-2">
            <Label htmlFor="systemName">Nome do sistema</Label>
            <Input
              id="systemName"
              value={systemName}
              onChange={(e) => setSystemName(e.target.value)}
              placeholder="Ex: Sistema Zimbro"
              maxLength={60}
            />
            <p className="text-xs text-muted-foreground">Aparece abaixo das logos no login e no dashboard.</p>
          </div>
          <Button
            onClick={handleSaveSystemName}
            disabled={updateSystemName.isPending}
            className="md:self-end"
          >
            Salvar
          </Button>
        </div>
      </Card>

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
