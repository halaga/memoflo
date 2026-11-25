import env from "./config/env.js";
import connectDB from "./database/mongodb.js";
import mongoose from "mongoose";
import app from "./app.js";
import Company from "./modules/company/company.model.js";
import { seedBusinessServices } from "./modules/business-service/businessService.seed.js";
import { seedRingoApprovalConfiguration } from "./modules/workflow/ringo.workflow.seed.js";
import { seedFinanceRole } from "./modules/auth/role.seed.js";

let httpServer;
let isShuttingDown = false;

async function shutdown(signal) {
    if (isShuttingDown) return;
    isShuttingDown = true;
    console.log(`Received ${signal}. Shutting down MemoFlo API…`);

    const forceExit = setTimeout(() => {
        console.error("Graceful shutdown timed out; forcing process exit.");
        process.exit(1);
    }, 10000);
    forceExit.unref();

    try {
        if (httpServer) {
            await new Promise((resolve, reject) => {
                httpServer.close((error) => (error ? reject(error) : resolve()));
            });
        }
        await mongoose.disconnect();
        clearTimeout(forceExit);
        process.exit(0);
    } catch (error) {
        console.error("Error during MemoFlo API shutdown:", error);
        process.exit(1);
    }
}

async function startServer() {
    try {
        await connectDB();
        // Keep the Ringo pilot ready without manual catalogue/workflow setup.
        // This is idempotent and strictly tenant-scoped; other companies are untouched.
        try {
            const ringo = await Company.findOne({ code: "RINGO", isActive: true, deletedAt: null });
            if (ringo) {
                await seedBusinessServices(ringo);
                await seedRingoApprovalConfiguration(ringo);
                await seedFinanceRole(ringo);
                console.log("Ringo pilot catalogue and requisition workflows are synchronized.");
            }
        } catch (seedError) {
            // Do not take the whole SaaS API offline because an organisation chart
            // needs attention. Surface a clear startup warning for administrators.
            console.error("Ringo pilot configuration needs attention:", seedError.message);
        }
        httpServer = app.listen(env.port, () => {
            console.log(`MemoFlo API running on port ${env.port}`);
            console.log(`Environment: ${env.nodeEnv}`);
        });
    } catch (error) {
        console.error("Unable to start MemoFlo API:", error);
        process.exit(1);
    }
}

process.once("SIGTERM", () => shutdown("SIGTERM"));
process.once("SIGINT", () => shutdown("SIGINT"));

startServer();
