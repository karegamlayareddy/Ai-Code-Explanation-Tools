require("dotenv").config();
const path = require("path");
const express = require("express");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const analysisRoutes = require("./routes/analysis");
const historyRoutes = require("./routes/history");
const { notFoundHandler, errorHandler } = require("./middleware/errorHandler");

const app = express();
const port = Number(process.env.PORT) || 3000;

app.disable("x-powered-by");
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: process.env.NODE_ENV === "production" ? [] : null
    }
  }
}));
app.use(express.json({ limit: "30kb" }));
app.use("/api/", rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 120,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many requests. Please wait a few minutes and try again." }
}));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "CodeClarity API", timestamp: new Date().toISOString() });
});
app.use("/api/analysis", analysisRoutes);
app.use("/api/history", historyRoutes);
app.use(express.static(path.join(__dirname, "..", "frontend"), { index: "index.html" }));
app.use("/api", notFoundHandler);
app.use(errorHandler);

app.listen(port, () => {
  console.log(`CodeClarity is running at http://localhost:${port}`);
  console.log("Press Ctrl+C to stop the server.");
});
