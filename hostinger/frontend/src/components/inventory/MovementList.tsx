import { StockMovement } from '@/hooks/useInventory';
import { formatBrazilTime } from '@/lib/datetime';
import { TrendingUp, TrendingDown, User, Pencil } from 'lucide-react';
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
        const movementType = movement.movement_type;
        const isEntrada = movementType === 'entrada';
        const isSaida = movementType === 'saida';

        const meta = isEntrada
          ? { label: 'Entrada', icon: TrendingUp, bg: 'bg-success/10', fg: 'text-success', sign: '+' }
          : isSaida
            ? { label: 'Saída', icon: TrendingDown, bg: 'bg-destructive/10', fg: 'text-destructive', sign: '-' }
            : { label: 'Edição', icon: Pencil, bg: 'bg-primary/10', fg: 'text-primary', sign: '' };

        // The hook already processes snapshot data into inventory_items
        const itemName = movement.inventory_items?.name || movement.item_name || 'Produto removido';
        const itemUnit = movement.inventory_items?.unit || 'un';

        const Icon = meta.icon;

        return (
          <div
            key={movement.id}
            className="glass rounded-xl p-4 transition-all duration-200 hover:bg-secondary/30"
          >
            <div className="flex items-start gap-4">
              <div
                className={cn(
                  'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                  meta.bg,
                )}
                aria-label={meta.label}
              >
                <Icon className={cn('w-5 h-5', meta.fg)} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-semibold text-foreground truncate">
                    {itemName}
                  </h4>
                  <span
                    className={cn(
                      'font-bold whitespace-nowrap',
                      meta.fg,
                    )}
                  >
                    {meta.sign}{movement.quantity} {itemUnit}
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
                  <span>
                    {formatBrazilTime(movement.created_at, 'dateTime')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
