const jwt  = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer "))
      return res.status(401).json({ message: "Not authenticated. Please sign in." });
    const decoded = jwt.verify(header.split(" ")[1], process.env.SECRET);
    const user    = await User.findById(decoded.id).select("-password");
    if (!user)         return res.status(401).json({ message: "User not found." });
    if (user.isBanned) return res.status(403).json({ message: "Account suspended: " + (user.banReason || "policy violation") });
    req.user = user;
    next();
  } catch {
    res.status(401).json({ message: "Token invalid or expired. Please sign in again." });
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (header && header.startsWith("Bearer ")) {
      const decoded = jwt.verify(header.split(" ")[1], process.env.SECRET);
      req.user = await User.findById(decoded.id).select("-password");
    }
  } catch {}
  next();
};

const requireVerified = (req, res, next) => {
  if (!req.user || !req.user.isEmailVerified)
    return res.status(403).json({ message: "Please verify your email first.", needsVerification: true });
  next();
};
const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({
      message: "Admin access required."
    });
  }

  next();
};
module.exports = {
  protect,
  optionalAuth,
  requireVerified,
  adminOnly
};