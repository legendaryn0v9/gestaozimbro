import { StockMovement } from '@/hooks/useInventory';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TrendingUp, TrendingDown, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MovementListProps {
  movements: StockMovement[];
  showDate?: boolean;
}

export function MovementList({ movements, showDate = true }: MovementListProps) {
  if (movements.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Nenhuma movimentação encontrada</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {movements.map((movement) => {
        const isEntrada = movement.movement_type === 'entrada';
        
        return (
          <div
            key={movement.id}
            className="glass rounded-xl p-4 transition-all duration-200 hover:bg-secondary/30"
          >
            <div className="flex items-start gap-4">
              <div className={cn(
                'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                isEntrada ? 'bg-success/10' : 'bg-destructive/10'
              )}>
                {isEntrada ? (
                  <TrendingUp className="w-5 h-5 text-success" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-destructive" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-semibold text-foreground truncate">
                    {movement.inventory_items?.name}
                  </h4>
                  <span className={cn(
                    'font-bold whitespace-nowrap',
                    isEntrada ? 'text-success' : 'text-destructive'
                  )}>
                    {isEntrada ? '+' : '-'}{movement.quantity} {movement.inventory_items?.unit}
                  </span>
                </div>

                {movement.notes && (
                  <p className="text-muted-foreground text-sm mt-1 truncate">
                    {movement.notes}
                  </p>
                )}

                <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    <span>{movement.profiles?.full_name}</span>
                  </div>
                  {showDate && (
                    <span>
                      {format(new Date(movement.created_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
