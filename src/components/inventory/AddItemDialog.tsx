import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAddItem, SectorType, UnitType } from '@/hooks/useInventory';
import { Package, Plus, ImagePlus, X, Search, Check } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

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
  Destilados: ['Destilados', 'Vodka', 'Gin', 'Whisky', 'Rum', 'Tequila', 'Cognac'],
  'Não Alcoólicos': ['Refrigerante', 'Energético', 'Cerveja Zero', 'Água com Gás', 'Água sem Gás'],
  Alcoólicos: ['Cerveja', 'Vinho', 'Licor'],
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

// Catálogo de produtos populares do Bar
const BAR_PRODUCTS_CATALOG = {
  'Destilados': [
    { name: 'Absolut Vodka', unit: 'unidade' as UnitType },
    { name: 'Smirnoff Vodka', unit: 'unidade' as UnitType },
    { name: 'Grey Goose Vodka', unit: 'unidade' as UnitType },
    { name: 'Tanqueray Gin', unit: 'unidade' as UnitType },
    { name: 'Bombay Sapphire Gin', unit: 'unidade' as UnitType },
    { name: 'Beefeater Gin', unit: 'unidade' as UnitType },
    { name: 'Johnnie Walker Red Label', unit: 'unidade' as UnitType },
    { name: 'Johnnie Walker Black Label', unit: 'unidade' as UnitType },
    { name: 'Jack Daniels', unit: 'unidade' as UnitType },
    { name: 'Chivas Regal 12', unit: 'unidade' as UnitType },
    { name: 'Bacardi Rum', unit: 'unidade' as UnitType },
    { name: 'Havana Club Rum', unit: 'unidade' as UnitType },
    { name: 'Captain Morgan', unit: 'unidade' as UnitType },
    { name: 'Jose Cuervo Tequila', unit: 'unidade' as UnitType },
    { name: 'Patron Tequila', unit: 'unidade' as UnitType },
    { name: 'Hennessy Cognac', unit: 'unidade' as UnitType },
    { name: 'Rémy Martin Cognac', unit: 'unidade' as UnitType },
  ],
  'Não Alcoólicos': [
    { name: 'Coca-Cola Lata 350ml', unit: 'unidade' as UnitType },
    { name: 'Coca-Cola 2L', unit: 'unidade' as UnitType },
    { name: 'Coca-Cola Zero Lata', unit: 'unidade' as UnitType },
    { name: 'Guaraná Antarctica Lata', unit: 'unidade' as UnitType },
    { name: 'Sprite Lata', unit: 'unidade' as UnitType },
    { name: 'Fanta Laranja Lata', unit: 'unidade' as UnitType },
    { name: 'Red Bull Energy', unit: 'unidade' as UnitType },
    { name: 'Monster Energy', unit: 'unidade' as UnitType },
    { name: 'Heineken 0.0', unit: 'unidade' as UnitType },
    { name: 'Budweiser Zero', unit: 'unidade' as UnitType },
    { name: 'Água Mineral com Gás', unit: 'unidade' as UnitType },
    { name: 'Água Mineral sem Gás', unit: 'unidade' as UnitType },
    { name: 'Água Tônica Schweppes', unit: 'unidade' as UnitType },
    { name: 'Suco de Laranja', unit: 'litro' as UnitType },
    { name: 'Suco de Limão', unit: 'litro' as UnitType },
  ],
  'Alcoólicos': [
    { name: 'Heineken Long Neck', unit: 'unidade' as UnitType },
    { name: 'Heineken Lata', unit: 'unidade' as UnitType },
    { name: 'Budweiser Long Neck', unit: 'unidade' as UnitType },
    { name: 'Stella Artois Long Neck', unit: 'unidade' as UnitType },
    { name: 'Corona Extra', unit: 'unidade' as UnitType },
    { name: 'Brahma Chopp Lata', unit: 'unidade' as UnitType },
    { name: 'Skol Lata', unit: 'unidade' as UnitType },
    { name: 'Antarctica Original', unit: 'unidade' as UnitType },
    { name: 'Vinho Tinto Seco', unit: 'unidade' as UnitType },
    { name: 'Vinho Branco Seco', unit: 'unidade' as UnitType },
    { name: 'Vinho Rosé', unit: 'unidade' as UnitType },
    { name: 'Espumante Brut', unit: 'unidade' as UnitType },
    { name: 'Prosecco', unit: 'unidade' as UnitType },
    { name: 'Licor Amarula', unit: 'unidade' as UnitType },
    { name: 'Licor Baileys', unit: 'unidade' as UnitType },
    { name: 'Licor Cointreau', unit: 'unidade' as UnitType },
  ],
};

type CatalogProduct = { name: string; unit: UnitType };

