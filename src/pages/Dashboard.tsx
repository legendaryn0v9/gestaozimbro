import { MainLayout } from '@/components/layout/MainLayout';
import { StatsCard } from '@/components/inventory/StatsCard';
import { MovementList } from '@/components/inventory/MovementList';
import { useInventoryItems, useStockMovements } from '@/hooks/useInventory';
import { Package, Wine, UtensilsCrossed, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import { format } from 'date-fns';

export default function Dashboard() {
  const { data: items = [] } = useInventoryItems();
  const today = format(new Date(), 'yyyy-MM-dd');
  const { data: movements = [] } = useStockMovements(today);

  const barItems = items.filter(i => i.sector === 'bar');
  const cozinhaItems = items.filter(i => i.sector === 'cozinha');
  const lowStockItems = items.filter(i => i.min_quantity !== null && i.quantity <= i.min_quantity);
  
  const todayEntradas = movements.filter(m => m.movement_type === 'entrada').length;
  const todaySaidas = movements.filter(m => m.movement_type === 'saida').length;

  return (
    <MainLayout>
      <div className="animate-fade-in">
        <div className="mb-6 lg:mb-8">
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-gradient">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1 sm:mt-2">
            Visão geral do estoque • {format(new Date(), 'dd/MM/yyyy')}
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6 lg:mb-8">
          <StatsCard
            title="Total de Itens"
            value={items.length}
            icon={<Package className="w-5 h-5 lg:w-6 lg:h-6 text-primary" />}
          />
          <StatsCard
            title="Bar"
            value={barItems.length}
            icon={<Wine className="w-5 h-5 lg:w-6 lg:h-6 text-primary" />}
            description={`${barItems.filter(i => i.quantity > 0).length} em estoque`}
          />
          <StatsCard
            title="Cozinha"
            value={cozinhaItems.length}
            icon={<UtensilsCrossed className="w-5 h-5 lg:w-6 lg:h-6 text-primary" />}
            description={`${cozinhaItems.filter(i => i.quantity > 0).length} em estoque`}
          />
          <StatsCard
            title="Alertas"
            value={lowStockItems.length}
            icon={<AlertTriangle className="w-5 h-5 lg:w-6 lg:h-6 text-warning" />}
            description="Itens em estoque baixo"
            trend={lowStockItems.length > 0 ? 'down' : 'neutral'}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          <div className="lg:col-span-2">
            <div className="glass rounded-xl lg:rounded-2xl p-4 lg:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 lg:mb-6">
                <h2 className="text-lg lg:text-xl font-display font-semibold">Movimentações de Hoje</h2>
                <div className="flex items-center gap-3 lg:gap-4 text-xs lg:text-sm">
                  <div className="flex items-center gap-1.5 lg:gap-2 text-success">
                    <TrendingUp className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                    <span>{todayEntradas} entradas</span>
                  </div>
                  <div className="flex items-center gap-1.5 lg:gap-2 text-destructive">
                    <TrendingDown className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                    <span>{todaySaidas} saídas</span>
                  </div>
                </div>
              </div>
              <MovementList movements={movements.slice(0, 10)} showDate={false} />
            </div>
          </div>

          <div>
            <div className="glass rounded-xl lg:rounded-2xl p-4 lg:p-6">
              <h2 className="text-lg lg:text-xl font-display font-semibold mb-3 lg:mb-4">Alertas de Estoque</h2>
              {lowStockItems.length === 0 ? (
                <div className="text-center py-6 lg:py-8 text-muted-foreground">
                  <AlertTriangle className="w-6 h-6 lg:w-8 lg:h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhum alerta no momento</p>
                </div>
              ) : (
                <div className="space-y-2 lg:space-y-3">
                  {lowStockItems.map((item) => (
                    <div
                      key={item.id}
                      className="p-2.5 lg:p-3 rounded-lg bg-warning/10 border border-warning/20"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm lg:text-base text-foreground">{item.name}</span>
                        <span className="text-warning font-semibold text-sm lg:text-base">
                          {item.quantity} {item.unit}
                        </span>
                      </div>
                      <p className="text-xs lg:text-sm text-muted-foreground mt-1">
                        Mínimo: {item.min_quantity} {item.unit}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
