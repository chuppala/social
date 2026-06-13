import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/auth.css";

function detectCtx() {
  const ua = navigator.userAgent;
  let browser = "Unknown", os = "Unknown";
  if (/Edg/.test(ua))         browser = "Edge";
  else if (/Chrome/.test(ua)) browser = "Chrome";
  else if (/Firefox/.test(ua))browser = "Firefox";
  else if (/Safari/.test(ua)) browser = "Safari";
  if (/Windows/.test(ua))     os = "Windows";
  else if (/Mac/.test(ua))    os = "macOS";
  else if (/Android/.test(ua))os = "Android";
  else if (/iPhone|iPad/.test(ua)) os = "iOS";
  else if (/Linux/.test(ua))  os = "Linux";
  return { browser, os, time: new Date().toLocaleString() };
}

export default function SignIn() {
  const { signin, verifySuspicious } = useAuth();
  const navigate = useNavigate();

  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [pwVis,    setPwVis]    = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [ctx,      setCtx]      = useState(null);

  // Suspicious login state
  const [phase,   setPhase]   = useState("signin"); // signin | suspicious | forgot | reset
  const [userId,  setUserId]  = useState(null);
  const [srvCtx,  setSrvCtx]  = useState(null);
  const [otp,     setOtp]     = useState(["","","","","",""]);
  const [trust,   setTrust]   = useState("session");

  // Forgot password state
  const [fpEmail,  setFpEmail]  = useState("");
  const [fpUserId, setFpUserId] = useState(null);
  const [fpOtp,    setFpOtp]    = useState(["","","","","",""]);
  const [fpPass,   setFpPass]   = useState("");
  const [fpStep,   setFpStep]   = useState(0); // 0=email, 1=otp, 2=newpass

  useEffect(() => { setCtx(detectCtx()); }, []);

  /* ── Sign in ─────────────────────────────────────────── */
  const handleSignin = async (e) => {
    e?.preventDefault();
    setError("");
    if (!email || !password) return setError("Email and password are required.");
    setLoading(true);
    try {
      const data = await signin(email, password);
      if (data.suspicious) {
        setUserId(data.userId);
        setSrvCtx(data.context);
        setPhase("suspicious");
      } else {
        navigate("/");
      }
    } catch (e) {
      setError(e.response?.data?.message || "Sign in failed.");
    } finally { setLoading(false); }
  };

  /* ── Suspicious OTP ──────────────────────────────────── */
  const setOtpD = (arr, setArr, i, v) => {
    const a = [...arr]; a[i] = v; setArr(a);
    if (v && i < 5) document.getElementById(`sotp-${i+1}`)?.focus();
  };
  const otpBk = (e, arr, setArr, prefix, i) => {
    if (e.key==="Backspace" && !arr[i] && i>0) document.getElementById(`${prefix}-${i-1}`)?.focus();
  };

  const handleVerifySuspicious = async () => {
    setError("");
    const code = otp.join("");
    if (code.length !== 6) return setError("Enter the full 6-digit code.");
    setLoading(true);
    try {
      await verifySuspicious(userId, code, trust);
      navigate("/");
    } catch (e) { setError(e.response?.data?.message || "Invalid code."); }
    finally { setLoading(false); }
  };

  /* ── Forgot password ─────────────────────────────────── */
  const handleForgot = async () => {
    setError("");
    if (!fpEmail) return setError("Enter your email.");
    setLoading(true);
    try {
      const { default: api } = await import("../utils/api");
      const res = await api.post("/auth/forgot-password", { email: fpEmail });
      setFpUserId(res.data.userId);
      setFpStep(1);
    } catch (e) { setError(e.response?.data?.message || "Error."); }
    finally { setLoading(false); }
  };

  const handleResetOTP = async () => {
    setError("");
    const code = fpOtp.join("");
    if (code.length !== 6) return setError("Enter full code.");
    setLoading(true);
    try {
      const { default: api } = await import("../utils/api");
      await api.post("/auth/reset-password", {
  userId: fpUserId,
  otp: code,
  newPassword: fpPass
});

setPhase("signin");
setError("");
    } catch (e) { setError(e.response?.data?.message || "Invalid code."); }
    finally { setLoading(false); }
  };

  /* ── RENDER: Suspicious login ────────────────────────── */
  if (phase === "suspicious") return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header" style={{background:"linear-gradient(135deg,#7f1d1d,#991b1b)"}}>
          <div className="auth-logo">⚠️ Security Alert</div>
          <div className="auth-tagline">Unrecognised device detected</div>
        </div>
        <div className="auth-body">
          <div className="alert alert-danger">
            <strong>New device detected!</strong> A security code has been sent to your registered email address. Enter it below to confirm it's you.
          </div>
          <div className="email-mock">
            <div className="from">FROM: security@echo.app</div>
            <div className="subject">⚠️ New sign-in to your Echo account</div>
            <div className="body">
              Sign-in attempt from:<br/>
              <strong>Browser:</strong> {srvCtx?.browser || ctx?.browser}<br/>
              <strong>OS:</strong> {srvCtx?.os || ctx?.os}<br/>
              <strong>IP:</strong> {srvCtx?.ip || "Unknown"}<br/>
              <strong>Time:</strong> {ctx?.time}
            </div>
            <div className="note" style={{marginTop:8}}>Check your inbox for the 6-digit security code.</div>
          </div>
          {error && <div className="alert alert-danger">{error}</div>}
          <label style={{fontSize:12,fontWeight:500,color:"#374151",display:"block",marginBottom:6}}>6-digit security code:</label>
          <div className="otp-row">
            {otp.map((d,i) => (
              <input key={i} id={`sotp-${i}`} className="otp-d" maxLength={1} value={d}
                onChange={e=>setOtpD(otp,setOtp,i,e.target.value)} onKeyDown={e=>otpBk(e,otp,setOtp,"sotp",i)} autoFocus={i===0} />
            ))}
          </div>
          <div className="field" style={{marginTop:12}}>
            <label>Trust this device?</label>
            <select value={trust} onChange={e=>setTrust(e.target.value)}>
              <option value="session">This session only</option>
              <option value="30d">Trust for 30 days</option>
              <option value="always">Always trust this device</option>
            </select>
          </div>
          <button className="btn-main" onClick={handleVerifySuspicious} disabled={loading}>{loading?"Verifying...":"Confirm it's me →"}</button>
          <button className="btn-ghost danger" onClick={()=>setPhase("signin")}>🚫 Block this login</button>
        </div>
      </div>
    </div>
  );

  /* ── RENDER: Forgot password ─────────────────────────── */
  if (phase === "forgot") return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">🔑 Reset Password</div>
          <div className="auth-tagline">We'll send you a reset code</div>
        </div>
        <div className="auth-body">
          {error && <div className="alert alert-danger">{error}</div>}
          {fpStep === 0 && (<>
            <div className="field"><label>Your email address</label><input type="email" value={fpEmail} onChange={e=>setFpEmail(e.target.value)} placeholder="you@example.com" autoFocus /></div>
            <button className="btn-main" onClick={handleForgot} disabled={loading}>{loading?"Sending...":"Send reset code"}</button>
            <button className="btn-ghost" onClick={()=>setPhase("signin")}>← Back to sign in</button>
          </>)}
          {fpStep === 1 && (<>
            <div className="alert alert-success">✅ Reset code sent to <strong>{fpEmail}</strong></div>
            <label style={{fontSize:12,fontWeight:500,color:"#374151",display:"block",marginBottom:6}}>Enter 6-digit code:</label>
            <div className="otp-row">
              {fpOtp.map((d,i) => (
                <input key={i} id={`fpotp-${i}`} className="otp-d" maxLength={1} value={d}
                  onChange={e=>{const a=[...fpOtp];a[i]=e.target.value;setFpOtp(a);if(e.target.value&&i<5)document.getElementById(`fpotp-${i+1}`)?.focus();}}
                  onKeyDown={e=>{if(e.key==="Backspace"&&!fpOtp[i]&&i>0)document.getElementById(`fpotp-${i-1}`)?.focus();}}
                  autoFocus={i===0} />
              ))}
            </div>
            <div className="field" style={{marginTop:10}}>
              <label>New password</label>
              <input type="password" value={fpPass} onChange={e=>setFpPass(e.target.value)} placeholder="Min 8 characters" />
            </div>
            <button className="btn-main" onClick={handleResetOTP} disabled={loading}>{loading?"Resetting...":"Reset password"}</button>
          </>)}
        </div>
      </div>
    </div>
  );

  /* ── RENDER: Normal sign in ───────────────────────────── */
    return (
  <div className="auth-page">
    <div className="split-auth">
      

      <div className="split-left">
        
         <div
    style={{
      display:"flex",
      alignItems:"center",
      gap:"12px",
      marginBottom:"35px"
    }}
  >
    <div
      style={{
        width:"52px",
        height:"52px",
        borderRadius:"14px",
        background:"linear-gradient(135deg,#2563eb,#7c3aed)",
        display:"flex",
        alignItems:"center",
        justifyContent:"center",
        color:"#fff",
        fontSize:"24px",
        fontWeight:"700"
      }}
    >
      S
    </div>

    <div>
      <div
        style={{
          fontSize:"34px",
          fontWeight:"800",
          color:"#111827"
        }}
      >
        SocialEcho
      </div>

      <div
        style={{
          color:"#6b7280",
          fontSize:"14px"
        }}
      >
        Your community, your voice
      </div>
    </div>
  </div>

  <h1>Welcome Back 👋</h1>
        <p className="welcome-text">
          Join communities, share ideas and connect with people around the world.
        </p>

        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={handleSignin}>
          <div className="field">
            <label>Email address</label>
            <input
              type="email"
              value={email}
              onChange={e=>setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>

          <div className="field">
            <label>Password</label>
            <input
              type={pwVis ? "text" : "password"}
              value={password}
              onChange={e=>setPassword(e.target.value)}
              placeholder="Your password"
            />
          </div>

          <div style={{textAlign:"right",marginBottom:"15px"}}>
            <span
              style={{cursor:"pointer",color:"#2563eb"}}
              onClick={()=>setPhase("forgot")}
            >
              Forgot password?
            </span>
          </div>

          <button
            className="btn-main"
            type="submit"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="footer-link">
          Don't have an account?
          <Link to="/signup"> Sign Up</Link>
        </div>
      </div>

      <div className="split-right">
        <img
          src="/login-illustration.svg"
          alt="SocialEcho"
          className="split-image"
        />

        <h2>Discover. Discuss. Connect.</h2>

        <p>
          Join thousands of communities,
          share knowledge and build meaningful discussions.
        </p>
      </div>

    </div>
  </div>
);
}
