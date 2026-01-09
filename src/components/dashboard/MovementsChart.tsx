import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useWeeklyMovements } from '@/hooks/useWeeklyMovements';
import { Skeleton } from '@/components/ui/skeleton';

export function MovementsChart() {
  const { data: weeklyData = [], isLoading } = useWeeklyMovements();

  if (isLoading) {
    return <Skeleton className="h-[300px] w-full" />;
  }

  return (
    <div className="glass rounded-xl lg:rounded-2xl p-4 lg:p-6">
      <h2 className="text-lg lg:text-xl font-display font-semibold mb-4">
        Movimentações dos Últimos 7 Dias
      </h2>
      
      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={weeklyData}
            margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            <XAxis 
              dataKey="dateLabel" 
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
            />
            <YAxis 
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                color: 'hsl(var(--foreground))',
              }}
              labelStyle={{ color: 'hsl(var(--foreground))' }}
              formatter={(value: number, name: string) => [
                value,
                name === 'entradas' ? 'Entradas' : 'Saídas'
              ]}
            />
            <Legend 
              formatter={(value) => value === 'entradas' ? 'Entradas' : 'Saídas'}
              wrapperStyle={{ paddingTop: '10px' }}
            />
            <Bar 
              dataKey="entradas" 
              fill="hsl(var(--success))" 
              radius={[4, 4, 0, 0]}
              name="entradas"
            />
            <Bar 
              dataKey="saidas" 
              fill="hsl(var(--destructive))" 
              radius={[4, 4, 0, 0]}
              name="saidas"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
