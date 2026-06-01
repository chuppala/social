const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
  author:    { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  community: { type: mongoose.Schema.Types.ObjectId, ref: "Community", required: true },
  title:     { type: String, required: true, trim: true, maxlength: 300 },
  content:   { type: String, required: true, maxlength: 5000 },
  tag:       { type: String, default: "", trim: true },
  likes:     [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  saves:     [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  isFlagged:  { type: Boolean, default: false },
  flagReason: { type: String,  default: "" },
  isRemoved:  { type: Boolean, default: false },
  reports: [{
    reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reason: String, details: String,
    createdAt: { type: Date, default: Date.now },
  }],
}, { timestamps: true });

module.exports = mongoose.model("Post", postSchema);
