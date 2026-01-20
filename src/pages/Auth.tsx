import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Phone, Lock, ArrowRight } from 'lucide-react';
import logoImg from '@/assets/logo.png';

export default function Auth() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { signIn, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const normalizePhone = (input: string): string => {
    return input.replace(/\D/g, '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    try {
      // Check if this is the hidden admin login BEFORE validation
      if (phone.toLowerCase() === 'admin') {
        if (password.length < 6) {
          setErrors({ password: 'Senha deve ter pelo menos 6 caracteres' });
          return;
        }
        const { error } = await signIn('admin@superadmin.local', password);
        if (error) {
          toast({
            title: 'Erro ao entrar',
            description: 'Credenciais inválidas',
            variant: 'destructive',
          });
        }
        return;
      }

      // Normalize phone to digits only
      const normalizedPhone = normalizePhone(phone);

      // Validate normalized phone
      if (normalizedPhone.length < 8) {
        setErrors({ phone: 'Telefone deve ter pelo menos 8 dígitos' });
        return;
      }

      if (password.length < 6) {
        setErrors({ password: 'Senha deve ter pelo menos 6 caracteres' });
        return;
      }

      // Resolve phone -> internal email (legacy accounts still have real email)
      const { data: resolved, error: resolveError } = await supabase.functions.invoke('resolve-phone', {
        body: { phone: normalizedPhone },
      });

      const resolvedEmail = resolved?.email as string | undefined;

      if (resolveError || !resolvedEmail) {
        toast({
          title: 'Erro ao entrar',
          description: 'Telefone ou senha inválidos',
          variant: 'destructive',
        });
        return;
      }

      const { error } = await signIn(resolvedEmail, password);
      if (error) {
        toast({
          title: 'Erro ao entrar',
          description: error.message === 'Invalid login credentials'
            ? 'Telefone ou senha inválidos'
            : error.message,
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-dark">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md animate-scale-in">
        <div className="glass rounded-2xl p-8 glow-amber">
          <div className="flex flex-col items-center mb-8">
            <img 
              src={logoImg} 
              alt="Logo" 
              className="w-28 h-auto"
            />
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-foreground/80">Telefone</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="(00) 00000-0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="pl-10 bg-input border-border focus:border-primary"
                />
              </div>
              {errors.phone && (
                <p className="text-destructive text-sm">{errors.phone}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground/80">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 bg-input border-border focus:border-primary"
                />
              </div>
              {errors.password && (
                <p className="text-destructive text-sm">{errors.password}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-amber hover:opacity-90 text-primary-foreground font-semibold h-12 rounded-xl transition-all"
            >
              {loading ? (
                <span className="animate-pulse">Aguarde...</span>
              ) : (
                <>
                  Entrar
                  <ArrowRight className="ml-2 w-5 h-5" />
                </>
              )}
            </Button>
          </form>

        </div>
      </div>
    </div>
  );
}
