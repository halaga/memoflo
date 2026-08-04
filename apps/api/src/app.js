import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";

import notFound from "./middleware/notFound.js";
import errorHandler from "./middleware/errorHandler.js";
import authRoutes from "./modules/auth/auth.routes.js";

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

app.use(notFound);

app.use(errorHandler);

app.use("/api/v1/auth", authRoutes);

export default app;