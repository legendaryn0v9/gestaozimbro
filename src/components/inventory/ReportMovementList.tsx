import { StockMovement } from '@/hooks/useInventory';
import { useIsAdmin } from '@/hooks/useUserRoles';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TrendingUp, TrendingDown, Clock, Package, User, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface ReportMovementListProps {
  movements: StockMovement[];
}

export function ReportMovementList({ movements }: ReportMovementListProps) {
  const { isAdmin } = useIsAdmin();

  if (movements.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p className="text-lg font-medium">Nenhuma movimentação encontrada</p>
        <p className="text-sm">Selecione outra data para ver as movimentações</p>
      </div>
    );
  }

  // Sort by time (most recent first)
  const sortedMovements = [...movements].sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  // Calculate totals for admin
  const entradas = movements.filter(m => m.movement_type === 'entrada');
  const saidas = movements.filter(m => m.movement_type === 'saida');
  
  const valorTotalEntradas = entradas.reduce((sum, m) => {
    const price = Number(m.inventory_items?.price) || 0;
    return sum + (price * Number(m.quantity));
  }, 0);

  const valorTotalSaidas = saidas.reduce((sum, m) => {
    const price = Number(m.inventory_items?.price) || 0;
    return sum + (price * Number(m.quantity));
  }, 0);

  return (
    <div className="space-y-4">
      {/* Financial Summary - Only for Admin */}
      {isAdmin && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <div className="glass rounded-xl p-3 border border-success/20">
            <div className="flex items-center gap-2 text-success mb-1">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm font-medium">Entradas</span>
            </div>
            <p className="text-lg font-bold text-success">
              R$ {valorTotalEntradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="glass rounded-xl p-3 border border-destructive/20">
            <div className="flex items-center gap-2 text-destructive mb-1">
              <TrendingDown className="w-4 h-4" />
              <span className="text-sm font-medium">Saídas</span>
            </div>
            <p className="text-lg font-bold text-destructive">
              R$ {valorTotalSaidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="glass rounded-xl p-3 border border-primary/20">
            <div className="flex items-center gap-2 text-primary mb-1">
              <DollarSign className="w-4 h-4" />
              <span className="text-sm font-medium">Balanço</span>
            </div>
            <p className={cn(
              "text-lg font-bold",
              valorTotalSaidas - valorTotalEntradas >= 0 ? 'text-success' : 'text-destructive'
            )}>
              R$ {(valorTotalSaidas - valorTotalEntradas).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="font-semibold">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Horário
                </div>
              </TableHead>
              <TableHead className="font-semibold">Tipo</TableHead>
              <TableHead className="font-semibold">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Produto
                </div>
              </TableHead>
              <TableHead className="font-semibold text-center">Quantidade</TableHead>
              {isAdmin && (
                <TableHead className="font-semibold text-right">
                  <div className="flex items-center gap-2 justify-end">
                    <DollarSign className="w-4 h-4" />
                    Valor
                  </div>
                </TableHead>
              )}
              <TableHead className="font-semibold">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Responsável
                </div>
              </TableHead>
              <TableHead className="font-semibold">Observações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedMovements.map((movement) => {
              const isEntrada = movement.movement_type === 'entrada';
              const price = Number(movement.inventory_items?.price) || 0;
              const total = price * Number(movement.quantity);
              
              return (
                <TableRow 
                  key={movement.id}
                  className="hover:bg-muted/30 transition-colors"
                >
                  <TableCell className="font-medium">
                    {format(new Date(movement.created_at), "HH:mm", { locale: ptBR })}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline"
                      className={cn(
                        'gap-1.5 font-medium',
                        isEntrada 
                          ? 'bg-success/10 text-success border-success/30' 
                          : 'bg-destructive/10 text-destructive border-destructive/30'
                      )}
                    >
                      {isEntrada ? (
                        <TrendingUp className="w-3.5 h-3.5" />
                      ) : (
                        <TrendingDown className="w-3.5 h-3.5" />
                      )}
                      {isEntrada ? 'Entrada' : 'Saída'}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">
                    {movement.inventory_items?.name}
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={cn(
                      'font-bold',
                      isEntrada ? 'text-success' : 'text-destructive'
                    )}>
                      {isEntrada ? '+' : '-'}{movement.quantity}
                    </span>
                    <span className="text-muted-foreground ml-1 text-sm">
                      {movement.inventory_items?.unit}
                    </span>
                  </TableCell>
                  {isAdmin && (
                    <TableCell className="text-right font-medium">
                      R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </TableCell>
                  )}
                  <TableCell>
                    {movement.profiles?.full_name || '-'}
                  </TableCell>
                  <TableCell className="text-muted-foreground max-w-[200px] truncate">
                    {movement.notes || '-'}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
