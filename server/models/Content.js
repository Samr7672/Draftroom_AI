import mongoose from "mongoose";

const contentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  type: { type: String, required: true },
  topic: { type: String, required: true },
  tone: String,
  title: { type: String, default: "Untitled" },
  body: { type: String, default: "" },
}, { timestamps: true });

export default mongoose.model("Content", contentSchema);
