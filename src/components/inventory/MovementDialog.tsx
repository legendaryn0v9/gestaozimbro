import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useInventoryItems, useAddMovement, MovementType, InventoryItem } from '@/hooks/useInventory';
import { useIsAdmin } from '@/hooks/useUserRoles';
import { useUserSector } from '@/hooks/useUserSector';
import { useCategories } from '@/hooks/useCategories';
import { TrendingUp, TrendingDown, ArrowRight, Package, Search, Check } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { cn } from '@/lib/utils';

interface MovementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: MovementType;
  preselectedItemId?: string;
  sector?: 'bar' | 'cozinha';
}

// Helper to get icon component
const getIconComponent = (iconName: string | null): React.ComponentType<{ className?: string }> => {
  if (!iconName) return Package;
  const icons = LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>;
  return icons[iconName] || Package;
};

// Unit conversion helpers - only for kg (gramas), litro stays as L with decimals
const unitConversions: Record<string, { subUnit: string; factor: number; subUnitLabel: string }> = {
  kg: { subUnit: 'g', factor: 1000, subUnitLabel: 'gramas' },
};

const getUnitLabel = (unit: string, useSubUnit: boolean) => {
  if (useSubUnit && unitConversions[unit]) {
    return unitConversions[unit].subUnit;
  }
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
  const [useSubUnit, setUseSubUnit] = useState(false);
  const [notes, setNotes] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: allItems = [] } = useInventoryItems();
  const { isAdmin } = useIsAdmin();
  const { sector: userSector } = useUserSector();
  const addMovement = useAddMovement();
  
  // Determine which sector to use - prefer prop, then user sector
  const effectiveSector = sector || userSector;
  
  // Fetch categories only for the effective sector
  const { data: barCategories = [] } = useCategories('bar');
  const { data: cozinhaCategories = [] } = useCategories('cozinha');

  // Filter items by effective sector
  const items = useMemo(() => {
    if (effectiveSector) {
      return allItems.filter(item => item.sector === effectiveSector);
    }
    return allItems;
  }, [allItems, effectiveSector]);

  // Set preselected item when dialog opens
  useEffect(() => {
    if (open && preselectedItemId) {
      const item = items.find(i => i.id === preselectedItemId);
      if (item) setSelectedItem(item);
    }
  }, [open, preselectedItemId, items]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setSelectedItem(null);
      setQuantity('');
      setUseSubUnit(false);
      setNotes('');
      setSearchQuery('');
    }
  }, [open]);

  // Filter items by search
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const query = searchQuery.toLowerCase();
    return items.filter(item => 
      item.name.toLowerCase().includes(query) ||
      item.category?.toLowerCase().includes(query)
    );
  }, [items, searchQuery]);

  // Organize items by categories - show only items from effective sector
  const organizedItems = useMemo(() => {
    // Use only categories from the effective sector
    let categories = effectiveSector === 'bar' 
      ? barCategories 
      : effectiveSector === 'cozinha'
        ? cozinhaCategories
        : [...barCategories, ...cozinhaCategories];

    // Sort categories by sort_order
    categories = [...categories].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

    const grouped: Array<{
      category: typeof categories[0];
      items: InventoryItem[];
      subcategories: Array<{
        subcategory: typeof categories[0]['subcategories'][0];
        items: InventoryItem[];
      }>;
    }> = [];

    // Track which items have been assigned to categories
    const assignedItemIds = new Set<string>();

    categories.forEach(category => {
      // Find ALL items that belong to this category
      const allCategoryItems = filteredItems.filter(item => {
        if (!item.category) return false;
        const itemCategoryName = item.category.split(' - ')[0]?.trim();
        return itemCategoryName === category.name;
      });

      const subcategoryGroups: typeof grouped[0]['subcategories'] = [];
      
      // Sort subcategories by sort_order
      const sortedSubcategories = [...category.subcategories].sort(
        (a, b) => (a.sort_order || 0) - (b.sort_order || 0)
      );
      
      sortedSubcategories.forEach(sub => {
        const subItems = filteredItems.filter(item => {
          if (!item.category) return false;
          const parts = item.category.split(' - ');
          const itemCategoryName = parts[0]?.trim();
          const itemSubcategoryName = parts[1]?.trim();
          return itemCategoryName === category.name && itemSubcategoryName === sub.name;
        });
        
        if (subItems.length > 0) {
          subItems.forEach(item => assignedItemIds.add(item.id));
          subcategoryGroups.push({
            subcategory: sub,
            items: subItems.sort((a, b) => a.name.localeCompare(b.name)),
          });
        }
      });

      // Direct items are those in the category but NOT in any subcategory
      const directItems = allCategoryItems.filter(item => {
        const parts = item.category?.split(' - ');
        // Item is direct if it has no subcategory part
        return parts?.length === 1 || !parts?.[1]?.trim();
      }).sort((a, b) => a.name.localeCompare(b.name));
      
      directItems.forEach(item => assignedItemIds.add(item.id));

      // Only add category if it has items
      if (directItems.length > 0 || subcategoryGroups.length > 0) {
        grouped.push({
          category,
          items: directItems,
          subcategories: subcategoryGroups,
        });
      }
    });

    // Uncategorized items - those without category or not matching any known category
    const uncategorized = filteredItems
      .filter(item => !assignedItemIds.has(item.id))
      .sort((a, b) => a.name.localeCompare(b.name));

    return { grouped, uncategorized };
  }, [filteredItems, barCategories, cozinhaCategories, effectiveSector]);

  // Calculate final quantity for display
  const getFinalQuantity = () => {
    if (!selectedItem || !quantity) return null;
    
    let qtyValue = Number(quantity);
    if (useSubUnit && unitConversions[selectedItem.unit]) {
      qtyValue = qtyValue / unitConversions[selectedItem.unit].factor;
    }
    
    const current = selectedItem.quantity;
    const final = type === 'entrada' ? current + qtyValue : current - qtyValue;
    return { qtyValue, final };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    
    let finalQty = Number(quantity);
    if (useSubUnit && unitConversions[selectedItem.unit]) {
      finalQty = finalQty / unitConversions[selectedItem.unit].factor;
    }
    
    addMovement.mutate(
      {
        itemId: selectedItem.id,
        movementType: type,
        quantity: finalQty,
        notes: notes || undefined,
      },
      {
        onSuccess: () => {
          setSelectedItem(null);
          setQuantity('');
          setUseSubUnit(false);
          setNotes('');
          setSearchQuery('');
          onOpenChange(false);
        },
      }
    );
  };

  const isEntrada = type === 'entrada';
  const hasSubUnit = selectedItem && unitConversions[selectedItem.unit];
  const calc = getFinalQuantity();

  const renderItemCard = (item: InventoryItem) => {
    const isSelected = selectedItem?.id === item.id;
    const unitLabel = getUnitLabel(item.unit, false);
    
    return (
      <button
        key={item.id}
        type="button"
        onClick={() => {
          setSelectedItem(item);
          setUseSubUnit(false);
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
          {/* Search */}
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

          {/* Items List */}
          <ScrollArea className="flex-1 px-4">
            <div className="space-y-4 pb-4">
              {organizedItems.grouped.map(({ category, items: directItems, subcategories }) => {
                const IconComponent = getIconComponent(category.icon);
                
                return (
                  <div key={category.id}>
                    <div className={cn(
                      'flex items-center gap-2 font-semibold text-sm mb-2 px-1',
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
          </ScrollArea>

          {/* Selected Item Details & Quantity */}
          {selectedItem && (
            <div className="border-t border-border p-4 space-y-4 bg-background/50">
              <div className="p-3 rounded-lg bg-secondary/50">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold">{selectedItem.name}</p>
                  <span className="text-sm text-muted-foreground">
                    Estoque: {selectedItem.quantity} {getUnitLabel(selectedItem.unit, false)}
                  </span>
                </div>
                
                {calc && (
                  <div className="flex items-center gap-2 text-sm">
                    <span>{selectedItem.quantity} {getUnitLabel(selectedItem.unit, false)}</span>
                    <ArrowRight className="w-3 h-3 text-muted-foreground" />
                    <span className={cn(
                      'font-semibold',
                      isEntrada ? 'text-success' : calc.final < 0 ? 'text-destructive' : 'text-destructive'
                    )}>
                      {calc.final.toFixed(2)} {getUnitLabel(selectedItem.unit, false)}
                    </span>
                    {calc.final < 0 && (
                      <span className="text-xs text-destructive">(Estoque insuficiente)</span>
                    )}
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="quantity">Quantidade</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="0"
                    className="bg-input border-border text-lg font-semibold"
                    required
                    autoFocus
                  />
                </div>
                
                {hasSubUnit && (
                  <div className="w-28 space-y-2">
                    <Label>Unidade</Label>
                    <Select 
                      value={useSubUnit ? 'sub' : 'main'} 
                      onValueChange={(v) => setUseSubUnit(v === 'sub')}
                    >
                      <SelectTrigger className="bg-input border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="main">{getUnitLabel(selectedItem.unit, false)}</SelectItem>
                        <SelectItem value="sub">{unitConversions[selectedItem.unit].subUnit}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
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
                disabled={addMovement.isPending || !quantity || (calc && calc.final < 0 && !isEntrada)}
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
                      <>
                        <TrendingUp className="w-4 h-4 mr-2" />
                        Registrar Entrada
                      </>
                    ) : (
                      <>
                        <TrendingDown className="w-4 h-4 mr-2" />
                        Registrar Saída
                      </>
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