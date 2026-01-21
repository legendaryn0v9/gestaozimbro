import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { ReportMovementList } from '@/components/inventory/ReportMovementList';
import { useStockMovements, useMovementDates, StockMovement } from '@/hooks/useInventory';
import { useIsAdmin, useIsDono, useAllUsersWithRoles } from '@/hooks/useUserRoles';
import { useAdminActions, getActionLabel, getActionIcon } from '@/hooks/useAdminActions';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ClipboardList, Calendar as CalendarIcon, Download, ChevronLeft, ChevronRight, Pencil, TrendingUp, TrendingDown, Users, Shield } from 'lucide-react';
import { format, subDays, addDays, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export default function Relatorios() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState<string>('movements');
  const formattedDate = format(selectedDate, 'yyyy-MM-dd');
  const { data: movements = [], isLoading } = useStockMovements(formattedDate);
  const { data: movementDates = [] } = useMovementDates();
  const { data: adminActions = [], isLoading: isLoadingActions } = useAdminActions(formattedDate);
  const { isAdmin } = useIsAdmin();
  const { isDono } = useIsDono();
  const { data: usersWithRoles = [] } = useAllUsersWithRoles();

  // Create a map of user_id to role for quick lookup
  const userRolesMap = new Map(usersWithRoles.map(u => [u.id, u.role]));

  // Separate movements by user role
  const getMovementsByRole = (role: 'funcionario' | 'admin' | 'dono') => {
    return movements.filter(m => userRolesMap.get(m.user_id) === role);
  };

  const funcionarioMovements = getMovementsByRole('funcionario');
  const gestorMovements = getMovementsByRole('admin');
  const donoMovements = getMovementsByRole('dono');

  const entradas = movements.filter(m => m.movement_type === 'entrada');
  const saidas = movements.filter(m => m.movement_type === 'saida');

  const totalEntradas = entradas.reduce((sum, m) => sum + Number(m.quantity), 0);
  const totalSaidas = saidas.reduce((sum, m) => sum + Number(m.quantity), 0);

  // Calculate values
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

  // Calculate totals for a specific set of movements
  const calculateTotals = (movs: StockMovement[]) => {
    const ent = movs.filter(m => m.movement_type === 'entrada');
    const sai = movs.filter(m => m.movement_type === 'saida');
    const valorEnt = ent.reduce((sum, m) => sum + (Number(m.inventory_items?.price || 0) * Number(m.quantity)), 0);
    const valorSai = sai.reduce((sum, m) => sum + (Number(m.inventory_items?.price || 0) * Number(m.quantity)), 0);
    return { entradas: ent.length, saidas: sai.length, valorEntradas: valorEnt, valorSaidas: valorSai };
  };

  const handleDownloadCSV = () => {
    if (movements.length === 0) return;

    const dateFormatted = format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    
    // Sort movements by time
    const sortedMovements = [...movements].sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    const lines: string[] = [
      `RELATÓRIO DE MOVIMENTAÇÕES - ${dateFormatted.toUpperCase()}`,
      '',
    ];

    // Financial summary only for admin/dono
    if (isAdmin) {
      lines.push(`RESUMO FINANCEIRO`);
      lines.push(`Total de Entradas: R$ ${valorTotalEntradas.toFixed(2).replace('.', ',')}`);
      lines.push(`Total de Saídas: R$ ${valorTotalSaidas.toFixed(2).replace('.', ',')}`);
      lines.push(`Balanço do Dia: R$ ${(valorTotalSaidas - valorTotalEntradas).toFixed(2).replace('.', ',')}`);
      lines.push('');
    }

    // Quantity summary
    lines.push(`RESUMO DE QUANTIDADES`);
    lines.push(`Total de Movimentações: ${movements.length}`);
    lines.push(`Entradas: ${totalEntradas} itens (${entradas.length} registros)`);
    lines.push(`Saídas: ${totalSaidas} itens (${saidas.length} registros)`);
    lines.push('');

    // Header
    if (isAdmin) {
      lines.push('Horário,Tipo,Produto,Quantidade,Valor Unit.,Responsável,Observações');
    } else {
      lines.push('Horário,Tipo,Produto,Quantidade,Responsável,Observações');
    }

    sortedMovements.forEach(m => {
      const tipo = m.movement_type === 'entrada' ? 'ENTRADA' : m.movement_type === 'saida' ? 'SAÍDA' : 'EDIÇÃO';
      const sign = m.movement_type === 'entrada' ? '+' : m.movement_type === 'saida' ? '-' : '';
      const price = Number(m.inventory_items?.price) || 0;
      
      if (isAdmin) {
        lines.push([
          format(new Date(m.created_at), "HH:mm"),
          tipo,
          `"${m.inventory_items?.name || ''}"`,
          `${sign}${m.quantity} ${m.inventory_items?.unit || ''}`,
          `R$ ${price.toFixed(2).replace('.', ',')}`,
          `"${m.profiles?.full_name || ''}"`,
          `"${m.notes || '-'}"`
        ].join(','));
      } else {
        lines.push([
          format(new Date(m.created_at), "HH:mm"),
          tipo,
          `"${m.inventory_items?.name || ''}"`,
          `${sign}${m.quantity} ${m.inventory_items?.unit || ''}`,
          `"${m.profiles?.full_name || ''}"`,
          `"${m.notes || '-'}"`
        ].join(','));
      }
    });

    lines.push('');
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

  // Render movements section grouped by role for Dono
  const renderDonoMovementsView = () => {
    return (
      <div className="space-y-6">
        {/* Funcionários */}
        {funcionarioMovements.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-lg font-semibold">
              <Users className="w-5 h-5 text-blue-500" />
              <span>Funcionários</span>
              <span className="text-sm font-normal text-muted-foreground">
                ({funcionarioMovements.length} movimentações)
              </span>
            </div>
            <div className="border border-blue-500/20 rounded-xl overflow-hidden">
              <ReportMovementList movements={funcionarioMovements} />
            </div>
          </div>
        )}

        {/* Gestores */}
        {gestorMovements.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-lg font-semibold">
              <Users className="w-5 h-5 text-purple-500" />
              <span>Gestores</span>
              <span className="text-sm font-normal text-muted-foreground">
                ({gestorMovements.length} movimentações)
              </span>
            </div>
            <div className="border border-purple-500/20 rounded-xl overflow-hidden">
              <ReportMovementList movements={gestorMovements} />
            </div>
          </div>
        )}

        {/* Dono */}
        {donoMovements.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-lg font-semibold">
              <Users className="w-5 h-5 text-amber-500" />
              <span>Dono</span>
              <span className="text-sm font-normal text-muted-foreground">
                ({donoMovements.length} movimentações)
              </span>
            </div>
            <div className="border border-amber-500/20 rounded-xl overflow-hidden">
              <ReportMovementList movements={donoMovements} />
            </div>
          </div>
        )}

        {/* If no movements at all */}
        {movements.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg">Nenhuma movimentação neste dia</p>
          </div>
        )}
      </div>
    );
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
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

          {/* Buttons for admin/dono */}
          {isAdmin && (
            <div className="flex gap-2 flex-wrap">
              <Button
                onClick={handleDownloadCSV}
                disabled={movements.length === 0}
                className="bg-gradient-amber text-primary-foreground hover:opacity-90"
              >
                <Download className="w-4 h-4 mr-2" />
                Baixar CSV
              </Button>
            </div>
          )}
        </div>

        {/* Date Selector */}
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
          </div>

        </div>

        {/* Content - Different for each role */}
        <div className="glass rounded-2xl p-4 md:p-6">
          {/* For Admin (Gestor) or Dono: Show tabs with movements and admin actions */}
          {isAdmin ? (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4 flex-wrap h-auto">
                <TabsTrigger value="movements" className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Movimentações
                </TabsTrigger>
                <TabsTrigger value="admin-actions" className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Ações Administrativas
                </TabsTrigger>
              </TabsList>

              <TabsContent value="movements">
                <h2 className="text-lg md:text-xl font-display font-semibold mb-4">
                  Movimentações de {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
                </h2>
                
                {isLoading ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-20 rounded-xl bg-secondary/50 animate-pulse" />
                    ))}
                  </div>
                ) : isDono ? (
                  renderDonoMovementsView()
                ) : (
                  <ReportMovementList movements={movements} />
                )}
              </TabsContent>

              <TabsContent value="admin-actions">
                <h2 className="text-lg md:text-xl font-display font-semibold mb-4">
                  Ações Administrativas de {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
                </h2>
                
                {isLoadingActions ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-16 rounded-xl bg-secondary/50 animate-pulse" />
                    ))}
                  </div>
                ) : adminActions.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg">Nenhuma ação administrativa neste dia</p>
                    <p className="text-sm">Criação de usuários, alteração de cargos e setores aparecerão aqui</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {adminActions.map((action) => (
                      <div
                        key={action.id}
                        className="p-4 rounded-xl bg-secondary/30 border border-border"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-xl">
                              {getActionIcon(action.action_type)}
                            </div>
                            <div>
                              <p className="font-semibold">{getActionLabel(action.action_type)}</p>
                              <div className="text-sm text-muted-foreground">
                                {action.target_user_name && (
                                  <span>Usuário: <strong>{action.target_user_name}</strong></span>
                                )}
                                {action.details && action.action_type === 'update_role' && (
                                  <span className="ml-2">
                                    ({action.details.old_role} → {action.details.new_role})
                                  </span>
                                )}
                                {action.details && action.action_type === 'update_sector' && (
                                  <span className="ml-2">
                                    ({action.details.old_sector || 'nenhum'} → {action.details.new_sector || 'nenhum'})
                                  </span>
                                )}
                                {action.details && action.action_type === 'create_employee' && (
                                  <span className="ml-2">
                                    (Setor: {action.details.sector})
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="text-right text-sm text-muted-foreground flex items-center gap-2">
                            <div>
                              <p>{format(new Date(action.created_at), 'HH:mm')}</p>
                              <p>{action.profiles?.full_name || 'Usuário'}</p>
                            </div>
                            {action.profiles?.avatar_url && (
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={action.profiles.avatar_url} />
                                <AvatarFallback>{getInitials(action.profiles.full_name || '')}</AvatarFallback>
                              </Avatar>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          ) : (
            // For Funcionário: Show only movements (no tabs)
            <>
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
                <ReportMovementList movements={movements} />
              )}
            </>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
