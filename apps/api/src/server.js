import env from "./config/env.js";
import connectDB from "./database/mongodb.js";
import mongoose from "mongoose";
import app from "./app.js";

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
