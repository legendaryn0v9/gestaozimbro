import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useInventoryItems, useAddMovement, MovementType } from '@/hooks/useInventory';
import { TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MovementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: MovementType;
  preselectedItemId?: string;
}

export function MovementDialog({ open, onOpenChange, type, preselectedItemId }: MovementDialogProps) {
  const [itemId, setItemId] = useState(preselectedItemId || '');
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');

  const { data: items = [] } = useInventoryItems();
  const addMovement = useAddMovement();

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass border-border max-w-md">
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

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>Selecione o Item</Label>
            <Select value={itemId} onValueChange={setItemId}>
              <SelectTrigger className="bg-input border-border">
                <SelectValue placeholder="Escolha um item..." />
              </SelectTrigger>
              <SelectContent>
                {items.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    <div className="flex items-center justify-between w-full">
                      <span>{item.name}</span>
                      <span className="text-muted-foreground ml-2">
                        ({item.quantity} {item.unit})
                      </span>
                    </div>
                  </SelectItem>
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
