import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { auth as apiAuth } from '@/lib/api';
import { Phone, Lock, ArrowRight } from 'lucide-react';

export default function Auth() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { signIn, signInWithEmail, user } = useAuth();
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
      // Check if this is the hidden admin login
      if (phone.toLowerCase() === 'admin') {
        if (password.length < 6) {
          setErrors({ password: 'Senha deve ter pelo menos 6 caracteres' });
          return;
        }
        const result = await signInWithEmail('admin@superadmin.local', password);
        if (result.error) {
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

      // Login directly with phone number
      const result = await signIn(normalizedPhone, password);
      if (result.error) {
        toast({
          title: 'Erro ao entrar',
          description: 'Telefone ou senha inválidos',
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
            <div className="w-28 h-28 rounded-2xl bg-gradient-amber flex items-center justify-center mb-4">
              <span className="text-4xl font-bold text-primary-foreground">Z</span>
            </div>
            <h1 className="text-2xl font-display font-bold text-foreground">Sistema Zimbro</h1>
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
