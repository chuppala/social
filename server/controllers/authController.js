const User = require("../models/User");
const { signToken, parseContext } = require("../config/jwt");
const { generateOTP, sendVerificationEmail, sendSuspiciousLoginEmail, sendPasswordResetEmail } = require("../config/email");

exports.signup = async (req, res) => {
  try {
    const { firstName, lastName, email, password, username } = req.body;
    if (!firstName||!lastName||!email||!password||!username)
      return res.status(400).json({ message: "All fields are required." });
    if (password.length < 8)
      return res.status(400).json({ message: "Password must be at least 8 characters." });
    const exists = await User.findOne({ $or:[{ email:email.toLowerCase() },{ username:username.toLowerCase() }] });
    if (exists) return res.status(400).json({ message: exists.email===email.toLowerCase() ? "Email already registered." : "Username already taken." });
    const otp  = generateOTP();
    const user = await User.create({ firstName, lastName, email, password, username,
      emailVerifyOTP:otp, emailVerifyExpires:new Date(Date.now()+10*60*1000) });
    sendVerificationEmail({ to:user.email, name:user.firstName, otp })
      .then(()=>console.log("Verification email sent to",user.email))
      .catch(e=>console.error("Verification email failed:",e.message));
    res.status(201).json({ message:"Account created! Check your email for the 6-digit code.", userId:user._id });
  } catch (e) { console.error("SIGNUP:",e.message); res.status(500).json({ message:"Server error." }); }
};

exports.verifyEmail = async (req, res) => {
  try {
    const { userId, otp } = req.body;
    const user = await User.findById(userId);
    if (!user)                return res.status(404).json({ message:"User not found." });
    if (user.isEmailVerified) return res.status(400).json({ message:"Already verified." });
    if (user.emailVerifyOTP!==String(otp)||new Date()>user.emailVerifyExpires)
      return res.status(400).json({ message:"Invalid or expired OTP." });
    user.isEmailVerified=true; user.emailVerifyOTP=undefined; user.emailVerifyExpires=undefined;
    await user.save();
    res.json({ message:"Email verified!", token:signToken(user._id), user:user.toPublic() });
  } catch (e) { res.status(500).json({ message:"Server error." }); }
};

exports.resendOTP = async (req, res) => {
  try {
    const user = await User.findById(req.body.userId);
    if (!user||user.isEmailVerified) return res.status(400).json({ message:"Not found or already verified." });
    const otp = generateOTP();
    user.emailVerifyOTP=otp; user.emailVerifyExpires=new Date(Date.now()+10*60*1000);
    await user.save();
    sendVerificationEmail({ to:user.email, name:user.firstName, otp }).catch(e=>console.error("Resend failed:",e.message));
    res.json({ message:"New code sent." });
  } catch { res.status(500).json({ message:"Server error." }); }
};

exports.signin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email||!password) return res.status(400).json({ message:"Email and password required." });
    const user = await User.findOne({ email:email.toLowerCase() });
    if (!user||!(await user.matchPassword(password)))
      return res.status(401).json({ message:"Invalid email or password." });
    if (user.isBanned) return res.status(403).json({ message:"Account suspended: "+(user.banReason||"policy violation") });
    if (!user.isEmailVerified) return res.status(403).json({ message:"Please verify your email first.", userId:user._id, needsVerification:true });
    const ctx     = parseContext(req);
    const trusted = user.isDeviceTrusted(ctx.deviceId);
    if (!trusted) {
      const otp = generateOTP();
      // Use updateOne to avoid validation errors on old users
      await User.updateOne({ _id: user._id }, { $set: { resetOTP: otp, resetOTPExpires: new Date(Date.now()+10*60*1000) } });
      sendSuspiciousLoginEmail({ to:user.email, name:user.firstName, otp, context:ctx }).catch(e=>console.error("Suspicious email failed:",e.message));
      return res.json({ suspicious:true, message:"New device detected. Security code sent to your email.", userId:user._id, context:{ browser:ctx.browser, os:ctx.os, ip:ctx.ip } });
    }
    res.json({ token:signToken(user._id), user:user.toPublic() });
  } catch (e) { console.error("SIGNIN:",e.message); res.status(500).json({ message:"Server error." }); }
};

exports.verifySuspicious = async (req, res) => {
  try {
    const { userId, otp, trustLevel } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message:"User not found." });
    if (user.resetOTP!==String(otp)||new Date()>user.resetOTPExpires)
      return res.status(400).json({ message:"Invalid or expired security code." });
    const ctx = parseContext(req);
    const exp = trustLevel==="30d" ? new Date(Date.now()+30*24*60*60*1000) : undefined;
    const newDevices = user.trustedDevices.filter(d=>d.deviceId!==ctx.deviceId);
    newDevices.push({ ...ctx, trustLevel:trustLevel||"session", expiresAt:exp });
    // Use updateOne to avoid validation on old users
    await User.updateOne({ _id: user._id }, { 
      $set: { trustedDevices: newDevices, resetOTP: undefined, resetOTPExpires: undefined }
    });
    res.json({ token:signToken(user._id), user:user.toPublic() });
  } catch (e) { console.error("VERIFY_SUSPICIOUS:",e.message); res.status(500).json({ message:"Server error." }); }
};

