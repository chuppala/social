import React from "react";
import { Link } from "react-router-dom";
import "../../styles/layout.css";

export default function Rightbar({ communities = [], userCommunities = [], onJoin }) {
  return (
  <aside className="rightbar">

    <div className="widget">
      <div className="widget-title">
        🔥 Trending Communities
      </div>

      {[...communities]
        .sort(
          (a, b) =>
            (b.memberCount || 0) -
            (a.memberCount || 0)
        )
        .slice(0, 5)
        .map(c => (
          <Link
            key={c._id}
            to={`/c/${c.name}`}
            className="trend-card"
          >
            <div>
              <div className="trend-name">
                c/{c.name}
              </div>

              <div className="trend-members">
                {c.memberCount || 0} members
              </div>
            </div>

            <span
              className="trend-dot"
              style={{
                background: c.color
              }}
            />
          </Link>
        ))}
    </div>

    <div className="widget">
      <div className="widget-title">
        📋 Community Guidelines
      </div>

      <ul className="rules-list">
        <li>Be respectful to others</li>
        <li>No hate speech or harassment</li>
        <li>Post in the correct community</li>
        <li>No spam or self promotion</li>
        <li>Follow Echo's terms of service</li>
      </ul>
    </div>

  </aside>
);
}
