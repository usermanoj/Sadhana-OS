import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { CircleDot } from 'lucide-react';
import type { BalanceWheelPoint } from '../../lib/chartData';
import { EmptyDataPanel } from '../ui/StateFeedback';

interface BalanceWheelChartProps {
  data: BalanceWheelPoint[];
  hasScores: boolean;
}

export default function BalanceWheelChart({ data, hasScores }: BalanceWheelChartProps) {
  if (!hasScores) {
    return (
      <EmptyDataPanel
        icon={CircleDot}
        title="Balance wheel is waiting"
        className="flex h-80 flex-col justify-center lg:h-[380px] 2xl:h-[440px]"
      >
        Complete a few daily entries to reveal category balance.
      </EmptyDataPanel>
    );
  }

  return (
    <div className="h-80 w-full rounded-lg bg-surface lg:h-[380px] 2xl:h-[440px]">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} outerRadius="68%">
          <PolarGrid stroke="var(--border)" strokeOpacity={0.8} />
          <PolarAngleAxis
            dataKey="category"
            tick={{ fontSize: 12, fill: 'var(--text-secondary)', fontWeight: 500 }}
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
              borderRadius: '8px',
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-card)',
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
