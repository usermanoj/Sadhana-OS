import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { BarChart3 } from 'lucide-react';
import type { CategoryBarPoint } from '../../lib/chartData';
import { EmptyDataPanel } from '../ui/StateFeedback';

interface CategoryBarChartProps {
  data: CategoryBarPoint[];
}

export default function CategoryBarChart({ data }: CategoryBarChartProps) {
  if (data.length === 0) {
    return (
      <EmptyDataPanel
        icon={BarChart3}
        title="No category comparison yet"
        className="flex h-64 flex-col justify-center"
      >
        Add daily entries to compare category scores.
      </EmptyDataPanel>
    );
  }

  return (
    <div className="w-full rounded-lg bg-surface" style={{ height: Math.max(360, data.length * 52) }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 12, right: 22, left: 4, bottom: 12 }}
          barCategoryGap={16}
        >
          <CartesianGrid strokeDasharray="4 6" horizontal={false} stroke="var(--border)" strokeOpacity={0.72} />
          <XAxis
            type="number"
            domain={[0, 100]}
            tickFormatter={(value) => `${value}%`}
            tick={{ fontSize: 12, fill: 'var(--text-secondary)' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="shortName"
            width={150}
            tick={{ fontSize: 12, fill: 'var(--text-secondary)', fontWeight: 500 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--bg-surface)',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-card)',
            }}
            formatter={(value) => [`${Math.round(Number(value))}%`, 'Average']}
          />
          <Bar dataKey="score" radius={[0, 8, 8, 0]} barSize={20}>
            {data.map((point) => (
              <Cell key={point.categoryId} fill={point.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
