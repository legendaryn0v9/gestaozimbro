import { useState, useRef, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { InventoryItem, useUpdateItem, UnitType } from '../../hooks/useInventory';
import { useCategories } from '../../hooks/useCategories';
import { Pencil, Save, ImagePlus, X } from 'lucide-react';

interface EditItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: InventoryItem;
}

export function EditItemDialog({ open, onOpenChange, item }: EditItemDialogProps) {
  const [name, setName] = useState(item.name);
  const [description, setDescription] = useState(item.description || '');
  const [unit, setUnit] = useState<UnitType>(item.unit);
  const [quantity, setQuantity] = useState(String(item.quantity));
  const [minQuantity, setMinQuantity] = useState(item.min_quantity ? String(item.min_quantity) : '');
  const [price, setPrice] = useState(item.price ? String(item.price) : '');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<string>('');
  const [imagePreview, setImagePreview] = useState<string | null>(item.image_url);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateItem = useUpdateItem();
  const { data: categories = [] } = useCategories(item.sector);

  const subcategories = useMemo(() => {
    const category = categories.find(c => c.id === selectedCategoryId);
    return category?.subcategories || [];
  }, [categories, selectedCategoryId]);

  useEffect(() => {
    setName(item.name);
    setDescription(item.description || '');
    setUnit(item.unit);
    setQuantity(String(item.quantity));
    setMinQuantity(item.min_quantity ? String(item.min_quantity) : '');
    setPrice(item.price ? String(item.price) : '');
    setImagePreview(item.image_url);
    
    // Find matching category
    const foundCategory = categories.find(c => c.name === item.category);
    if (foundCategory) {
      setSelectedCategoryId(foundCategory.id);
    } else {
      // Check subcategories
      for (const cat of categories) {
        const foundSub = cat.subcategories.find(s => s.name === item.category);
        if (foundSub) {
          setSelectedCategoryId(cat.id);
          setSelectedSubcategoryId(foundSub.id);
          break;
        }
      }
    }
  }, [item, categories]);

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

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    setSelectedSubcategoryId('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let categoryString: string | null = item.category;
    
    const selectedCategory = categories.find(c => c.id === selectedCategoryId);
    if (selectedCategory) {
      const selectedSubcategory = selectedCategory.subcategories.find(s => s.id === selectedSubcategoryId);
      if (selectedSubcategory) {
        categoryString = selectedSubcategory.name;
      } else {
        categoryString = selectedCategory.name;
      }
    }
    
    const changes: Array<{ field: string; oldValue: string; newValue: string }> = [];
    
    if (name !== item.name) {
      changes.push({ field: 'Nome', oldValue: item.name, newValue: name });
    }
    if (Number(quantity) !== item.quantity) {
      changes.push({ field: 'Quantidade', oldValue: String(item.quantity), newValue: quantity });
    }
    if (unit !== item.unit) {
      changes.push({ field: 'Unidade', oldValue: item.unit, newValue: unit });
    }
    if (Number(price) !== item.price) {
      changes.push({ field: 'Preço', oldValue: String(item.price || 0), newValue: price || '0' });
    }
    if (categoryString !== item.category) {
      changes.push({ field: 'Categoria', oldValue: item.category || 'Sem categoria', newValue: categoryString || 'Sem categoria' });
    }
    
    updateItem.mutate(
      {
        id: item.id,
        name,
        description: description || null,
        unit,
        quantity: Number(quantity),
        min_quantity: minQuantity ? Number(minQuantity) : null,
        price: price ? Number(price) : 0,
        category: categoryString,
        image_url: imagePreview,
        changes: changes.length > 0 ? changes : undefined,
      },
      {
        onSuccess: () => {
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
              <Pencil className="w-4 h-4 text-primary" />
            </div>
            Editar Item
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>Foto do Produto</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
            {imagePreview ? (
              <div className="relative w-full h-40 rounded-xl overflow-hidden border border-border group">
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button type="button" variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}>
                    <ImagePlus className="w-4 h-4 mr-1" />
                    Trocar
                  </Button>
                  <Button type="button" variant="destructive" size="sm" onClick={removeImage}>
                    <X className="w-4 h-4 mr-1" />
                    Remover
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-32 border-dashed border-2 hover:bg-muted/50"
              >
                <div className="flex flex-col items-center gap-2">
                  <ImagePlus className="w-8 h-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Adicionar foto</span>
                </div>
              </Button>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-name">Nome do Item</Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value.toUpperCase())}
              className="bg-input border-border"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-description">Descrição</Label>
            <Textarea
              id="edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value.toUpperCase())}
              className="bg-input border-border resize-none"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>Categoria</Label>
            <Select value={selectedCategoryId} onValueChange={handleCategoryChange}>
              <SelectTrigger className="bg-input border-border">
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {subcategories.length > 0 && (
            <div className="space-y-2">
              <Label>Subcategoria</Label>
              <Select value={selectedSubcategoryId || "__none__"} onValueChange={(v) => setSelectedSubcategoryId(v === "__none__" ? "" : v)}>
                <SelectTrigger className="bg-input border-border">
                  <SelectValue placeholder="Selecione uma subcategoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Nenhuma</SelectItem>
                  {subcategories.map((sub) => (
                    <SelectItem key={sub.id} value={sub.id}>{sub.name}</SelectItem>
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
              <Label htmlFor="edit-quantity">Quantidade</Label>
              <Input id="edit-quantity" type="number" min="0" step="0.01" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="bg-input border-border" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-minQuantity">Quantidade Mínima</Label>
            <Input id="edit-minQuantity" type="number" min="0" step="0.01" value={minQuantity} onChange={(e) => setMinQuantity(e.target.value)} className="bg-input border-border" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-price">Valor Unitário (R$)</Label>
            <Input id="edit-price" type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} className="bg-input border-border" />
          </div>

          <Button type="submit" disabled={updateItem.isPending || !name} className="w-full bg-gradient-amber text-primary-foreground hover:opacity-90 h-11">
            {updateItem.isPending ? <span className="animate-pulse">Salvando...</span> : <><Save className="w-4 h-4 mr-2" />Salvar Alterações</>}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
