import cors from "cors";
import express from "express";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";
import "./config/env.js";
import { errorHandler, notFound } from "./middlewares/errorMiddleware.js";
import apiRoutes from "./routes/index.js";

export const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("CORS origin not allowed"));
    }
  })
);
app.use(express.json({ limit: "2mb" }));
app.use(morgan("dev"));
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", name: "My 3C API" });
});

app.use("/api", apiRoutes);
app.use(notFound);
app.use(errorHandler);
