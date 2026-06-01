const mongoose = require("mongoose");
const bcrypt   = require("bcryptjs");

const trustedDeviceSchema = new mongoose.Schema({
  deviceId:    String,
  browser:     String,
  os:          String,
  ip:          String,
  encryptedIp: String,
  trustLevel:  { type: String, enum: ["session","30d","always"], default: "session" },
  trustedAt:   { type: Date, default: Date.now },
  expiresAt:   Date,
});

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true, trim: true },
  lastName:  { type: String, required: true, trim: true },
  username:  { type: String, required: true, unique: true, trim: true, lowercase: true },
  email:     { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:  { type: String, required: true, minlength: 8 },
  bio:       { type: String, default: "", maxlength: 300 },
  avatar:    { type: String, default: "" },
  interests: [String],
  role:      { type: String, enum: ["user","moderator","admin"], default: "user" },

  isEmailVerified:    { type: Boolean, default: false },
  emailVerifyOTP:     String,
  emailVerifyExpires: Date,

  resetOTP:        String,
  resetOTPExpires: Date,

  trustedDevices: [trustedDeviceSchema],
  warnings:       { type: Number, default: 0 },
  isBanned:       { type: Boolean, default: false },
  banReason:      String,

  savedPosts:        [{ type: mongoose.Schema.Types.ObjectId, ref: "Post" }],
  joinedCommunities: [{ type: mongoose.Schema.Types.ObjectId, ref: "Community" }],
  followers:         [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  following:         [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
}, { timestamps: true });

// ✅ Fixed pre-save (no next parameter)
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.matchPassword = async function (plain) {
  return bcrypt.compare(plain, this.password);
};

userSchema.methods.isDeviceTrusted = function (deviceId) {
  const dev = this.trustedDevices.find(d => d.deviceId === deviceId);
  if (!dev) return false;
  if (dev.trustLevel === "always") return true;
  if (dev.trustLevel === "30d")    return dev.expiresAt && dev.expiresAt > new Date();
  return false;
};

userSchema.methods.toPublic = function () {
  const o = this.toObject();
  delete o.password; delete o.emailVerifyOTP; delete o.emailVerifyExpires;
  delete o.resetOTP; delete o.resetOTPExpires; delete o.trustedDevices;
  return o;
};

module.exports = mongoose.model("User", userSchema);
