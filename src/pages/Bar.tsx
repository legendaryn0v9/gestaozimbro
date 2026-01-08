import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { ItemCard } from '@/components/inventory/ItemCard';
import { AddItemDialog } from '@/components/inventory/AddItemDialog';
import { MovementDialog } from '@/components/inventory/MovementDialog';
import { useInventoryItems } from '@/hooks/useInventory';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Wine, Plus, Search, TrendingUp, TrendingDown } from 'lucide-react';

export default function Bar() {
  const [search, setSearch] = useState('');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [entradaDialogOpen, setEntradaDialogOpen] = useState(false);
  const [saidaDialogOpen, setSaidaDialogOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string>();

  const { data: items = [], isLoading } = useInventoryItems('bar');

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleItemClick = (itemId: string) => {
    setSelectedItemId(itemId);
    setSaidaDialogOpen(true);
  };

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

        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar itens do bar..."
            className="pl-12 h-12 bg-input border-border"
          />
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="glass rounded-xl h-40 animate-pulse" />
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-16">
            <Wine className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              {search ? 'Nenhum item encontrado' : 'Estoque vazio'}
            </h3>
            <p className="text-muted-foreground mb-6">
              {search ? 'Tente buscar por outro termo' : 'Adicione o primeiro item ao estoque do bar'}
            </p>
            {!search && (
              <Button
                onClick={() => setAddDialogOpen(true)}
                className="bg-gradient-amber text-primary-foreground hover:opacity-90"
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Item
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
