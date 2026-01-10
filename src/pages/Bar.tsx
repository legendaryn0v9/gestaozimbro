import { useState, useMemo } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { ItemCard } from '@/components/inventory/ItemCard';
import { AddItemDialog } from '@/components/inventory/AddItemDialog';
import { MovementDialog } from '@/components/inventory/MovementDialog';
import { useInventoryItems } from '@/hooks/useInventory';
import { useIsAdmin } from '@/hooks/useUserRoles';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Wine, Plus, Search, TrendingUp, TrendingDown, GlassWater, Beer, Martini, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';

const BAR_CATEGORIES = [
  {
    name: 'Destilados',
    icon: Martini,
    subcategories: ['Todos', 'Destilados', 'Vodka', 'Gin', 'Whisky', 'Rum', 'Tequila', 'Cognac'],
    gradient: 'from-amber-500 to-orange-600',
  },
  {
    name: 'Não Alcoólicos',
    icon: GlassWater,
    subcategories: ['Todos', 'Refrigerante', 'Energético', 'Cerveja Zero', 'Água com Gás', 'Água sem Gás'],
    gradient: 'from-blue-500 to-cyan-600',
  },
  {
    name: 'Alcoólicos',
    icon: Beer,
    subcategories: ['Todos', 'Cerveja', 'Vinho', 'Licor'],
    gradient: 'from-purple-500 to-pink-600',
  },
];

const normalizeCategory = (category: string | null) => {
  if (!category) return null;
  return category.split(' - ').pop()?.trim() || category;
};

