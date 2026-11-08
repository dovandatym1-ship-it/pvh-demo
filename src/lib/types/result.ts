/**
 * Standard Result Envelope per ADR-002 §9.1 and PROJECT.md Interface Contract §2
 */

export type ErrorCode =
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION"
  | "VERSION_CONFLICT"
  | "DUPLICATE_REQUEST"
  | "INVALID_TRANSITION"
  | "INTERNAL";

export interface ErrorDetails {
  readonly code: ErrorCode;
  readonly message: string;
  readonly details?: unknown;
}

export type Result<T> =
  | { readonly ok: true; readonly data: T }
  | { readonly ok: false; readonly error: ErrorDetails };

export function ok<T>(data: T): Result<T> {
  return { ok: true, data };
}

export function fail<T = never>(code: ErrorCode, message: string, details?: unknown): Result<T> {
  return { ok: false, error: { code, message, details } };
}
