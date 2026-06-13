import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../utils/api";
import Navbar from "../../components/layout/Navbar";

// ── Custom Confirm Modal ──────────────────────────────────────────────────────
function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.5)",zIndex:1000,
      display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{background:"#fff",borderRadius:12,padding:24,maxWidth:360,width:"90%",
        boxShadow:"0 20px 60px rgba(0,0,0,.2)"}}>
        <div style={{fontSize:16,fontWeight:600,color:"#111827",marginBottom:8}}>Confirm Action</div>
        <div style={{fontSize:14,color:"#6b7280",marginBottom:20,lineHeight:1.5}}>{message}</div>
        <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
          <button onClick={onCancel}
            style={{padding:"8px 18px",borderRadius:8,border:"1px solid #d1d5db",
              background:"#fff",fontSize:13,fontWeight:500,color:"#374151",cursor:"pointer"}}>
            Cancel
          </button>
          <button onClick={onConfirm}
            style={{padding:"8px 18px",borderRadius:8,border:"none",
              background:"#ef4444",fontSize:13,fontWeight:600,color:"#fff",cursor:"pointer"}}>
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ModeratorPanel() {
  const { user }   = useAuth();
  const navigate   = useNavigate();
  const [communities,     setCommunities]     = useState([]);
  const [selectedComm,    setSelectedComm]    = useState(null);
  const [stats,           setStats]           = useState(null);
  const [tab,             setTab]             = useState("overview");
  const [flaggedPosts,    setFlaggedPosts]    = useState([]);
  const [reportedPosts,   setReportedPosts]   = useState([]);
  const [flaggedComments, setFlaggedComments] = useState([]);
  const [allPosts,        setAllPosts]        = useState([]);
  const [newMod,          setNewMod]          = useState("");
  const [toast,           setToast]           = useState("");
  const [loading,         setLoading]         = useState(false);
  const [confirm,         setConfirm]         = useState(null); // { message, onConfirm }

  useEffect(() => {
    if (!user) { navigate("/"); return; }
    api.get("/moderator/my-communities")
      .then(r => {
        setCommunities(r.data.communities || []);
        if (r.data.communities?.length > 0) selectCommunity(r.data.communities[0]);
      })
      .catch(() => navigate("/"));
  }, [user]);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const askConfirm = (message) => new Promise(resolve => {
    setConfirm({ message, resolve });
  });

  const handleConfirm = () => { confirm.resolve(true);  setConfirm(null); };
  const handleCancel  = () => { confirm.resolve(false); setConfirm(null); };

  const selectCommunity = async (comm) => {
    setSelectedComm(comm);
    setTab("overview");
    try {
      const r = await api.get(`/moderator/community/${comm._id}/stats`);
      setStats(r.data);
    } catch {}
  };

  const loadTab = async (t) => {
    setTab(t);
    if (!selectedComm) return;
    setLoading(true);
    try {
      if (t === "flagged-posts")    { const r = await api.get(`/moderator/community/${selectedComm._id}/flagged-posts`);    setFlaggedPosts(r.data.posts); }
      if (t === "reported-posts")   { const r = await api.get(`/moderator/community/${selectedComm._id}/reported-posts`);   setReportedPosts(r.data.posts); }
      if (t === "flagged-comments") { const r = await api.get(`/moderator/community/${selectedComm._id}/flagged-comments`); setFlaggedComments(r.data.comments); }
      if (t === "all-posts")        { const r = await api.get(`/moderator/community/${selectedComm._id}/posts`);            setAllPosts(r.data.posts); }
    } catch {} finally { setLoading(false); }
  };

  const removePost = async (postId, from) => {
    const ok = await askConfirm("Are you sure you want to remove this post? This cannot be undone.");
    if (!ok) return;
    try {
      await api.put(`/moderator/community/${selectedComm._id}/posts/${postId}/remove`);
      showToast("✅ Post removed");
      if (from === "flagged")  setFlaggedPosts(p => p.filter(x => x._id !== postId));
      if (from === "reported") setReportedPosts(p => p.filter(x => x._id !== postId));
      if (from === "all")      setAllPosts(p => p.filter(x => x._id !== postId));
      const r = await api.get(`/moderator/community/${selectedComm._id}/stats`); setStats(r.data);
    } catch (e) { showToast("❌ " + (e.response?.data?.message || "Failed")); }
  };

  const approvePost = async (postId, from) => {
    try {
      await api.put(`/moderator/community/${selectedComm._id}/posts/${postId}/approve`);
      showToast("✅ Post approved and flag cleared");
      if (from === "flagged")  setFlaggedPosts(p => p.filter(x => x._id !== postId));
      if (from === "reported") setReportedPosts(p => p.filter(x => x._id !== postId));
      const r = await api.get(`/moderator/community/${selectedComm._id}/stats`); setStats(r.data);
    } catch (e) { showToast("❌ " + (e.response?.data?.message || "Failed")); }
  };

  const removeComment = async (commentId) => {
    const ok = await askConfirm("Are you sure you want to remove this comment?");
    if (!ok) return;
    try {
      await api.put(`/moderator/community/${selectedComm._id}/comments/${commentId}/remove`);
      showToast("✅ Comment removed");
      setFlaggedComments(c => c.filter(x => x._id !== commentId));
    } catch (e) { showToast("❌ " + (e.response?.data?.message || "Failed")); }
  };

  const addModerator = async () => {
    if (!newMod.trim()) return;
    try {
      const r = await api.post(`/moderator/community/${selectedComm._id}/add-mod`, { username: newMod });
      showToast("✅ " + r.data.message);
      setNewMod("");
    } catch (e) { showToast("❌ " + (e.response?.data?.message || "Failed")); }
  };

  const timeAgo = (d) => {
    const s = Math.floor((Date.now() - new Date(d)) / 1000);
    if (s < 60) return `${s}s ago`;
    if (s < 3600) return `${Math.floor(s/60)}m ago`;
    return `${Math.floor(s/3600)}h ago`;
  };

  const S = {
    card:   { background:"#fff", border:"1px solid #e5e7eb", borderRadius:10, padding:16, marginBottom:12 },
    title:  { fontSize:20, fontWeight:700, color:"#111827", marginBottom:16 },
    empty:  { background:"#f0fdf4", border:"1px solid #bbf7d0", borderRadius:10, padding:24, textAlign:"center", color:"#166534", fontSize:14, fontWeight:500 },
    btnG:   { padding:"8px 16px", borderRadius:7, background:"#16a34a", color:"#fff", fontSize:12, fontWeight:600, border:"none", cursor:"pointer" },
    btnR:   { padding:"8px 16px", borderRadius:7, background:"#ef4444", color:"#fff", fontSize:12, fontWeight:600, border:"none", cursor:"pointer" },
    flagR:  { background:"#fffbeb", border:"1px solid #fde68a", borderRadius:6, padding:"5px 10px", fontSize:12, color:"#78350f", marginBottom:8 },
  };

  if (communities.length === 0) return (
    <>
      <Navbar />
      <div style={{maxWidth:500,margin:"60px auto",padding:"0 16px",textAlign:"center"}}>
        <div style={{fontSize:48,marginBottom:16}}>🛡️</div>
        <div style={{fontSize:20,fontWeight:700,color:"#111827",marginBottom:8}}>No Moderator Access</div>
        <div style={{fontSize:14,color:"#6b7280",marginBottom:20}}>You are not a moderator of any community yet. An admin can assign you.</div>
        <button onClick={()=>navigate("/")} style={{padding:"10px 20px",borderRadius:8,background:"#2563eb",color:"#fff",fontSize:14,fontWeight:500,border:"none",cursor:"pointer"}}>← Back to Echo</button>
      </div>
    </>
  );

  return (
    <>
      <Navbar />

      {/* Custom Confirm Modal */}
      {confirm && <ConfirmModal message={confirm.message} onConfirm={handleConfirm} onCancel={handleCancel} />}

      {/* Toast */}
      {toast && (
        <div style={{position:"fixed",bottom:24,right:24,background:"#111827",color:"#fff",
          padding:"12px 20px",borderRadius:10,fontSize:13,zIndex:999,
          boxShadow:"0 4px 20px rgba(0,0,0,.2)"}}>
          {toast}
        </div>
      )}

      <div style={{display:"flex",minHeight:"calc(100vh - 52px)"}}>

        {/* SIDEBAR */}
        <aside style={{width:220,background:"#0f172a",padding:"16px 0",flexShrink:0,
          position:"sticky",top:52,height:"calc(100vh - 52px)",overflowY:"auto"}}>
          <div style={{color:"#fff",fontSize:14,fontWeight:700,padding:"10px 16px 16px",
            borderBottom:"1px solid #1e293b",marginBottom:8}}>🛡️ Mod Panel</div>

          <div style={{padding:"6px 16px 4px",fontSize:10,fontWeight:600,color:"#64748b",
            textTransform:"uppercase",letterSpacing:".06em"}}>My Communities</div>

          {communities.map(c => (
            <div key={c._id} onClick={() => selectCommunity(c)}
              style={{padding:"9px 16px",fontSize:13,fontWeight:500,
                color:selectedComm?._id===c._id?"#fff":"#94a3b8",
                background:selectedComm?._id===c._id?"#2563eb":"transparent",
                cursor:"pointer",display:"flex",alignItems:"center",gap:8,transition:"all .15s"}}>
              <div style={{width:8,height:8,borderRadius:"50%",background:c.color||"#2563eb",flexShrink:0}} />
              c/{c.name}
            </div>
          ))}

          {selectedComm && (<>
            <div style={{padding:"14px 16px 4px",fontSize:10,fontWeight:600,color:"#64748b",
              textTransform:"uppercase",letterSpacing:".06em",borderTop:"1px solid #1e293b",marginTop:8}}>
              Actions
            </div>
            {[
              {id:"overview",         label:"Overview",         icon:"📊"},
              {id:"flagged-posts",    label:"Flagged Posts",    icon:"🚩", count:stats?.flaggedPosts},
              {id:"reported-posts",   label:"Reported Posts",   icon:"📋", count:stats?.reportedPosts},
              {id:"flagged-comments", label:"Flagged Comments", icon:"💬", count:stats?.flaggedComments},
              {id:"all-posts",        label:"All Posts",        icon:"📝"},
              {id:"moderators",       label:"Moderators",       icon:"👥"},
            ].map(({id,label,icon,count}) => (
              <div key={id} onClick={() => loadTab(id)}
                style={{padding:"9px 16px",fontSize:13,
                  color:tab===id?"#fff":"#94a3b8",
                  background:tab===id?"#1e40af":"transparent",
                  cursor:"pointer",display:"flex",alignItems:"center",
                  justifyContent:"space-between",transition:"all .15s"}}>
                <span>{icon} {label}</span>
                {count > 0 && (
                  <span style={{background:"#ef4444",color:"#fff",fontSize:10,fontWeight:700,
                    padding:"2px 6px",borderRadius:10}}>{count}</span>
                )}
              </div>
            ))}
          </>)}

          <div onClick={()=>navigate("/")}
            style={{padding:"9px 16px",fontSize:13,color:"#64748b",cursor:"pointer",
              marginTop:8,borderTop:"1px solid #1e293b",paddingTop:16}}>
            ← Back to Echo
          </div>
        </aside>

        {/* MAIN */}
        <main style={{flex:1,padding:24,overflowY:"auto",background:"#f9fafb"}}>
          {!selectedComm ? (
            <div style={{textAlign:"center",padding:60,color:"#9ca3af"}}>Select a community</div>
          ) : (<>

            {/* OVERVIEW */}
            {tab === "overview" && stats && (
              <div>
                <div
  style={{
    background:"#fff",
    borderRadius:18,
    padding:"24px",
    marginBottom:"20px",
    border:"1px solid #e5e7eb",
    boxShadow:"0 4px 20px rgba(0,0,0,.06)"
  }}
>
  <h1
    style={{
      fontSize:"28px",
      fontWeight:"800",
      color:"#111827",
      marginBottom:"8px"
    }}
  >
    Welcome Back Moderator 👋
  </h1>

  <p
    style={{
      color:"#6b7280",
      fontSize:"14px"
    }}
  >
    Manage your assigned communities and keep discussions healthy.
  </p>
</div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",gap:14,marginBottom:20}}>
                  {[
  {
    label:"Members",
    value:stats.members,
    color:"#3b82f6",
    icon:"👥"
  },
  {
    label:"Total Posts",
    value:stats.posts,
    color:"#10b981",
    icon:"📝"
  },
  {
    label:"Reports",
    value:stats.reportedPosts,
    color:"#f97316",
    icon:"📋"
  },
  {
    label:"Comments",
    value:stats.flaggedComments,
    color:"#ec4899",
    icon:"💬"
  }
].map(({label,value,color,icon}) => (
                    <div key={label} style={{background:"#fff",border:"1px solid #e5e7eb",
                      borderRadius:10,padding:16,borderTop:`4px solid ${color}`,textAlign:"center"}}>
                      <div style={{fontSize:22,marginBottom:6}}>{icon}</div>
                      <div style={{fontSize:24,fontWeight:700,color}}>{value ?? 0}</div>
                      <div style={{fontSize:11,color:"#6b7280",marginTop:2}}>{label}</div>
                    </div>
                  ))}
                </div>
                <div
  style={{
    background:"#fff",
    border:"1px solid #e5e7eb",
    borderRadius:16,
    padding:"20px",
    marginBottom:"20px"
  }}
>
  <h3
    style={{
      fontSize:"18px",
      fontWeight:"700",
      marginBottom:"16px"
    }}
  >
    🏘️ Your Communities
  </h3>

  <div
    style={{
      display:"grid",
      gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",
      gap:"12px"
    }}
  >
    {communities.map(c => (
      <div
        key={c._id}
        style={{
          padding:"12px",
          border:"1px solid #e5e7eb",
          borderRadius:"12px",
          background:"#f9fafb"
        }}
      >
        <div
          style={{
            fontWeight:"600",
            color:"#111827"
          }}
        >
          c/{c.name}
        </div>
      </div>
    ))}
  </div>
</div>
                <div style={S.card}>
                  <div style={{fontSize:14,fontWeight:600,color:"#111827",marginBottom:12}}>Quick Actions</div>
                  <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                    <button style={S.btnR} onClick={()=>loadTab("flagged-posts")}>🚩 Flagged Posts ({stats.flaggedPosts})</button>
                    <button style={S.btnR} onClick={()=>loadTab("reported-posts")}>📋 Reported ({stats.reportedPosts})</button>
                    <button style={S.btnR} onClick={()=>loadTab("flagged-comments")}>💬 Comments ({stats.flaggedComments})</button>
                    <button style={{...S.btnG}} onClick={()=>loadTab("all-posts")}>📝 All Posts</button>
                  </div>
                </div>
              </div>
            )}

            {/* FLAGGED POSTS */}
            {tab === "flagged-posts" && (
              <div>
                <div style={S.title}>🚩 Flagged Posts — c/{selectedComm.name}</div>
                {loading ? <div style={{color:"#9ca3af",padding:20}}>Loading...</div> :
                  flaggedPosts.length === 0 ? <div style={S.empty}>✅ No flagged posts!</div> :
                  flaggedPosts.map(p => (
                    <div key={p._id} style={{...S.card,borderLeft:"4px solid #ef4444"}}>
                      <div style={{fontWeight:600,fontSize:14,color:"#111827",marginBottom:4}}>{p.title}</div>
                      <div style={{fontSize:12,color:"#6b7280",marginBottom:8}}>by @{p.author?.username} · {timeAgo(p.createdAt)}</div>
                      <p style={{fontSize:13,color:"#374151",marginBottom:8,lineHeight:1.5}}>{p.content?.substring(0,200)}{p.content?.length>200?"...":""}</p>
                      <div style={S.flagR}>⚠️ {p.flagReason}</div>
                      <div style={{display:"flex",gap:8}}>
                        <button style={S.btnG} onClick={()=>approvePost(p._id,"flagged")}>✅ Approve</button>
                        <button style={S.btnR} onClick={()=>removePost(p._id,"flagged")}>🗑️ Remove</button>
                      </div>
                    </div>
                  ))
                }
              </div>
            )}

            {/* REPORTED POSTS */}
            {tab === "reported-posts" && (
              <div>
                <div style={S.title}>📋 Reported Posts — c/{selectedComm.name}</div>
                {loading ? <div style={{color:"#9ca3af",padding:20}}>Loading...</div> :
                  reportedPosts.length === 0 ? <div style={S.empty}>✅ No reported posts!</div> :
                  reportedPosts.map(p => (
                    <div key={p._id} style={{...S.card,borderLeft:"4px solid #f97316"}}>
                      <div style={{fontWeight:600,fontSize:14,color:"#111827",marginBottom:4}}>{p.title}</div>
                      <div style={{fontSize:12,color:"#6b7280",marginBottom:8}}>by @{p.author?.username} · {timeAgo(p.createdAt)} · {p.reports?.length} report(s)</div>
                      <p style={{fontSize:13,color:"#374151",marginBottom:8}}>{p.content?.substring(0,200)}{p.content?.length>200?"...":""}</p>
                      <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:10}}>
                        {p.reports?.map((r,i)=>(
                          <span key={i} style={{padding:"2px 8px",borderRadius:8,background:"#fef2f2",
                            color:"#991b1b",border:"1px solid #fecaca",fontSize:11}}>🚩 {r.reason}</span>
                        ))}
                      </div>
                      <div style={{display:"flex",gap:8}}>
                        <button style={S.btnG} onClick={()=>approvePost(p._id,"reported")}>✅ Clear Reports</button>
                        <button style={S.btnR} onClick={()=>removePost(p._id,"reported")}>🗑️ Remove</button>
                      </div>
                    </div>
                  ))
                }
              </div>
            )}

            {/* FLAGGED COMMENTS */}
            {tab === "flagged-comments" && (
              <div>
                <div style={S.title}>💬 Flagged Comments — c/{selectedComm.name}</div>
                {loading ? <div style={{color:"#9ca3af",padding:20}}>Loading...</div> :
                  flaggedComments.length === 0 ? <div style={S.empty}>✅ No flagged comments!</div> :
                  flaggedComments.map(c => (
                    <div key={c._id} style={{...S.card,borderLeft:"4px solid #ec4899"}}>
                      <div style={{fontSize:12,color:"#6b7280",marginBottom:6}}>
                        by @{c.author?.username} on "{c.post?.title?.substring(0,50)}" · {timeAgo(c.createdAt)}
                      </div>
                      <div style={{background:"#fef2f2",border:"1px solid #fecaca",borderRadius:8,
                        padding:"8px 12px",fontSize:13,color:"#7f1d1d",marginBottom:8}}>
                        "{c.content}"
                      </div>
                      <div style={S.flagR}>⚠️ {c.flagReason}</div>
                      <button style={{...S.btnR,marginTop:8}} onClick={()=>removeComment(c._id)}>🗑️ Remove Comment</button>
                    </div>
                  ))
                }
              </div>
            )}

            {/* ALL POSTS */}
            {tab === "all-posts" && (
              <div>
                <div style={S.title}>📝 All Posts — c/{selectedComm.name}</div>
                {loading ? <div style={{color:"#9ca3af",padding:20}}>Loading...</div> :
                  allPosts.length === 0 ? <div style={S.empty}>No posts yet</div> :
                  <div style={S.card}>
                    <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
                      <thead>
                        <tr style={{borderBottom:"1px solid #e5e7eb"}}>
                          {["Title","Author","Likes","Status","Date","Action"].map(h=>(
                            <th key={h} style={{textAlign:"left",padding:"8px 10px",color:"#6b7280",fontSize:11,textTransform:"uppercase",fontWeight:600}}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {allPosts.map(p=>(
                          <tr key={p._id} style={{borderBottom:"1px solid #f3f4f6"}}>
                            <td style={{padding:"10px",maxWidth:200,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontWeight:500}}>{p.title}</td>
                            <td style={{padding:"10px",color:"#6b7280"}}>@{p.author?.username}</td>
                            <td style={{padding:"10px"}}>❤️ {p.likes?.length||0}</td>
                            <td style={{padding:"10px"}}>
                              {p.isFlagged
                                ? <span style={{background:"#fef2f2",color:"#991b1b",padding:"2px 7px",borderRadius:8,fontSize:11}}>Flagged</span>
                                : <span style={{background:"#f0fdf4",color:"#166534",padding:"2px 7px",borderRadius:8,fontSize:11}}>OK</span>}
                            </td>
                            <td style={{padding:"10px",color:"#9ca3af",fontSize:11}}>{timeAgo(p.createdAt)}</td>
                            <td style={{padding:"10px"}}>
                              <button style={{...S.btnR,padding:"4px 10px",fontSize:11}} onClick={()=>removePost(p._id,"all")}>Remove</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                }
              </div>
            )}

            {/* MODERATORS */}
            {tab === "moderators" && (
              <div>
                <div style={S.title}>👥 Moderators — c/{selectedComm.name}</div>
                <div style={S.card}>
                  <div style={{fontSize:13,fontWeight:600,color:"#374151",marginBottom:10}}>Add Moderator by Username</div>
                  <div style={{display:"flex",gap:10}}>
                    <input value={newMod} onChange={e=>setNewMod(e.target.value)}
                      placeholder="Enter username..."
                      onKeyDown={e=>e.key==="Enter"&&addModerator()}
                      style={{flex:1,border:"1px solid #d1d5db",borderRadius:8,padding:"8px 12px",
                        fontSize:13,outline:"none"}} />
                    <button style={S.btnG} onClick={addModerator}>Add Mod</button>
                  </div>
                </div>
              </div>
            )}

          </>)}
        </main>
      </div>
    </>
  );
}
