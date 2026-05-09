export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  errors?: Record<string, string[]>;
  meta?: PaginationMeta;
  timestamp: string;
  requestId?: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  search?: string;
}

export type ApiError = {
  statusCode: number;
  message: string;
  error: string;
  timestamp: string;
  path: string;
};

export interface WebhookPayload {
  event: string;
  data: Record<string, unknown>;
  timestamp: string;
  provider: string;
  signature?: string;
}
