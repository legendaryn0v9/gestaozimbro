import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useInventoryItems, useAddMovement, MovementType } from '@/hooks/useInventory';
import { useIsAdmin } from '@/hooks/useUserRoles';
import { useUserSector } from '@/hooks/useUserSector';
import { useCategories } from '@/hooks/useCategories';
import { TrendingUp, TrendingDown, ArrowRight, Package } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { cn } from '@/lib/utils';

interface MovementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: MovementType;
  preselectedItemId?: string;
}

// Helper to get icon component
const getIconComponent = (iconName: string | null): React.ComponentType<{ className?: string }> => {
  if (!iconName) return Package;
  const icons = LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>;
  return icons[iconName] || Package;
};

// Helper to extract gradient colors for text
const getGradientTextColor = (gradient: string | null) => {
  if (!gradient) return 'text-amber-500';
  
  // Extract the first color from gradient (e.g., "from-amber-500 to-orange-600" -> "amber-500")
  const match = gradient.match(/from-([a-z]+-\d+)/);
  if (match) {
    return `text-${match[1]}`;
  }
  return 'text-amber-500';
};

export function MovementDialog({ open, onOpenChange, type, preselectedItemId }: MovementDialogProps) {
  const [itemId, setItemId] = useState(preselectedItemId || '');
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');

  const { data: allItems = [] } = useInventoryItems();
  const { isAdmin } = useIsAdmin();
  const { sector: userSector } = useUserSector();
  const addMovement = useAddMovement();
  
  // Fetch categories for both sectors
  const { data: barCategories = [] } = useCategories('bar');
  const { data: cozinhaCategories = [] } = useCategories('cozinha');

  // Filter items by sector for employees
  const items = useMemo(() => {
    if (isAdmin || !userSector) {
      return allItems;
    }
    return allItems.filter(item => item.sector === userSector);
  }, [allItems, isAdmin, userSector]);

  // Sync itemId when preselectedItemId changes
  useEffect(() => {
    if (preselectedItemId) {
      setItemId(preselectedItemId);
    }
  }, [preselectedItemId]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setItemId('');
      setQuantity('');
      setNotes('');
    }
  }, [open]);

  // Set preselected item when dialog opens
  useEffect(() => {
    if (open && preselectedItemId) {
      setItemId(preselectedItemId);
    }
  }, [open, preselectedItemId]);

  // Organize items by categories from database
  const organizedItems = useMemo(() => {
    const barItems = items.filter(i => i.sector === 'bar');
    const cozinhaItems = items.filter(i => i.sector === 'cozinha');
    
    // Get categories in order (sort_order)
    const categories = userSector === 'bar' ? barCategories : 
                       userSector === 'cozinha' ? cozinhaCategories :
                       [...barCategories, ...cozinhaCategories];
    
    const sectorItems = userSector === 'bar' ? barItems :
                        userSector === 'cozinha' ? cozinhaItems :
                        [...barItems, ...cozinhaItems];

    // Group items by category
    const grouped: Array<{
      category: typeof categories[0];
      items: typeof items;
      subcategories: Array<{
        subcategory: typeof categories[0]['subcategories'][0];
        items: typeof items;
      }>;
    }> = [];

    categories.forEach(category => {
      const categoryItems = sectorItems.filter(item => {
        const itemCategory = item.category?.split(' - ')[0]?.trim();
        return itemCategory === category.name;
      });

      if (categoryItems.length > 0 || category.subcategories.length > 0) {
        const subcategoryGroups: typeof grouped[0]['subcategories'] = [];
        
        // Group by subcategories
        category.subcategories.forEach(sub => {
          const subItems = sectorItems.filter(item => {
            const parts = item.category?.split(' - ');
            const itemSubcategory = parts?.[1]?.trim();
            return itemSubcategory === sub.name;
          });
          
          if (subItems.length > 0) {
            subcategoryGroups.push({
              subcategory: sub,
              items: subItems,
            });
          }
        });

        // Items directly in category (no subcategory)
        const directItems = categoryItems.filter(item => {
          const parts = item.category?.split(' - ');
          return parts?.length === 1;
        });

        grouped.push({
          category,
          items: directItems,
          subcategories: subcategoryGroups,
        });
      }
    });

    // Items without category
    const uncategorized = sectorItems.filter(item => !item.category);

    return { grouped, uncategorized };
  }, [items, barCategories, cozinhaCategories, userSector]);

  const selectedItem = items.find(i => i.id === itemId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    addMovement.mutate(
      {
        itemId,
        movementType: type,
        quantity: Number(quantity),
        notes: notes || undefined,
      },
      {
        onSuccess: () => {
          setItemId('');
          setQuantity('');
          setNotes('');
          onOpenChange(false);
        },
      }
    );
  };

  const isEntrada = type === 'entrada';

  const renderItemOption = (item: typeof items[0]) => (
    <SelectItem key={item.id} value={item.id}>
      <div className="flex items-center justify-between w-full gap-2">
        <span className="truncate">{item.name}</span>
        <span className="text-muted-foreground text-xs whitespace-nowrap">
          ({item.quantity} {item.unit})
        </span>
      </div>
    </SelectItem>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass border-border max-w-md max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
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

        <form onSubmit={handleSubmit} className="space-y-4 mt-4 overflow-y-auto flex-1">
          <div className="space-y-2">
            <Label>Selecione o Item</Label>
            <Select value={itemId} onValueChange={setItemId}>
              <SelectTrigger className="bg-input border-border">
                <SelectValue placeholder="Escolha um item..." />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {/* Categories in order with their colors */}
                {organizedItems.grouped.map(({ category, items: directItems, subcategories }) => {
                  const IconComponent = getIconComponent(category.icon);
                  const textColorClass = getGradientTextColor(category.gradient);
                  
                  return (
                    <SelectGroup key={category.id}>
                      <SelectLabel className={cn("flex items-center gap-2 font-semibold", textColorClass)}>
                        <IconComponent className="w-3.5 h-3.5" />
                        {category.name}
                      </SelectLabel>
                      
                      {/* Direct items in category */}
                      {directItems.map(renderItemOption)}
                      
                      {/* Subcategory items */}
                      {subcategories.map(({ subcategory, items: subItems }) => (
                        <div key={subcategory.id}>
                          <div className={cn("pl-5 text-xs font-medium py-1", textColorClass, "opacity-70")}>
                            └ {subcategory.name}
                          </div>
                          {subItems.map(renderItemOption)}
                        </div>
                      ))}
                    </SelectGroup>
                  );
                })}
                
                {/* Uncategorized items */}
                {organizedItems.uncategorized.length > 0 && (
                  <SelectGroup>
                    <SelectLabel className="text-muted-foreground flex items-center gap-2">
                      <Package className="w-3.5 h-3.5" />
                      Sem Categoria
                    </SelectLabel>
                    {organizedItems.uncategorized.map(renderItemOption)}
                  </SelectGroup>
                )}
              </SelectContent>
            </Select>
          </div>

          {selectedItem && (
            <div className="p-3 rounded-lg bg-secondary/50 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Estoque atual</p>
                <p className="font-semibold">{selectedItem.quantity} {selectedItem.unit}</p>
              </div>
              {quantity && (
                <>
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Após movimentação</p>
                    <p className={cn(
                      'font-semibold',
                      isEntrada ? 'text-success' : 'text-destructive'
                    )}>
                      {isEntrada 
                        ? selectedItem.quantity + Number(quantity)
                        : selectedItem.quantity - Number(quantity)
                      } {selectedItem.unit}
                    </p>
                  </div>
                </>
              )}
            </div>
          )}

          <div className="space-y-2">
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
            disabled={addMovement.isPending || !itemId || !quantity}
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
        </form>
      </DialogContent>
    </Dialog>
  );
}