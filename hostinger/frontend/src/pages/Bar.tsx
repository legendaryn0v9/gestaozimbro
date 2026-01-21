import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '../components/layout/MainLayout';
import { ItemCard } from '../components/inventory/ItemCard';
import { AddItemDialog } from '../components/inventory/AddItemDialog';
import { MovementDialog } from '../components/inventory/MovementDialog';
import { CategoryManagerDialog } from '../components/inventory/CategoryManagerDialog';
import { useInventoryItems } from '../hooks/useInventory';
import { useRealtimeInventory } from '../hooks/useRealtimeInventory';
import { useIsAdmin } from '../hooks/useUserRoles';
import { useUserSector } from '../hooks/useUserSector';
import { useCategories } from '../hooks/useCategories';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Wine, Plus, Search, TrendingUp, TrendingDown, DollarSign, AlertCircle, Settings, Package } from 'lucide-react';
import { cn } from '../lib/utils';
import * as LucideIcons from 'lucide-react';

const getIconComponent = (iconName: string | null): React.ComponentType<{ className?: string }> => {
  if (!iconName) return Package;
  const icons = LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>;
  return icons[iconName] || Package;
};

export default function Bar() {
  const navigate = useNavigate();
  const { canAccessBar, isLoading: sectorLoading } = useUserSector();
  const { isAdmin } = useIsAdmin();
  useRealtimeInventory();
  
  const [search, setSearch] = useState('');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addDialogCategory, setAddDialogCategory] = useState<string | undefined>();
  const [categoryManagerOpen, setCategoryManagerOpen] = useState(false);
  const [entradaDialogOpen, setEntradaDialogOpen] = useState(false);
  const [saidaDialogOpen, setSaidaDialogOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string>();

  const { data: dynamicCategories = [], isLoading: categoriesLoading, isError: categoriesError } = useCategories('bar');
  const { data: items = [], isLoading, isError: itemsError } = useInventoryItems('bar');

  useEffect(() => {
    if (!sectorLoading && !canAccessBar && !isAdmin) {
      navigate('/cozinha');
    }
  }, [canAccessBar, sectorLoading, isAdmin, navigate]);

  // Treat error as loaded (show empty state instead of infinite loading)
  const isDataLoading = (categoriesLoading && !categoriesError) || (isLoading && !itemsError);

  const filteredItems = useMemo(() => {
    if (!search) return items;
    return items.filter(item => item.name.toLowerCase().includes(search.toLowerCase()));
  }, [items, search]);

  const totalInventoryValue = useMemo(() => {
    return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }, [items]);

  const handleItemClick = (itemId: string) => {
    setSelectedItemId(itemId);
    setSaidaDialogOpen(true);
  };

  if (sectorLoading || isDataLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse text-muted-foreground">Carregando...</div>
        </div>
      </MainLayout>
    );
  }

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
        <div className="flex flex-col gap-4 mb-6">
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

            {isAdmin && (
              <div className="glass rounded-xl p-3 flex items-center gap-3 border border-primary/20">
                <DollarSign className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Caixa Total</p>
                  <p className="text-lg font-bold text-primary">
                    R$ {totalInventoryValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button onClick={() => setEntradaDialogOpen(true)} variant="outline" size="sm" className="border-success text-success hover:bg-success/10">
              <TrendingUp className="w-4 h-4 mr-2" />Entrada
            </Button>
            <Button onClick={() => setSaidaDialogOpen(true)} variant="outline" size="sm" className="border-destructive text-destructive hover:bg-destructive/10">
              <TrendingDown className="w-4 h-4 mr-2" />Saída
            </Button>
            {isAdmin && (
              <>
                <Button onClick={() => setCategoryManagerOpen(true)} variant="outline" size="sm">
                  <Settings className="w-4 h-4 mr-2" />Categorias
                </Button>
                <Button onClick={() => setAddDialogOpen(true)} size="sm" className="bg-gradient-amber text-primary-foreground">
                  <Plus className="w-4 h-4 mr-2" />Novo Item
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar itens..." className="pl-10 bg-input border-border" />
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(4)].map((_, j) => (<div key={j} className="glass rounded-xl h-40 animate-pulse" />))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-16">
            <Wine className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-xl font-semibold mb-2">{search ? 'Nenhum item encontrado' : 'Estoque vazio'}</h3>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredItems.map((item) => (
              <ItemCard key={item.id} item={item} onClick={() => handleItemClick(item.id)} />
            ))}
          </div>
        )}
      </div>

      <AddItemDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} defaultSector="bar" defaultCategory={addDialogCategory} />
      <MovementDialog open={entradaDialogOpen} onOpenChange={setEntradaDialogOpen} type="entrada" sector="bar" />
      <MovementDialog open={saidaDialogOpen} onOpenChange={setSaidaDialogOpen} type="saida" preselectedItemId={selectedItemId} sector="bar" />
      <CategoryManagerDialog open={categoryManagerOpen} onOpenChange={setCategoryManagerOpen} sector="bar" />
    </MainLayout>
  );
}
