import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function Sidebar({ communities }) {
  const { user } = useAuth();
  const loc = useLocation();

  const joined = communities.filter(c =>
    user?.joinedCommunities?.some(jc => (jc._id||jc) === c._id)
  );

  return (
    <aside className="sidebar">
      <div className="sidebar-card">
        {/* Home */}
        <Link className={`slink ${loc.pathname==="/"?"active":""}`} to="/">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          Home
        </Link>

        {user && (<>
          {/* Profile */}
          <Link className={`slink ${loc.pathname.includes("/u/")?"active":""}`} to={`/u/${user.username}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            Profile
          </Link>

          {/* Saved */}
          <Link className={`slink ${loc.pathname==="/saved"?"active":""}`} to="/saved">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>
            </svg>
            Saved
          </Link>
        </>)}

        {/* Joined Communities */}
        {joined.length > 0 && (<>
          <div className="ssect">My Communities</div>
          {joined.slice(0,6).map(c => (
            <Link key={c._id} className="scomm" to={`/c/${c.name}`}>
              <div className="cdot" style={{background:c.color||"#2563eb"}} />
              c/{c.name}
            </Link>
          ))}
        </>)}

        {/* Explore */}
        <div className="ssect">Explore</div>
        {communities.filter(c => !joined.find(j => j._id===c._id)).slice(0,5).map(c => (
          <Link key={c._id} className="scomm" to={`/c/${c.name}`}>
            <div className="cdot" style={{background:c.color||"#2563eb"}} />
            c/{c.name}
          </Link>
        ))}
      </div>
    </aside>
  );
}
