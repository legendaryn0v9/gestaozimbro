import { StockMovement } from '@/hooks/useInventory';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TrendingUp, TrendingDown, Clock, Package, User } from 'lucide-react';
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

  return (
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
  );
}
