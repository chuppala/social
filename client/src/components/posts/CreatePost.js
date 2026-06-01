import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import api from "../../utils/api";

export default function CreatePost({ communities, onCreated }) {
  const { user } = useAuth();
  const [open,    setOpen]    = useState(false);
  const [title,   setTitle]   = useState("");
  const [content, setContent] = useState("");
  const [comm,    setComm]    = useState("");
  const [tag,     setTag]     = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [warn,    setWarn]    = useState("");

  const reset = () => { setTitle(""); setContent(""); setComm(""); setTag(""); setError(""); setWarn(""); };

  const handleSubmit = async () => {
    setError(""); setWarn("");
    if (!title.trim())   return setError("Title is required.");
    if (!content.trim()) return setError("Content is required.");
    if (!comm)           return setError("Please select a community.");
    setLoading(true);
    try {
      const res = await api.post("/posts", { title, content, community: comm, tag });
      onCreated(res.data.post);
      if (res.data.flagged) {
        setWarn(`⚠️ Flagged: ${res.data.flagReason}. Post is under review.`);
        setTimeout(() => { setOpen(false); reset(); }, 3000);
      } else if (res.data.offTopic) {
        setWarn(res.data.offTopicWarning);
        setTimeout(() => { setOpen(false); reset(); }, 4000);
      } else {
        setOpen(false); reset();
      }
    } catch (e) {
      setError(e.response?.data?.message || "Failed to create post.");
    } finally { setLoading(false); }
  };

  if (!open) return (
    <div className="create-box" onClick={() => setOpen(true)}>
      <div className="create-avatar-icon">{user?.firstName?.[0]?.toUpperCase() || "+"}</div>
      <div className="create-placeholder">What's on your mind? Share with a community...</div>
      <button className="cf-submit" style={{fontSize:12,padding:"6px 12px"}} onClick={e=>{e.stopPropagation();setOpen(true);}}>+ Post</button>
    </div>
  );

  return (
    <div className="create-form">
      <div className="create-form-header">
        <span>Create Post</span>
        <button onClick={()=>{setOpen(false);reset();}}>×</button>
      </div>
      {error && <div className="alert alert-danger" style={{marginBottom:10}}>{error}</div>}
      {warn  && <div className="alert alert-warning" style={{marginBottom:10}}>{warn}</div>}
      <select className="cf-select" value={comm} onChange={e=>setComm(e.target.value)}>
        <option value="">Choose a community...</option>
        {communities.map(c => <option key={c._id} value={c._id}>c/{c.name}</option>)}
      </select>
      <input  className="cf-input"   value={title}   onChange={e=>setTitle(e.target.value)}   placeholder="Post title *" />
      <textarea className="cf-textarea" value={content} onChange={e=>setContent(e.target.value)} placeholder="Write your post content here... *" rows={5} />
      <input  className="cf-input"   value={tag}     onChange={e=>setTag(e.target.value)}     placeholder="Tag (optional, e.g. Discussion, Question)" style={{marginBottom:0}} />
      <div style={{fontSize:11,color:"#9ca3af",margin:"6px 0 10px"}}>⚠️ Posts with violent or abusive content will be automatically flagged.</div>
      <div className="cf-actions">
        <button className="cf-cancel" onClick={()=>{setOpen(false);reset();}}>Cancel</button>
        <button className="cf-submit" onClick={handleSubmit} disabled={loading}>{loading?"Publishing...":"Publish Post"}</button>
      </div>
    </div>
  );
}
