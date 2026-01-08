import { InventoryItem } from '@/hooks/useInventory';
import { cn } from '@/lib/utils';
import { Package, AlertTriangle, Wine, UtensilsCrossed } from 'lucide-react';

interface ItemCardProps {
  item: InventoryItem;
  onClick?: () => void;
}

export function ItemCard({ item, onClick }: ItemCardProps) {
  const isLowStock = item.min_quantity !== null && item.quantity <= item.min_quantity;
  const isOutOfStock = item.quantity === 0;

  const unitLabels: Record<string, string> = {
    unidade: 'un',
    kg: 'kg',
    litro: 'L',
    caixa: 'cx',
    pacote: 'pct',
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        'glass rounded-xl p-4 cursor-pointer transition-all duration-300 hover:glow-amber hover:scale-[1.02]',
        isOutOfStock && 'border-destructive/50',
        isLowStock && !isOutOfStock && 'border-warning/50'
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          {item.sector === 'bar' ? (
            <Wine className="w-5 h-5 text-primary" />
          ) : (
            <UtensilsCrossed className="w-5 h-5 text-primary" />
          )}
        </div>
        {(isLowStock || isOutOfStock) && (
          <div className={cn(
            'px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1',
            isOutOfStock ? 'bg-destructive/20 text-destructive' : 'bg-warning/20 text-warning'
          )}>
            <AlertTriangle className="w-3 h-3" />
            {isOutOfStock ? 'Esgotado' : 'Baixo'}
          </div>
        )}
      </div>

      <h3 className="font-semibold text-foreground truncate">{item.name}</h3>
      {item.description && (
        <p className="text-muted-foreground text-sm truncate mt-1">{item.description}</p>
      )}

      <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
        <span className="text-muted-foreground text-sm">Quantidade</span>
        <span className={cn(
          'font-bold text-lg',
          isOutOfStock ? 'text-destructive' : isLowStock ? 'text-warning' : 'text-foreground'
        )}>
          {item.quantity} {unitLabels[item.unit]}
        </span>
      </div>
    </div>
  );
}
