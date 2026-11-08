export class AppError extends Error {
  constructor(
    public readonly code: string,
    public readonly statusCode: number,
    message: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Chưa xác thực danh tính (UNAUTHENTICATED)", details?: unknown) {
    super("UNAUTHENTICATED", 401, message, details);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Không có quyền thực hiện hành động này (FORBIDDEN)", details?: unknown) {
    super("FORBIDDEN", 403, message, details);
    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Không tìm thấy tài nguyên yêu cầu (NOT_FOUND)", details?: unknown) {
    super("NOT_FOUND", 404, message, details);
    this.name = "NotFoundError";
  }
}

export class ValidationError extends AppError {
  constructor(message = "Dữ liệu yêu cầu không hợp lệ (VALIDATION)", details?: unknown) {
    super("VALIDATION", 400, message, details);
    this.name = "ValidationError";
  }
}
