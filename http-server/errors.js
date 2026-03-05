export class HttpError extends Error {
  /**
   * @param {{ name?: string, message: string, statusCode: number }} msg
   */
  constructor({ name, message, statusCode = 500 }) {
    super(message);
    this.name = name || this.constructor.name;
    this.statusCode = statusCode;
    Error.captureStackTrace(this);
  }
}

export class BadRequestError extends HttpError {
  /**
   * @param {string} [message]
   */
  constructor(message) {
    super({
      name: "ERR_BAD_REQUEST",
      message: message || "Bad Request",
      statusCode: 400
    });
  }
}

export class NotFoundError extends HttpError {
  /**
   * @param {string} [message]
   */
  constructor(message) {
    super({
      name: "ERR_NOT_FOUND",
      message: message || "Not found",
      statusCode: 404
    });
  }
}

export class MethodNotAllowedError extends HttpError {
  /**
   * @param {string} [message]
   */
  constructor(message) {
    super({
      name: "ERR_METHOD_NOT_ALLOWED",
      message: message || "Method not allowed",
      statusCode: 405
    });
  }
}

export class ServiceUnavailableError extends HttpError {
  /**
   * @param {string} [message]
   */
  constructor(message) {
    super({
      name: "ERR_SERVICE_UNAVAILABLE",
      message: message || "Service unavailable",
      statusCode: 503
    });
  }
}
