import mongoose from "mongoose";

const classRoomSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, trim: true, unique: true, sparse: true },
    description: { type: String, default: "" },
    formation: { type: mongoose.Schema.Types.ObjectId, ref: "Formation", required: true },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    students: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]
  },
  { timestamps: true }
);

export const ClassRoom = mongoose.model("ClassRoom", classRoomSchema);
