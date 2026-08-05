import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";

import authRoutes from "./modules/auth/auth.routes.js";
import employeeRoutes from "./modules/employee/employee.routes.js";

import notFound from "./middleware/notFound.js";
import errorHandler from "./middleware/errorHandler.js";

const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/", (req, res) => {
  res.json({
    success: true,
    product: "MemoFlo API",
    version: "2.0.0",
    status: "Running",
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/employees", employeeRoutes);

// Error Handlers (ALWAYS LAST)
app.use(notFound);
app.use(errorHandler);

export default app;