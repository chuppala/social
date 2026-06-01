import React, { useState, useCallback, useEffect } from "react";
import api from "../utils/api";

const AuthContext = React.createContext();
export const useAuth = () => React.useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("echo_token");
    if (!token) { setLoading(false); return; }
    api.get("/auth/me")
      .then((r) => { setUser(r.data.user); localStorage.setItem("echo_user", JSON.stringify(r.data.user)); })
      .catch(() => { localStorage.removeItem("echo_token"); localStorage.removeItem("echo_user"); setUser(null); })
      .finally(() => setLoading(false));
  }, []);

  const saveSession = useCallback((token, userData) => {
    localStorage.setItem("echo_token", token);
    localStorage.setItem("echo_user", JSON.stringify(userData));
    setUser(userData);
  }, []);

  const signup = useCallback(async (data) => {
    const res = await api.post("/auth/signup", data);
    return res.data;
  }, []);

  // verifyEmail now returns data WITHOUT saving session
  // so GuestRoute won't redirect — SignUp handles the flow
  const verifyEmail = useCallback(async (userId, otp) => {
    const res = await api.post("/auth/verify-email", { userId, otp });
    return res.data; // caller decides when to save session
  }, []);

  const completeSignup = useCallback((token, userData) => {
    saveSession(token, userData);
  }, [saveSession]);

  const resendOTP = useCallback(async (userId) => {
    const res = await api.post("/auth/resend-otp", { userId });
    return res.data;
  }, []);

  const signin = useCallback(async (email, password) => {
    const res = await api.post("/auth/signin", { email, password });
    if (res.data.token) saveSession(res.data.token, res.data.user);
    return res.data;
  }, [saveSession]);

  const verifySuspicious = useCallback(async (userId, otp, trustLevel) => {
    const res = await api.post("/auth/verify-suspicious", { userId, otp, trustLevel });
    saveSession(res.data.token, res.data.user);
    return res.data;
  }, [saveSession]);

  const updateProfile = useCallback(async (data) => {
    const res = await api.put("/auth/profile", data);
    const updated = { ...user, ...res.data.user };
    localStorage.setItem("echo_user", JSON.stringify(updated));
    setUser(updated);
    return res.data;
  }, [user]);

  const logout = useCallback(() => {
    localStorage.removeItem("echo_token");
    localStorage.removeItem("echo_user");
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, signup, verifyEmail, completeSignup, resendOTP, signin, verifySuspicious, updateProfile, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}
