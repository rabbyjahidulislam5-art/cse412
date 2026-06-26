import { Response } from 'express';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string; details?: unknown };
  meta?: { page?: number; limit?: number; total?: number; totalPages?: number };
}

export function success<T>(res: Response, data: T, statusCode = 200, meta?: ApiResponse['meta']) {
  const response: ApiResponse<T> = { success: true, data, meta };
  return res.status(statusCode).json(response);
}

export function error(res: Response, code: string, message: string, statusCode = 400, details?: unknown) {
  const response: ApiResponse = { success: false, error: { code, message, details } };
  return res.status(statusCode).json(response);
}

export function paginated<T>(res: Response, data: T[], page: number, limit: number, total: number) {
  const response: ApiResponse<T[]> = {
    success: true,
    data,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
  return res.status(200).json(response);
}
