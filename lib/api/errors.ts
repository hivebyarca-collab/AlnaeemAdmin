export type ApiErrorBody = {
  code: string;
  message: string;
  details?: unknown;
};

export class ApiClientError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(status: number, body: ApiErrorBody) {
    super(body.message || `API error ${status}`);
    this.name = 'ApiClientError';
    this.status = status;
    this.code = body.code || `HTTP_${status}`;
    this.details = body.details;
  }

  get isUnauthorized() {
    return this.status === 401;
  }

  get isForbidden() {
    return this.status === 403;
  }

  get isNotFound() {
    return this.status === 404;
  }

  get isValidation() {
    return this.status === 422 || this.code === 'VALIDATION_ERROR';
  }

  get isConflict() {
    return this.status === 409;
  }

  get isRateLimited() {
    return this.status === 429;
  }

  get isNetwork() {
    return this.status === 0 || this.code === 'NETWORK_ERROR';
  }
}

export function toActionError(error: unknown): string {
  if (error instanceof ApiClientError) {
    if (error.isUnauthorized) return 'انتهت الجلسة — يرجى تسجيل الدخول مجدداً';
    if (error.isForbidden) return 'ليست لديك صلاحية لهذا الإجراء';
    if (error.isNotFound) return 'العنصر غير موجود';
    if (error.isConflict) return error.message || 'تعذر الحذف بسبب ارتباطات موجودة';
    if (error.isRateLimited) return 'محاولات كثيرة — حاول لاحقاً';
    if (error.isNetwork) return 'تعذر الاتصال بالخادم — تحقق من تشغيل API';
    if (error.isValidation) return error.message || 'بيانات غير صالحة';
    return error.message;
  }
  if (error instanceof Error) return error.message;
  return 'حدث خطأ غير متوقع';
}
