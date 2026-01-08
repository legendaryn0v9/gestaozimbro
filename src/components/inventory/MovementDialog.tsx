import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useInventoryItems, useAddMovement, MovementType } from '@/hooks/useInventory';
import { TrendingUp, TrendingDown, ArrowRight, Martini, GlassWater, Beer, UtensilsCrossed } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MovementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: MovementType;
  preselectedItemId?: string;
}

// Categorias do Bar
const BAR_DESTILADOS = ['Destilados', 'Vodka', 'Gin', 'Whisky', 'Rum', 'Tequila', 'Cognac'];
const BAR_NAO_ALCOOLICOS = ['Refrigerante', 'Energético', 'Cerveja Zero', 'Água com Gás', 'Água sem Gás'];
const BAR_ALCOOLICOS = ['Cerveja', 'Vinho', 'Licor'];

const normalizeCategory = (category: string | null) => {
  if (!category) return null;
  return category.split(' - ').pop()?.trim() || category;
};

export function MovementDialog({ open, onOpenChange, type, preselectedItemId }: MovementDialogProps) {
  const [itemId, setItemId] = useState(preselectedItemId || '');
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');

  const { data: items = [] } = useInventoryItems();
  const addMovement = useAddMovement();

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

  // Organize items by categories
  const itemsByCategory = useMemo(() => {
    const barItems = items.filter(i => i.sector === 'bar');
    const cozinhaItems = items.filter(i => i.sector === 'cozinha');

    const destilados = barItems.filter(i => {
      const cat = normalizeCategory(i.category);
      return cat && BAR_DESTILADOS.includes(cat);
    });

    const naoAlcoolicos = barItems.filter(i => {
      const cat = normalizeCategory(i.category);
      return cat && BAR_NAO_ALCOOLICOS.includes(cat);
    });

    const alcoolicos = barItems.filter(i => {
      const cat = normalizeCategory(i.category);
      return cat && BAR_ALCOOLICOS.includes(cat);
    });

    // Items that don't fit in any category
    const outrosBar = barItems.filter(i => {
      const cat = normalizeCategory(i.category);
      return !cat || (!BAR_DESTILADOS.includes(cat) && !BAR_NAO_ALCOOLICOS.includes(cat) && !BAR_ALCOOLICOS.includes(cat));
    });

    // Group cozinha items by category
    const cozinhaCategorias = new Map<string, typeof items>();
    cozinhaItems.forEach(item => {
      const cat = item.category || 'Outros';
      if (!cozinhaCategorias.has(cat)) {
        cozinhaCategorias.set(cat, []);
      }
      cozinhaCategorias.get(cat)!.push(item);
    });

    return {
      destilados,
      naoAlcoolicos,
      alcoolicos,
      outrosBar,
      cozinha: cozinhaCategorias,
    };
  }, [items]);

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
                {/* Destilados */}
                {itemsByCategory.destilados.length > 0 && (
                  <SelectGroup>
                    <SelectLabel className="flex items-center gap-2 text-amber-500">
                      <Martini className="w-3.5 h-3.5" />
                      Destilados
                    </SelectLabel>
                    {itemsByCategory.destilados.map(renderItemOption)}
                  </SelectGroup>
                )}

                {/* Não Alcoólicos */}
                {itemsByCategory.naoAlcoolicos.length > 0 && (
                  <SelectGroup>
                    <SelectLabel className="flex items-center gap-2 text-blue-500">
                      <GlassWater className="w-3.5 h-3.5" />
                      Não Alcoólicos
                    </SelectLabel>
                    {itemsByCategory.naoAlcoolicos.map(renderItemOption)}
                  </SelectGroup>
                )}

                {/* Alcoólicos */}
                {itemsByCategory.alcoolicos.length > 0 && (
                  <SelectGroup>
                    <SelectLabel className="flex items-center gap-2 text-purple-500">
                      <Beer className="w-3.5 h-3.5" />
                      Alcoólicos
                    </SelectLabel>
                    {itemsByCategory.alcoolicos.map(renderItemOption)}
                  </SelectGroup>
                )}

                {/* Outros Bar */}
                {itemsByCategory.outrosBar.length > 0 && (
                  <SelectGroup>
                    <SelectLabel className="text-muted-foreground">
                      Outros (Bar)
                    </SelectLabel>
                    {itemsByCategory.outrosBar.map(renderItemOption)}
                  </SelectGroup>
                )}

                {/* Cozinha - by category */}
                {Array.from(itemsByCategory.cozinha.entries()).map(([category, categoryItems]) => (
                  <SelectGroup key={category}>
                    <SelectLabel className="flex items-center gap-2 text-orange-500">
                      <UtensilsCrossed className="w-3.5 h-3.5" />
                      Cozinha - {category}
                    </SelectLabel>
                    {categoryItems.map(renderItemOption)}
                  </SelectGroup>
                ))}
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
