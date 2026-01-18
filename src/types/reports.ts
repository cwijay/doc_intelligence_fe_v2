/**
 * Type definitions for Business Intelligence Reports
 */

// Report types
export type ReportType =
  | 'expense_summary'
  | 'vendor_analysis'
  | 'invoice_reconciliation'
  | 'spend_trends'
  | 'cash_flow_projection'
  | 'tax_preparation';

export type ReportStatus =
  | 'pending'
  | 'extracting'
  | 'aggregating'
  | 'analyzing'
  | 'generating'
  | 'completed'
  | 'failed';

export type OutputFormat = 'pdf' | 'excel' | 'json' | 'markdown';

// Date range
export interface DateRange {
  start: string; // ISO date string
  end: string;
}

// Report options
export interface ReportOptions {
  include_charts: boolean;
  include_raw_data: boolean;
  include_recommendations: boolean;
  output_format: OutputFormat;
  additional_formats: OutputFormat[];
  chart_types: string[];
  max_insights: number;
  currency_symbol: string;
  locale: string;
}

// Insight from AI analysis
export interface Insight {
  category: string;
  title: string;
  description: string;
  severity?: 'info' | 'warning' | 'critical';
  data_points?: Record<string, unknown>;
}

// Chart data
export interface ChartData {
  chart_type: 'pie' | 'bar' | 'line' | 'area';
  title: string;
  data: Record<string, unknown>;
  gcs_path?: string;
}

// Report summary
export interface ReportSummary {
  total_amount: number;
  document_count: number;
  record_count: number;
  vendor_count: number;
  category_count: number;
  date_range: DateRange;
  top_category?: string;
  top_vendor?: string;
  avg_transaction_amount?: number;
}

// Category breakdown
export interface CategoryBreakdown {
  category: string;
  amount: number;
  percentage: number;
  count: number;
}

// Vendor breakdown
export interface VendorBreakdown {
  vendor: string;
  amount: number;
  percentage: number;
  invoice_count: number;
  avg_amount: number;
}

// Monthly trend
export interface MonthlyTrend {
  month: string;
  amount: number;
  count: number;
  change_percentage?: number;
}

// Report info (list view)
export interface ReportInfo {
  id: string;
  organization_id: string;
  folder_id: string;
  report_type: ReportType;
  status: ReportStatus;
  document_count: number;
  extracted_record_count: number;
  created_at: string;
  completed_at?: string;
  processing_time_ms?: number;
  error_message?: string;
}

// Full report detail
export interface Report extends ReportInfo {
  date_range: DateRange;
  options: ReportOptions;
  summary?: ReportSummary;
  insights: Insight[];
  charts: ChartData[];
  pdf_path?: string;
  excel_path?: string;
  json_path?: string;
}

// API Request types
export interface CreateReportRequest {
  folder_id: string;
  report_type: ReportType;
  date_range_start?: string;
  date_range_end?: string;
  include_charts?: boolean;
  include_recommendations?: boolean;
  output_format?: OutputFormat;
  additional_formats?: OutputFormat[];
  max_insights?: number;
  currency_symbol?: string;
}

export interface QuickAnalyzeRequest {
  folder_id: string;
  analysis_type?: 'summary' | 'trends' | 'anomalies' | 'top_vendors' | 'top_categories';
  date_range_start?: string;
  date_range_end?: string;
  limit?: number;
}

export interface DashboardDataRequest {
  folder_id: string;
  report_type?: ReportType;
  date_range_start?: string;
  date_range_end?: string;
}

// API Response types
export interface CreateReportResponse {
  success: boolean;
  report_id: string;
  status: ReportStatus;
  message: string;
  estimated_time_seconds?: number;
}

export interface ReportDetailResponse {
  success: boolean;
  report: ReportInfo;
  summary?: ReportSummary;
  insights: Insight[];
  charts: ChartData[];
  pdf_path?: string;
  excel_path?: string;
  json_path?: string;
  progress_percentage?: number;
}

