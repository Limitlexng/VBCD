export interface IRevenueMetric {
  date: string;
  totalRevenue: number;
  transactionFees: number;
  spreadRevenue: number;
  billRevenue: number;
  cryptoRevenue: number;
}

export interface ITransactionMetric {
  date: string;
  total: number;
  successful: number;
  failed: number;
  pending: number;
  volume: number;
  successRate: number;
}

export interface IUserMetric {
  date: string;
  newUsers: number;
  activeUsers: number;
  verifiedUsers: number;
  kycCompleted: number;
  churnRate: number;
}

export interface IProviderMetricSummary {
  providerId: string;
  providerName: string;
  successRate: number;
  avgResponseTime: number;
  totalTransactions: number;
  volume: number;
  uptime: number;
}

export interface IDashboardSummary {
  totalUsers: number;
  activeUsers24h: number;
  totalTransactions24h: number;
  successRate24h: number;
  totalRevenue24h: number;
  totalVolume24h: number;
  pendingKyc: number;
  openTickets: number;
  walletBalance: number;
  failedTransactions24h: number;
}
