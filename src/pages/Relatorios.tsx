import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { MovementList } from '@/components/inventory/MovementList';
import { useStockMovements, useInventoryItems } from '@/hooks/useInventory';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ClipboardList, Calendar, TrendingUp, TrendingDown, Package } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Relatorios() {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const { data: movements = [], isLoading } = useStockMovements(selectedDate);
  const { data: items = [] } = useInventoryItems();

  const entradas = movements.filter(m => m.movement_type === 'entrada');
  const saidas = movements.filter(m => m.movement_type === 'saida');

  const totalEntradas = entradas.reduce((sum, m) => sum + Number(m.quantity), 0);
  const totalSaidas = saidas.reduce((sum, m) => sum + Number(m.quantity), 0);

  const quickDates = [
    { label: 'Hoje', date: format(new Date(), 'yyyy-MM-dd') },
    { label: 'Ontem', date: format(subDays(new Date(), 1), 'yyyy-MM-dd') },
    { label: '7 dias', date: format(subDays(new Date(), 7), 'yyyy-MM-dd') },
  ];

  return (
    <MainLayout>
      <div className="animate-fade-in">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-amber flex items-center justify-center">
                <ClipboardList className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-3xl font-display font-bold text-gradient">Relatórios</h1>
                <p className="text-muted-foreground">
                  Histórico de movimentações do estoque
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Date Filter */}
        <div className="glass rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-muted-foreground" />
              <span className="text-muted-foreground">Data:</span>
            </div>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-48 bg-input border-border"
            />
            <div className="flex gap-2">
              {quickDates.map((qd) => (
                <Button
                  key={qd.label}
                  variant={selectedDate === qd.date ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedDate(qd.date)}
                  className={selectedDate === qd.date ? 'bg-gradient-amber text-primary-foreground' : ''}
                >
                  {qd.label}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="glass rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Total de Movimentações</p>
                <p className="text-3xl font-display font-bold mt-1">{movements.length}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Package className="w-6 h-6 text-primary" />
              </div>
            </div>
          </div>

          <div className="glass rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Entradas</p>
                <p className="text-3xl font-display font-bold mt-1 text-success">
                  +{totalEntradas}
                </p>
                <p className="text-sm text-muted-foreground">{entradas.length} registros</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-success" />
              </div>
            </div>
          </div>

          <div className="glass rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Saídas</p>
                <p className="text-3xl font-display font-bold mt-1 text-destructive">
                  -{totalSaidas}
                </p>
                <p className="text-sm text-muted-foreground">{saidas.length} registros</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-destructive/10 flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-destructive" />
              </div>
            </div>
          </div>
        </div>

        {/* Movement List */}
        <div className="glass rounded-2xl p-6">
          <h2 className="text-xl font-display font-semibold mb-4">
            Movimentações de {format(new Date(selectedDate + 'T12:00:00'), "dd 'de' MMMM", { locale: ptBR })}
          </h2>
          
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-20 rounded-xl bg-secondary/50 animate-pulse" />
              ))}
            </div>
          ) : (
            <MovementList movements={movements} showDate={false} />
          )}
        </div>
      </div>
    </MainLayout>
  );
}
