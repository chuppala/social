// ═══════════════════════════════════════════════════
// routes/auth.js
// ═══════════════════════════════════════════════════
const express = require("express");
const router  = express.Router();
const ctrl    = require("../controllers/authController");
const { protect } = require("../middleware/auth");

router.post("/signup",            ctrl.signup);
router.post("/verify-email",      ctrl.verifyEmail);
router.post("/resend-otp",        ctrl.resendOTP);
router.post("/signin",            ctrl.signin);
router.post("/verify-suspicious", ctrl.verifySuspicious);
router.post("/forgot-password",   ctrl.forgotPassword);
router.post("/reset-password",    ctrl.resetPassword);
router.put ("/profile", protect,  ctrl.updateProfile);
router.get ("/me",      protect,  ctrl.getMe);
router.post("/dev-verify",        ctrl.devVerify); // Remove in production

module.exports = router;
