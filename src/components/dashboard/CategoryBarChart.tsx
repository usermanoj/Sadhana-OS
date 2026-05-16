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
import type { CategoryBarPoint } from '../../lib/chartData';

interface CategoryBarChartProps {
  data: CategoryBarPoint[];
}

export default function CategoryBarChart({ data }: CategoryBarChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-md border border-border bg-muted/50 px-4 text-center text-body text-text-secondary">
        Add daily entries to compare category scores.
      </div>
    );
  }

  return (
    <div className="w-full rounded-md bg-surface" style={{ height: Math.max(360, data.length * 52) }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 12, right: 24, left: 8, bottom: 12 }}
          barCategoryGap={16}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
          <XAxis
            type="number"
            domain={[0, 100]}
            tickFormatter={(value) => `${value}%`}
            tick={{ fontSize: 13, fill: 'var(--text-secondary)' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="shortName"
            width={150}
            tick={{ fontSize: 13, fill: 'var(--text-secondary)' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--bg-surface)',
              borderRadius: '12px',
              border: '1px solid var(--border)',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
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
