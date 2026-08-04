import mongoose from "mongoose";
import env from "../config/env.js";

const connectDatabase = async () => {
  try {
    await mongoose.connect(env.mongoUri);

    console.log(
      "✅ MongoDB Connected Successfully"
    );
  } catch (error) {
    console.error(
      "❌ MongoDB Connection Failed"
    );

    console.error(error.message);

    process.exit(1);
  }
};

export default connectDatabase;