export function AddItemDialog({ open, onOpenChange, defaultSector, defaultCategory }: AddItemDialogProps) {
  const [activeTab, setActiveTab] = useState<'catalog' | 'new'>('catalog');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [sector, setSector] = useState<SectorType>(defaultSector || 'bar');
  const [unit, setUnit] = useState<UnitType>('unidade');
  const [quantity, setQuantity] = useState('0');
  const [minQuantity, setMinQuantity] = useState('');
  const [category, setCategory] = useState(() => {
    if (!defaultCategory) return '';
    if (BAR_CATEGORIES.includes(defaultCategory)) return defaultCategory;
    const parent = Object.entries(BAR_SUBCATEGORIES).find(([_, subs]) => subs.includes(defaultCategory));
    return parent ? parent[0] : defaultCategory;
  });
  const [subcategory, setSubcategory] = useState(() => {
    if (!defaultCategory) return '';
    const parent = Object.entries(BAR_SUBCATEGORIES).find(([_, subs]) => subs.includes(defaultCategory));
    return parent ? defaultCategory : '';
  });
  const [customCategory, setCustomCategory] = useState('');
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<CatalogProduct | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addItem = useAddItem();

  const categories = sector === 'bar' ? BAR_CATEGORIES : COZINHA_CATEGORIES;
  const subcategories = sector === 'bar' && category ? BAR_SUBCATEGORIES[category] || [] : [];

  const getBarParentCategory = (cat: string) =>
    Object.entries(BAR_SUBCATEGORIES).find(([_, subs]) => subs.includes(cat))?.[0] ?? null;

  // Filtrar produtos do catálogo
  const catalogKey = defaultCategory
    ? ((defaultCategory in BAR_PRODUCTS_CATALOG
        ? defaultCategory
        : getBarParentCategory(defaultCategory)) as keyof typeof BAR_PRODUCTS_CATALOG | null)
    : null;

  const catalogProducts = catalogKey
    ? BAR_PRODUCTS_CATALOG[catalogKey] || []
    : Object.values(BAR_PRODUCTS_CATALOG).flat();
  
  const filteredCatalogProducts = catalogProducts.filter(p => 
    p.name.toLowerCase().includes(catalogSearch.toLowerCase())
  );

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

  const selectCatalogProduct = (product: CatalogProduct) => {
    setSelectedProduct(product);
    setName(product.name);
    setUnit(product.unit);
  };

  const getFinalCategory = () => {
    if (isCustomCategory && customCategory.trim()) {
      return customCategory.trim();
    }

    // Para o Bar, quando houver "tipo" selecionado (Vodka, Gin, etc), salvar esse tipo
    if (sector === 'bar' && !isCustomCategory && subcategory) {
      return subcategory;
    }

    if (category) {
      return category;
    }

    // fallback
    if (defaultCategory) {
      return defaultCategory;
    }

    return null;
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setQuantity('0');
    setMinQuantity('');
    setCategory('');
    setSubcategory('');
    setCustomCategory('');
    setIsCustomCategory(false);
    setImagePreview(null);
    setSelectedProduct(null);
    setCatalogSearch('');
    setActiveTab('catalog');
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
          resetForm();
          onOpenChange(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass border-border max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-xl">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Package className="w-4 h-4 text-primary" />
            </div>
            Novo Item {defaultCategory && `- ${defaultCategory}`}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'catalog' | 'new')} className="mt-4">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="catalog">📦 Catálogo</TabsTrigger>
              <TabsTrigger value="new">✨ Criar Novo</TabsTrigger>
            </TabsList>

            <TabsContent value="catalog" className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  placeholder="Buscar produto..."
                  className="pl-9 bg-input border-border"
                />
              </div>

              <ScrollArea className="h-48 border border-border rounded-lg">
                <div className="p-2 space-y-1">
                  {filteredCatalogProducts.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4 text-sm">
                      Nenhum produto encontrado
                    </p>
                  ) : (
                    filteredCatalogProducts.map((product) => (
                      <button
                        key={product.name}
                        type="button"
                        onClick={() => selectCatalogProduct(product)}
                        className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center justify-between ${
                          selectedProduct?.name === product.name
                            ? 'bg-primary text-primary-foreground'
                            : 'hover:bg-muted'
                        }`}
                      >
                        <span>{product.name}</span>
                        {selectedProduct?.name === product.name && (
                          <Check className="w-4 h-4" />
                        )}
                      </button>
                    ))
                  )}
                </div>
              </ScrollArea>

              {selectedProduct && (
                <div className="space-y-4 pt-2 border-t border-border">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="catalog-quantity">Quantidade</Label>
                      <Input
                        id="catalog-quantity"
                        type="number"
                        min="0"
                        step="1"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        className="bg-input border-border"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="catalog-min">Qtd. Mínima</Label>
                      <Input
                        id="catalog-min"
                        type="number"
                        min="0"
                        step="1"
                        value={minQuantity}
                        onChange={(e) => setMinQuantity(e.target.value)}
                        placeholder="Alerta"
                        className="bg-input border-border"
                      />
                    </div>
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
                      <div className="relative w-full h-24 rounded-lg overflow-hidden border border-border">
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
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
                        className="w-full h-16 border-dashed border-2 hover:bg-muted/50"
                      >
                        <div className="flex items-center gap-2">
                          <ImagePlus className="w-5 h-5 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">Adicionar foto</span>
                        </div>
                      </Button>
                    )}
                  </div>

                  <Button
                    type="submit"
                    disabled={addItem.isPending}
                    className="w-full bg-gradient-amber text-primary-foreground hover:opacity-90 h-11"
                  >
                    {addItem.isPending ? (
                      <span className="animate-pulse">Salvando...</span>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Adicionar {selectedProduct.name}
                      </>
                    )}
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="new" className="space-y-4">
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

              <div className="grid grid-cols-2 gap-4 items-end">
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
                    <Select
                      value={category}
                      onValueChange={(v) => {
                        setCategory(v);
                        setSubcategory('');
                      }}
                    >
                      <SelectTrigger className="bg-input border-border">
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border z-50">
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

              {sector === 'bar' && !isCustomCategory && category && subcategories.length > 0 && (
                <div className="space-y-2">
                  <Label>Tipo de {category}</Label>
                  <Select value={subcategory} onValueChange={setSubcategory}>
                    <SelectTrigger className="bg-input border-border">
                      <SelectValue placeholder="Selecione o tipo..." />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border z-50">
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
            </TabsContent>
          </Tabs>
        </form>
      </DialogContent>
    </Dialog>
  );
}
