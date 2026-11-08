export class AppError extends Error {
  public statusCode: number;
  public code: string;

  constructor(message: string, statusCode = 400, code = "BAD_REQUEST") {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Không có quyền truy cập hoặc phiên làm việc đã hết hạn.") {
    super(message, 401, "UNAUTHORIZED");
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Hành động bị từ chối do không đủ thẩm quyền nghiệp vụ.") {
    super(message, 403, "FORBIDDEN");
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Không tìm thấy dữ liệu yêu cầu.") {
    super(message, 404, "NOT_FOUND");
  }
}

export class BusinessRuleViolationError extends AppError {
  constructor(message: string) {
    super(message, 422, "BUSINESS_RULE_VIOLATION");
  }
}
