'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { UsageHistoryItem } from '@/types/usage';
import { format, parseISO } from 'date-fns';

type MetricKey = 'tokens' | 'pages' | 'queries' | 'cost';

interface MetricConfig {
  key: string;
  name: string;
  color: string;
  formatter: (value: number) => string;
}

const METRIC_CONFIG: Record<MetricKey, MetricConfig> = {
  tokens: {
    key: 'tokens_used',
    name: 'Tokens',
    color: '#3B82F6',
    formatter: (v: number) => v.toLocaleString(),
  },
  pages: {
    key: 'llamaparse_pages',
    name: 'Parse Pages',
    color: '#10B981',
    formatter: (v: number) => v.toString(),
  },
  queries: {
    key: 'file_search_queries',
    name: 'Search Queries',
    color: '#8B5CF6',
    formatter: (v: number) => v.toString(),
  },
  cost: {
    key: 'cost_usd',
    name: 'Cost ($)',
    color: '#F59E0B',
    formatter: (v: number) => `$${v.toFixed(2)}`,
  },
};

interface UsageTrendsChartProps {
  data: UsageHistoryItem[];
  selectedMetrics?: MetricKey[];
  height?: number;
}

export function UsageTrendsChart({
  data,
  selectedMetrics = ['tokens', 'cost'],
  height = 300,
}: UsageTrendsChartProps) {
  // Format data for display
  const formattedData = data.map((item) => ({
    ...item,
    dateFormatted: format(parseISO(item.date), 'MMM d'),
  }));

  // Custom tooltip content
  const CustomTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean;
    payload?: Array<{ name: string; value: number; color: string; dataKey: string }>;
    label?: string;
  }) => {
    if (!active || !payload || payload.length === 0) return null;

    return (
      <div className="bg-white dark:bg-secondary-800 p-3 rounded-lg shadow-lg border border-secondary-200 dark:border-secondary-700">
        <p className="text-sm font-medium text-secondary-900 dark:text-secondary-100 mb-2">
          {label}
        </p>
        {payload.map((entry, index) => {
          const metricKey = Object.keys(METRIC_CONFIG).find(
            (key) => METRIC_CONFIG[key as MetricKey].key === entry.dataKey
          ) as MetricKey | undefined;
          const config = metricKey ? METRIC_CONFIG[metricKey] : null;

          return (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {config ? config.formatter(entry.value) : entry.value}
            </p>
          );
        })}
      </div>
    );
  };

  if (formattedData.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-secondary-500 dark:text-secondary-400"
        style={{ height }}
      >
        No usage data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={formattedData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid
          strokeDasharray="3 3"
          className="stroke-secondary-200 dark:stroke-secondary-700"
        />
        <XAxis
          dataKey="dateFormatted"
          tick={{ fontSize: 12 }}
          className="text-secondary-600 dark:text-secondary-400"
        />
        <YAxis tick={{ fontSize: 12 }} className="text-secondary-600 dark:text-secondary-400" />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: '12px' }}
          iconType="circle"
          iconSize={8}
        />
        {selectedMetrics.map((metric) => (
          <Line
            key={metric}
            type="monotone"
            dataKey={METRIC_CONFIG[metric].key}
            name={METRIC_CONFIG[metric].name}
            stroke={METRIC_CONFIG[metric].color}
            strokeWidth={2}
            dot={{ r: 3, fill: METRIC_CONFIG[metric].color }}
            activeDot={{ r: 5 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
