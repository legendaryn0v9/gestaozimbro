import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useAddItem, SectorType, UnitType } from '@/hooks/useInventory';
import { Package, Plus } from 'lucide-react';

interface AddItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultSector?: SectorType;
}

export function AddItemDialog({ open, onOpenChange, defaultSector }: AddItemDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [sector, setSector] = useState<SectorType>(defaultSector || 'bar');
  const [unit, setUnit] = useState<UnitType>('unidade');
  const [quantity, setQuantity] = useState('0');
  const [minQuantity, setMinQuantity] = useState('');

  const addItem = useAddItem();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    addItem.mutate(
      {
        name,
        description: description || null,
        sector,
        unit,
        quantity: Number(quantity),
        min_quantity: minQuantity ? Number(minQuantity) : null,
      },
      {
        onSuccess: () => {
          setName('');
          setDescription('');
          setQuantity('0');
          setMinQuantity('');
          onOpenChange(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-xl">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Package className="w-4 h-4 text-primary" />
            </div>
            Novo Item
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Item</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Cerveja Heineken"
              className="bg-input border-border"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição (opcional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrição do item..."
              className="bg-input border-border resize-none"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Setor</Label>
              <Select value={sector} onValueChange={(v) => setSector(v as SectorType)}>
                <SelectTrigger className="bg-input border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bar">Bar</SelectItem>
                  <SelectItem value="cozinha">Cozinha</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Unidade</Label>
              <Select value={unit} onValueChange={(v) => setUnit(v as UnitType)}>
                <SelectTrigger className="bg-input border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unidade">Unidade</SelectItem>
                  <SelectItem value="kg">Kg</SelectItem>
                  <SelectItem value="litro">Litro</SelectItem>
                  <SelectItem value="caixa">Caixa</SelectItem>
                  <SelectItem value="pacote">Pacote</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantidade Inicial</Label>
              <Input
                id="quantity"
                type="number"
                min="0"
                step="0.01"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="bg-input border-border"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="minQuantity">Qtd. Mínima</Label>
              <Input
                id="minQuantity"
                type="number"
                min="0"
                step="0.01"
                value={minQuantity}
                onChange={(e) => setMinQuantity(e.target.value)}
                placeholder="Alerta"
                className="bg-input border-border"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={addItem.isPending || !name}
            className="w-full bg-gradient-amber text-primary-foreground hover:opacity-90 h-11"
          >
            {addItem.isPending ? (
              <span className="animate-pulse">Salvando...</span>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Item
              </>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
