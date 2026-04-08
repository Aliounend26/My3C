import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    conversation: { type: mongoose.Schema.Types.ObjectId, ref: "Conversation" },
    from: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    to: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: "CourseGroup" },
    classRoom: { type: mongoose.Schema.Types.ObjectId, ref: "ClassRoom" },
    subject: { type: String, default: "" },
    deliveryType: { type: String, enum: ["direct", "course", "class"], default: "direct" },
    body: { type: String, required: true },
    isRead: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export const Message = mongoose.model("Message", messageSchema);
