import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import type { BalanceWheelPoint } from '../../lib/chartData';

interface BalanceWheelChartProps {
  data: BalanceWheelPoint[];
  hasScores: boolean;
}

export default function BalanceWheelChart({ data, hasScores }: BalanceWheelChartProps) {
  if (!hasScores) {
    return (
      <div className="flex h-72 items-center justify-center rounded-md border border-border bg-muted/50 px-4 text-center text-body text-text-secondary">
        Complete a few daily entries to reveal the balance wheel.
      </div>
    );
  }

  return (
    <div className="h-72 w-full rounded-md bg-surface sm:h-80">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} outerRadius="68%">
          <PolarGrid stroke="var(--border)" />
          <PolarAngleAxis
            dataKey="category"
            tick={{ fontSize: 10, fill: 'var(--text-secondary)' }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={false}
            axisLine={false}
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
          <Radar
            dataKey="score"
            stroke="var(--accent-primary)"
            fill="var(--accent-primary)"
            fillOpacity={0.18}
            strokeWidth={2}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
