import { useState } from 'react';
import { InventoryItem, useDeleteItem } from '@/hooks/useInventory';
import { useIsAdmin } from '@/hooks/useUserRoles';
import { cn } from '@/lib/utils';
import { AlertTriangle, Wine, UtensilsCrossed, Trash2, Pencil, MoreVertical } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { EditItemDialog } from './EditItemDialog';

interface ItemCardProps {
  item: InventoryItem;
  onClick?: () => void;
}

export function ItemCard({ item, onClick }: ItemCardProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const { isAdmin } = useIsAdmin();
  const deleteItem = useDeleteItem();
  
  const isLowStock = item.min_quantity !== null && item.quantity <= item.min_quantity;
  const isOutOfStock = item.quantity === 0;

  const unitLabels: Record<string, string> = {
    unidade: 'un',
    kg: 'kg',
    litro: 'L',
    caixa: 'cx',
    pacote: 'pct',
  };

  const handleMenuAction = (e: React.MouseEvent, action: 'edit' | 'delete') => {
    e.stopPropagation();
    if (action === 'edit') {
      setEditDialogOpen(true);
    } else {
      setDeleteDialogOpen(true);
    }
  };

  const confirmDelete = () => {
    deleteItem.mutate(item.id);
    setDeleteDialogOpen(false);
  };

  return (
    <>
      <div
        onClick={onClick}
        className={cn(
          'glass rounded-xl p-4 cursor-pointer transition-all duration-300 hover:glow-amber hover:scale-[1.02] relative group',
          isOutOfStock && 'border-destructive/50',
          isLowStock && !isOutOfStock && 'border-warning/50'
        )}
      >
        {/* Admin Menu */}
        {isAdmin && (
          <div className="absolute top-3 right-3 z-10" onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 bg-background/80 backdrop-blur-sm hover:bg-background border border-border shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onClick={(e) => handleMenuAction(e, 'edit')}>
                  <Pencil className="w-4 h-4 mr-2" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={(e) => handleMenuAction(e, 'delete')}
                  className="text-destructive focus:text-destructive focus:bg-destructive/10"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        {/* Image or Icon */}
        <div className="relative w-full aspect-square mb-3 rounded-xl overflow-hidden bg-gradient-to-br from-muted/50 to-muted/30 flex items-center justify-center">
          {item.image_url ? (
            <img 
              src={item.image_url} 
              alt={item.name} 
              className="w-full h-full object-contain p-2"
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
              {item.sector === 'bar' ? (
                <Wine className="w-8 h-8 text-primary" />
              ) : (
                <UtensilsCrossed className="w-8 h-8 text-primary" />
              )}
            </div>
          )}
          
          {/* Stock Badge */}
          {(isLowStock || isOutOfStock) && (
            <div className={cn(
              'absolute top-2 left-2 px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1 shadow-sm',
              isOutOfStock ? 'bg-destructive text-destructive-foreground' : 'bg-warning text-white'
            )}>
              <AlertTriangle className="w-3 h-3" />
              {isOutOfStock ? 'Esgotado' : 'Baixo'}
            </div>
          )}
        </div>

        <div className="space-y-1">
          <h3 className="font-semibold text-foreground truncate text-base">{item.name}</h3>
          {item.category && (
            <span className="inline-block px-2 py-0.5 rounded-md bg-primary/10 text-primary text-xs font-medium">
              {item.category}
            </span>
          )}
          {item.description && (
            <p className="text-muted-foreground text-sm truncate">{item.description}</p>
          )}
        </div>

        <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
          <span className="text-muted-foreground text-sm">Quantidade</span>
          <span className={cn(
            'font-bold text-lg',
            isOutOfStock ? 'text-destructive' : isLowStock ? 'text-warning' : 'text-foreground'
          )}>
            {item.quantity} {unitLabels[item.unit]}
          </span>
        </div>
      </div>

      {/* Edit Dialog */}
      <EditItemDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        item={item}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="glass border-border">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-destructive" />
              </div>
              <div>
                <AlertDialogTitle className="text-left">Excluir Item</AlertDialogTitle>
                <p className="text-sm text-muted-foreground text-left">Esta ação é permanente</p>
              </div>
            </div>
            <AlertDialogDescription className="text-left pt-2">
              Você está prestes a excluir <strong className="text-foreground">{item.name}</strong> do estoque. 
              Todo o histórico de movimentações deste item também será removido.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel className="mt-0">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Sim, Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
