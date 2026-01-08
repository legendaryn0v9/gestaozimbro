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
      {item.image_url ? (
        <div className="relative w-full h-24 mb-3 rounded-lg overflow-hidden">
          <img 
            src={item.image_url} 
            alt={item.name} 
            className="w-full h-full object-cover"
          />
          {(isLowStock || isOutOfStock) && (
            <div className={cn(
              'absolute top-2 right-2 px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1',
              isOutOfStock ? 'bg-destructive/90 text-white' : 'bg-warning/90 text-white'
            )}>
              <AlertTriangle className="w-3 h-3" />
              {isOutOfStock ? 'Esgotado' : 'Baixo'}
            </div>
          )}
        </div>
      ) : (
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
      )}

      <div className="flex items-center gap-2 mb-1">
        <h3 className="font-semibold text-foreground truncate">{item.name}</h3>
      </div>
      {item.category && (
        <span className="inline-block px-2 py-0.5 rounded-md bg-primary/10 text-primary text-xs font-medium mb-1">
          {item.category}
        </span>
      )}
      {item.description && (
        <p className="text-muted-foreground text-sm truncate">{item.description}</p>
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
