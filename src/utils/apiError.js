class apiError extends Error {
  constructor(
    statusCode,
    message = "something went wrong in server",
    errors = [],
    stack = ""
  ) {
    super(message);
    this.statusCode = statusCode;
    this.message = message;
    this.data = null;
    this.errors = errors;
    this.success = false;
    this.stack = stack;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export { apiError };
