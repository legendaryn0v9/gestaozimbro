import { useState, useMemo } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { ItemCard } from '@/components/inventory/ItemCard';
import { AddItemDialog } from '@/components/inventory/AddItemDialog';
import { MovementDialog } from '@/components/inventory/MovementDialog';
import { useInventoryItems } from '@/hooks/useInventory';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Wine, Plus, Search, TrendingUp, TrendingDown, GlassWater, Beer, Martini } from 'lucide-react';

const BAR_CATEGORIES = [
  { 
    name: 'Destilados', 
    icon: Martini,
    subcategories: ['Vodka', 'Gin', 'Whisky', 'Rum', 'Tequila', 'Cognac'],
    gradient: 'from-amber-500 to-orange-600'
  },
  { 
    name: 'Não Alcoólicos', 
    icon: GlassWater,
    subcategories: ['Refrigerante', 'Energético', 'Cerveja Zero', 'Água com Gás', 'Água sem Gás'],
    gradient: 'from-blue-500 to-cyan-600'
  },
  { 
    name: 'Alcoólicos', 
    icon: Beer,
    subcategories: ['Cerveja', 'Vinho', 'Licor'],
    gradient: 'from-purple-500 to-pink-600'
  },
];

export default function Bar() {
  const [search, setSearch] = useState('');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [entradaDialogOpen, setEntradaDialogOpen] = useState(false);
  const [saidaDialogOpen, setSaidaDialogOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string>();

  const { data: items = [], isLoading } = useInventoryItems('bar');

  // Agrupar itens por categoria principal
  const itemsByCategory = useMemo(() => {
    const grouped: Record<string, typeof items> = {};
    
    BAR_CATEGORIES.forEach(cat => {
      grouped[cat.name] = items.filter(item => {
        if (!item.category) return false;
        // Verifica se o item pertence à categoria ou subcategoria
        return item.category === cat.name || 
               item.category.startsWith(`${cat.name} - `) ||
               cat.subcategories.some(sub => 
                 item.category === sub || 
                 item.category?.includes(sub)
               );
      });
    });

    // Itens sem categoria ou com categorias personalizadas
    grouped['Outros'] = items.filter(item => {
      if (!item.category) return true;
      return !BAR_CATEGORIES.some(cat => 
        item.category === cat.name || 
        item.category?.startsWith(`${cat.name} - `) ||
        cat.subcategories.some(sub => 
          item.category === sub || 
          item.category?.includes(sub)
        )
      );
    });

    return grouped;
  }, [items]);

  // Filtrar por busca
  const filteredItemsByCategory = useMemo(() => {
    if (!search) return itemsByCategory;
    
    const filtered: Record<string, typeof items> = {};
    Object.entries(itemsByCategory).forEach(([cat, catItems]) => {
      filtered[cat] = catItems.filter(item => 
        item.name.toLowerCase().includes(search.toLowerCase())
      );
    });
    return filtered;
  }, [itemsByCategory, search]);

  const handleItemClick = (itemId: string) => {
    setSelectedItemId(itemId);
    setSaidaDialogOpen(true);
  };

  const totalFilteredItems = Object.values(filteredItemsByCategory).reduce(
    (acc, items) => acc + items.length, 0
  );

  return (
    <MainLayout>
      <div className="animate-fade-in">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-amber flex items-center justify-center">
                <Wine className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-3xl font-display font-bold text-gradient">Bar</h1>
                <p className="text-muted-foreground">{items.length} itens no estoque</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={() => setEntradaDialogOpen(true)}
              variant="outline"
              className="border-success text-success hover:bg-success/10"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Entrada
            </Button>
            <Button
              onClick={() => setSaidaDialogOpen(true)}
              variant="outline"
              className="border-destructive text-destructive hover:bg-destructive/10"
            >
              <TrendingDown className="w-4 h-4 mr-2" />
              Saída
            </Button>
            <Button
              onClick={() => setAddDialogOpen(true)}
              className="bg-gradient-amber text-primary-foreground hover:opacity-90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Item
            </Button>
          </div>
        </div>

        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar itens do bar..."
            className="pl-12 h-12 bg-input border-border"
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
            <p className="text-muted-foreground mb-6">
              Adicione o primeiro item ao estoque do bar
            </p>
            <Button
              onClick={() => setAddDialogOpen(true)}
              className="bg-gradient-amber text-primary-foreground hover:opacity-90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Item
            </Button>
          </div>
        ) : (
          <div className="space-y-10">
            {BAR_CATEGORIES.map((category) => {
              const categoryItems = filteredItemsByCategory[category.name] || [];
              const Icon = category.icon;
              
              return (
                <section key={category.name} className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${category.gradient} flex items-center justify-center`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-display font-semibold text-foreground">
                        {category.name}
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        {categoryItems.length} {categoryItems.length === 1 ? 'item' : 'itens'}
                      </p>
                    </div>
                  </div>
                  
                  {categoryItems.length === 0 ? (
                    <div className="glass rounded-xl p-6 text-center border-dashed border-2 border-border">
                      <p className="text-muted-foreground mb-3">
                        Nenhum item em {category.name}
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setAddDialogOpen(true)}
                        className="text-primary border-primary hover:bg-primary/10"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Adicionar
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {categoryItems.map((item) => (
                        <ItemCard
                          key={item.id}
                          item={item}
                          onClick={() => handleItemClick(item.id)}
                        />
                      ))}
                    </div>
                  )}
                </section>
              );
            })}

            {/* Itens sem categoria ou com categorias personalizadas */}
            {(filteredItemsByCategory['Outros']?.length ?? 0) > 0 && (
              <section className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gray-500 to-gray-600 flex items-center justify-center">
                    <Wine className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-display font-semibold text-foreground">
                      Outros
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {filteredItemsByCategory['Outros'].length} {filteredItemsByCategory['Outros'].length === 1 ? 'item' : 'itens'}
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredItemsByCategory['Outros'].map((item) => (
                    <ItemCard
                      key={item.id}
                      item={item}
                      onClick={() => handleItemClick(item.id)}
                    />
                  ))}
                </div>
              </section>
            )}

            {search && totalFilteredItems === 0 && (
              <div className="text-center py-16">
                <Search className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  Nenhum item encontrado
                </h3>
                <p className="text-muted-foreground">
                  Tente buscar por outro termo
                </p>
              </div>
            )}
          </div>
        )}

        <AddItemDialog
          open={addDialogOpen}
          onOpenChange={setAddDialogOpen}
          defaultSector="bar"
        />

        <MovementDialog
          open={entradaDialogOpen}
          onOpenChange={setEntradaDialogOpen}
          type="entrada"
        />

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
