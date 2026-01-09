import { useState, useMemo } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { MovementList } from '@/components/inventory/MovementList';
import { useStockMovements, useMovementDates, useEmployeeRanking } from '@/hooks/useInventory';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ClipboardList, Calendar as CalendarIcon, TrendingUp, TrendingDown, Package, Download, ChevronLeft, ChevronRight, Trophy, Medal, DollarSign, Users } from 'lucide-react';
import { format, subDays, addDays, isSameDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export default function Relatorios() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all');
  const formattedDate = format(selectedDate, 'yyyy-MM-dd');
  const { data: allMovements = [], isLoading } = useStockMovements(formattedDate);
  const { data: movementDates = [] } = useMovementDates();
  const { data: ranking = [] } = useEmployeeRanking();

  // Get unique employees from movements
  const employees = useMemo(() => {
    const uniqueEmployees = new Map<string, string>();
    allMovements.forEach(m => {
      if (m.user_id && m.profiles?.full_name) {
        uniqueEmployees.set(m.user_id, m.profiles.full_name);
      }
    });
    return Array.from(uniqueEmployees.entries()).map(([id, name]) => ({ id, name }));
  }, [allMovements]);

  // Filter movements by selected employee
  const movements = useMemo(() => {
    if (selectedEmployee === 'all') return allMovements;
    return allMovements.filter(m => m.user_id === selectedEmployee);
  }, [allMovements, selectedEmployee]);

  const entradas = movements.filter(m => m.movement_type === 'entrada');
  const saidas = movements.filter(m => m.movement_type === 'saida');

  const totalEntradas = entradas.reduce((sum, m) => sum + Number(m.quantity), 0);
  const totalSaidas = saidas.reduce((sum, m) => sum + Number(m.quantity), 0);

  // Calculate values - entradas add to caixa, saidas remove from caixa
  const valorTotalEntradas = entradas.reduce((sum, m) => {
    const price = Number(m.inventory_items?.price) || 0;
    return sum + (price * Number(m.quantity));
  }, 0);

  const valorTotalSaidas = saidas.reduce((sum, m) => {
    const price = Number(m.inventory_items?.price) || 0;
    return sum + (price * Number(m.quantity));
  }, 0);

  // Check if a date has movements
  const hasMovements = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return movementDates.includes(dateStr);
  };

  // Get recent days with movements for quick access
  const recentDatesWithMovements = movementDates.slice(0, 7).map(d => parseISO(d));

  // Group movements by product
  const groupedByProduct = movements.reduce((acc, m) => {
    const productName = m.inventory_items?.name || 'Produto Desconhecido';
    if (!acc[productName]) {
      acc[productName] = {
        name: productName,
        unit: m.inventory_items?.unit || 'unidade',
        price: Number(m.inventory_items?.price) || 0,
        entradas: [],
        saidas: [],
      };
    }
    if (m.movement_type === 'entrada') {
      acc[productName].entradas.push(m);
    } else {
      acc[productName].saidas.push(m);
    }
    return acc;
  }, {} as Record<string, any>);

  const handleDownloadCSV = () => {
    if (movements.length === 0) return;

    const dateFormatted = format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    
    const lines: string[] = [
      `RELATÓRIO DE MOVIMENTAÇÕES - ${dateFormatted.toUpperCase()}`,
      '',
      '═══════════════════════════════════════════════════════════════════',
      '',
      'RESUMO FINANCEIRO DO DIA',
      '───────────────────────────────────────────────────────────────────',
      `Valor Total de Entradas (Investido): R$ ${valorTotalEntradas.toFixed(2).replace('.', ',')}`,
      `Valor Total de Saídas (Vendido): R$ ${valorTotalSaidas.toFixed(2).replace('.', ',')}`,
      `Diferença no Caixa: R$ ${(valorTotalEntradas - valorTotalSaidas).toFixed(2).replace('.', ',')}`,
      '',
      '═══════════════════════════════════════════════════════════════════',
      '',
      'RESUMO DE QUANTIDADES',
      '───────────────────────────────────────────────────────────────────',
      `Total de Movimentações: ${movements.length}`,
      `Total de Entradas: ${totalEntradas} itens (${entradas.length} registros)`,
      `Total de Saídas: ${totalSaidas} itens (${saidas.length} registros)`,
      '',
    ];

    // Add entries section
    if (entradas.length > 0) {
      lines.push('═══════════════════════════════════════════════════════════════════');
      lines.push('');
      lines.push('ENTRADAS NO ESTOQUE');
      lines.push('───────────────────────────────────────────────────────────────────');
      lines.push('');
      lines.push('Hora,Produto,Quantidade,Unidade,Valor Unit.,Valor Total,Responsável,Observações');
      
      entradas.forEach(m => {
        const price = Number(m.inventory_items?.price) || 0;
        const valorTotal = price * Number(m.quantity);
        lines.push([
          format(new Date(m.created_at), "HH:mm"),
          `"${m.inventory_items?.name || ''}"`,
          m.quantity.toString(),
          m.inventory_items?.unit || '',
          `R$ ${price.toFixed(2).replace('.', ',')}`,
          `R$ ${valorTotal.toFixed(2).replace('.', ',')}`,
          `"${m.profiles?.full_name || ''}"`,
          `"${m.notes || '-'}"`
        ].join(','));
      });
      
      lines.push('');
      lines.push(`SUBTOTAL ENTRADAS: R$ ${valorTotalEntradas.toFixed(2).replace('.', ',')}`);
      lines.push('');
    }

    // Add exits section
    if (saidas.length > 0) {
      lines.push('═══════════════════════════════════════════════════════════════════');
      lines.push('');
      lines.push('SAÍDAS DO ESTOQUE');
      lines.push('───────────────────────────────────────────────────────────────────');
      lines.push('');
      lines.push('Hora,Produto,Quantidade,Unidade,Valor Unit.,Valor Total,Responsável,Observações');
      
      saidas.forEach(m => {
        const price = Number(m.inventory_items?.price) || 0;
        const valorTotal = price * Number(m.quantity);
        lines.push([
          format(new Date(m.created_at), "HH:mm"),
          `"${m.inventory_items?.name || ''}"`,
          m.quantity.toString(),
          m.inventory_items?.unit || '',
          `R$ ${price.toFixed(2).replace('.', ',')}`,
          `R$ ${valorTotal.toFixed(2).replace('.', ',')}`,
          `"${m.profiles?.full_name || ''}"`,
          `"${m.notes || '-'}"`
        ].join(','));
      });
      
      lines.push('');
      lines.push(`SUBTOTAL SAÍDAS: R$ ${valorTotalSaidas.toFixed(2).replace('.', ',')}`);
      lines.push('');
    }

    // Add product summary
    lines.push('═══════════════════════════════════════════════════════════════════');
    lines.push('');
    lines.push('RESUMO POR PRODUTO');
    lines.push('───────────────────────────────────────────────────────────────────');
    lines.push('');
    lines.push('Produto,Entradas (Qtd),Entradas (R$),Saídas (Qtd),Saídas (R$),Saldo (Qtd)');
    
    Object.values(groupedByProduct).forEach((product: any) => {
      const entradasQtd = product.entradas.reduce((s: number, m: any) => s + Number(m.quantity), 0);
      const saidasQtd = product.saidas.reduce((s: number, m: any) => s + Number(m.quantity), 0);
      const entradasValor = entradasQtd * product.price;
      const saidasValor = saidasQtd * product.price;
      const saldo = entradasQtd - saidasQtd;
      
      lines.push([
        `"${product.name}"`,
        `+${entradasQtd} ${product.unit}`,
        `R$ ${entradasValor.toFixed(2).replace('.', ',')}`,
        `-${saidasQtd} ${product.unit}`,
        `R$ ${saidasValor.toFixed(2).replace('.', ',')}`,
        `${saldo >= 0 ? '+' : ''}${saldo} ${product.unit}`
      ].join(','));
    });

    // Add responsible employees summary
    lines.push('');
    lines.push('═══════════════════════════════════════════════════════════════════');
    lines.push('');
    lines.push('MOVIMENTAÇÕES POR FUNCIONÁRIO');
    lines.push('───────────────────────────────────────────────────────────────────');
    lines.push('');
    
    const byEmployee = movements.reduce((acc, m) => {
      const name = m.profiles?.full_name || 'Desconhecido';
      if (!acc[name]) {
        acc[name] = { entradas: 0, saidas: 0, valorEntradas: 0, valorSaidas: 0 };
      }
      const price = Number(m.inventory_items?.price) || 0;
      const valor = price * Number(m.quantity);
      if (m.movement_type === 'entrada') {
        acc[name].entradas += Number(m.quantity);
        acc[name].valorEntradas += valor;
      } else {
        acc[name].saidas += Number(m.quantity);
        acc[name].valorSaidas += valor;
      }
      return acc;
    }, {} as Record<string, any>);

    lines.push('Funcionário,Entradas (Qtd),Entradas (R$),Saídas (Qtd),Saídas (R$)');
    Object.entries(byEmployee).forEach(([name, data]: [string, any]) => {
      lines.push([
        `"${name}"`,
        `+${data.entradas}`,
        `R$ ${data.valorEntradas.toFixed(2).replace('.', ',')}`,
        `-${data.saidas}`,
        `R$ ${data.valorSaidas.toFixed(2).replace('.', ',')}`
      ].join(','));
    });

    lines.push('');
    lines.push('═══════════════════════════════════════════════════════════════════');
    lines.push(`Relatório gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`);

    const csvContent = lines.join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio-${formattedDate}.csv`;
    link.click();
  };

  const navigateDay = (direction: 'prev' | 'next') => {
    setSelectedDate(prev => direction === 'prev' ? subDays(prev, 1) : addDays(prev, 1));
  };

  return (
    <MainLayout>
      <div className="animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-amber flex items-center justify-center">
              <ClipboardList className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-display font-bold text-gradient">Relatórios</h1>
              <p className="text-muted-foreground">
                Histórico de movimentações do estoque
              </p>
            </div>
          </div>

          <Button
            onClick={handleDownloadCSV}
            disabled={movements.length === 0}
            className="bg-gradient-amber text-primary-foreground hover:opacity-90"
          >
            <Download className="w-4 h-4 mr-2" />
            Baixar Relatório
          </Button>
        </div>

        {/* Filters Row */}
        <div className="glass rounded-2xl p-4 md:p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            {/* Date Navigation */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigateDay('prev')}
                className="h-10 w-10"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="min-w-[200px] justify-center text-left font-medium"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    locale={ptBR}
                    className="pointer-events-auto"
                    modifiers={{
                      hasMovements: (date) => hasMovements(date),
                    }}
                    modifiersClassNames={{
                      hasMovements: 'bg-primary/20 font-bold',
                    }}
                  />
                </PopoverContent>
              </Popover>

              <Button
                variant="outline"
                size="icon"
                onClick={() => navigateDay('next')}
                disabled={isSameDay(selectedDate, new Date())}
                className="h-10 w-10"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>

              <Button
                variant={isSameDay(selectedDate, new Date()) ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedDate(new Date())}
                className={cn(
                  'ml-2',
                  isSameDay(selectedDate, new Date()) && 'bg-gradient-amber text-primary-foreground'
                )}
              >
                Hoje
              </Button>
            </div>

            {/* Employee Filter */}
            <div className="flex items-center gap-2 flex-1">
              <Users className="w-4 h-4 text-muted-foreground" />
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Filtrar por funcionário" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os funcionários</SelectItem>
                  {employees.map(emp => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Recent Days with Movements */}
          {recentDatesWithMovements.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-muted-foreground whitespace-nowrap">Dias com movimento:</span>
                <div className="flex gap-1.5 flex-wrap">
                  {recentDatesWithMovements.map((date) => (
                    <Button
                      key={date.toISOString()}
                      variant={isSameDay(selectedDate, date) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedDate(date)}
                      className={cn(
                        'h-8 px-3 text-xs',
                        isSameDay(selectedDate, date) && 'bg-gradient-amber text-primary-foreground'
                      )}
                    >
                      {format(date, "dd/MM", { locale: ptBR })}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigateDay('prev')}
                className="h-10 w-10"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="min-w-[200px] justify-center text-left font-medium"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    locale={ptBR}
                    className="pointer-events-auto"
                    modifiers={{
                      hasMovements: (date) => hasMovements(date),
                    }}
                    modifiersClassNames={{
                      hasMovements: 'bg-primary/20 font-bold',
                    }}
                  />
                </PopoverContent>
              </Popover>

              <Button
                variant="outline"
                size="icon"
                onClick={() => navigateDay('next')}
                disabled={isSameDay(selectedDate, new Date())}
                className="h-10 w-10"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>


        {/* Financial Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="glass rounded-xl p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Movimentações</p>
                <p className="text-2xl md:text-3xl font-display font-bold mt-1">{movements.length}</p>
              </div>
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Package className="w-5 h-5 md:w-6 md:h-6 text-primary" />
              </div>
            </div>
          </div>

          <div className="glass rounded-xl p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Entradas (Investido)</p>
                <p className="text-xl md:text-2xl font-display font-bold mt-1 text-success">
                  R$ {valorTotalEntradas.toFixed(2).replace('.', ',')}
                </p>
                <p className="text-xs text-muted-foreground">+{totalEntradas} itens</p>
              </div>
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-success/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 md:w-6 md:h-6 text-success" />
              </div>
            </div>
          </div>

          <div className="glass rounded-xl p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Saídas (Vendido)</p>
                <p className="text-xl md:text-2xl font-display font-bold mt-1 text-destructive">
                  R$ {valorTotalSaidas.toFixed(2).replace('.', ',')}
                </p>
                <p className="text-xs text-muted-foreground">-{totalSaidas} itens</p>
              </div>
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-destructive/10 flex items-center justify-center">
                <TrendingDown className="w-5 h-5 md:w-6 md:h-6 text-destructive" />
              </div>
            </div>
          </div>

          <div className="glass rounded-xl p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Balanço do Dia</p>
                <p className={cn(
                  "text-xl md:text-2xl font-display font-bold mt-1",
                  valorTotalEntradas - valorTotalSaidas >= 0 ? "text-success" : "text-destructive"
                )}>
                  R$ {Math.abs(valorTotalEntradas - valorTotalSaidas).toFixed(2).replace('.', ',')}
                </p>
                <p className="text-xs text-muted-foreground">
                  {valorTotalEntradas - valorTotalSaidas >= 0 ? 'Investido' : 'Vendido'}
                </p>
              </div>
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <DollarSign className="w-5 h-5 md:w-6 md:h-6 text-amber-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Ranking */}
        <div className="glass rounded-xl p-4 md:p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-5 h-5 text-amber-500" />
            <h3 className="font-display font-semibold">Top Funcionários (Saídas)</h3>
          </div>
          
          {ranking.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhum registro ainda
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {ranking.slice(0, 6).map((employee, index) => {
                const isTop3 = index < 3;
                const medalColors = ['text-amber-500', 'text-gray-400', 'text-amber-700'];
                
                return (
                  <div
                    key={employee.user_id}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-lg transition-colors',
                      isTop3 ? 'bg-gradient-to-r from-amber-500/10 to-transparent' : 'bg-secondary/30'
                    )}
                  >
                    <div className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold',
                      isTop3 ? 'bg-amber-500/20' : 'bg-muted'
                    )}>
                      {isTop3 ? (
                        <Medal className={cn('w-4 h-4', medalColors[index])} />
                      ) : (
                        <span className="text-muted-foreground">{index + 1}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{employee.full_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm text-destructive">{employee.total_saidas}</p>
                      <p className="text-xs text-muted-foreground">saídas</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Movement List */}
        <div className="glass rounded-2xl p-4 md:p-6">
          <h2 className="text-lg md:text-xl font-display font-semibold mb-4">
            Movimentações de {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
          </h2>
          
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-20 rounded-xl bg-secondary/50 animate-pulse" />
              ))}
            </div>
          ) : (
            <MovementList movements={movements} showDate={false} />
          )}
        </div>
      </div>
    </MainLayout>
  );
}
