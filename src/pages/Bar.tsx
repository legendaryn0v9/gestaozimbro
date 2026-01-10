import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { ItemCard } from '@/components/inventory/ItemCard';
import { AddItemDialog } from '@/components/inventory/AddItemDialog';
import { MovementDialog } from '@/components/inventory/MovementDialog';
import { CategoryManagerDialog } from '@/components/inventory/CategoryManagerDialog';
import { useInventoryItems } from '@/hooks/useInventory';
import { useRealtimeInventory } from '@/hooks/useRealtimeInventory';
import { useIsAdmin } from '@/hooks/useUserRoles';
import { useUserSector } from '@/hooks/useUserSector';
import { useCategories, CategoryWithSubcategories } from '@/hooks/useCategories';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Wine, Plus, Search, TrendingUp, TrendingDown, DollarSign, AlertCircle, Settings, Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import * as LucideIcons from 'lucide-react';

const normalizeCategory = (category: string | null) => {
  if (!category) return null;
  return category.split(' - ').pop()?.trim() || category;
};

// Helper to get icon component from string name
const getIconComponent = (iconName: string | null): React.ComponentType<{ className?: string }> => {
  if (!iconName) return Package;
  const icons = LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>;
  const IconComponent = icons[iconName];
  return IconComponent || Package;
};

