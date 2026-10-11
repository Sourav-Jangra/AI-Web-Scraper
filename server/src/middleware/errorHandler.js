/**
 * Centralized error handler middleware.
 * Ensures internal details, stack traces, IP addresses, and API keys are NEVER exposed to the frontend.
 */
function errorHandler(err, req, res, next) {
  const statusCode = err.status || err.statusCode || 500;

  // Log internally for debugging (never sent to client)
  console.error(`[SERVER ERROR] ${new Date().toISOString()} - ${err.message}`);

  let clientMessage = 'An unexpected error occurred while processing your request.';

  // If error is marked sanitized or is a client/operational error (4xx)
  if (err.isSanitized || (statusCode >= 400 && statusCode < 500)) {
    clientMessage = err.message;
  }

  res.status(statusCode).json({
    success: false,
    error: clientMessage
  });
}

module.exports = errorHandler;
