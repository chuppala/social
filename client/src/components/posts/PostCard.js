import React, { useState } from "react";
import { Link } from "react-router-dom";
import api from "../../utils/api";
import { useAuth } from "../../context/AuthContext";
import CommentSection from "../comments/CommentSection";
import "../../styles/posts.css";

function timeAgo(date) {
  const s = Math.floor((Date.now() - new Date(date)) / 1000);
  if (s < 60)    return `${s}s ago`;
  if (s < 3600)  return `${Math.floor(s/60)}m ago`;
  if (s < 86400) return `${Math.floor(s/3600)}h ago`;
  return `${Math.floor(s/86400)}d ago`;
}

export default function PostCard({ post: initialPost, onDelete }) {
  const { user }  = useAuth();
  const [post,         setPost]         = useState(initialPost);
  const [liked,        setLiked]        = useState(post.likes?.includes(user?._id));
  const [likeCount,    setLikeCount]    = useState(post.likes?.length || 0);
  const [saved,        setSaved]        = useState(false);
  const [reported,     setReported]     = useState(false);
  const [showReport,   setShowReport]   = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [showComments, setShowComments] = useState(false);
  const [reportMsg,    setReportMsg]    = useState("");
  const [deleted,      setDeleted]      = useState(false);
  const [showDelConfirm, setShowDelConfirm] = useState(false);

  const isOwner = user && (String(user._id) === String(post.author?._id) || String(user._id) === String(post.author));
  const stored = JSON.parse(localStorage.getItem("echo_user") || "{}"); const isAdmin = (user?.role || stored?.role) === "admin";
  const canDelete = isOwner || isAdmin;

  const handleLike = async () => {
    if (!user) return;
    try {
      const res = await api.post(`/posts/${post._id}/like`);
      setLiked(res.data.liked);
      setLikeCount(res.data.likes);
    } catch {}
  };

  const handleSave = async () => {
    if (!user) return;
    try {
      const res = await api.post(`/posts/${post._id}/save`);
      setSaved(res.data.saved);
    } catch {}
  };

  const handleReport = async () => {
    if (!reportReason) return;
    try {
      const res = await api.post(`/posts/${post._id}/report`, { reason: reportReason });
      setReported(true);
      setShowReport(false);
      setReportMsg(res.data.message);
    } catch (e) {
      setReportMsg(e.response?.data?.message || "Error submitting report.");
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/posts/${post._id}`);
      setDeleted(true);
      setShowDelConfirm(false);
      if (onDelete) onDelete(post._id);
    } catch (e) {
  console.error(e);
}
  };

  if (deleted) return null;

  return (
    <div className={`post-card ${post.isFlagged ? "flagged" : ""}`}>

      {/* Delete Confirmation Modal */}
      {showDelConfirm && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.5)",zIndex:1000,
          display:"flex",alignItems:"center",justifyContent:"center"}}>
          <div style={{background:"#fff",borderRadius:12,padding:24,maxWidth:360,width:"90%",
            boxShadow:"0 20px 60px rgba(0,0,0,.2)"}}>
            <div style={{fontSize:16,fontWeight:600,color:"#111827",marginBottom:8}}>Delete Post?</div>
            <div style={{fontSize:14,color:"#6b7280",marginBottom:20,lineHeight:1.5}}>
              This will permanently remove your post. This cannot be undone.
            </div>
            <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
              <button onClick={() => setShowDelConfirm(false)}
                style={{padding:"8px 18px",borderRadius:8,border:"1px solid #d1d5db",
                  background:"#fff",fontSize:13,fontWeight:500,cursor:"pointer"}}>
                Cancel
              </button>
              <button onClick={handleDelete}
                style={{padding:"8px 18px",borderRadius:8,border:"none",
                  background:"#ef4444",color:"#fff",fontSize:13,fontWeight:600,cursor:"pointer"}}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="post-header">
        <div className="post-user">
         <Link to={`/u/${post.author?.username}`} className="post-avatar">
  {post.author?.avatar ? (
    <img
      src={post.author.avatar}
      alt="Profile"
      style={{
        width: "40px",
        height: "40px",
        borderRadius: "50%",
        objectFit: "cover"
      }}
    />
  ) : (
    post.author?.firstName?.[0]?.toUpperCase() || "?"
  )}
</Link>
          <div className="post-user-info">
            <Link to={`/u/${post.author?.username}`} className="post-author">
              {post.author?.firstName} {post.author?.lastName}
            </Link>
            <div className="post-meta">
              in <Link to={`/c/${post.community?.name}`} className="post-comm-link">c/{post.community?.name}</Link>
              {" · "}{timeAgo(post.createdAt)}
            </div>
          </div>
        </div>
        <div className="post-badges">
          {post.isFlagged && <span className="badge badge-yellow">⚠ Flagged</span>}
          {reported       && <span className="badge badge-red">Reported</span>}
          {post.tag       && <span className="badge badge-blue">{post.tag}</span>}
        </div>
      </div>

      <div className="post-body">
        {post.tag && <div className="post-tag">{post.tag}</div>}
        <div className="post-title">{post.title}</div>
        <p className="post-content">{post.content}</p>
        {post.image && (
  <img
    src={post.image}
    alt="Post"
    style={{
      width: "100%",
      borderRadius: "12px",
      marginTop: "10px"
    }}
  />
)}
        {post.isFlagged && post.flagReason && (
          <div style={{background:"#fffbeb",border:"1px solid #fde68a",borderRadius:8,
            padding:"7px 12px",fontSize:12,color:"#78350f",marginTop:6}}>
            ⚠️ {post.flagReason}
          </div>
        )}
      </div>

      <div className="post-actions">
        <button className={`act-btn ${liked?"liked":""}`} onClick={handleLike}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill={liked?"currentColor":"none"} stroke="currentColor" strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
          {likeCount}
        </button>

        <button className="act-btn" onClick={() => setShowComments(s => !s)}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          {post.commentCount || 0} Comments
        </button>

        <button className={`act-btn ${saved?"saved":""}`} onClick={handleSave}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill={saved?"currentColor":"none"} stroke="currentColor" strokeWidth="2">
            <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>
          </svg>
          {saved ? "Saved" : "Save"}
        </button>

        {user && !reported && (
          <button className="act-btn report-btn" onClick={() => setShowReport(s => !s)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
              <line x1="4" y1="22" x2="4" y2="15"/>
            </svg>
            Report
          </button>
        )}

        {canDelete && (
          <button className="act-btn delete-btn" onClick={() => setShowDelConfirm(true)}
            style={{marginLeft:"auto",color:"#ef4444"}}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
              <path d="M10 11v6M14 11v6"/>
              <path d="M9 6V4h6v2"/>
            </svg>
            Delete
          </button>
        )}
      </div>

      {reportMsg && (
        <div style={{padding:"6px 14px",fontSize:12,color:"#166534",
          background:"#f0fdf4",borderTop:"1px solid #bbf7d0"}}>{reportMsg}</div>
      )}

      {showReport && (
        <div className="report-box">
          <select value={reportReason} onChange={e => setReportReason(e.target.value)}>
  <option value="">Select reason...</option>

  <option value="off-topic">Off-topic content</option>
  <option value="spam">Spam or promotional content</option>
  <option value="misinformation">Misinformation</option>
  <option value="harassment">Harassment or bullying</option>
  <option value="hate">Hate speech or discrimination</option>
  <option value="violence">Violence or threats</option>
  <option value="other">Other</option>
</select>
          <button className="report-submit" onClick={handleReport}>Submit</button>
          <button className="report-cancel" onClick={() => setShowReport(false)}>Cancel</button>
        </div>
      )}

      {showComments && <CommentSection postId={post._id} />}
    </div>
  );
}
