'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { UsageBreakdownItem } from '@/types/usage';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4'];

interface UsageBreakdownChartProps {
  data: UsageBreakdownItem[];
  height?: number;
}

export function UsageBreakdownChart({ data, height = 280 }: UsageBreakdownChartProps) {
  // Custom tooltip
  const CustomTooltip = ({
    active,
    payload,
  }: {
    active?: boolean;
    payload?: Array<{ payload: UsageBreakdownItem }>;
  }) => {
    if (!active || !payload || payload.length === 0) return null;

    const item = payload[0].payload;
    return (
      <div className="bg-white dark:bg-secondary-800 p-3 rounded-lg shadow-lg border border-secondary-200 dark:border-secondary-700">
        <p className="text-sm font-medium text-secondary-900 dark:text-secondary-100 mb-1">
          {item.name}
        </p>
        <p className="text-sm text-secondary-600 dark:text-secondary-400">
          Tokens: {item.tokens_used.toLocaleString()}
        </p>
        <p className="text-sm text-secondary-600 dark:text-secondary-400">
          Usage: {item.percentage.toFixed(1)}%
        </p>
        <p className="text-sm text-secondary-600 dark:text-secondary-400">
          Cost: ${item.cost_usd.toFixed(2)}
        </p>
      </div>
    );
  };

  // Custom label
  const renderCustomLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
  }: {
    cx: number;
    cy: number;
    midAngle: number;
    innerRadius: number;
    outerRadius: number;
    percent: number;
  }) => {
    // Only show label if percentage is > 5%
    if (percent < 0.05) return null;

    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor="middle"
        dominantBaseline="central"
        className="text-xs font-medium"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  // Custom legend
  const renderLegend = (props: { payload?: Array<{ value: string; color: string }> }) => {
    const { payload } = props;
    if (!payload) return null;

    return (
      <ul className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-2">
        {payload.map((entry, index) => (
          <li key={index} className="flex items-center text-xs">
            <span
              className="w-2.5 h-2.5 rounded-full mr-1.5"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-secondary-600 dark:text-secondary-400">{entry.value}</span>
          </li>
        ))}
      </ul>
    );
  };

  if (!data || data.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-secondary-500 dark:text-secondary-400"
        style={{ height }}
      >
        No breakdown data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="45%"
          labelLine={false}
          label={renderCustomLabel}
          outerRadius={80}
          innerRadius={40}
          dataKey="tokens_used"
          nameKey="name"
          paddingAngle={2}
        >
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend content={renderLegend} />
      </PieChart>
    </ResponsiveContainer>
  );
}
