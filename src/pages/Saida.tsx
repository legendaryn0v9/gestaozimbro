import { useState, useMemo } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { MovementDialog } from '@/components/inventory/MovementDialog';
import { MovementList } from '@/components/inventory/MovementList';
import { useStockMovements } from '@/hooks/useInventory';
import { useIsAdmin } from '@/hooks/useUserRoles';
import { useUserSector } from '@/hooks/useUserSector';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingDown, Plus, Wine, UtensilsCrossed } from 'lucide-react';

export default function Saida() {
  const { user } = useAuth();
  const { isAdmin } = useIsAdmin();
  const { sector: userSector } = useUserSector();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data: allMovements = [], isLoading } = useStockMovements();

  // Filter movements based on user role
  const movements = useMemo(() => {
    const saidas = allMovements.filter(m => m.movement_type === 'saida');
    
    if (isAdmin) {
      return saidas;
    }
    // For employees: only show their own movements from their sector
    return saidas.filter(m => {
      const isOwnMovement = m.user_id === user?.id;
      const isFromUserSector = !userSector || m.inventory_items?.sector === userSector;
      return isOwnMovement && isFromUserSector;
    });
  }, [allMovements, isAdmin, user?.id, userSector]);

  // Separate by sector for admin
  const barMovements = useMemo(() => 
    movements.filter(m => m.inventory_items?.sector === 'bar'), 
    [movements]
  );
  
  const cozinhaMovements = useMemo(() => 
    movements.filter(m => m.inventory_items?.sector === 'cozinha'), 
    [movements]
  );

  return (
    <MainLayout>
      <div className="animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 lg:mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-destructive/20 flex items-center justify-center">
              <TrendingDown className="w-5 h-5 sm:w-6 sm:h-6 text-destructive" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground">Saídas</h1>
              <p className="text-sm text-muted-foreground">
                {movements.length} {isAdmin ? 'registros de saída' : 'suas saídas'}
              </p>
            </div>
          </div>

          <Button
            onClick={() => setDialogOpen(true)}
            size="sm"
            className="bg-destructive hover:bg-destructive/90 text-white w-full sm:w-auto"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Saída
          </Button>
        </div>

        <div className="glass rounded-xl lg:rounded-2xl p-4 lg:p-6">
          {isLoading ? (
            <div className="space-y-3 lg:space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 lg:h-20 rounded-xl bg-secondary/50 animate-pulse" />
              ))}
            </div>
          ) : isAdmin ? (
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
                <MovementList movements={barMovements} />
              </TabsContent>
              <TabsContent value="cozinha">
                <MovementList movements={cozinhaMovements} />
              </TabsContent>
            </Tabs>
          ) : (
            <MovementList movements={movements} />
          )}
        </div>

        <MovementDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          type="saida"
        />
      </div>
    </MainLayout>
  );
}