export default function Bar() {
  const navigate = useNavigate();
  const { canAccessBar, isLoading: sectorLoading } = useUserSector();
  const { isAdmin } = useIsAdmin();
  
  // Enable realtime updates for inventory
  useRealtimeInventory();
  
  const [search, setSearch] = useState('');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [categoryManagerOpen, setCategoryManagerOpen] = useState(false);
  const [entradaDialogOpen, setEntradaDialogOpen] = useState(false);
  const [saidaDialogOpen, setSaidaDialogOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string>();

  // Fetch dynamic categories
  const { data: dynamicCategories = [], isLoading: categoriesLoading } = useCategories('bar');

  // Redirect if user doesn't have access to bar
  useEffect(() => {
    if (!sectorLoading && !canAccessBar && !isAdmin) {
      navigate('/cozinha');
    }
  }, [canAccessBar, sectorLoading, isAdmin, navigate]);

  const openAddDialog = (category?: string) => {
    setAddDialogOpen(true);
  };

  const closeAddDialog = (open: boolean) => {
    setAddDialogOpen(open);
  };

  const { data: items = [], isLoading } = useInventoryItems('bar');

  // Group items by category and subcategory
  const organizedItems = useMemo(() => {
    const result: Record<string, {
      categoryItems: typeof items;
      subcategories: Record<string, typeof items>;
    }> = {};

    dynamicCategories.forEach((cat) => {
      // Items directly in the main category (not in any subcategory)
      const directCategoryItems = items.filter((item) => {
        const n = normalizeCategory(item.category);
        return n === cat.name;
      });

      // Items grouped by subcategory
      const subcategoryItems: Record<string, typeof items> = {};
      cat.subcategories.forEach((sub) => {
        subcategoryItems[sub.name] = items.filter((item) => {
          const n = normalizeCategory(item.category);
          return n === sub.name;
        });
      });

      result[cat.name] = {
        categoryItems: directCategoryItems,
        subcategories: subcategoryItems,
      };
    });

    return result;
  }, [items, dynamicCategories]);

  // Filter by search
  const filteredOrganizedItems = useMemo(() => {
    if (!search) return organizedItems;

    const filtered: typeof organizedItems = {};

    Object.entries(organizedItems).forEach(([catName, data]) => {
      const filteredCategoryItems = data.categoryItems.filter((item) =>
        item.name.toLowerCase().includes(search.toLowerCase())
      );

      const filteredSubcategories: Record<string, typeof items> = {};
      Object.entries(data.subcategories).forEach(([subName, subItems]) => {
        filteredSubcategories[subName] = subItems.filter((item) =>
          item.name.toLowerCase().includes(search.toLowerCase())
        );
      });

      filtered[catName] = {
        categoryItems: filteredCategoryItems,
        subcategories: filteredSubcategories,
      };
    });

    return filtered;
  }, [organizedItems, search]);

  const totalFilteredItems = useMemo(() => {
    let count = 0;
    Object.values(filteredOrganizedItems).forEach((data) => {
      count += data.categoryItems.length;
      Object.values(data.subcategories).forEach((subItems) => {
        count += subItems.length;
      });
    });
    return count;
  }, [filteredOrganizedItems]);

  const handleItemClick = (itemId: string) => {
    setSelectedItemId(itemId);
    setSaidaDialogOpen(true);
  };

  // Calculate total inventory value
  const totalInventoryValue = useMemo(() => {
    return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }, [items]);

  // Show loading while checking sector access
  if (sectorLoading || categoriesLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse text-muted-foreground">Carregando...</div>
        </div>
      </MainLayout>
    );
  }

  // Show access denied message
  if (!canAccessBar && !isAdmin) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <AlertCircle className="w-16 h-16 text-destructive mb-4" />
          <h2 className="text-xl font-semibold mb-2">Acesso Restrito</h2>
          <p className="text-muted-foreground">Você não tem permissão para acessar o Bar.</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="animate-fade-in">
        {/* Header */}
        <div className="flex flex-col gap-4 mb-6 lg:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-amber flex items-center justify-center">
                <Wine className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-display font-bold text-gradient">Bar</h1>
                <p className="text-sm text-muted-foreground">{items.length} itens no estoque</p>
              </div>
            </div>

            {/* Total Value Card - Only for Admin */}
            {isAdmin && (
              <div className="glass rounded-xl p-3 sm:p-4 flex items-center gap-3 border border-primary/20">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Caixa Total do Bar</p>
                  <p className="text-lg sm:text-xl font-bold text-primary">
                    R$ {totalInventoryValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <Button
              onClick={() => setEntradaDialogOpen(true)}
              variant="outline"
              size="sm"
              className="border-success text-success hover:bg-success/10 flex-1 sm:flex-none"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Entrada
            </Button>
            <Button
              onClick={() => setSaidaDialogOpen(true)}
              variant="outline"
              size="sm"
              className="border-destructive text-destructive hover:bg-destructive/10 flex-1 sm:flex-none"
            >
              <TrendingDown className="w-4 h-4 mr-2" />
              Saída
            </Button>
            {isAdmin && (
              <>
                <Button
                  onClick={() => setCategoryManagerOpen(true)}
                  variant="outline"
                  size="sm"
                  className="flex-1 sm:flex-none"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Categorias
                </Button>
                <Button 
                  onClick={() => openAddDialog()} 
                  size="sm"
                  className="bg-gradient-amber text-primary-foreground hover:opacity-90 flex-1 sm:flex-none"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Item
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-6 lg:mb-8">
          <Search className="absolute left-3 lg:left-4 top-1/2 -translate-y-1/2 w-4 lg:w-5 h-4 lg:h-5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar itens..."
            className="pl-10 lg:pl-12 h-10 lg:h-12 bg-input border-border text-sm lg:text-base"
          />
        </div>

        {isLoading ? (
          <div className="space-y-8">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-4">
                <div className="h-8 w-48 bg-muted rounded animate-pulse" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {[...Array(4)].map((_, j) => (
                    <div key={j} className="glass rounded-xl h-40 animate-pulse" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : dynamicCategories.length === 0 ? (
          <div className="text-center py-16">
            <Settings className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">Nenhuma categoria criada</h3>
            <p className="text-muted-foreground mb-6">Crie categorias para organizar o estoque do bar</p>
            {isAdmin && (
              <Button onClick={() => setCategoryManagerOpen(true)} className="bg-gradient-amber text-primary-foreground hover:opacity-90">
                <Settings className="w-4 h-4 mr-2" />
                Gerenciar Categorias
              </Button>
            )}
          </div>
        ) : totalFilteredItems === 0 && !search && items.length === 0 ? (
          <div className="text-center py-16">
            <Wine className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">Estoque vazio</h3>
            <p className="text-muted-foreground mb-6">Adicione o primeiro item ao estoque do bar</p>
            {isAdmin && (
              <Button onClick={() => openAddDialog()} className="bg-gradient-amber text-primary-foreground hover:opacity-90">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Item
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-10">
            {dynamicCategories.map((category: CategoryWithSubcategories) => {
              const categoryData = filteredOrganizedItems[category.name];
              if (!categoryData) return null;

              const Icon = getIconComponent(category.icon);
              const totalCategoryItems = categoryData.categoryItems.length + 
                Object.values(categoryData.subcategories).reduce((acc, items) => acc + items.length, 0);

              return (
                <section key={category.id} className="space-y-6">
                  {/* Category Header */}
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-xl bg-gradient-to-br ${category.gradient || 'from-amber-500 to-orange-600'} flex items-center justify-center shadow-lg`}
                    >
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-2xl font-display font-bold text-foreground">{category.name}</h2>
                      <p className="text-sm text-muted-foreground">
                        {totalCategoryItems} {totalCategoryItems === 1 ? 'item' : 'itens'}
                      </p>
                    </div>
                    {isAdmin && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openAddDialog(category.name)}
                        className="text-primary border-primary hover:bg-primary/10"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Adicionar
                      </Button>
                    )}
                  </div>

                  {/* Items directly in category (no subcategory) */}
                  {categoryData.categoryItems.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 lg:gap-4">
                      {categoryData.categoryItems.map((item) => (
                        <ItemCard key={item.id} item={item} onClick={() => handleItemClick(item.id)} />
                      ))}
                    </div>
                  )}

                  {/* Subcategories */}
                  {category.subcategories.map((sub) => {
                    const subItems = categoryData.subcategories[sub.name] || [];
                    
                    return (
                      <div key={sub.id} className="space-y-3">
                        {/* Subcategory Header */}
                        <div className="flex items-center gap-2 pl-2 border-l-4 border-primary/30">
                          <h3 className="text-lg font-semibold text-foreground/90">{sub.name}</h3>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                            {subItems.length} {subItems.length === 1 ? 'item' : 'itens'}
                          </span>
                          {isAdmin && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openAddDialog(sub.name)}
                              className="ml-auto h-7 text-xs text-primary hover:bg-primary/10"
                            >
                              <Plus className="w-3 h-3 mr-1" />
                              Adicionar
                            </Button>
                          )}
                        </div>

                        {subItems.length === 0 ? (
                          <div className="glass rounded-lg p-4 text-center border-dashed border border-border ml-4">
                            <p className="text-sm text-muted-foreground">Nenhum item em {sub.name}</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 lg:gap-4 ml-4">
                            {subItems.map((item) => (
                              <ItemCard key={item.id} item={item} onClick={() => handleItemClick(item.id)} />
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {totalCategoryItems === 0 && (
                    <div className="glass rounded-xl p-6 text-center border-dashed border-2 border-border">
                      <p className="text-muted-foreground">Nenhum item em {category.name}</p>
                    </div>
                  )}
                </section>
              );
            })}

            {search && totalFilteredItems === 0 && (
              <div className="text-center py-16">
                <Search className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">Nenhum item encontrado</h3>
                <p className="text-muted-foreground">Tente buscar por outro termo</p>
              </div>
            )}
          </div>
        )}

        <AddItemDialog open={addDialogOpen} onOpenChange={closeAddDialog} defaultSector="bar" />

        <MovementDialog open={entradaDialogOpen} onOpenChange={setEntradaDialogOpen} type="entrada" />

        <MovementDialog
          open={saidaDialogOpen}
          onOpenChange={(open) => {
            setSaidaDialogOpen(open);
            if (!open) setSelectedItemId(undefined);
          }}
          type="saida"
          preselectedItemId={selectedItemId}
        />

        <CategoryManagerDialog
          open={categoryManagerOpen}
          onOpenChange={setCategoryManagerOpen}
          sector="bar"
        />
      </div>
    </MainLayout>
  );
}
