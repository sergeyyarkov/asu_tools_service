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
      name: "E_BAD_REQUEST",
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
      name: "E_NOT_FOUND",
      message: message || "Not found",
      statusCode: 404
    });
  }
}
