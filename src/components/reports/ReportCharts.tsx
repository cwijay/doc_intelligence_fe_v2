'use client';

import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import { ChartData } from '@/types/reports';
import { formatCurrency } from '@/lib/api/reports';

// Color palette for charts
const COLORS = [
  '#3B82F6', // blue-500
  '#10B981', // emerald-500
  '#F59E0B', // amber-500
  '#EF4444', // red-500
  '#8B5CF6', // violet-500
  '#EC4899', // pink-500
  '#06B6D4', // cyan-500
  '#84CC16', // lime-500
];

interface ReportChartsProps {
  charts: ChartData[];
  currencySymbol?: string;
}

export function ReportCharts({ charts, currencySymbol = '$' }: ReportChartsProps) {
  if (!charts || charts.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {charts.map((chart, index) => (
        <ChartCard key={index} chart={chart} currencySymbol={currencySymbol} />
      ))}
    </div>
  );
}

interface ChartCardProps {
  chart: ChartData;
  currencySymbol: string;
}

function ChartCard({ chart, currencySymbol }: ChartCardProps) {
  return (
    <div className="bg-white dark:bg-secondary-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-secondary-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        {chart.title}
      </h3>
      <div className="h-[300px]">
        {chart.chart_type === 'pie' && (
          <PieChartComponent data={chart.data} currencySymbol={currencySymbol} />
        )}
        {chart.chart_type === 'bar' && (
          <BarChartComponent data={chart.data} currencySymbol={currencySymbol} />
        )}
        {chart.chart_type === 'line' && (
          <LineChartComponent data={chart.data} currencySymbol={currencySymbol} />
        )}
        {chart.chart_type === 'area' && (
          <AreaChartComponent data={chart.data} currencySymbol={currencySymbol} />
        )}
      </div>
    </div>
  );
}

interface ChartComponentProps {
  data: Record<string, unknown>;
  currencySymbol: string;
}

function PieChartComponent({ data, currencySymbol }: ChartComponentProps) {
  const items = (data.items as Array<{ name: string; value: number; percentage: number }>) || [];

  if (items.length === 0) {
    return <NoDataMessage />;
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-white dark:bg-secondary-700 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-secondary-600">
          <p className="font-medium text-gray-900 dark:text-white">{item.name}</p>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {formatCurrency(item.value, currencySymbol)}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {item.percentage}%
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={items}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={2}
          dataKey="value"
          label={({ name, percentage }) =>
            percentage > 5 ? `${percentage}%` : ''
          }
          labelLine={false}
        >
          {items.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          layout="vertical"
          align="right"
          verticalAlign="middle"
          formatter={(value: string) => (
            <span className="text-sm text-gray-600 dark:text-gray-300">{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

function BarChartComponent({ data, currencySymbol }: ChartComponentProps) {
  const items = (data.items as Array<{ name: string; value: number }>) || [];

  if (items.length === 0) {
    return <NoDataMessage />;
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-secondary-700 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-secondary-600">
          <p className="font-medium text-gray-900 dark:text-white">{label}</p>
          <p className="text-sm text-primary-600 dark:text-primary-400">
            {formatCurrency(payload[0].value, currencySymbol)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={items}
        layout="vertical"
        margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
        <XAxis
          type="number"
          tickFormatter={(value) => formatCurrency(value, currencySymbol)}
          tick={{ fontSize: 12 }}
        />
        <YAxis
          type="category"
          dataKey="name"
          width={90}
          tick={{ fontSize: 11 }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="value" fill="#3B82F6" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function LineChartComponent({ data, currencySymbol }: ChartComponentProps) {
  const items = (data.items as Array<{ name: string; value: number; change?: number }>) || [];

  if (items.length === 0) {
    return <NoDataMessage />;
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-white dark:bg-secondary-700 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-secondary-600">
          <p className="font-medium text-gray-900 dark:text-white">{label}</p>
          <p className="text-sm text-primary-600 dark:text-primary-400">
            {formatCurrency(payload[0].value, currencySymbol)}
          </p>
          {item.change !== undefined && (
            <p
              className={`text-sm ${
                item.change >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {item.change >= 0 ? '+' : ''}
              {item.change}% from previous
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={items}
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11 }}
          angle={items.length > 6 ? -45 : 0}
          textAnchor={items.length > 6 ? 'end' : 'middle'}
          height={items.length > 6 ? 60 : 30}
        />
        <YAxis
          tickFormatter={(value) => formatCurrency(value, currencySymbol)}
          tick={{ fontSize: 12 }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Line
          type="monotone"
          dataKey="value"
          stroke="#3B82F6"
          strokeWidth={2}
          dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

function AreaChartComponent({ data, currencySymbol }: ChartComponentProps) {
  const items = (data.items as Array<{ name: string; value: number }>) || [];

  if (items.length === 0) {
    return <NoDataMessage />;
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart
        data={items}
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
        <YAxis
          tickFormatter={(value) => formatCurrency(value, currencySymbol)}
          tick={{ fontSize: 12 }}
        />
        <Tooltip
          formatter={(value: number) => [
            formatCurrency(value, currencySymbol),
            'Amount',
          ]}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke="#3B82F6"
          fill="#3B82F6"
          fillOpacity={0.2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function NoDataMessage() {
  return (
    <div className="flex items-center justify-center h-full">
      <p className="text-gray-500 dark:text-gray-400">No data available</p>
    </div>
  );
}

export default ReportCharts;
