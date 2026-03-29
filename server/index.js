require("dotenv").config();
const bodyParser = require("body-parser");
const express = require("express");
const cors = require("cors");
const path = require("path");

const { connectDB } = require("./models/db");
const seedData = require("./seed-data");

const AuthRouter = require("./routes/AuthRouter");
const AdminRouter = require("./routes/AdminRouter");
const UserRouter = require("./routes/UserRouter");
const ExpenseRouter = require("./routes/ExpenseRouter");
const ManagerRouter = require("./routes/ManagerRouter");

const app = express();

require("./models");

const PORT = process.env.PORT || 8080;

// Middleware
app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "10mb" }));

// CORS configuration
const allowedOrigins = [
  "https://odoo-hackathon-fawn.vercel.app",
  "http://localhost:5173",
  "http://localhost:3000",
  "http://localhost:8080",
];

// Add dev origin
if (process.env.NODE_ENV === "development") {
  allowedOrigins.push("http://localhost:5173");
}

console.log("Allowed CORS origins:", allowedOrigins);

// ✅ FIXED CORS (IMPORTANT)
app.use(
  cors({
    origin: function (origin, callback) {
      // When credentials are included, we must NEVER return "*".
      // Only reflect the request origin if it is explicitly allowed.
      if (origin && allowedOrigins.includes(origin))
        return callback(null, origin);
      return callback(null, false);
    },
    credentials: true,
  }),
);

// ✅ FIXED PREFLIGHT (NO wildcard issue)
app.options(
  "*",
  cors({
    origin: function (origin, callback) {
      if (origin && allowedOrigins.includes(origin))
        return callback(null, origin);
      return callback(null, false);
    },
    credentials: true,
    optionsSuccessStatus: 204,
  }),
);

// Static files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/api/auth", AuthRouter);
app.use("/api/admin", AdminRouter);
app.use("/api/users", UserRouter);
app.use("/api/expenses", ExpenseRouter);
app.use("/api/manager", ManagerRouter);

// Health check
app.get("/ping", (req, res) => {
  res.json({
    message: "Server is running",
  });
});

// 404
app.use("*", (req, res) => {
  res.status(404).json({
    message: "Route not found",
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);

  res.status(500).json({
    message: "Internal server error",
  });
});

async function start() {
  await connectDB();

  app.listen(PORT, async () => {
    console.log(`🚀 Server running on port ${PORT}`);

    try {
      await seedData();
      console.log("🌱 Seed data executed");
    } catch (err) {
      console.log("⚠️ Seed skipped or failed:", err.message);
    }
  });
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
