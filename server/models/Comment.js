const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema({
  post:       { type: mongoose.Schema.Types.ObjectId, ref: "Post", required: true },
  author:     { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  content:    { type: String, required: true, maxlength: 1000 },
  likes:      [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  isFlagged:  { type: Boolean, default: false },
  flagReason: { type: String,  default: "" },
  isRemoved:  { type: Boolean, default: false },
  reports: [{
    reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reason: String,
    createdAt: { type: Date, default: Date.now },
  }],
}, { timestamps: true });

module.exports = mongoose.model("Comment", commentSchema);
