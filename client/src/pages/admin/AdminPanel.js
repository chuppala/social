import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../utils/api";
import Navbar from "../../components/layout/Navbar";

const S = {
  wrap:       { display:"flex", minHeight:"calc(100vh - 60px)", background:"#f3f4f6" },
  sidebar:    { width:220, background:"#1e293b", flexShrink:0, position:"sticky", top:60, height:"calc(100vh - 60px)", overflowY:"auto" },
  brand:      { color:"#fff", fontSize:15, fontWeight:700, padding:"14px 16px 16px", borderBottom:"1px solid #334155", marginBottom:8 },
  navItem:    { display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 16px", color:"#94a3b8", fontSize:13, fontWeight:500, cursor:"pointer", transition:"all .15s" },
  navActive:  { display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 16px", color:"#fff", fontSize:13, fontWeight:600, cursor:"pointer", background:"#2563eb" },
  badge:      { background:"#ef4444", color:"#fff", fontSize:10, fontWeight:700, padding:"2px 6px", borderRadius:10, minWidth:18, textAlign:"center" },
  main:       { flex:1, padding:24, overflowY:"auto" },
  title:      { fontSize:22, fontWeight:700, color:"#111827", marginBottom:20 },
  grid:       { display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))", gap:14, marginBottom:20 },
  card:       { background:"#fff", borderRadius:10, border:"1px solid #e5e7eb", padding:16, textAlign:"center" },
  statIcon:   { fontSize:26, marginBottom:8 },
  statVal:    { fontSize:28, fontWeight:700, marginBottom:4 },
  statLbl:    { fontSize:12, color:"#6b7280" },
  panel:      { background:"#fff", borderRadius:10, border:"1px solid #e5e7eb", padding:16, marginBottom:12 },
  btnBlue:    { padding:"8px 14px", borderRadius:7, background:"#2563eb", color:"#fff", fontSize:13, fontWeight:500, border:"none", cursor:"pointer", marginRight:8 },
  btnGreen:   { padding:"7px 12px", borderRadius:7, background:"#16a34a", color:"#fff", fontSize:12, fontWeight:500, border:"none", cursor:"pointer", marginRight:6 },
  btnRed:     { padding:"7px 12px", borderRadius:7, background:"#ef4444", color:"#fff", fontSize:12, fontWeight:500, border:"none", cursor:"pointer" },
  btnOrange:  { padding:"8px 14px", borderRadius:7, background:"#f97316", color:"#fff", fontSize:13, fontWeight:500, border:"none", cursor:"pointer", marginRight:8 },
  btnGray:    { padding:"8px 14px", borderRadius:7, background:"#6b7280", color:"#fff", fontSize:13, fontWeight:500, border:"none", cursor:"pointer" },
  flagCard:   { background:"#fff", border:"1px solid #e5e7eb", borderLeft:"4px solid #ef4444", borderRadius:8, padding:14, marginBottom:10 },
  repCard:    { background:"#fff", border:"1px solid #e5e7eb", borderLeft:"4px solid #f97316", borderRadius:8, padding:14, marginBottom:10 },
  commCard:   { background:"#fff", border:"1px solid #e5e7eb", borderLeft:"4px solid #ec4899", borderRadius:8, padding:14, marginBottom:10 },
  reasonBox:  { background:"#fffbeb", border:"1px solid #fde68a", borderRadius:6, padding:"5px 10px", fontSize:12, color:"#78350f", margin:"6px 0 10px" },
  emptyBox:   { background:"#f0fdf4", border:"1px solid #bbf7d0", borderRadius:10, padding:24, textAlign:"center", color:"#166534", fontSize:14, fontWeight:500 },
  search:     { flex:1, border:"1px solid #d1d5db", borderRadius:8, padding:"8px 12px", fontSize:13, outline:"none" },
  table:      { width:"100%", borderCollapse:"collapse", fontSize:13 },
  th:         { textAlign:"left", padding:"8px 10px", color:"#6b7280", fontSize:11, textTransform:"uppercase", fontWeight:600, borderBottom:"1px solid #e5e7eb" },
  td:         { padding:"10px", borderBottom:"1px solid #f3f4f6", verticalAlign:"middle" },
  toast:      { position:"fixed", bottom:20, right:20, background:"#111827", color:"#fff", padding:"12px 20px", borderRadius:10, fontSize:14, zIndex:999 },
};

function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.5)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{background:"#fff",borderRadius:12,padding:24,maxWidth:360,width:"90%",boxShadow:"0 20px 60px rgba(0,0,0,.2)"}}>
        <div style={{fontSize:16,fontWeight:600,color:"#111827",marginBottom:8}}>Confirm Action</div>
        <div style={{fontSize:14,color:"#6b7280",marginBottom:20,lineHeight:1.5}}>{message}</div>
        <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
          <button onClick={onCancel} style={{padding:"8px 18px",borderRadius:8,border:"1px solid #d1d5db",background:"#fff",fontSize:13,cursor:"pointer"}}>Cancel</button>
          <button onClick={onConfirm} style={{padding:"8px 18px",borderRadius:8,border:"none",background:"#ef4444",color:"#fff",fontSize:13,fontWeight:600,cursor:"pointer"}}>Confirm</button>
        </div>
      </div>
    </div>
  );
}

