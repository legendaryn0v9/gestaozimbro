import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { useInventoryItems, useAddMovement, MovementType, InventoryItem } from '../../hooks/useInventory';
import { useIsAdmin } from '../../hooks/useUserRoles';
import { useUserSector } from '../../hooks/useUserSector';
import { useCategories } from '../../hooks/useCategories';
import { TrendingUp, TrendingDown, ArrowRight, Package, Search, Check } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { cn } from '../../lib/utils';

interface MovementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: MovementType;
  preselectedItemId?: string;
  sector?: 'bar' | 'cozinha';
}

const getIconComponent = (iconName: string | null): React.ComponentType<{ className?: string }> => {
  if (!iconName) return Package;
  const icons = LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>;
  return icons[iconName] || Package;
};

const getUnitLabel = (unit: string) => {
  const labels: Record<string, string> = {
    unidade: 'un',
    kg: 'kg',
    litro: 'L',
    caixa: 'cx',
    pacote: 'pct',
  };
  return labels[unit] || unit;
};

export function MovementDialog({ open, onOpenChange, type, preselectedItemId, sector }: MovementDialogProps) {
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: allItems = [] } = useInventoryItems();
  const { isAdmin } = useIsAdmin();
  const { sector: userSector } = useUserSector();
  const addMovement = useAddMovement();
  
  const effectiveSector = sector || userSector;
  
  const { data: barCategories = [] } = useCategories('bar');
  const { data: cozinhaCategories = [] } = useCategories('cozinha');

  const items = useMemo(() => {
    if (effectiveSector) {
      return allItems.filter(item => item.sector === effectiveSector);
    }
    return allItems;
  }, [allItems, effectiveSector]);

  useEffect(() => {
    if (open && preselectedItemId) {
      const item = items.find(i => i.id === preselectedItemId);
      if (item) setSelectedItem(item);
    }
  }, [open, preselectedItemId, items]);

  useEffect(() => {
    if (!open) {
      setSelectedItem(null);
      setQuantity('');
      setNotes('');
      setSearchQuery('');
    }
  }, [open]);

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const query = searchQuery.toLowerCase();
    return items.filter(item => 
      item.name.toLowerCase().includes(query) ||
      item.category?.toLowerCase().includes(query)
    );
  }, [items, searchQuery]);

  const organizedItems = useMemo(() => {
    let categories = effectiveSector === 'bar' 
      ? barCategories 
      : effectiveSector === 'cozinha'
        ? cozinhaCategories
        : [...barCategories, ...cozinhaCategories];

    categories = [...categories].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

    const grouped: Array<{
      category: typeof categories[0];
      items: InventoryItem[];
      subcategories: Array<{
        subcategory: typeof categories[0]['subcategories'][0];
        items: InventoryItem[];
      }>;
    }> = [];

    const assignedItemIds = new Set<string>();

    categories.forEach(category => {
      const subcategoryGroups: typeof grouped[0]['subcategories'] = [];
      
      const sortedSubcategories = [...category.subcategories].sort(
        (a, b) => (a.sort_order || 0) - (b.sort_order || 0)
      );
      
      sortedSubcategories.forEach(sub => {
        const subItems = filteredItems.filter(item => {
          if (!item.category) return false;
          return item.category.trim() === sub.name;
        });
        
        if (subItems.length > 0) {
          subItems.forEach(item => assignedItemIds.add(item.id));
          subcategoryGroups.push({
            subcategory: sub,
            items: subItems.sort((a, b) => a.name.localeCompare(b.name)),
          });
        }
      });

      const directItems = filteredItems.filter(item => {
        if (!item.category || assignedItemIds.has(item.id)) return false;
        return item.category.trim() === category.name;
      }).sort((a, b) => a.name.localeCompare(b.name));
      
      directItems.forEach(item => assignedItemIds.add(item.id));

      if (directItems.length > 0 || subcategoryGroups.length > 0) {
        grouped.push({
          category,
          items: directItems,
          subcategories: subcategoryGroups,
        });
      }
    });

    const uncategorized = filteredItems
      .filter(item => !assignedItemIds.has(item.id))
      .sort((a, b) => a.name.localeCompare(b.name));

    return { grouped, uncategorized };
  }, [filteredItems, barCategories, cozinhaCategories, effectiveSector]);

  const getFinalQuantity = () => {
    if (!selectedItem || !quantity) return null;
    const qtyValue = Number(String(quantity).replace(',', '.'));
    if (!Number.isFinite(qtyValue) || qtyValue <= 0) return null;

    // Backend PHP may return numbers as strings; always coerce to number to avoid crashes.
    const current = Number(selectedItem.quantity);
    const currentQty = Number.isFinite(current) ? current : 0;
    const final = type === 'entrada' ? currentQty + qtyValue : currentQty - qtyValue;
    return { qtyValue, final };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    
    addMovement.mutate(
      {
        itemId: selectedItem.id,
        movementType: type,
        quantity: Number(quantity),
        notes: notes || undefined,
      },
      {
        onSuccess: () => {
          setSelectedItem(null);
          setQuantity('');
          setNotes('');
          setSearchQuery('');
          onOpenChange(false);
        },
      }
    );
  };

  const isEntrada = type === 'entrada';
  const calc = getFinalQuantity();
  const isDirectMode = Boolean(preselectedItemId && selectedItem);

  const renderItemCard = (item: InventoryItem) => {
    const isSelected = selectedItem?.id === item.id;
    const unitLabel = getUnitLabel(item.unit);
    
    return (
      <button
        key={item.id}
        type="button"
        onClick={() => {
          setSelectedItem(item);
          setQuantity('');
        }}
        className={cn(
          'w-full p-3 rounded-lg text-left transition-all border',
          isSelected 
            ? 'bg-primary/10 border-primary ring-1 ring-primary' 
            : 'bg-secondary/30 border-transparent hover:bg-secondary/50'
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{item.name}</p>
            {item.category && (
              <p className="text-xs text-muted-foreground truncate">{item.category}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className={cn(
              'text-sm font-semibold px-2 py-1 rounded',
              item.quantity === 0 ? 'bg-destructive/20 text-destructive' :
              item.quantity <= (item.min_quantity || 0) ? 'bg-warning/20 text-warning' :
              'bg-muted text-foreground'
            )}>
              {item.quantity} {unitLabel}
            </span>
            {isSelected && (
              <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                <Check className="w-3 h-3 text-primary-foreground" />
              </div>
            )}
          </div>
        </div>
      </button>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass border-border max-w-lg max-h-[90vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle className="flex items-center gap-2 font-display text-xl">
            <div className={cn(
              'w-8 h-8 rounded-lg flex items-center justify-center',
              isEntrada ? 'bg-success/10' : 'bg-destructive/10'
            )}>
              {isEntrada ? (
                <TrendingUp className="w-4 h-4 text-success" />
              ) : (
                <TrendingDown className="w-4 h-4 text-destructive" />
              )}
            </div>
            {isEntrada ? 'Registrar Entrada' : 'Registrar Saída'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          {!isDirectMode && (
            <>
              <div className="px-4 py-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar produto..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 bg-input border-border"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-4 min-h-[200px] max-h-[50vh]">
                <div className="space-y-4 pb-4">
                  {organizedItems.grouped.map(({ category, items: directItems, subcategories }) => {
                    const IconComponent = getIconComponent(category.icon);
                    
                    return (
                      <div key={category.id}>
                        <div className={cn(
                          'flex items-center gap-2 font-semibold text-sm mb-2 px-1 sticky top-0 bg-background/95 backdrop-blur-sm py-1',
                          `bg-gradient-to-r ${category.gradient || 'from-amber-500 to-orange-600'} bg-clip-text text-transparent`
                        )}>
                          <IconComponent className="w-4 h-4 text-primary" />
                          {category.name}
                        </div>
                        
                        <div className="space-y-2">
                          {directItems.map(renderItemCard)}
                          
                          {subcategories.map(({ subcategory, items: subItems }) => (
                            <div key={subcategory.id} className="ml-2">
                              <p className="text-xs font-medium text-muted-foreground mb-1 pl-2">
                                └ {subcategory.name}
                              </p>
                              <div className="space-y-2">
                                {subItems.map(renderItemCard)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                  
                  {organizedItems.uncategorized.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 font-semibold text-sm mb-2 px-1 text-muted-foreground">
                        <Package className="w-4 h-4" />
                        Sem Categoria
                      </div>
                      <div className="space-y-2">
                        {organizedItems.uncategorized.map(renderItemCard)}
                      </div>
                    </div>
                  )}
                  
                  {filteredItems.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>Nenhum produto encontrado</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {selectedItem && (
            <div className="border-t border-border p-4 space-y-4 bg-background/50">
              <div className="p-3 rounded-lg bg-secondary/50">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold">{selectedItem.name}</p>
                  <span className="text-sm text-muted-foreground">
                    Estoque: {selectedItem.quantity} {getUnitLabel(selectedItem.unit)}
                  </span>
                </div>
                
                {calc && (
                  <div className="flex items-center gap-2 text-sm">
                    <span>{selectedItem.quantity} {getUnitLabel(selectedItem.unit)}</span>
                    <ArrowRight className="w-3 h-3 text-muted-foreground" />
                    <span className={cn(
                      'font-semibold',
                      isEntrada ? 'text-success' : calc.final < 0 ? 'text-destructive' : 'text-destructive'
                    )}>
                      {calc.final.toFixed(2)} {getUnitLabel(selectedItem.unit)}
                    </span>
                    {calc.final < 0 && (
                      <span className="text-xs text-destructive">(Estoque insuficiente)</span>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity">Quantidade ({getUnitLabel(selectedItem.unit)})</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="bg-input border-border text-lg font-semibold"
                  required
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Observação (opcional)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: Compra do fornecedor X..."
                  className="bg-input border-border resize-none"
                  rows={2}
                />
              </div>

              <Button
                type="submit"
                disabled={addMovement.isPending || !calc || (calc && calc.final < 0 && !isEntrada)}
                className={cn(
                  'w-full h-11 text-white',
                  isEntrada 
                    ? 'bg-success hover:bg-success/90' 
                    : 'bg-destructive hover:bg-destructive/90'
                )}
              >
                {addMovement.isPending ? (
                  <span className="animate-pulse">Registrando...</span>
                ) : (
                  <>
                    {isEntrada ? (
                      <><TrendingUp className="w-4 h-4 mr-2" />Registrar Entrada</>
                    ) : (
                      <><TrendingDown className="w-4 h-4 mr-2" />Registrar Saída</>
                    )}
                  </>
                )}
              </Button>
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
