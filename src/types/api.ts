export type ApiSuccess<T> = {
  success: true;
  message: string;
  data: T;
  timestamp: string;
  path: string;
};

export type ApiError = {
  success: false;
  error: string;
  message: string;
  timestamp: string;
  path: string;
};

export class HttpError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.code = code;
  }
}