exports.forgotPassword = async (req, res) => {
  try {
    const user = await User.findOne({ email:req.body.email?.toLowerCase() });
    if (!user) return res.json({ message:"If that email is registered, a reset code has been sent." });
    const otp = generateOTP();
    // Use updateOne to avoid validation on old users
    await User.updateOne({ _id: user._id }, { 
      $set: { resetOTP: otp, resetOTPExpires: new Date(Date.now()+10*60*1000) }
    });
    sendPasswordResetEmail({ to:user.email, name:user.firstName||"User", otp }).catch(e=>console.error("Reset email failed:",e.message));
    res.json({ message:"If that email is registered, a reset code has been sent.", userId:user._id });
  } catch { res.status(500).json({ message:"Server error." }); }
};

exports.resetPassword = async (req, res) => {
  try {
    const { userId, otp, newPassword } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message:"User not found." });
    if (user.resetOTP!==String(otp)||new Date()>user.resetOTPExpires)
      return res.status(400).json({ message:"Invalid or expired code." });
    if (!newPassword||newPassword.length<8) return res.status(400).json({ message:"Password must be 8+ chars." });
    user.password=newPassword; user.resetOTP=undefined; user.resetOTPExpires=undefined;
    await user.save();
    res.json({ message:"Password reset. Please sign in." });
  } catch { res.status(500).json({ message:"Server error." }); }
};

exports.updateProfile = async (req, res) => {
  try {
    const { bio, interests, trustLevel } = req.body;
    const user = await User.findById(req.user._id);
    if (bio!==undefined)       user.bio=bio;
    if (interests!==undefined) user.interests=interests;
    if (trustLevel) {
      const ctx = parseContext(req);
      const exp = trustLevel==="30d" ? new Date(Date.now()+30*24*60*60*1000) : undefined;
      user.trustedDevices = user.trustedDevices.filter(d=>d.deviceId!==ctx.deviceId);
      user.trustedDevices.push({ ...ctx, trustLevel, expiresAt:exp });
    }
    await user.save();
    res.json({ user:user.toPublic() });
  } catch { res.status(500).json({ message:"Server error." }); }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select("-password -emailVerifyOTP -resetOTP -trustedDevices")
      .populate("joinedCommunities","name color");
    res.json({ user });
  } catch { res.status(500).json({ message:"Server error." }); }
};

exports.devVerify = async (req, res) => {
  try {
    const { email } = req.body;
    const db   = require("mongoose").connection.db;
    const result = await db.collection("users").updateOne(
      { email: email?.toLowerCase() },
      { $set: { isEmailVerified:true, firstName:req.body.firstName||"User", lastName:req.body.lastName||"Echo",
                username:req.body.username||email?.split("@")[0]||"user", role:"user" } }
    );
    if (!result.modifiedCount && !result.matchedCount)
      return res.status(404).json({ message:"User not found." });
    const user = await require("../models/User").findOne({ email:email?.toLowerCase() });
    res.json({ message:"Email force-verified!", token:signToken(user._id), user:user.toPublic() });
  } catch (e) { res.status(500).json({ message:"Server error: "+e.message }); }
};
// =========================
// ADMIN: MAKE MODERATOR
// =========================

exports.makeModerator = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user)
      return res.status(404).json({
        message: "User not found."
      });

    user.role = "moderator";

    await user.save();

    res.json({
      message: "User promoted to moderator.",
      user: user.toPublic()
    });

  } catch (e) {
    res.status(500).json({
      message: "Server error."
    });
  }
};

// =========================
// ADMIN: REMOVE MODERATOR
// =========================

exports.removeModerator = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user)
      return res.status(404).json({
        message: "User not found."
      });

    user.role = "user";

    await user.save();

    res.json({
      message: "Moderator removed successfully.",
      user: user.toPublic()
    });

  } catch (e) {
    res.status(500).json({
      message: "Server error."
    });
  }
};

// =========================
// ADMIN: BAN USER
// =========================

exports.banUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user)
      return res.status(404).json({
        message: "User not found."
      });

    user.isBanned = true;

    user.banReason =
      req.body.reason || "Banned by admin";

    await user.save();

    res.json({
      message: "User banned successfully."
    });

  } catch (e) {
    res.status(500).json({
      message: "Server error."
    });
  }
};

// =========================
// ADMIN: UNBAN USER
// =========================

exports.unbanUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user)
      return res.status(404).json({
        message: "User not found."
      });

    user.isBanned = false;
    user.banReason = "";

    await user.save();

    res.json({
      message: "User unbanned successfully."
    });

  } catch (e) {
    res.status(500).json({
      message: "Server error."
    });
  }
};