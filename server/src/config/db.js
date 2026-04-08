import mongoose from "mongoose";

export const connectDatabase = async () => {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error("MONGODB_URI is missing. Check server/.env");
  }

  await mongoose.connect(mongoUri, {
    serverSelectionTimeoutMS: 5000
  });
  console.log("MongoDB connected");
};
