import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useAddItem, SectorType, UnitType } from '@/hooks/useInventory';
import { Package, Plus, ImagePlus, X } from 'lucide-react';

interface AddItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultSector?: SectorType;
  defaultCategory?: string;
}

const BAR_CATEGORIES = [
  'Destilados',
  'Não Alcoólicos',
  'Alcoólicos',
];

const BAR_SUBCATEGORIES: Record<string, string[]> = {
  'Destilados': ['Vodka', 'Gin', 'Whisky', 'Rum', 'Tequila', 'Cognac'],
  'Não Alcoólicos': ['Refrigerante', 'Energético', 'Cerveja Zero', 'Água com Gás', 'Água sem Gás'],
  'Alcoólicos': ['Cerveja', 'Vinho', 'Licor'],
};

const COZINHA_CATEGORIES = [
  'Carnes',
  'Aves',
  'Peixes',
  'Vegetais',
  'Frutas',
  'Laticínios',
  'Grãos',
  'Temperos',
  'Congelados',
];

export function AddItemDialog({ open, onOpenChange, defaultSector, defaultCategory }: AddItemDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [sector, setSector] = useState<SectorType>(defaultSector || 'bar');
  const [unit, setUnit] = useState<UnitType>('unidade');
  const [quantity, setQuantity] = useState('0');
  const [minQuantity, setMinQuantity] = useState('');
  const [category, setCategory] = useState(defaultCategory || '');
  const [subcategory, setSubcategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addItem = useAddItem();

  const categories = sector === 'bar' ? BAR_CATEGORIES : COZINHA_CATEGORIES;
  const subcategories = sector === 'bar' && category ? BAR_SUBCATEGORIES[category] || [] : [];
  const hideCategory = !!defaultCategory;

  const handleSectorChange = (newSector: SectorType) => {
    setSector(newSector);
    setCategory('');
    setSubcategory('');
    setCustomCategory('');
    setIsCustomCategory(false);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getFinalCategory = () => {
    // Se temos defaultCategory, usar diretamente
    if (defaultCategory) {
      return defaultCategory;
    }
    if (isCustomCategory && customCategory.trim()) {
      return customCategory.trim();
    }
    if (sector === 'bar' && subcategory) {
      return `${category} - ${subcategory}`;
    }
    return category || null;
  };

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
        category: getFinalCategory(),
        image_url: imagePreview,
      },
      {
        onSuccess: () => {
          setName('');
          setDescription('');
          setQuantity('0');
          setMinQuantity('');
          setCategory('');
          setSubcategory('');
          setCustomCategory('');
          setIsCustomCategory(false);
          setImagePreview(null);
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

          {hideCategory ? (
            <div className="space-y-2">
              <Label>Setor</Label>
              <div className="h-10 px-3 py-2 bg-muted rounded-md border border-border flex items-center text-muted-foreground">
                {sector === 'bar' ? 'Bar' : 'Cozinha'} - {defaultCategory}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Setor</Label>
                <Select value={sector} onValueChange={(v) => handleSectorChange(v as SectorType)}>
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
                <Label className="flex items-center justify-between">
                  <span>Categoria</span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomCategory(!isCustomCategory);
                      setCategory('');
                      setSubcategory('');
                      setCustomCategory('');
                    }}
                    className="text-xs text-primary hover:underline"
                  >
                    {isCustomCategory ? 'Usar existente' : 'Criar nova'}
                  </button>
                </Label>
                {isCustomCategory ? (
                  <Input
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    placeholder="Nome da nova categoria..."
                    className="bg-input border-border"
                  />
                ) : (
                  <Select value={category} onValueChange={(v) => { setCategory(v); setSubcategory(''); }}>
                    <SelectTrigger className="bg-input border-border">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
          )}

          {sector === 'bar' && !isCustomCategory && !hideCategory && category && subcategories.length > 0 && (
            <div className="space-y-2">
              <Label>Subcategoria</Label>
              <Select value={subcategory} onValueChange={setSubcategory}>
                <SelectTrigger className="bg-input border-border">
                  <SelectValue placeholder="Selecione o tipo..." />
                </SelectTrigger>
                <SelectContent>
                  {subcategories.map((sub) => (
                    <SelectItem key={sub} value={sub}>
                      {sub}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="minQuantity">Quantidade Mínima (Alerta)</Label>
            <Input
              id="minQuantity"
              type="number"
              min="0"
              step="0.01"
              value={minQuantity}
              onChange={(e) => setMinQuantity(e.target.value)}
              placeholder="Quantidade para alerta de estoque baixo"
              className="bg-input border-border"
            />
          </div>

          <div className="space-y-2">
            <Label>Foto do Produto (opcional)</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
            {imagePreview ? (
              <div className="relative w-full h-32 rounded-lg overflow-hidden border border-border">
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-2 right-2 w-6 h-6 bg-destructive rounded-full flex items-center justify-center hover:bg-destructive/80"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-20 border-dashed border-2 hover:bg-muted/50"
              >
                <div className="flex flex-col items-center gap-1">
                  <ImagePlus className="w-6 h-6 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Adicionar foto</span>
                </div>
              </Button>
            )}
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
