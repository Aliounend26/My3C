import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    specialty: { type: String, trim: true, default: "" },
    password: { type: String, required: true, minlength: 6 },
    role: {
      type: String,
      enum: ["superadmin", "admin", "teacher", "student"],
      required: true,
      default: "student"
    },
    matricule: { type: String, unique: true, sparse: true, trim: true },
    formations: [{ type: mongoose.Schema.Types.ObjectId, ref: "Formation" }],
    classrooms: [{ type: mongoose.Schema.Types.ObjectId, ref: "ClassRoom" }],
    assignedCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: "CourseGroup" }],
    avatar: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date }
  },
  { timestamps: true }
);

userSchema.pre("save", async function savePassword(next) {
  if (!this.isModified("password")) {
    return next();
  }

  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = function comparePassword(password) {
  return bcrypt.compare(password, this.password);
};

export const User = mongoose.model("User", userSchema);
