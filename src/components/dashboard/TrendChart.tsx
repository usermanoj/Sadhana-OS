import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Activity } from 'lucide-react';
import { hasChartScores, type ChartPoint } from '../../lib/chartData';
import { EmptyDataPanel } from '../ui/StateFeedback';

interface TrendChartProps {
  data: ChartPoint[];
  color?: string;
}

export default function TrendChart({ data, color = '#7C3AED' }: TrendChartProps) {
  if (!data || data.length === 0 || !hasChartScores(data)) {
    return (
      <EmptyDataPanel
        icon={Activity}
        title="No entries in this range"
        className="flex h-80 flex-col justify-center lg:h-[360px] 2xl:h-[420px]"
      >
        Track a few days to reveal the score trend.
      </EmptyDataPanel>
    );
  }

  return (
    <div className="h-80 w-full rounded-lg bg-surface lg:h-[360px] 2xl:h-[420px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 16, right: 16, left: -12, bottom: 8 }}>
          <CartesianGrid strokeDasharray="4 6" vertical={false} stroke="var(--border)" strokeOpacity={0.72} />
          <XAxis 
            dataKey="date" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 13, fill: 'var(--text-secondary)' }}
            dy={10}
          />
          <YAxis 
            domain={[0, 100]} 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 13, fill: 'var(--text-secondary)' }}
            width={42}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'var(--bg-surface)', 
              borderRadius: '8px',
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-card)',
            }}
            itemStyle={{ color: 'var(--text-primary)', fontWeight: 600 }}
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
