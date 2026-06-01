const crypto = require("crypto");

const getKey = () => {
  const raw = process.env.CRYPTO_KEY || "abcdefghijklmnop";
  return Buffer.from(raw.padEnd(32, "0").slice(0, 32));
};

const encrypt = (text) => {
  try {
    if (!text) return text;
    const key = getKey();
    const iv  = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
    let enc = cipher.update(String(text), "utf8", "hex");
    enc += cipher.final("hex");
    return iv.toString("hex") + ":" + enc;
  } catch { return text; }
};

const decrypt = (enc) => {
  try {
    if (!enc || !enc.includes(":")) return enc;
    const [ivHex, data] = enc.split(":");
    const key      = getKey();
    const iv       = Buffer.from(ivHex, "hex");
    const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
    let dec = decipher.update(data, "hex", "utf8");
    dec += decipher.final("utf8");
    return dec;
  } catch { return enc; }
};

module.exports = { encrypt, decrypt };