export default function Bar() {
  const [search, setSearch] = useState('');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addDialogCategory, setAddDialogCategory] = useState<string | undefined>();
  const [addDialogCategoryType, setAddDialogCategoryType] = useState<'destilados' | 'naoAlcoolicos' | 'alcoolicos'>('destilados');
  const [entradaDialogOpen, setEntradaDialogOpen] = useState(false);
  const [saidaDialogOpen, setSaidaDialogOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string>();
  const [selectedSubcategories, setSelectedSubcategories] = useState<Record<string, string>>({
    Destilados: 'Todos',
    'Não Alcoólicos': 'Todos',
    Alcoólicos: 'Todos',
  });

  const openAddDialog = (category?: string, categoryType: 'destilados' | 'naoAlcoolicos' | 'alcoolicos' = 'destilados') => {
    setAddDialogCategory(category);
    setAddDialogCategoryType(categoryType);
    setAddDialogOpen(true);
  };

  const closeAddDialog = (open: boolean) => {
    setAddDialogOpen(open);
    if (!open) {
      setAddDialogCategory(undefined);
      setAddDialogCategoryType('destilados');
    }
  };

  const { data: items = [], isLoading } = useInventoryItems('bar');
  const { isAdmin } = useIsAdmin();

  // Agrupar itens por categoria principal (Destilados / Não Alcoólicos / Alcoólicos)
  const itemsByCategory = useMemo(() => {
    const grouped: Record<string, typeof items> = {};

    BAR_CATEGORIES.forEach((cat) => {
      const allowed = new Set(cat.subcategories.filter((s) => s !== 'Todos'));
      grouped[cat.name] = items.filter((item) => {
        const n = normalizeCategory(item.category);
        if (!n) return false;
        return n === cat.name || allowed.has(n);
      });
    });

    return grouped;
  }, [items]);

  // Filtrar por aba (subcategoria) + busca
  const filteredItemsByCategory = useMemo(() => {
    const filtered: Record<string, typeof items> = {};

    Object.entries(itemsByCategory).forEach(([cat, catItems]) => {
      let result = catItems;

      const selectedSub = selectedSubcategories[cat];
      if (selectedSub && selectedSub !== 'Todos') {
        result = result.filter((item) => normalizeCategory(item.category) === selectedSub);
      }

      if (search) {
        result = result.filter((item) => item.name.toLowerCase().includes(search.toLowerCase()));
      }

      filtered[cat] = result;
    });

    return filtered;
  }, [itemsByCategory, selectedSubcategories, search]);

  const handleItemClick = (itemId: string) => {
    setSelectedItemId(itemId);
    setSaidaDialogOpen(true);
  };

  const handleSubcategoryChange = (category: string, subcategory: string) => {
    setSelectedSubcategories((prev) => ({
      ...prev,
      [category]: subcategory,
    }));
  };

  const totalFilteredItems = Object.values(filteredItemsByCategory).reduce((acc, list) => acc + list.length, 0);

  // Calculate total inventory value
  const totalInventoryValue = useMemo(() => {
    return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }, [items]);

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

          {/* Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <Button
              onClick={() => setEntradaDialogOpen(true)}
              variant="outline"
              size="sm"
              className="border-success text-success hover:bg-success/10 flex-1 sm:flex-none"
            >
              <TrendingUp className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden xs:inline">Entrada</span>
              <span className="xs:hidden">+</span>
            </Button>
            <Button
              onClick={() => setSaidaDialogOpen(true)}
              variant="outline"
              size="sm"
              className="border-destructive text-destructive hover:bg-destructive/10 flex-1 sm:flex-none"
            >
              <TrendingDown className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden xs:inline">Saída</span>
              <span className="xs:hidden">-</span>
            </Button>
            {isAdmin && (
              <Button 
                onClick={() => openAddDialog()} 
                size="sm"
                className="bg-gradient-amber text-primary-foreground hover:opacity-90 flex-1 sm:flex-none"
              >
                <Plus className="w-4 h-4 mr-1 sm:mr-2" />
                <span className="hidden xs:inline">Novo Item</span>
                <span className="xs:hidden">Novo</span>
              </Button>
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
        ) : totalFilteredItems === 0 && !search ? (
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
            {BAR_CATEGORIES.map((category) => {
              const categoryItems = filteredItemsByCategory[category.name] || [];
              const Icon = category.icon;
              const selectedSub = selectedSubcategories[category.name] || 'Todos';

              return (
                <section key={category.name} className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-lg bg-gradient-to-br ${category.gradient} flex items-center justify-center`}
                    >
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-xl font-display font-semibold text-foreground">{category.name}</h2>
                      <p className="text-sm text-muted-foreground">
                        {categoryItems.length} {categoryItems.length === 1 ? 'item' : 'itens'}
                      </p>
                    </div>
                    {isAdmin && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const catType = category.name === 'Não Alcoólicos' ? 'naoAlcoolicos' : 
                                          category.name === 'Alcoólicos' ? 'alcoolicos' : 'destilados';
                          openAddDialog(selectedSub !== 'Todos' ? selectedSub : undefined, catType);
                        }}
                        className="text-primary border-primary hover:bg-primary/10"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Adicionar
                      </Button>
                    )}
                  </div>

                  {/* Subcategory tabs - horizontal scroll on mobile */}
                  <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 lg:mx-0 lg:px-0 lg:flex-wrap scrollbar-hide">
                    {category.subcategories.map((sub) => {
                      const isSelected = selectedSub === sub;
                      const subCount =
                        sub === 'Todos'
                          ? (itemsByCategory[category.name]?.length || 0)
                          : (itemsByCategory[category.name] || []).filter(
                              (item) => normalizeCategory(item.category) === sub
                            ).length;

                      return (
                        <Button
                          key={sub}
                          variant={isSelected ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => handleSubcategoryChange(category.name, sub)}
                          className={cn(
                            'h-8 text-xs whitespace-nowrap flex-shrink-0',
                            isSelected ? `bg-gradient-to-r ${category.gradient} text-white border-0` : 'hover:bg-secondary'
                          )}
                        >
                          {sub}
                          <span
                            className={cn(
                              'ml-1.5 px-1.5 py-0.5 rounded-full text-[10px]',
                              isSelected ? 'bg-white/20' : 'bg-muted'
                            )}
                          >
                            {subCount}
                          </span>
                        </Button>
                      );
                    })}
                  </div>

                  {categoryItems.length === 0 ? (
                    <div className="glass rounded-xl p-6 text-center border-dashed border-2 border-border">
                      <p className="text-muted-foreground">
                        {selectedSub !== 'Todos' ? `Nenhum item em ${selectedSub}` : `Nenhum item em ${category.name}`}
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 lg:gap-4">
                      {categoryItems.map((item) => (
                        <ItemCard key={item.id} item={item} onClick={() => handleItemClick(item.id)} />
                      ))}
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

        <AddItemDialog open={addDialogOpen} onOpenChange={closeAddDialog} defaultSector="bar" defaultCategory={addDialogCategory} categoryType={addDialogCategoryType} />

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
      </div>
    </MainLayout>
  );
}
