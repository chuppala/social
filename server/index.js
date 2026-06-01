require("dotenv").config();
const express   = require("express");
const mongoose  = require("mongoose");
const cors      = require("cors");
const helmet    = require("helmet");
const rateLimit = require("express-rate-limit");

const app = express();

app.set("trust proxy", 1);
app.use(helmet({ crossOriginResourcePolicy: false, contentSecurityPolicy: false }));
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:3000", credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth/signin", rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: { message: "Too many login attempts. Try again later." } }));
app.use("/api/auth/signup", rateLimit({ windowMs: 60 * 60 * 1000, max: 5,  message: { message: "Too many registrations. Try again later." } }));
app.use("/api/",            rateLimit({ windowMs: 15 * 60 * 1000, max: 300 }));

app.use("/api/auth",        require("./routes/auth"));
app.use("/api/posts",       require("./routes/posts"));
app.use("/api/comments",    require("./routes/comments"));
app.use("/api/communities", require("./routes/communities"));
app.use("/api/users",       require("./routes/users"));
app.use("/api/admin",       require("./routes/admin"));
app.use("/api/moderator",   require("./routes/moderator"));
app.get("/api/health",      (req, res) => res.json({ status: "ok", time: new Date() }));

app.use((err, req, res, next) => {
  console.error("Error:", err.message);
  res.status(500).json({ message: "Internal server error" });
});

const MONGO = process.env.MONGODB_URI;
if (!MONGO) { console.error("MONGODB_URI not set in .env"); process.exit(1); }

mongoose.connect(MONGO)
  .then(() => {
    console.log("MongoDB Connected");
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log("Server Running On Port " + PORT));
  })
  .catch((err) => { console.error("MongoDB error:", err.message); process.exit(1); });
