import React from "react";
import { Link } from "react-router-dom";
import "../../styles/layout.css";

export default function Rightbar({ communities = [], userCommunities = [], onJoin }) {
  return (
    <aside className="rightbar">
      <div className="widget">
        <div className="widget-title">🏘️ Communities</div>
        {communities.length === 0
          ? <p style={{fontSize:12,color:"#9ca3af"}}>No communities yet.</p>
          : communities.map(c => {
              const joined = userCommunities.includes(c._id);
              return (
                <div key={c._id} className="comm-row">
                  <div>
                    <Link to={`/c/${c.name}`} className="comm-name" style={{color:c.color}}>
                      c/{c.name}
                    </Link>
                    <div className="comm-members">{c.memberCount || 0} members</div>
                  </div>
                  <button
                    className={`join-btn ${joined ? "joined" : ""}`}
                    onClick={() => onJoin && onJoin(c._id, joined)}
                  >
                    {joined ? "Joined" : "Join"}
                  </button>
                </div>
              );
            })
        }
      </div>

      <div className="widget">
        <div className="widget-title">📋 Community Guidelines</div>
        <ul style={{fontSize:12,color:"#6b7280",paddingLeft:16,lineHeight:1.8,margin:0}}>
          <li>Be respectful to others</li>
          <li>No hate speech or harassment</li>
          <li>Post in the correct community</li>
          <li>No spam or self-promotion</li>
          <li>Follow Echo's terms of service</li>
        </ul>
      </div>
    </aside>
  );
}
