import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { ItemCard } from '@/components/inventory/ItemCard';
import { AddItemDialog } from '@/components/inventory/AddItemDialog';
import { MovementDialog } from '@/components/inventory/MovementDialog';
import { useInventoryItems } from '@/hooks/useInventory';
import { useIsAdmin } from '@/hooks/useUserRoles';
import { useUserSector } from '@/hooks/useUserSector';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UtensilsCrossed, Plus, Search, TrendingUp, TrendingDown, Filter, AlertCircle } from 'lucide-react';

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
  'Outros',
];

export default function Cozinha() {
  const navigate = useNavigate();
  const { canAccessCozinha, isLoading: sectorLoading } = useUserSector();
  const { isAdmin } = useIsAdmin();
  
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [entradaDialogOpen, setEntradaDialogOpen] = useState(false);
  const [saidaDialogOpen, setSaidaDialogOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string>();

  // Redirect if user doesn't have access to cozinha
  useEffect(() => {
    if (!sectorLoading && !canAccessCozinha && !isAdmin) {
      navigate('/bar');
    }
  }, [canAccessCozinha, sectorLoading, isAdmin, navigate]);

  const { data: items = [], isLoading } = useInventoryItems('cozinha');

  const categories = useMemo(() => {
    const cats = items.map(item => item.category).filter(Boolean) as string[];
    return [...new Set(cats)];
  }, [items]);

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleItemClick = (itemId: string) => {
    setSelectedItemId(itemId);
    setSaidaDialogOpen(true);
  };

  // Show loading while checking sector access
  if (sectorLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse text-muted-foreground">Carregando...</div>
        </div>
      </MainLayout>
    );
  }

  // Show access denied message
  if (!canAccessCozinha && !isAdmin) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <AlertCircle className="w-16 h-16 text-destructive mb-4" />
          <h2 className="text-xl font-semibold mb-2">Acesso Restrito</h2>
          <p className="text-muted-foreground">Você não tem permissão para acessar a Cozinha.</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 lg:mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-amber flex items-center justify-center">
              <UtensilsCrossed className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-display font-bold text-gradient">Cozinha</h1>
              <p className="text-sm text-muted-foreground">{items.length} itens no estoque</p>
            </div>
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
              <Button
                onClick={() => setAddDialogOpen(true)}
                size="sm"
                className="bg-gradient-amber text-primary-foreground hover:opacity-90 flex-1 sm:flex-none"
              >
                <Plus className="w-4 h-4 mr-2" />
                Novo Item
              </Button>
            )}
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 lg:left-4 top-1/2 -translate-y-1/2 w-4 lg:w-5 h-4 lg:h-5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar itens..."
              className="pl-10 lg:pl-12 h-10 lg:h-12 bg-input border-border text-sm lg:text-base"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-48 h-10 lg:h-12 bg-input border-border text-sm lg:text-base">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas Categorias</SelectItem>
              {COZINHA_CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 lg:gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="glass rounded-xl h-40 animate-pulse" />
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-12 lg:py-16">
            <UtensilsCrossed className="w-12 h-12 lg:w-16 lg:h-16 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg lg:text-xl font-semibold text-foreground mb-2">
              {search || categoryFilter !== 'all' ? 'Nenhum item encontrado' : 'Estoque vazio'}
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              {search || categoryFilter !== 'all' ? 'Tente buscar por outro termo ou categoria' : 'Adicione o primeiro item ao estoque da cozinha'}
            </p>
            {!search && categoryFilter === 'all' && isAdmin && (
              <Button
                onClick={() => setAddDialogOpen(true)}
                size="sm"
                className="bg-gradient-amber text-primary-foreground hover:opacity-90"
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Item
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 lg:gap-4">
            {filteredItems.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                onClick={() => handleItemClick(item.id)}
              />
            ))}
          </div>
        )}

        <AddItemDialog
          open={addDialogOpen}
          onOpenChange={setAddDialogOpen}
          defaultSector="cozinha"
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