export default function AdminPanel() {
  const { user }   = useAuth();
  const navigate   = useNavigate();
  const [tab,      setTab]     = useState("dashboard");
  const [stats,    setStats]   = useState(null);
  const [users,    setUsers]   = useState([]);
  const [flaggedPosts,    setFlaggedPosts]    = useState([]);
  const [reportedPosts,   setReportedPosts]   = useState([]);
  const [flaggedComments, setFlaggedComments] = useState([]);
  const [allPosts,        setAllPosts]        = useState([]);
  const [search,   setSearch]  = useState("");
  const [loading,  setLoading] = useState(false);
  const [toast,    setToast]   = useState("");
  const [confirm,  setConfirm] = useState(null);

  const stored = JSON.parse(localStorage.getItem("echo_user") || "{}");
  const role   = stored?.role || user?.role;

  useEffect(() => {
    if (!user || role !== "admin") { navigate("/"); return; }
    fetchStats();
  }, [user]);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 3000); };
  const askConfirm = (msg) => new Promise(r => setConfirm({ msg, r }));
  const handleConfirm = () => { confirm.r(true);  setConfirm(null); };
  const handleCancel  = () => { confirm.r(false); setConfirm(null); };

  const fetchStats = async () => {
    try { const r = await api.get("/admin/stats"); setStats(r.data); } catch {}
  };

  const loadTab = async (t) => {
    setTab(t); setLoading(true);
    try {
      if (t==="users")            { const r = await api.get(`/admin/users?search=${search}`); setUsers(r.data.users); }
      if (t==="flagged-posts")    { const r = await api.get("/admin/flagged-posts");           setFlaggedPosts(r.data.posts); }
      if (t==="reported-posts")   { const r = await api.get("/admin/reported-posts");          setReportedPosts(r.data.posts); }
      if (t==="flagged-comments") { const r = await api.get("/admin/flagged-comments");        setFlaggedComments(r.data.comments); }
      if (t==="all-posts")        { const r = await api.get("/admin/posts");                   setAllPosts(r.data.posts); }
    } catch {} finally { setLoading(false); }
  };

 const banUser = async (id, username) => {
  try {
    await api.put(`/admin/users/${id}/ban`, {
      reason: "Violated community guidelines"
    });

    showToast(`✅ @${username} banned`);
    loadTab("users");
    fetchStats();
  } catch (e) {
    showToast("❌ " + (e.response?.data?.message || "Error"));
  }
};
  const unbanUser = async (id, username) => {
    try { await api.put(`/admin/users/${id}/unban`); showToast(`✅ @${username} unbanned`); loadTab("users"); fetchStats(); }
    catch { showToast("❌ Error"); }
  };

  const removePost = async (id, from) => {
    const ok = await askConfirm("Remove this post permanently?");
    if (!ok) return;
    try {
      await api.put(`/admin/posts/${id}/remove`);
      showToast("✅ Post removed");
      if (from==="flagged")  setFlaggedPosts(p=>p.filter(x=>x._id!==id));
      if (from==="reported") setReportedPosts(p=>p.filter(x=>x._id!==id));
      if (from==="all")      setAllPosts(p=>p.filter(x=>x._id!==id));
      fetchStats();
    } catch {}
  };

  const approvePost = async (id, from) => {
    try {
      await api.put(`/admin/posts/${id}/approve`);
      showToast("✅ Post approved");
      if (from==="flagged")  setFlaggedPosts(p=>p.filter(x=>x._id!==id));
      if (from==="reported") setReportedPosts(p=>p.filter(x=>x._id!==id));
      fetchStats();
    } catch {}
  };

  const removeComment = async (id) => {
    const ok = await askConfirm("Remove this comment?");
    if (!ok) return;
    try { await api.put(`/admin/comments/${id}/remove`); showToast("✅ Comment removed"); setFlaggedComments(c=>c.filter(x=>x._id!==id)); fetchStats(); }
    catch {}
  };

  const timeAgo = (d) => {
    const s = Math.floor((Date.now()-new Date(d))/1000);
    if (s<60) return `${s}s ago`;
    if (s<3600) return `${Math.floor(s/60)}m ago`;
    return `${Math.floor(s/3600)}h ago`;
  };

  if (!user || role !== "admin") return null;

  const navItems = [
    { id:"dashboard",        label:"📊  Dashboard",         badge:null },
    { id:"users",            label:"👥  Users",             badge:null },
    { id:"flagged-posts",    label:"🚩  Flagged Posts",     badge:stats?.flaggedPosts },
    { id:"reported-posts",   label:"📋  Reported Posts",    badge:stats?.reportedPosts },
    { id:"flagged-comments", label:"💬  Flagged Comments",  badge:stats?.flaggedComments },
    { id:"all-posts",        label:"📝  All Posts",         badge:null },
  ];

  return (
    <>
      <Navbar />
      {confirm && <ConfirmModal message={confirm.msg} onConfirm={handleConfirm} onCancel={handleCancel} />}
      {toast && <div style={S.toast}>{toast}</div>}

      <div style={S.wrap}>
        {/* SIDEBAR */}
        <aside style={S.sidebar}>
          <div style={S.brand}>🛡️ Admin Panel</div>
          {navItems.map(({id,label,badge}) => (
            <div key={id}
              style={tab===id ? S.navActive : S.navItem}
              onClick={() => loadTab(id)}
              onMouseEnter={e => { if(tab!==id) { e.currentTarget.style.background="#334155"; e.currentTarget.style.color="#fff"; }}}
              onMouseLeave={e => { if(tab!==id) { e.currentTarget.style.background=""; e.currentTarget.style.color="#94a3b8"; }}}>
              <span>{label}</span>
              {badge > 0 && <span style={S.badge}>{badge}</span>}
            </div>
          ))}
          <div style={{...S.navItem, marginTop:16, borderTop:"1px solid #334155", paddingTop:16}}
            onClick={() => navigate("/")}>← Back to Echo</div>
        </aside>

        {/* MAIN */}
        <main style={S.main}>

          {/* DASHBOARD */}
          {tab==="dashboard" && (
            <>
              <div style={S.title}>Dashboard</div>
              <div style={S.grid}>
                {[
                  {icon:"👥", val:stats?.users,           lbl:"Total Users",       color:"#3b82f6"},
                  {icon:"📝", val:stats?.posts,           lbl:"Total Posts",       color:"#10b981"},
                  {icon:"💬", val:stats?.comments,        lbl:"Comments",          color:"#8b5cf6"},
                  {icon:"🏘️", val:stats?.communities,     lbl:"Communities",       color:"#f59e0b"},
                  {icon:"🚩", val:stats?.flaggedPosts,    lbl:"Flagged Posts",     color:"#ef4444"},
                  {icon:"📋", val:stats?.reportedPosts,   lbl:"Reported Posts",    color:"#f97316"},
                  {icon:"⚠️", val:stats?.flaggedComments, lbl:"Flagged Comments",  color:"#ec4899"},
                  {icon:"🚫", val:stats?.bannedUsers,     lbl:"Banned Users",      color:"#6b7280"},
                ].map(({icon,val,lbl,color}) => (
                  <div key={lbl} style={{...S.card, borderTop:`4px solid ${color}`}}>
                    <div style={S.statIcon}>{icon}</div>
                    <div style={{...S.statVal, color}}>{val ?? "..."}</div>
                    <div style={S.statLbl}>{lbl}</div>
                  </div>
                ))}
              </div>
              <div style={S.panel}>
                <div style={{fontSize:14,fontWeight:600,color:"#111827",marginBottom:12}}>Quick Actions</div>
                <button style={S.btnBlue}   onClick={()=>loadTab("flagged-posts")}>🚩 Flagged ({stats?.flaggedPosts||0})</button>
                <button style={S.btnOrange} onClick={()=>loadTab("reported-posts")}>📋 Reports ({stats?.reportedPosts||0})</button>
                <button style={S.btnRed}    onClick={()=>loadTab("flagged-comments")}>💬 Comments ({stats?.flaggedComments||0})</button>
                <button style={S.btnGray}   onClick={()=>loadTab("users")}>👥 Users</button>
              </div>
            </>
          )}

          {/* USERS */}
          {tab==="users" && (
            <>
              <div style={S.title}>👥 Users</div>
              <div style={{display:"flex",gap:10,marginBottom:16}}>
                <input style={S.search} placeholder="Search by name, email or username..." value={search}
                  onChange={e=>setSearch(e.target.value)} onKeyDown={e=>e.key==="Enter"&&loadTab("users")} />
                <button style={S.btnBlue} onClick={()=>loadTab("users")}>Search</button>
              </div>
              {loading ? <div style={{color:"#9ca3af",padding:20}}>Loading...</div> : (
                <div style={S.panel}>
                  <table style={S.table}>
                    <thead>
                      <tr>
                        {["User","Email","Role","Verified","Warnings","Status","Joined","Action"].map(h=>(
                          <th key={h} style={S.th}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(u => (
                        <tr key={u._id} style={{background:u.isBanned?"#fef2f2":"#fff"}}>
                          <td style={S.td}>
                            <div style={{fontWeight:600}}>@{u.username}</div>
                            <div style={{fontSize:11,color:"#6b7280"}}>{u.firstName} {u.lastName}</div>
                          </td>
                          <td style={{...S.td,fontSize:12}}>{u.email}</td>
                          <td style={S.td}>
                            <span style={{padding:"2px 8px",borderRadius:10,fontSize:11,fontWeight:600,
                              background:u.role==="admin"?"#eff6ff":u.role==="moderator"?"#f0fdf4":"#f3f4f6",
                              color:u.role==="admin"?"#1e40af":u.role==="moderator"?"#166534":"#374151"}}>
                              {u.role}
                            </span>
                          </td>
                          <td style={{...S.td,textAlign:"center"}}>{u.isEmailVerified?"✅":"❌"}</td>
                          <td style={{...S.td,textAlign:"center",color:u.warnings>0?"#ef4444":"#374151",fontWeight:u.warnings>0?700:400}}>{u.warnings||0}</td>
                          <td style={S.td}>
                            <span style={{padding:"2px 8px",borderRadius:8,fontSize:11,fontWeight:500,
                              background:u.isBanned?"#fef2f2":"#f0fdf4",color:u.isBanned?"#991b1b":"#166534"}}>
                              {u.isBanned?"Banned":"Active"}
                            </span>
                          </td>
                          <td style={{...S.td,fontSize:11,color:"#9ca3af"}}>{timeAgo(u.createdAt)}</td>
                          <td style={S.td}>
                            {u.isBanned
                              ? <button style={{...S.btnGreen,padding:"4px 10px",fontSize:11}} onClick={()=>unbanUser(u._id,u.username)}>Unban</button>
                              : <button style={{...S.btnRed,padding:"4px 10px",fontSize:11}} onClick={()=>banUser(u._id,u.username)}>Ban</button>
                            }
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {users.length===0 && <div style={{textAlign:"center",padding:30,color:"#9ca3af"}}>No users found</div>}
                </div>
              )}
            </>
          )}

          {/* FLAGGED POSTS */}
          {tab==="flagged-posts" && (
            <>
              <div style={S.title}>🚩 Flagged Posts</div>
              {loading ? <div style={{color:"#9ca3af",padding:20}}>Loading...</div> :
                flaggedPosts.length===0 ? <div style={S.emptyBox}>✅ No flagged posts!</div> :
                flaggedPosts.map(p => (
                  <div key={p._id} style={S.flagCard}>
                    <div style={{fontWeight:600,fontSize:15,color:"#111827",marginBottom:4}}>{p.title}</div>
                    <div style={{fontSize:12,color:"#6b7280",marginBottom:8}}>by @{p.author?.username} in c/{p.community?.name} · {timeAgo(p.createdAt)}</div>
                    <p style={{fontSize:13,color:"#374151",marginBottom:8,lineHeight:1.5}}>{p.content?.substring(0,200)}{p.content?.length>200?"...":""}</p>
                    <div style={S.reasonBox}>⚠️ {p.flagReason}</div>
                    <div style={{display:"flex",gap:8}}>
                      <button style={S.btnGreen} onClick={()=>approvePost(p._id,"flagged")}>✅ Approve</button>
                      <button style={S.btnRed}   onClick={()=>removePost(p._id,"flagged")}>🗑️ Remove</button>
                    </div>
                  </div>
                ))
              }
            </>
          )}

          {/* REPORTED POSTS */}
          {tab==="reported-posts" && (
            <>
              <div style={S.title}>📋 Reported Posts</div>
              {loading ? <div style={{color:"#9ca3af",padding:20}}>Loading...</div> :
                reportedPosts.length===0 ? <div style={S.emptyBox}>✅ No reported posts!</div> :
                reportedPosts.map(p => (
                  <div key={p._id} style={S.repCard}>
                    <div style={{fontWeight:600,fontSize:15,color:"#111827",marginBottom:4}}>{p.title}</div>
                    <div style={{fontSize:12,color:"#6b7280",marginBottom:8}}>by @{p.author?.username} · {p.reports?.length} report(s) · {timeAgo(p.createdAt)}</div>
                    <p style={{fontSize:13,color:"#374151",marginBottom:8}}>{p.content?.substring(0,200)}{p.content?.length>200?"...":""}</p>
                    <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:10}}>
                      {p.reports?.map((r,i)=>(
                        <span key={i} style={{padding:"2px 8px",borderRadius:8,background:"#fef2f2",color:"#991b1b",border:"1px solid #fecaca",fontSize:11}}>🚩 {r.reason}</span>
                      ))}
                    </div>
                    <div style={{display:"flex",gap:8}}>
                      <button style={S.btnGreen} onClick={()=>approvePost(p._id,"reported")}>✅ Clear Reports</button>
                      <button style={S.btnRed}   onClick={()=>removePost(p._id,"reported")}>🗑️ Remove</button>
                    </div>
                  </div>
                ))
              }
            </>
          )}

          {/* FLAGGED COMMENTS */}
          {tab==="flagged-comments" && (
            <>
              <div style={S.title}>💬 Flagged Comments</div>
              {loading ? <div style={{color:"#9ca3af",padding:20}}>Loading...</div> :
                flaggedComments.length===0 ? <div style={S.emptyBox}>✅ No flagged comments!</div> :
                flaggedComments.map(c => (
                  <div key={c._id} style={S.commCard}>
                    <div style={{fontSize:12,color:"#6b7280",marginBottom:6}}>by @{c.author?.username} on "{c.post?.title?.substring(0,50)}" · {timeAgo(c.createdAt)}</div>
                    <div style={{background:"#fef2f2",border:"1px solid #fecaca",borderRadius:8,padding:"8px 12px",fontSize:13,color:"#7f1d1d",marginBottom:8}}>"{c.content}"</div>
                    <div style={S.reasonBox}>⚠️ {c.flagReason}</div>
                    <button style={S.btnRed} onClick={()=>removeComment(c._id)}>🗑️ Remove Comment</button>
                  </div>
                ))
              }
            </>
          )}

          {/* ALL POSTS */}
          {tab==="all-posts" && (
            <>
              <div style={S.title}>📝 All Posts</div>
              {loading ? <div style={{color:"#9ca3af",padding:20}}>Loading...</div> : (
                <div style={S.panel}>
                  <table style={S.table}>
                    <thead>
                      <tr>{["Title","Author","Community","Likes","Status","Date","Action"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr>
                    </thead>
                    <tbody>
                      {allPosts.map(p=>(
                        <tr key={p._id}>
                          <td style={{...S.td,maxWidth:200,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontWeight:500}}>{p.title}</td>
                          <td style={{...S.td,fontSize:12}}>@{p.author?.username}</td>
                          <td style={S.td}><span style={{background:(p.community?.color||"#2563eb")+"20",color:p.community?.color||"#2563eb",padding:"2px 8px",borderRadius:10,fontSize:11,fontWeight:500}}>c/{p.community?.name}</span></td>
                          <td style={{...S.td,textAlign:"center"}}>❤️ {p.likes?.length||0}</td>
                          <td style={S.td}>{p.isFlagged?<span style={{background:"#fef2f2",color:"#991b1b",padding:"2px 7px",borderRadius:8,fontSize:11}}>Flagged</span>:<span style={{background:"#f0fdf4",color:"#166534",padding:"2px 7px",borderRadius:8,fontSize:11}}>OK</span>}</td>
                          <td style={{...S.td,fontSize:11,color:"#9ca3af"}}>{timeAgo(p.createdAt)}</td>
                          <td style={S.td}><button style={{...S.btnRed,padding:"4px 10px",fontSize:11}} onClick={()=>removePost(p._id,"all")}>Remove</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {allPosts.length===0&&<div style={{textAlign:"center",padding:30,color:"#9ca3af"}}>No posts</div>}
                </div>
              )}
            </>
          )}

        </main>
      </div>
    </>
  );
}
