const jwt    = require("jsonwebtoken");
const crypto = require("crypto");
const { encrypt } = require("./encryption");

const signToken = (userId) =>
  jwt.sign({ id: userId }, process.env.SECRET, { expiresIn: "7d" });

const getDeviceId = (req) => {
  const raw = (req.headers["user-agent"] || "") + "|" + (req.headers["accept-language"] || "");
  return crypto.createHash("sha256").update(raw).digest("hex").slice(0, 32);
};

const parseContext = (req) => {
  const ua = req.headers["user-agent"] || "";
  let browser = "Unknown", os = "Unknown";
  if (/Edg/.test(ua))          browser = "Edge";
  else if (/Chrome/.test(ua))  browser = "Chrome";
  else if (/Firefox/.test(ua)) browser = "Firefox";
  else if (/Safari/.test(ua))  browser = "Safari";
  if (/Windows/.test(ua))      os = "Windows";
  else if (/Mac/.test(ua))     os = "macOS";
  else if (/Android/.test(ua)) os = "Android";
  else if (/iPhone|iPad/.test(ua)) os = "iOS";
  else if (/Linux/.test(ua))   os = "Linux";
  const ip = (req.headers["x-forwarded-for"] || req.ip || "Unknown").split(",")[0].trim();
  return { deviceId: getDeviceId(req), browser, os, ip, encryptedIp: encrypt(ip) };
};

module.exports = { signToken, parseContext };
