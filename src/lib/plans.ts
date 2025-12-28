import { PlanType } from '@/types/api';

export interface PlanLimit {
  monthlyTokens: string;
  llamaParsePages: string;
  fileSearchQueries: string;
  storage: string;
  requestsPerMinute: string;
  requestsPerDay: string;
  maxFileSize: string;
  concurrentJobs: string;
}

export interface PlanFeature {
  name: string;
  free: boolean;
  pro: boolean;
  enterprise: boolean;
}

export interface PlanInfo {
  id: PlanType;
  name: string;
  description: string;
  monthlyPrice: number;
  annualPrice: number;
  limits: PlanLimit;
  highlighted?: boolean;
  keyFeatures: string[];
}

export const PLANS: PlanInfo[] = [
  {
    id: 'free',
    name: 'Free',
    description: 'Perfect for trying out biz2Bricks.ai',
    monthlyPrice: 0,
    annualPrice: 0,
    limits: {
      monthlyTokens: '50,000',
      llamaParsePages: '50',
      fileSearchQueries: '100',
      storage: '1 GB',
      requestsPerMinute: '10',
      requestsPerDay: '1,000',
      maxFileSize: '25 MB',
      concurrentJobs: '2',
    },
    keyFeatures: ['50K tokens/month', '1 GB storage', 'Basic support'],
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'For growing teams and businesses',
    monthlyPrice: 29,
    annualPrice: 290,
    highlighted: true,
    limits: {
      monthlyTokens: '500,000',
      llamaParsePages: '500',
      fileSearchQueries: '1,000',
      storage: '10 GB',
      requestsPerMinute: '60',
      requestsPerDay: '10,000',
      maxFileSize: '100 MB',
      concurrentJobs: '10',
    },
    keyFeatures: ['500K tokens/month', '10 GB storage', 'Priority support'],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For large organizations with advanced needs',
    monthlyPrice: 199,
    annualPrice: 1990,
    limits: {
      monthlyTokens: '5,000,000',
      llamaParsePages: '5,000',
      fileSearchQueries: '10,000',
      storage: '100 GB',
      requestsPerMinute: '300',
      requestsPerDay: '100,000',
      maxFileSize: '500 MB',
      concurrentJobs: '50',
    },
    keyFeatures: ['5M tokens/month', '100 GB storage', 'Dedicated support'],
  },
];

export const PLAN_FEATURES: PlanFeature[] = [
  { name: 'Document Agent', free: true, pro: true, enterprise: true },
  { name: 'Sheets Agent', free: true, pro: true, enterprise: true },
  { name: 'RAG Search', free: true, pro: true, enterprise: true },
  { name: 'API Access', free: true, pro: true, enterprise: true },
  { name: 'Custom Models', free: false, pro: true, enterprise: true },
  { name: 'Priority Support', free: false, pro: true, enterprise: true },
  { name: 'Advanced Analytics', free: false, pro: true, enterprise: true },
  { name: 'Team Management', free: false, pro: true, enterprise: true },
  { name: 'SSO', free: false, pro: false, enterprise: true },
  { name: 'Audit Logs', free: false, pro: false, enterprise: true },
  { name: 'Custom Integrations', free: false, pro: false, enterprise: true },
  { name: 'Dedicated Support', free: false, pro: false, enterprise: true },
];

export const PLAN_LIMITS_LABELS: Record<keyof PlanLimit, string> = {
  monthlyTokens: 'Monthly Tokens',
  llamaParsePages: 'LlamaParse Pages',
  fileSearchQueries: 'File Search Queries',
  storage: 'Storage',
  requestsPerMinute: 'Requests/Minute',
  requestsPerDay: 'Requests/Day',
  maxFileSize: 'Max File Size',
  concurrentJobs: 'Concurrent Jobs',
};

export const getPlanById = (id: PlanType): PlanInfo | undefined => {
  return PLANS.find(plan => plan.id === id);
};
