import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { MovementDialog } from '@/components/inventory/MovementDialog';
import { MovementList } from '@/components/inventory/MovementList';
import { useStockMovements } from '@/hooks/useInventory';
import { Button } from '@/components/ui/button';
import { TrendingDown, Plus } from 'lucide-react';

export default function Saida() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data: movements = [], isLoading } = useStockMovements();

  const saidas = movements.filter(m => m.movement_type === 'saida');

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
                {saidas.length} registros de saída
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
          ) : (
            <MovementList movements={saidas} />
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
