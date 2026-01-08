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
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-destructive/20 flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-destructive" />
              </div>
              <div>
                <h1 className="text-3xl font-display font-bold text-foreground">Saídas</h1>
                <p className="text-muted-foreground">
                  {saidas.length} registros de saída
                </p>
              </div>
            </div>
          </div>

          <Button
            onClick={() => setDialogOpen(true)}
            className="bg-destructive hover:bg-destructive/90 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Saída
          </Button>
        </div>

        <div className="glass rounded-2xl p-6">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-20 rounded-xl bg-secondary/50 animate-pulse" />
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
