// lib/utils/error-handler.ts
// Centralized error handling utility for Assessify

import { toast } from "sonner";

/**
 * Standard error response type
 */
export interface ErrorResponse {
  error: string;
  details?: string;
  code?: string;
}

/**
 * Standard success response type
 */
export interface SuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
}

/**
 * Action result type - either success or error
 */
export type ActionResult<T = any> = SuccessResponse<T> | ErrorResponse;

/**
 * Check if response is an error
 */
export function isError(response: unknown): response is ErrorResponse {
  return !!(response && typeof response === 'object' && 'error' in response && typeof (response as Record<string, unknown>).error === 'string');
}

/**
 * Handle server action errors consistently
 */
export function handleActionError(error: unknown): ErrorResponse {
  console.error('Action error:', error);

  // Handle Supabase errors
  if (error && typeof error === 'object' && 'message' in error) {
    const supabaseError = error as { message: string; code?: string };
    return {
      error: supabaseError.message || 'An unexpected error occurred',
      code: supabaseError.code,
    };
  }

  // Handle standard Error objects
  if (error instanceof Error) {
    return {
      error: error.message || 'An unexpected error occurred',
    };
  }

  // Handle string errors
  if (typeof error === 'string') {
    return {
      error,
    };
  }

  // Fallback for unknown errors
  return {
    error: 'An unexpected error occurred. Please try again.',
  };
}

/**
 * Show error toast notification
 */
export function showErrorToast(error: ErrorResponse | string) {
  const message = typeof error === 'string' ? error : error.error;
  toast.error(message);
}

/**
 * Show success toast notification
 */
export function showSuccessToast(message: string) {
  toast.success(message);
}

/**
 * Wrapper for server actions to handle errors consistently
 */
export async function withErrorHandling<T>(
  action: () => Promise<T>,
  errorMessage?: string
): Promise<ActionResult<T>> {
  try {
    const data = await action();
    return {
      success: true,
      data,
    };
  } catch (error) {
    const errorResponse = handleActionError(error);
    return {
      ...errorResponse,
      error: errorMessage || errorResponse.error,
    };
  }
}

/**
 * Type guard to check if value is defined
 */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * Safe JSON parse with error handling
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    console.error('Failed to parse JSON:', json);
    return fallback;
  }
}

/**
 * Format error for user display
 */
export function formatErrorMessage(error: unknown): string {
  if (isError(error)) {
    return error.error;
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return 'An unexpected error occurred';
}

/**
 * Validate required fields
 */
export function validateRequired<T extends Record<string, any>>(
  data: T,
  fields: (keyof T)[]
): ErrorResponse | null {
  const missing = fields.filter(field => {
    const value = data[field];
    return value === null || value === undefined || value === '';
  });

  if (missing.length > 0) {
    return {
      error: `Missing required fields: ${missing.join(', ')}`,
      code: 'VALIDATION_ERROR',
    };
  }

  return null;
}

/**
 * Create success response
 */
export function createSuccess<T>(data: T, message?: string): SuccessResponse<T> {
  return {
    success: true,
    data,
    message,
  };
}

/**
 * Create error response
 */
export function createError(error: string, details?: string, code?: string): ErrorResponse {
  return {
    error,
    details,
    code,
  };
}