export interface ListReportsResponse {
  success: boolean;
  reports: ReportInfo[];
  total: number;
  limit: number;
  offset: number;
}

export interface DownloadReportResponse {
  success: boolean;
  download_url: string;
  format: string;
  expires_in_seconds: number;
}

export interface QuickAnalyzeResponse {
  success: boolean;
  analysis_type: string;
  results: Record<string, unknown>;
  insights: Insight[];
  processing_time_ms: number;
}

// Dashboard types
export interface DashboardMetric {
  id: string;
  label: string;
  value: number | string;
  format: 'currency' | 'number' | 'percent' | 'text';
  currency?: string;
  icon?: string;
}

export interface DashboardChart {
  chart_type: string;
  title: string;
  data: {
    labels?: string[];
    values?: number[];
    percentages?: number[];
    counts?: number[];
    items?: Array<Record<string, unknown>>;
  };
}

export interface DashboardTable {
  id: string;
  title: string;
  columns: Array<{
    key: string;
    label: string;
    type: string;
    currency?: string;
  }>;
  rows: Array<Record<string, unknown>>;
}

export interface DashboardDataResponse {
  success: boolean;
  summary_metrics: DashboardMetric[];
  charts: DashboardChart[];
  tables: DashboardTable[];
  insights: Insight[];
  generated_at: string;
}

export interface ReportStatisticsResponse {
  success: boolean;
  statistics: {
    total_reports: number;
    completed_reports: number;
    failed_reports: number;
    pending_reports: number;
    total_documents_processed: number;
    total_records_analyzed: number;
    avg_processing_time_ms?: number;
  };
}

// UI-specific types
export interface ReportTypeOption {
  value: ReportType;
  label: string;
  description: string;
  icon: string;
  estimatedTime: number; // seconds
}

export const REPORT_TYPE_OPTIONS: ReportTypeOption[] = [
  {
    value: 'expense_summary',
    label: 'Expense Summary',
    description: 'Analyze expenses by category, vendor, and time period',
    icon: 'receipt',
    estimatedTime: 30,
  },
  {
    value: 'vendor_analysis',
    label: 'Vendor Analysis',
    description: 'Vendor rankings, concentration metrics, and spend analysis',
    icon: 'building',
    estimatedTime: 25,
  },
  {
    value: 'invoice_reconciliation',
    label: 'Invoice Reconciliation',
    description: 'Match invoices with purchase orders, identify discrepancies',
    icon: 'document-check',
    estimatedTime: 45,
  },
  {
    value: 'spend_trends',
    label: 'Spending Trends',
    description: 'Historical spending patterns and forecasts',
    icon: 'chart-line',
    estimatedTime: 20,
  },
  {
    value: 'cash_flow_projection',
    label: 'Cash Flow Projection',
    description: 'Project cash flow based on accounts receivable and payable',
    icon: 'currency-dollar',
    estimatedTime: 35,
  },
  {
    value: 'tax_preparation',
    label: 'Tax Preparation',
    description: 'Categorize expenses for tax reporting and deductions',
    icon: 'calculator',
    estimatedTime: 40,
  },
];

// Status display mapping
export const REPORT_STATUS_CONFIG: Record<ReportStatus, { label: string; color: string; bgColor: string }> = {
  pending: { label: 'Pending', color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
  extracting: { label: 'Extracting Data', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  aggregating: { label: 'Aggregating', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  analyzing: { label: 'Analyzing', color: 'text-purple-600', bgColor: 'bg-purple-100' },
  generating: { label: 'Generating Report', color: 'text-indigo-600', bgColor: 'bg-indigo-100' },
  completed: { label: 'Completed', color: 'text-green-600', bgColor: 'bg-green-100' },
  failed: { label: 'Failed', color: 'text-red-600', bgColor: 'bg-red-100' },
};
