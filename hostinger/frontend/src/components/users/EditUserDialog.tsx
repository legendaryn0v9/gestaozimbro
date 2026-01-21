import { useEffect, useState } from 'react';
import { Pencil, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { users, admin } from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';

export interface EditUserDialogProps {
  userId: string;
  userName: string;
  userPhone: string | null;
  userSector: 'bar' | 'cozinha' | null;
}

export function EditUserDialog({ userId, userName, userPhone, userSector }: EditUserDialogProps) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [fullName, setFullName] = useState(userName);
  const [phone, setPhone] = useState(userPhone || '');
  const [password, setPassword] = useState('');
  const [sector, setSector] = useState<'bar' | 'cozinha' | 'none'>(userSector || 'none');

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  useEffect(() => {
    if (!open) return;
    setFullName(userName);
    setPhone(userPhone || '');
    setPassword('');
    setSector(userSector || 'none');
  }, [open, userName, userPhone, userSector]);

  const normalizePhone = (input: string) => input.replace(/\D/g, '');

  const handleSave = async () => {
    const trimmedName = fullName.trim();
    if (!trimmedName) {
      toast({ title: 'Nome inválido', description: 'Informe o nome do usuário.', variant: 'destructive' });
      return;
    }

    const normalizedPhone = phone ? normalizePhone(phone) : '';
    if (phone && normalizedPhone.length < 8) {
      toast({ title: 'Telefone inválido', description: 'Telefone deve ter pelo menos 8 dígitos.', variant: 'destructive' });
      return;
    }

    if (password && password.trim().length < 6) {
      toast({ title: 'Senha inválida', description: 'Senha deve ter pelo menos 6 caracteres.', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const payload: { full_name?: string; phone?: string; password?: string; sector?: string } = {
        full_name: trimmedName,
      };

      if (phone) payload.phone = normalizedPhone;
      if (password.trim()) payload.password = password.trim();
      if (sector !== 'none') payload.sector = sector;

      const res = await users.update(userId, payload);
      if (res.error) throw new Error(res.error);

      // Log action (best-effort)
      if (user) {
        await admin.logAction({
          action_type: 'update_employee_info',
          target_user_id: userId,
          details: JSON.stringify({ updated_fields: Object.keys(payload) }),
        });
      }

      queryClient.invalidateQueries({ queryKey: ['all-users-roles'] });
      queryClient.invalidateQueries({ queryKey: ['admin-actions'] });

      toast({ title: 'Usuário atualizado!', description: 'As informações foram salvas com sucesso.' });
      setOpen(false);
    } catch (err: any) {
      toast({ title: 'Erro ao salvar', description: err?.message || 'Tente novamente', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  // Segurança: apenas Dono deve ver (o backend também bloqueia)
  if (user?.role !== 'dono') return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar usuário</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit_full_name">Nome</Label>
            <Input id="edit_full_name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit_phone">Telefone</Label>
            <Input
              id="edit_phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(99) 99999-9999"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit_password">Senha (opcional)</Label>
            <Input
              id="edit_password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <div className="space-y-2">
            <Label>Setor</Label>
            <Select value={sector} onValueChange={(v) => setSector(v as any)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Não definido</SelectItem>
                <SelectItem value="bar">Bar</SelectItem>
                <SelectItem value="cozinha">Cozinha</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
