import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "../../styles/layout.css";

export default function Navbar({ onSearch }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const handleLogout = () => { logout(); navigate("/signin"); };

  // Read role directly from localStorage — most reliable
  const stored = JSON.parse(localStorage.getItem("echo_user") || "{}");
  const role   = stored?.role || user?.role || "user";
  const avatar = stored?.avatar || user?.avatar || "";
  const uname  = stored?.username || user?.username || "";
  const fname  = stored?.firstName || user?.firstName || "U";

  console.log("NAV ROLE:", role); // debug

  return (
    <nav className="navbar">
      <Link className="nav-brand" to="/">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <circle cx="12" cy="12" r="10"/>
          <path d="M8 9h8M8 12h6M8 15h4"/>
        </svg>
        SocialEcho
      </Link>

      <div className="nav-search">
        <input type="text" placeholder="Search posts..." value={query}
          onChange={e => {
            setQuery(e.target.value);
            if (onSearch) onSearch(e.target.value);
          }} />
      </div>

      <div className="nav-right">
        {user ? (
          <>
            <Link to="/" className="nav-link">Home</Link>
            



            {/* Show Admin for admin role */}
            {role === "admin" && (
              <Link to="/admin" className="nav-link"
                style={{color:"#ef4444", fontWeight:700, fontSize:13}}>
                🛡️ Admin
              </Link>
            )}

            {/* Show Mod for admin or moderator */}
            <Link
  to="/moderator"
  className="nav-link"
  style={{color:"#8b5cf6", fontWeight:700, fontSize:13}}
>
  🛡️ Moderator
</Link>

<Link to={`/u/${uname}`}>
  <div className="nav-avatar">
    {avatar
      ? <img src={avatar} alt={fname}
          style={{
            width:"100%",
            height:"100%",
            objectFit:"cover",
            borderRadius:"50%"
          }}
        />
      : fname?.[0]?.toUpperCase() || "U"}
  </div>
</Link>

            

            <button className="nav-btn ghost" onClick={handleLogout}>Sign out</button>
          </>
        ) : (
          <>
            <Link to="/signin" className="nav-btn outline">Sign in</Link>
            <Link to="/signup" className="nav-btn primary">Sign up</Link>
          </>
        )}
      </div>
    </nav>
  );
}
