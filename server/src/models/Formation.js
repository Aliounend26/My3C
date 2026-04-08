import mongoose from "mongoose";

const formationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    code: { type: String, required: true, trim: true, unique: true },
    description: { type: String, default: "" },
    totalHours: { type: Number, required: true, min: 1 }
  },
  { timestamps: true }
);

export const Formation = mongoose.model("Formation", formationSchema);
