import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/auth.css";

const STEPS = ["Details", "Verify Email", "Trust Device", "Profile"];
const INTERESTS = ["Technology","Design","Gaming","Science","Photography","Startups","Music","Career","Sports","Art"];

function StepBar({ current }) {
  return (
    <div className="step-bar">
      {STEPS.map((s, i) => (
        <React.Fragment key={s}>
          <div className="step-item">
            <div className={`step-circle ${i < current ? "done" : i === current ? "active" : ""}`}>
              {i < current ? "✓" : i + 1}
            </div>
            <div className={`step-label ${i < current ? "done" : i === current ? "active" : ""}`}>{s}</div>
          </div>
          {i < STEPS.length - 1 && <div className={`step-line ${i < current ? "done" : ""}`} />}
        </React.Fragment>
      ))}
    </div>
  );
}

export default function SignUp() {
  const { signup, verifyEmail, completeSignup, resendOTP, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [step,      setStep]      = useState(0);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");
  const [success,   setSuccess]   = useState("");
  const [userId,    setUserId]    = useState(null);
  const [verifiedData, setVerifiedData] = useState(null); // store token+user after OTP
  const [trust,     setTrust]     = useState("session");
  const [pwVis,     setPwVis]     = useState(false);
  const [interests, setInterests] = useState([]);
  const [otp,       setOtp]       = useState(["","","","","",""]);
  const [form,      setForm]      = useState({ firstName:"", lastName:"", email:"", password:"", username:"", bio:"" });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const setOtpDigit = (i, v) => {
    const arr = [...otp]; arr[i] = v; setOtp(arr);
    if (v && i < 5) document.getElementById(`otp-${i+1}`)?.focus();
  };
  const otpBack = (e, i) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) document.getElementById(`otp-${i-1}`)?.focus();
  };

  const pw = form.password;
  const pwChecks = { len: pw.length >= 8, upper: /[A-Z]/.test(pw), sym: /[0-9!@#$%^&*]/.test(pw) };
  const pwScore  = Object.values(pwChecks).filter(Boolean).length;
  const pwColor  = ["#ef4444","#f59e0b","#22c55e"][pwScore-1] || "#e5e7eb";

  const toggleInterest = (i) =>
    setInterests(s => s.includes(i) ? s.filter(x => x !== i) : s.length < 3 ? [...s, i] : s);

  // Step 0: Details
  const handleStep0 = async () => {
    setError("");
    const { firstName, lastName, email, password, username } = form;
    if (!firstName || !lastName || !email || !password || !username)
      return setError("All fields are required.");
    if (!email.includes("@")) return setError("Enter a valid email.");
    if (password.length < 8)  return setError("Password must be at least 8 characters.");
    setLoading(true);
    try {
      const data = await signup({ firstName, lastName, email, password, username });
      setUserId(data.userId);
      setSuccess("Verification code sent to " + email);
      setStep(1);
    } catch (e) { setError(e.response?.data?.message || "Signup failed. Try again."); }
    finally { setLoading(false); }
  };

  // Step 1: Verify OTP — store result but DON'T login yet
  const handleVerify = async () => {
    setError("");
    const code = otp.join("");
    if (code.length !== 6) return setError("Enter the full 6-digit code.");
    setLoading(true);
    try {
      const data = await verifyEmail(userId, code);
      // Store token and user but don't call completeSignup yet
      setVerifiedData(data);
      setStep(2); // Go to Step 3 (Trust Device)
    } catch (e) { setError(e.response?.data?.message || "Invalid or expired code."); }
    finally { setLoading(false); }
  };

  // Step 2: Trust Device — just set preference and go to Step 4
  const handleTrust = () => {
    setError("");
    setStep(3); // Go to Step 4 (Profile)
  };

  // Step 3: Profile — save session and go to home
  const handleProfile = async () => {
    setLoading(true);
    try {
      // NOW save the session (login the user)
      if (verifiedData?.token) {
        completeSignup(verifiedData.token, verifiedData.user);
      }
      // Update profile if bio or interests added
      if (form.bio || interests.length > 0) {
        await updateProfile({ bio: form.bio, interests, trustLevel: trust });
      }
      navigate("/");
    } catch {
      navigate("/");
    } finally { setLoading(false); }
  };

  const handleResend = async () => {
    setError(""); setSuccess("");
    try {
      await resendOTP(userId);
      setSuccess("New code sent!");
    } catch (e) { setError(e.response?.data?.message || "Failed to resend."); }
  };

  return (
    <div className="split-auth">

  <div className="split-left">

    <div className="auth-header">
      <div className="auth-logo">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <circle cx="12" cy="12" r="10"/>
          <path d="M8 9h8M8 12h6M8 15h4"/>
        </svg>
        SocialEcho
      </div>

      <p className="auth-tagline">
        Your community, your voice
      </p>
    </div>

    <div className="auth-tabs">
      <Link to="/signin" className="auth-tab">
        Sign In
      </Link>

      <div className="auth-tab active">
        Sign Up
      </div>
    </div>

    {/* Progress bar and form here */}
<div className="auth-body">

  <div className="signup-progress">
    <div
      className="signup-progress-fill"
      style={{ width: `${(step + 1) * 25}%` }}
    />
  </div>

  <p className="step-text">
    Step {step + 1} of 4
  </p>
          {error   && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          {/* ── STEP 0: Details ── */}
          {step === 0 && (
            <div className="step-content">
              <div className="form-row">
                <div className="form-group">
                  <label>First Name</label>
                  <input value={form.firstName} onChange={e => set("firstName", e.target.value)} placeholder="First name" />
                </div>
                <div className="form-group">
                  <label>Last Name</label>
                  <input value={form.lastName} onChange={e => set("lastName", e.target.value)} placeholder="Last name" />
                </div>
              </div>
              <div className="form-group">
                <label>Username</label>
                <input value={form.username} onChange={e => set("username", e.target.value.toLowerCase())} placeholder="@username" />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="you@email.com" />
              </div>
              <div className="form-group">
                <label>Password</label>
                <div className="pw-wrap">
                  <input type={pwVis ? "text" : "password"} value={form.password}
                    onChange={e => set("password", e.target.value)} placeholder="Min 8 characters" />
                  <button type="button" className="pw-toggle" onClick={() => setPwVis(!pwVis)}>
                    {pwVis ? "🙈" : "👁"}
                  </button>
                </div>
                <div className="pw-bar">
                  <div style={{ width: `${(pwScore/3)*100}%`, background: pwColor }} />
                </div>
                <div className="pw-checks">
                  <span className={pwChecks.len   ? "check ok" : "check"}>✓ 8+ chars</span>
                  <span className={pwChecks.upper ? "check ok" : "check"}>✓ Uppercase</span>
                  <span className={pwChecks.sym   ? "check ok" : "check"}>✓ Number/symbol</span>
                </div>
              </div>
              <div className="alert alert-info">📧 A 6-digit code will be sent to your email to verify your account.</div>
              <button className="btn-main" onClick={handleStep0} disabled={loading}>
                {loading ? "Creating account..." : "Continue →"}
              </button>
              <p className="auth-footer">Already have an account? <Link to="/signin">Sign in</Link></p>
            </div>
          )}

          {/* ── STEP 1: Verify OTP ── */}
          {step === 1 && (
            <div className="step-content">
              <p className="step-desc">Enter the 6-digit code sent to <strong>{form.email}</strong></p>
              <div className="otp-row">
                {otp.map((d, i) => (
                  <input key={i} id={`otp-${i}`} className="otp-d" maxLength={1} value={d}
                    onChange={e => setOtpDigit(i, e.target.value.replace(/\D/,""))}
                    onKeyDown={e => otpBack(e, i)} />
                ))}
              </div>
              <button className="btn-main" onClick={handleVerify} disabled={loading}>
                {loading ? "Verifying..." : "Verify Email →"}
              </button>
              <button className="btn-ghost" onClick={handleResend}>Resend code</button>
              <button className="btn-ghost" onClick={() => { setStep(0); setError(""); }}>← Back</button>
            </div>
          )}

          {/* ── STEP 2: Trust Device ── */}
          {step === 2 && (
            <div className="step-content">
              <p className="step-desc">How long should we trust this device?</p>
              <div className="alert alert-info">🔒 We fingerprint your device for security. Choose your trust level.</div>
              {[
                { val:"session", icon:"🔒", title:"This session only",    desc:"You'll verify again next time you sign in." },
                { val:"30d",     icon:"📅", title:"Trust for 30 days",    desc:"Skip verification on this device for 30 days." },
                { val:"always",  icon:"✅", title:"Always trust",          desc:"Permanently trusted. Best for personal devices." },
              ].map(({ val, icon, title, desc }) => (
                <div key={val} className={`trust-opt ${trust === val ? "selected" : ""}`} onClick={() => setTrust(val)}>
                  <span className="trust-icon">{icon}</span>
                  <div>
                    <div className="trust-title">{title}</div>
                    <div className="trust-desc">{desc}</div>
                  </div>
                </div>
              ))}
              <button className="btn-main" onClick={handleTrust}>Continue →</button>
            </div>
          )}

          {/* ── STEP 3: Profile ── */}
          {step === 3 && (
            <div className="step-content">
              <div className="alert alert-success">🎉 Almost done! Add your profile details.</div>
              <div className="form-group">
  <label>Profile Picture</label>

  <input
    type="file"
    accept="image/*"
  />
</div>

<div className="form-group">
  <label>Location (Optional)</label>

  <input
    placeholder="Hyderabad, India"
  />
</div>

<div className="form-group">
  <label>
    Bio
    <span style={{ color:"#9ca3af", fontWeight:400 }}>
      (optional)
    </span>
  </label>

  <textarea
    value={form.bio}
    onChange={e => set("bio", e.target.value)}
    placeholder="Tell the community about yourself..."
    rows={3}
  />
  
</div>
              <div className="form-group">
                <label>Interests <span style={{ color:"#9ca3af", fontWeight:400 }}>(pick up to 3)</span></label>
                <div className="interest-grid">
                  {INTERESTS.map(i => (
                    <span key={i} className={`interest-tag ${interests.includes(i) ? "selected" : ""}`}
                      onClick={() => toggleInterest(i)}>{i}</span>
                  ))}
                </div>
              </div>
              <button className="btn-main" onClick={handleProfile} disabled={loading}>
                {loading ? "Creating account..." : "Create my account 🚀"}
              </button>
            </div>
          )}
</div> {/* auth-body */}

</div> {/* split-left */}

<div className="split-right">
  <img
    src="/login-illustration.svg"
    alt="SocialEcho"
    className="split-image"
  />

  <h2>Build Communities.</h2>
  <h2>Share Ideas.</h2>
  <h2>Make Connections.</h2>

  <p>
    Join thousands of communities,
    share knowledge and build meaningful discussions.
  </p>

        </div>
      </div>
  );
}
