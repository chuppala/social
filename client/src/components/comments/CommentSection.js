import React, { useState, useEffect } from "react";
import api from "../../utils/api";
import { useAuth } from "../../context/AuthContext";
import "../../styles/comments.css";

function timeAgo(d) {
  const s = Math.floor((Date.now() - new Date(d)) / 1000);
  if (s < 60)   return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s/60)}m ago`;
  return `${Math.floor(s/3600)}h ago`;
}

export default function CommentSection({ postId }) {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [text,     setText]     = useState("");
  const [loading,  setLoading]  = useState(false);
  const [fetching, setFetching] = useState(true);
  const [warning,  setWarning]  = useState(null);

  useEffect(() => {
    api.get(`/comments/${postId}`)
      .then(r => setComments(r.data.comments))
      .catch(() => {})
      .finally(() => setFetching(false));
  }, [postId]);

  const submit = async () => {
    if (!text.trim() || !user) return;
    setLoading(true);
    setWarning(null);
    try {
      const res = await api.post(`/comments/${postId}`, { content: text });
      setComments(c => [...c, res.data.comment]);
      setText("");
      if (res.data.flagged) {
        setWarning({ severity: res.data.severity, reason: res.data.flagReason });
      }
    } catch (e) {
      if (e.response?.data?.message) setWarning({ reason: e.response.data.message, isError: true });
    } finally { setLoading(false); }
  };

  return (
    <div className="comments-wrap">
      {warning && (
        <div className={`warn-box ${warning.isError?"warn-error":""}`}>
          <div className="warn-title">
            {warning.isError ? "❌ Error" : `⚠️ Inappropriate content detected`}
            {warning.severity && <span className="warn-sev">{warning.severity}</span>}
          </div>
          <div className="warn-body">{warning.reason} Your comment has been flagged and hidden from others. Continued violations may lead to account suspension.</div>
          <button className="warn-dismiss" onClick={() => setWarning(null)}>I understand</button>
        </div>
      )}

      {fetching ? (
        <div style={{padding:"12px 0",color:"#9ca3af",fontSize:12}}>Loading comments...</div>
      ) : comments.length === 0 ? (
        <div style={{padding:"12px 0",color:"#9ca3af",fontSize:12}}>No comments yet. Be the first!</div>
      ) : (
        comments.map(c => (
          <div key={c._id} className={`comment ${c.isFlagged?"comment-flagged":""}`}>
            <div className="cav">{c.author?.firstName?.[0]?.toUpperCase() || "?"}</div>
            <div className="cbubble">
              <div className="cheader">
                <span className="cname">{c.author?.firstName} {c.author?.lastName}</span>
                <span className="ctime">{timeAgo(c.createdAt)}</span>
                {c.isFlagged && <span className="flag-badge">⚠ Flagged</span>}
              </div>
              <div className="ctext">
                {c.isFlagged
                  ? <em style={{color:"#991b1b"}}>This comment was flagged for inappropriate content and is under review by moderators.</em>
                  : c.content}
              </div>
            </div>
          </div>
        ))
      )}

      {user ? (
        <div className="comment-form">
          <div className="cav" style={{background:"#2563eb"}}>{user.firstName?.[0]?.toUpperCase()}</div>
          <input
            className="comment-input"
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } }}
            placeholder="Write a comment... (Enter to send)"
          />
          <button className="comment-send" onClick={submit} disabled={loading}>
            {loading ? "..." : "Post"}
          </button>
        </div>
      ) : (
        <div className="comment-login">
          <a href="/signin" style={{color:"#2563eb",fontWeight:500}}>Sign in</a> to leave a comment
        </div>
      )}
    </div>
  );
}
