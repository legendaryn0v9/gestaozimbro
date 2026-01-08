import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { MovementList } from '@/components/inventory/MovementList';
import { useStockMovements, useMovementDates, useEmployeeRanking } from '@/hooks/useInventory';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ClipboardList, Calendar as CalendarIcon, TrendingUp, TrendingDown, Package, Download, ChevronLeft, ChevronRight, Trophy, Medal } from 'lucide-react';
import { format, subDays, addDays, isSameDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export default function Relatorios() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const formattedDate = format(selectedDate, 'yyyy-MM-dd');
  const { data: movements = [], isLoading } = useStockMovements(formattedDate);
  const { data: movementDates = [] } = useMovementDates();
  const { data: ranking = [] } = useEmployeeRanking();

  const entradas = movements.filter(m => m.movement_type === 'entrada');
  const saidas = movements.filter(m => m.movement_type === 'saida');

  const totalEntradas = entradas.reduce((sum, m) => sum + Number(m.quantity), 0);
  const totalSaidas = saidas.reduce((sum, m) => sum + Number(m.quantity), 0);

  // Check if a date has movements
  const hasMovements = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return movementDates.includes(dateStr);
  };

  // Get recent days with movements for quick access
  const recentDatesWithMovements = movementDates.slice(0, 7).map(d => parseISO(d));

  const handleDownloadCSV = () => {
    if (movements.length === 0) return;

    const headers = ['Data/Hora', 'Tipo', 'Item', 'Quantidade', 'Unidade', 'Responsável', 'Observações'];
    const rows = movements.map(m => [
      format(new Date(m.created_at), "dd/MM/yyyy HH:mm"),
      m.movement_type === 'entrada' ? 'Entrada' : 'Saída',
      m.inventory_items?.name || '',
      m.quantity.toString(),
      m.inventory_items?.unit || '',
      m.profiles?.full_name || '',
      m.notes || ''
    ]);

    const csvContent = [
      `Relatório de Movimentações - ${format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}`,
      '',
      `Total de Entradas: ${totalEntradas}`,
      `Total de Saídas: ${totalSaidas}`,
      '',
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

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

        {/* Date Navigation */}
        <div className="glass rounded-2xl p-4 md:p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            {/* Day Navigator */}
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

            {/* Recent Days with Movements */}
            {recentDatesWithMovements.length > 0 && (
              <div className="flex-1">
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
        </div>

        {/* Stats and Ranking */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Stats */}
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="glass rounded-xl p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Total de Movimentações</p>
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
                  <p className="text-muted-foreground text-sm">Entradas</p>
                  <p className="text-2xl md:text-3xl font-display font-bold mt-1 text-success">
                    +{totalEntradas}
                  </p>
                  <p className="text-sm text-muted-foreground">{entradas.length} registros</p>
                </div>
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-success/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 md:w-6 md:h-6 text-success" />
                </div>
              </div>
            </div>

            <div className="glass rounded-xl p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Saídas</p>
                  <p className="text-2xl md:text-3xl font-display font-bold mt-1 text-destructive">
                    -{totalSaidas}
                  </p>
                  <p className="text-sm text-muted-foreground">{saidas.length} registros</p>
                </div>
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-destructive/10 flex items-center justify-center">
                  <TrendingDown className="w-5 h-5 md:w-6 md:h-6 text-destructive" />
                </div>
              </div>
            </div>
          </div>

          {/* Employee Ranking */}
          <div className="glass rounded-xl p-4 md:p-6">
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="w-5 h-5 text-amber-500" />
              <h3 className="font-display font-semibold">Top Funcionários (Saídas)</h3>
            </div>
            
            {ranking.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum registro ainda
              </p>
            ) : (
              <div className="space-y-2">
                {ranking.map((employee, index) => {
                  const isTop3 = index < 3;
                  const medalColors = ['text-amber-500', 'text-gray-400', 'text-amber-700'];
                  
                  return (
                    <div
                      key={employee.user_id}
                      className={cn(
                        'flex items-center gap-3 p-2 rounded-lg transition-colors',
                        isTop3 ? 'bg-gradient-to-r from-amber-500/10 to-transparent' : 'bg-secondary/30'
                      )}
                    >
                      <div className={cn(
                        'w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold',
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
