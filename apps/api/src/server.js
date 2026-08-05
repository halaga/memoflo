import "./database/registerModels.js";
import app from "./app.js";
import env from "./config/env.js";
import connectDatabase from "./database/mongodb.js";

const startServer = async () => {
  await connectDatabase();

  app.listen(env.port, () => {
    console.log("");

    console.log(
      "================================="
    );

    console.log(
      `🚀 MemoFlo API running on port ${env.port}`
    );

    console.log(
      `🌍 Environment: ${env.nodeEnv}`
    );

    console.log(
      "================================="
    );

    console.log("");
  });
};

startServer();