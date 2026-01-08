import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { MovementDialog } from '@/components/inventory/MovementDialog';
import { MovementList } from '@/components/inventory/MovementList';
import { useStockMovements } from '@/hooks/useInventory';
import { Button } from '@/components/ui/button';
import { TrendingUp, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Entrada() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data: movements = [], isLoading } = useStockMovements();

  const entradas = movements.filter(m => m.movement_type === 'entrada');

  return (
    <MainLayout>
      <div className="animate-fade-in">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-success/20 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-success" />
              </div>
              <div>
                <h1 className="text-3xl font-display font-bold text-foreground">Entradas</h1>
                <p className="text-muted-foreground">
                  {entradas.length} registros de entrada
                </p>
              </div>
            </div>
          </div>

          <Button
            onClick={() => setDialogOpen(true)}
            className="bg-success hover:bg-success/90 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Entrada
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
            <MovementList movements={entradas} />
          )}
        </div>

        <MovementDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          type="entrada"
        />
      </div>
    </MainLayout>
  );
}
