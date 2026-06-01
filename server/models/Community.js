const mongoose = require("mongoose");

const communitySchema = new mongoose.Schema({
  name:        { type: String, required: true, unique: true, trim: true },
  description: { type: String, default: "", maxlength: 500 },
  color:       { type: String, default: "#2563eb" },
  creator:     { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  moderators:  [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  members:     [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  rules:       [{ title: String, description: String }],
}, { timestamps: true });

communitySchema.virtual("memberCount").get(function () {
  return this.members ? this.members.length : 0;
});
communitySchema.set("toJSON",   { virtuals: true });
communitySchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Community", communitySchema);
