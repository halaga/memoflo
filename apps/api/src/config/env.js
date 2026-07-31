import dotenv from "dotenv";

dotenv.config();

const env = {
  port: process.env.PORT || 5000,

  nodeEnv:
    process.env.NODE_ENV || "development",

  mongoUri: process.env.MONGO_URI,

  jwtSecret: process.env.JWT_SECRET,

  uploadPath:
    process.env.UPLOAD_PATH ||
    "src/uploads",
};

export default env;