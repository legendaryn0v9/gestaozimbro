import { MainLayout } from '@/components/layout/MainLayout';
import { StatsCard } from '@/components/inventory/StatsCard';
import { MovementList } from '@/components/inventory/MovementList';
import { useInventoryItems, useStockMovements } from '@/hooks/useInventory';
import { useRealtimeInventory } from '@/hooks/useRealtimeInventory';
import { useIsAdmin } from '@/hooks/useUserRoles';
import { useUserSector } from '@/hooks/useUserSector';
import { useAuth } from '@/lib/auth';
import { Package, Wine, UtensilsCrossed, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import { format } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMemo } from 'react';

export default function Dashboard() {
  const { user } = useAuth();
  const { isAdmin } = useIsAdmin();
  const { sector: userSector } = useUserSector();
  
  // Enable realtime updates for inventory (polling-based in Hostinger)
  useRealtimeInventory();
  
  const { data: items = [] } = useInventoryItems();
  const today = format(new Date(), 'yyyy-MM-dd');
  const { data: allMovements = [] } = useStockMovements(today);

  // Filter items based on user sector
  const sectorItems = useMemo(() => {
    if (isAdmin) return items;
    if (!userSector) return items;
    return items.filter(i => i.sector === userSector);
  }, [items, isAdmin, userSector]);

  // Filter movements based on user role
  const movements = useMemo(() => {
    if (isAdmin) {
      return allMovements;
    }
    // For employees: only show their own movements from their sector
    return allMovements.filter(m => {
      const isOwnMovement = m.user_id === user?.id;
      const isFromUserSector = !userSector || m.inventory_items?.sector === userSector;
      return isOwnMovement && isFromUserSector;
    });
  }, [allMovements, isAdmin, user?.id, userSector]);

  // Separate movements by sector for admin
  const barMovements = useMemo(() => 
    movements.filter(m => m.inventory_items?.sector === 'bar'), 
    [movements]
  );
  
  const cozinhaMovements = useMemo(() => 
    movements.filter(m => m.inventory_items?.sector === 'cozinha'), 
    [movements]
  );

  const barItems = items.filter(i => i.sector === 'bar');
  const cozinhaItems = items.filter(i => i.sector === 'cozinha');
  
  // Filter low stock items based on user role and sector
  const allLowStockItems = items.filter(i => i.min_quantity !== null && i.quantity <= i.min_quantity);
  const barLowStockItems = allLowStockItems.filter(i => i.sector === 'bar');
  const cozinhaLowStockItems = allLowStockItems.filter(i => i.sector === 'cozinha');
  
  // For employees, only show alerts from their sector
  const lowStockItems = useMemo(() => {
    if (isAdmin) return allLowStockItems;
    if (!userSector) return allLowStockItems;
    return allLowStockItems.filter(i => i.sector === userSector);
  }, [allLowStockItems, isAdmin, userSector]);
  
  const todayEntradas = movements.filter(m => m.movement_type === 'entrada').length;
  const todaySaidas = movements.filter(m => m.movement_type === 'saida').length;

  // Stats for bar and cozinha separately (for admin)
  const barEntradas = barMovements.filter(m => m.movement_type === 'entrada').length;
  const barSaidas = barMovements.filter(m => m.movement_type === 'saida').length;
  const cozinhaEntradas = cozinhaMovements.filter(m => m.movement_type === 'entrada').length;
  const cozinhaSaidas = cozinhaMovements.filter(m => m.movement_type === 'saida').length;

  // Get sector icon and label
  const getSectorInfo = () => {
    if (userSector === 'bar') {
      return { icon: <Wine className="w-5 h-5 lg:w-6 lg:h-6 text-primary" />, label: 'Itens do Bar' };
    }
    if (userSector === 'cozinha') {
      return { icon: <UtensilsCrossed className="w-5 h-5 lg:w-6 lg:h-6 text-primary" />, label: 'Itens da Cozinha' };
    }
    return { icon: <Package className="w-5 h-5 lg:w-6 lg:h-6 text-primary" />, label: 'Total de Itens' };
  };

  const sectorInfo = getSectorInfo();

  return (
    <MainLayout>
      <div className="animate-fade-in">
        <div className="mb-6 lg:mb-8">
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-gradient">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1 sm:mt-2">
            {isAdmin ? 'Visão geral do estoque' : 'Suas movimentações'} • {format(new Date(), 'dd/MM/yyyy')}
          </p>
        </div>

        {/* Stats Cards */}
        {isAdmin ? (
          // Admin view - show all sectors
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
              value={allLowStockItems.length}
              icon={<AlertTriangle className="w-5 h-5 lg:w-6 lg:h-6 text-warning" />}
              description="Itens em estoque baixo"
              trend={allLowStockItems.length > 0 ? 'down' : 'neutral'}
            />
          </div>
        ) : (
          // Employee view - show only their sector
          <div className="grid grid-cols-2 gap-3 lg:gap-4 mb-6 lg:mb-8">
            <StatsCard
              title={sectorInfo.label}
              value={sectorItems.length}
              icon={sectorInfo.icon}
              description={`${sectorItems.filter(i => i.quantity > 0).length} em estoque`}
            />
            <StatsCard
              title="Alertas"
              value={lowStockItems.length}
              icon={<AlertTriangle className="w-5 h-5 lg:w-6 lg:h-6 text-warning" />}
              description="Estoque baixo"
              trend={lowStockItems.length > 0 ? 'down' : 'neutral'}
            />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          {/* Movements Section */}
          <div className="lg:col-span-2">
            <div className="glass rounded-xl lg:rounded-2xl p-4 lg:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 lg:mb-6">
                <h2 className="text-lg lg:text-xl font-display font-semibold">
                  {isAdmin ? 'Movimentações de Hoje' : 'Suas Movimentações de Hoje'}
                </h2>
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

              {isAdmin ? (
                <Tabs defaultValue="bar" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="bar" className="flex items-center gap-2">
                      <Wine className="w-4 h-4" />
                      Bar
                      <span className="text-xs bg-muted px-1.5 py-0.5 rounded">
                        {barMovements.length}
                      </span>
                    </TabsTrigger>
                    <TabsTrigger value="cozinha" className="flex items-center gap-2">
                      <UtensilsCrossed className="w-4 h-4" />
                      Cozinha
                      <span className="text-xs bg-muted px-1.5 py-0.5 rounded">
                        {cozinhaMovements.length}
                      </span>
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="bar">
                    <div className="flex items-center gap-4 text-xs mb-3">
                      <div className="flex items-center gap-1.5 text-success">
                        <TrendingUp className="w-3 h-3" />
                        <span>{barEntradas} entradas</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-destructive">
                        <TrendingDown className="w-3 h-3" />
                        <span>{barSaidas} saídas</span>
                      </div>
                    </div>
                    <MovementList movements={barMovements.slice(0, 10)} showDate={false} />
                  </TabsContent>
                  <TabsContent value="cozinha">
                    <div className="flex items-center gap-4 text-xs mb-3">
                      <div className="flex items-center gap-1.5 text-success">
                        <TrendingUp className="w-3 h-3" />
                        <span>{cozinhaEntradas} entradas</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-destructive">
                        <TrendingDown className="w-3 h-3" />
                        <span>{cozinhaSaidas} saídas</span>
                      </div>
                    </div>
                    <MovementList movements={cozinhaMovements.slice(0, 10)} showDate={false} />
                  </TabsContent>
                </Tabs>
              ) : (
                <MovementList movements={movements.slice(0, 10)} showDate={false} />
              )}
            </div>
          </div>

          {/* Alerts Section */}
          <div>
            <div className="glass rounded-xl lg:rounded-2xl p-4 lg:p-6">
              <h2 className="text-lg lg:text-xl font-display font-semibold mb-3 lg:mb-4">Alertas de Estoque</h2>
              
              {isAdmin ? (
                <Tabs defaultValue="bar" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="bar" className="flex items-center gap-2">
                      <Wine className="w-4 h-4" />
                      Bar
                      {barLowStockItems.length > 0 && (
                        <span className="text-xs bg-warning/20 text-warning px-1.5 py-0.5 rounded">
                          {barLowStockItems.length}
                        </span>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="cozinha" className="flex items-center gap-2">
                      <UtensilsCrossed className="w-4 h-4" />
                      Cozinha
                      {cozinhaLowStockItems.length > 0 && (
                        <span className="text-xs bg-warning/20 text-warning px-1.5 py-0.5 rounded">
                          {cozinhaLowStockItems.length}
                        </span>
                      )}
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="bar">
                    {barLowStockItems.length === 0 ? (
                      <div className="text-center py-6 text-muted-foreground">
                        <AlertTriangle className="w-6 h-6 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Nenhum alerta no Bar</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {barLowStockItems.map((item) => (
                          <div
                            key={item.id}
                            className="p-2.5 rounded-lg bg-warning/10 border border-warning/20"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-sm text-foreground">{item.name}</span>
                              <span className="text-warning font-semibold text-sm">
                                {item.quantity} {item.unit}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              Mínimo: {item.min_quantity} {item.unit}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                  <TabsContent value="cozinha">
                    {cozinhaLowStockItems.length === 0 ? (
                      <div className="text-center py-6 text-muted-foreground">
                        <AlertTriangle className="w-6 h-6 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Nenhum alerta na Cozinha</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {cozinhaLowStockItems.map((item) => (
                          <div
                            key={item.id}
                            className="p-2.5 rounded-lg bg-warning/10 border border-warning/20"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-sm text-foreground">{item.name}</span>
                              <span className="text-warning font-semibold text-sm">
                                {item.quantity} {item.unit}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              Mínimo: {item.min_quantity} {item.unit}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              ) : (
                lowStockItems.length === 0 ? (
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
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
