function notFoundHandler(req, res) {
  res.status(404).json({ error: "Route not found." });
}

function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);
  const status = Number.isInteger(err.status) ? err.status : 500;
  if (status >= 500) {
    console.error(`[server error] ${req.method} ${req.path}:`, err.message);
  }
  res.status(status).json({
    error: status >= 500 ? "The server could not complete the request. Check server logs and configuration." : err.message
  });
}

module.exports = { notFoundHandler, errorHandler };
