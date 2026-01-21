import { useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera, Trash2, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { uploadAvatar, useUpdateProfileAvatar } from '@/hooks/useUserProfile';
import { useAuth } from '@/lib/auth';

interface EditAvatarDialogProps {
  userId: string;
  userName: string;
  currentAvatarUrl: string | null;
}

export function EditAvatarDialog({ userId, userName, currentAvatarUrl }: EditAvatarDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentAvatarUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const updateAvatar = useUpdateProfileAvatar();

  const canEditThisUser = !!user && (user.id === userId || user.role === 'admin' || user.role === 'dono');

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview local
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    setLoading(true);
    try {
      const avatarUrl = await uploadAvatar(userId, file);
      await updateAvatar.mutateAsync({ userId, avatarUrl });

      // refresh in realtime polling too, but we force now
      queryClient.invalidateQueries({ queryKey: ['all-users-roles'] });
      queryClient.invalidateQueries({ queryKey: ['user-profile', userId] });

      toast({
        title: 'Foto atualizada!',
        description: 'A foto do perfil foi atualizada com sucesso.',
      });
      setOpen(false);
    } catch (err: any) {
      toast({
        title: 'Erro ao atualizar foto',
        description: err?.message || 'Tente novamente',
        variant: 'destructive',
      });
      setPreviewUrl(currentAvatarUrl);
    } finally {
      setLoading(false);
      URL.revokeObjectURL(objectUrl);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveAvatar = async () => {
    setLoading(true);
    try {
      await updateAvatar.mutateAsync({ userId, avatarUrl: null });
      setPreviewUrl(null);
      queryClient.invalidateQueries({ queryKey: ['all-users-roles'] });
      queryClient.invalidateQueries({ queryKey: ['user-profile', userId] });

      toast({
        title: 'Foto removida!',
        description: 'A foto do perfil foi removida.',
      });
      setOpen(false);
    } catch (err: any) {
      toast({
        title: 'Erro ao remover foto',
        description: err?.message || 'Tente novamente',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!canEditThisUser) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Camera className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-primary" />
            Foto do usuário
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-6 py-4">
          <Avatar className="h-28 w-28 border-4 border-border">
            <AvatarImage src={previewUrl || undefined} alt={userName} />
            <AvatarFallback className="text-xl bg-muted">{getInitials(userName)}</AvatarFallback>
          </Avatar>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
            >
              <Upload className="w-4 h-4 mr-2" />
              Enviar
            </Button>
            <Button
              variant="outline"
              onClick={handleRemoveAvatar}
              disabled={loading}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Remover
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
