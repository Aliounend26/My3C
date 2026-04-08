import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["direct", "class", "course"], default: "direct" },
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }],
    classRoom: { type: mongoose.Schema.Types.ObjectId, ref: "ClassRoom" },
    course: { type: mongoose.Schema.Types.ObjectId, ref: "CourseGroup" }
  },
  { timestamps: true }
);

conversationSchema.index({ participants: 1 });

export const Conversation = mongoose.model("Conversation", conversationSchema);
