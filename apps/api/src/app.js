import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";

import errorHandler from "./middleware/errorHandler.js";
import notFound from "./middleware/notFound.js";
import authRoutes from "./modules/auth/auth.routes.js";
import roleRoutes from "./modules/auth/role.routes.js";
import businessServiceRoutes from "./modules/business-service/businessService.routes.js";
import companyRoutes from "./modules/company/company.routes.js";
import employeeRoutes from "./modules/employee/employee.routes.js";
import memoRoutes from "./modules/memo/memo.routes.js";
import notificationRoutes from "./modules/notification/notification.routes.js";
import positionRoutes from "./modules/position/position.routes.js";
import departmentRoutes from "./modules/organization/department/department.routes.js";
import designationRoutes from "./modules/organization/designation/designation.routes.js";
import sbuRoutes from "./modules/organization/sbu/sbu.routes.js";
import workflowRoutes from "./modules/workflow/workflow.routes.js";

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

app.use("/api/auth", authRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/memos", memoRoutes);
app.use("/api/positions", positionRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/designations", designationRoutes);
app.use("/api/sbus", sbuRoutes);
app.use("/api/workflow", workflowRoutes);
app.use("/api/business-services", businessServiceRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api/company", companyRoutes);
app.use("/api/notifications", notificationRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
