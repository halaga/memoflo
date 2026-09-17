import env from "./config/env.js";
import connectDB from "./database/mongodb.js";
import app from "./app.js";

async function startServer() {
  try {
    await connectDB();

    app.listen(env.port, () => {
      console.log(`MemoFlo API running on port ${env.port}`);
      console.log(`Environment: ${env.nodeEnv}`);
    });
  } catch (error) {
    console.error("Unable to start MemoFlo API:", error);
    process.exit(1);
  }
}

startServer();
