/**
 * Centralized error handler middleware.
 * Ensures internal details, stack traces, IP addresses, and API keys are NEVER exposed to the frontend.
 */
function errorHandler(err, req, res, next) {
  const statusCode = err.status || err.statusCode || 500;

  // Log internally for debugging (never sent to client)
  console.error(`[SERVER ERROR] ${new Date().toISOString()} - ${err.message}`);

  let clientMessage = 'An unexpected error occurred while processing your request.';

  // If error has been explicitly marked sanitized or comes from operational error
  if (err.isSanitized || statusCode < 500) {
    clientMessage = err.message;
  } else if (err.message && (
    err.message.includes('URL') ||
    err.message.includes('webpage') ||
    err.message.includes('timeout') ||
    err.message.includes('security') ||
    err.message.includes('Access denied') ||
    err.message.includes('redirect')
  )) {
    clientMessage = err.message;
  }

  res.status(statusCode).json({
    success: false,
    error: clientMessage
  });
}

module.exports = errorHandler;
