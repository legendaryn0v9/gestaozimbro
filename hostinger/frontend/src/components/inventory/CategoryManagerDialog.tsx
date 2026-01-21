import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../ui/accordion';
import { Badge } from '../ui/badge';
import {
  useCategories,
  useCreateCategory,
  useDeleteCategory,
  useCreateSubcategory,
  useDeleteSubcategory,
} from '../../hooks/useCategories';
import { Plus, Trash2, FolderOpen, Tag, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

interface CategoryManagerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sector: 'bar' | 'cozinha';
}

const GRADIENT_OPTIONS = [
  { value: 'from-amber-500 to-orange-600', label: 'Âmbar', preview: 'bg-gradient-to-r from-amber-500 to-orange-600' },
  { value: 'from-blue-500 to-cyan-600', label: 'Azul', preview: 'bg-gradient-to-r from-blue-500 to-cyan-600' },
  { value: 'from-purple-500 to-pink-600', label: 'Roxo', preview: 'bg-gradient-to-r from-purple-500 to-pink-600' },
  { value: 'from-green-500 to-emerald-600', label: 'Verde', preview: 'bg-gradient-to-r from-green-500 to-emerald-600' },
  { value: 'from-red-500 to-rose-600', label: 'Vermelho', preview: 'bg-gradient-to-r from-red-500 to-rose-600' },
  { value: 'from-indigo-500 to-violet-600', label: 'Índigo', preview: 'bg-gradient-to-r from-indigo-500 to-violet-600' },
  { value: 'from-teal-500 to-cyan-600', label: 'Teal', preview: 'bg-gradient-to-r from-teal-500 to-cyan-600' },
  { value: 'from-yellow-500 to-amber-600', label: 'Amarelo', preview: 'bg-gradient-to-r from-yellow-500 to-amber-600' },
];

export function CategoryManagerDialog({ open, onOpenChange, sector }: CategoryManagerDialogProps) {
  const { data: categories = [], isLoading } = useCategories(sector);
  const createCategory = useCreateCategory();
  const deleteCategory = useDeleteCategory();
  const createSubcategory = useCreateSubcategory();
  const deleteSubcategory = useDeleteSubcategory();

  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryGradient, setNewCategoryGradient] = useState(GRADIENT_OPTIONS[0].value);
  const [newSubcategoryName, setNewSubcategoryName] = useState<Record<string, string>>({});

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;

    await createCategory.mutateAsync({
      name: newCategoryName.trim(),
      sector,
      gradient: newCategoryGradient,
      icon: 'Package',
    });

    setNewCategoryName('');
    setNewCategoryGradient(GRADIENT_OPTIONS[0].value);
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta categoria e todas suas subcategorias?')) return;
    await deleteCategory.mutateAsync({ id: categoryId, sector });
  };

  const handleCreateSubcategory = async (categoryId: string) => {
    const name = newSubcategoryName[categoryId]?.trim();
    if (!name) return;

    await createSubcategory.mutateAsync({
      category_id: categoryId,
      name,
      sector,
    });

    setNewSubcategoryName((prev) => ({ ...prev, [categoryId]: '' }));
  };

  const handleDeleteSubcategory = async (subcategoryId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta subcategoria?')) return;
    await deleteSubcategory.mutateAsync({ id: subcategoryId, sector });
  };

  const sectorLabel = sector === 'cozinha' ? 'Cozinha' : 'Bar';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5" />
            Gerenciar Categorias - {sectorLabel}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="glass rounded-xl p-4 space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Nova Categoria
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome da Categoria</Label>
                <Input
                  placeholder="Ex: Carnes, Destilados..."
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Cor</Label>
                <Select value={newCategoryGradient} onValueChange={setNewCategoryGradient}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {GRADIENT_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        <div className="flex items-center gap-2">
                          <div className={cn('w-4 h-4 rounded', opt.preview)} />
                          {opt.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button
              onClick={handleCreateCategory}
              disabled={!newCategoryName.trim() || createCategory.isPending}
              className="w-full bg-gradient-amber text-primary-foreground"
            >
              {createCategory.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              Criar Categoria
            </Button>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">Categorias Existentes</h3>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : categories.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FolderOpen className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Nenhuma categoria criada ainda</p>
              </div>
            ) : (
              <Accordion type="multiple" className="space-y-2">
                {categories.map((category) => (
                  <AccordionItem
                    key={category.id}
                    value={category.id}
                    className="glass rounded-xl border-none overflow-hidden"
                  >
                    <AccordionTrigger className="px-4 py-3 hover:no-underline">
                      <div className="flex items-center gap-3 flex-1">
                        <div
                          className={cn(
                            'w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br',
                            category.gradient || 'from-amber-500 to-orange-600'
                          )}
                        >
                          <Tag className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-medium">{category.name}</span>
                        <Badge variant="secondary" className="ml-auto mr-2">
                          {category.subcategories.length} subcategorias
                        </Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                      <div className="space-y-3">
                        {category.subcategories.length > 0 && (
                          <div className="space-y-2">
                            {category.subcategories.map((sub) => (
                              <div
                                key={sub.id}
                                className="flex items-center justify-between bg-background/50 rounded-lg px-3 py-2"
                              >
                                <span className="text-sm">{sub.name}</span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                                  onClick={() => handleDeleteSubcategory(sub.id)}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="flex gap-2">
                          <Input
                            placeholder="Nova subcategoria..."
                            value={newSubcategoryName[category.id] || ''}
                            onChange={(e) =>
                              setNewSubcategoryName((prev) => ({
                                ...prev,
                                [category.id]: e.target.value,
                              }))
                            }
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleCreateSubcategory(category.id);
                              }
                            }}
                            className="flex-1"
                          />
                          <Button
                            size="icon"
                            onClick={() => handleCreateSubcategory(category.id)}
                            disabled={!newSubcategoryName[category.id]?.trim()}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full text-destructive border-destructive hover:bg-destructive/10"
                          onClick={() => handleDeleteCategory(category.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Excluir Categoria
                        </Button>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
