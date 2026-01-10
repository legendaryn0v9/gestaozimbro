import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useAddItem, SectorType, UnitType } from '@/hooks/useInventory';
import { useCategories } from '@/hooks/useCategories';
import { Package, Plus, ImagePlus, X } from 'lucide-react';

interface AddItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultSector?: SectorType;
  defaultCategory?: string;
  categoryType?: 'destilados' | 'naoAlcoolicos' | 'alcoolicos';
}

// Fallback categories for Bar (used when no dynamic categories exist)
const BAR_FALLBACK_CATEGORIES = {
  destilados: ['Destilados', 'Vodka', 'Gin', 'Whisky', 'Rum', 'Tequila', 'Cognac'],
  naoAlcoolicos: ['Refrigerante', 'Energético', 'Cerveja Zero', 'Água com Gás', 'Água sem Gás'],
  alcoolicos: ['Cerveja', 'Vinho', 'Licor'],
};

export function AddItemDialog({ open, onOpenChange, defaultSector, defaultCategory, categoryType }: AddItemDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [sector, setSector] = useState<SectorType>(defaultSector || 'bar');
  const [unit, setUnit] = useState<UnitType>('unidade');
  const [quantity, setQuantity] = useState('0');
  const [minQuantity, setMinQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [selectedMainCategory, setSelectedMainCategory] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addItem = useAddItem();
  
  // Fetch dynamic categories based on sector
  const { data: dynamicCategories = [] } = useCategories(sector);

  // Update sector when defaultSector changes
  useEffect(() => {
    if (defaultSector) {
      setSector(defaultSector);
    }
  }, [defaultSector]);

  // Set default category when dialog opens
  useEffect(() => {
    if (open && defaultCategory && dynamicCategories.length > 0) {
      // Check if defaultCategory matches a main category
      const mainCat = dynamicCategories.find(c => c.name === defaultCategory);
      if (mainCat) {
        setSelectedMainCategory(mainCat.id);
        setSelectedSubcategory('');
      } else {
        // Check if it's a subcategory
        for (const cat of dynamicCategories) {
          const sub = cat.subcategories.find(s => s.name === defaultCategory);
          if (sub) {
            setSelectedMainCategory(cat.id);
            setSelectedSubcategory(sub.id);
            break;
          }
        }
      }
    }
  }, [open, defaultCategory, dynamicCategories]);

  const handleSectorChange = (newSector: SectorType) => {
    setSector(newSector);
    setSelectedMainCategory('');
    setSelectedSubcategory('');
    setCustomCategory('');
    setIsCustomCategory(false);
  };

  const handleMainCategoryChange = (categoryId: string) => {
    setSelectedMainCategory(categoryId);
    setSelectedSubcategory('');
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
    if (isCustomCategory && customCategory.trim()) {
      return customCategory.trim();
    }

    // If subcategory is selected, use subcategory name
    if (selectedSubcategory) {
      const mainCat = dynamicCategories.find(c => c.id === selectedMainCategory);
      const sub = mainCat?.subcategories.find(s => s.id === selectedSubcategory);
      return sub?.name || null;
    }

    // If only main category is selected, use main category name
    if (selectedMainCategory) {
      const mainCat = dynamicCategories.find(c => c.id === selectedMainCategory);
      return mainCat?.name || null;
    }

    return null;
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setQuantity('0');
    setMinQuantity('');
    setPrice('');
    setSelectedMainCategory('');
    setSelectedSubcategory('');
    setCustomCategory('');
    setIsCustomCategory(false);
    setImagePreview(null);
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
        price: price ? Number(price) : 0,
        category: getFinalCategory(),
        image_url: imagePreview,
      },
      {
        onSuccess: () => {
          resetForm();
          onOpenChange(false);
        },
      }
    );
  };

  // Get subcategories for selected main category
  const selectedCategory = dynamicCategories.find(c => c.id === selectedMainCategory);
  const subcategories = selectedCategory?.subcategories || [];

  const hasDynamicCategories = dynamicCategories.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass border-border max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-xl">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Package className="w-4 h-4 text-primary" />
            </div>
            {sector === 'cozinha' ? 'Novo Item - Cozinha' : 'Novo Item - Bar'}
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

          <div className="space-y-2">
            <Label>Setor</Label>
            {defaultSector ? (
              <div className="h-10 px-3 py-2 bg-muted rounded-md border border-border flex items-center">
                {sector === 'bar' ? 'Bar' : 'Cozinha'}
              </div>
            ) : (
              <Select value={sector} onValueChange={(v) => handleSectorChange(v as SectorType)}>
                <SelectTrigger className="bg-input border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border z-50">
                  <SelectItem value="bar">Bar</SelectItem>
                  <SelectItem value="cozinha">Cozinha</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Category Selection */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Categoria</Label>
              {hasDynamicCategories && (
                <button
                  type="button"
                  onClick={() => {
                    setIsCustomCategory(!isCustomCategory);
                    setSelectedMainCategory('');
                    setSelectedSubcategory('');
                    setCustomCategory('');
                  }}
                  className="text-xs text-primary hover:underline"
                >
                  {isCustomCategory ? 'Usar existente' : 'Criar nova'}
                </button>
              )}
            </div>

            {!hasDynamicCategories ? (
              <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
                Nenhuma categoria criada. Crie categorias primeiro no botão "Categorias".
              </div>
            ) : isCustomCategory ? (
              <Input
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                placeholder="Nome da nova categoria..."
                className="bg-input border-border"
              />
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {/* Main Category */}
                <Select value={selectedMainCategory} onValueChange={handleMainCategoryChange}>
                  <SelectTrigger className="bg-input border-border">
                    <SelectValue placeholder="Selecione a categoria..." />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border z-50">
                    {dynamicCategories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Subcategory (if main category has subcategories) */}
                {selectedMainCategory && subcategories.length > 0 && (
                  <Select value={selectedSubcategory} onValueChange={setSelectedSubcategory}>
                    <SelectTrigger className="bg-input border-border">
                      <SelectValue placeholder="Selecione a subcategoria (opcional)..." />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border z-50">
                      {subcategories.map((sub) => (
                        <SelectItem key={sub.id} value={sub.id}>
                          {sub.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Unidade</Label>
              <Select value={unit} onValueChange={(v) => setUnit(v as UnitType)}>
                <SelectTrigger className="bg-input border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border z-50">
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
            <Label htmlFor="price">Valor Unitário (R$)</Label>
            <Input
              id="price"
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0,00"
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
