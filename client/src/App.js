import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import SignIn         from "./pages/SignIn";
import SignUp         from "./pages/SignUp";
import Home           from "./pages/Home";
import Profile        from "./pages/Profile";
import SavedPosts     from "./pages/SavedPosts";
import Community      from "./pages/Community";
import AdminPanel     from "./pages/admin/AdminPanel";
import Communities from "./pages/Communities";
import ModeratorPanel from "./pages/moderator/ModeratorPanel";

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",color:"#6b7280"}}>Loading...</div>;
  return user ? children : <Navigate to="/signin" replace />;
}

function GuestRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/" replace /> : children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/"            element={<Home />} />
      <Route path="/c/:name"     element={<Community />} />
      <Route path="/u/:username" element={<Profile />} />
      <Route path="/saved"       element={<PrivateRoute><SavedPosts /></PrivateRoute>} />
      <Route path="/admin"       element={<PrivateRoute><AdminPanel /></PrivateRoute>} />
      <Route path="/moderator"   element={<PrivateRoute><ModeratorPanel /></PrivateRoute>} />
      <Route path="/signin"      element={<GuestRoute><SignIn /></GuestRoute>} />
      <Route path="/signup"      element={<GuestRoute><SignUp /></GuestRoute>} />
      <Route path="*"            element={<Navigate to="/" replace />} />
      <Route
  path="/communities"
  element={<Communities />}
/>
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
