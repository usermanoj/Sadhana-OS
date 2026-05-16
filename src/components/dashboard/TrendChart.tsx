import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { hasChartScores, type ChartPoint } from '../../lib/chartData';

interface TrendChartProps {
  data: ChartPoint[];
  color?: string;
}

export default function TrendChart({ data, color = '#7C3AED' }: TrendChartProps) {
  if (!data || data.length === 0 || !hasChartScores(data)) {
    return (
      <div className="flex h-80 items-center justify-center rounded-md border border-border bg-muted/50 px-4 text-center text-body text-text-secondary lg:h-[360px] 2xl:h-[420px]">
        No entries in this range
      </div>
    );
  }

  return (
    <div className="h-80 w-full rounded-md bg-surface lg:h-[360px] 2xl:h-[420px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
          <XAxis 
            dataKey="date" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 14, fill: 'var(--text-secondary)' }} 
            dy={10}
          />
          <YAxis 
            domain={[0, 100]} 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 14, fill: 'var(--text-secondary)' }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'var(--bg-surface)', 
              borderRadius: '12px',
              border: '1px solid var(--border)',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
            }}
            itemStyle={{ color: 'var(--text-primary)', fontWeight: 'bold' }}
            labelStyle={{ color: 'var(--text-secondary)', marginBottom: '4px' }}
            formatter={(value: number) => [`${Math.round(value)}%`, 'Score']}
          />
          <Line
            type="monotone" 
            dataKey="score" 
            stroke={color} 
            strokeWidth={3}
            connectNulls={false}
            dot={{ r: 3, strokeWidth: 0, fill: color }}
            activeDot={{ r: 6, strokeWidth: 0, fill: color }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
