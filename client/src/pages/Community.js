import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";
import Navbar   from "../components/layout/Navbar";
import PostCard from "../components/posts/PostCard";
import CreatePost from "../components/posts/CreatePost";
import "../styles/layout.css";
import "../styles/posts.css";

export default function Community() {
  const { name }   = useParams();
  const { user }   = useAuth();
  const [community,    setCommunity]    = useState(null);
  const [posts,        setPosts]        = useState([]);
  const [communities,  setCommunities]  = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [joined,       setJoined]       = useState(false);
  const [memberCount,  setMemberCount]  = useState(0);

  useEffect(() => {
    Promise.all([
      api.get(`/communities/${name}`),
      api.get("/posts", { params: { sort: "new", limit: 30 } }),
      api.get("/communities"),
    ]).then(([cr, pr, allr]) => {
      const c = cr.data.community;
      setCommunity(c);
      setMemberCount(c.memberCount || c.members?.length || 0);
      setJoined(user ? c.members?.some(m => (m._id||m) === user._id) : false);
      setPosts((pr.data.posts||[]).filter(p => p.community?._id === c._id || p.community === c._id));
      setCommunities(allr.data.communities || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [name, user]);

  const handleJoinToggle = async () => {
    if (!user || !community) return;
    try {
      const res = await api.post(`/communities/${community._id}/join`);
      setJoined(res.data.joined);
      setMemberCount(res.data.memberCount);

      window.location.reload();
    } catch {}
  };

  const handlePostCreated = (p) => setPosts(arr => [p, ...arr]);

  if (loading) return (<><Navbar /><div style={{padding:40,textAlign:"center",color:"#9ca3af"}}>Loading...</div></>);
  if (!community) return (<><Navbar /><div style={{padding:40,textAlign:"center",color:"#ef4444"}}>Community not found.</div></>);

  return (
    <>
      <Navbar />
      <div style={{background:community.color||"#2563eb",padding:"24px 20px"}}>
        <div style={{maxWidth:1080,margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div>
            <div style={{fontSize:22,fontWeight:700,color:"#fff"}}>c/{community.name}</div>
            <div style={{fontSize:13,color:"rgba(255,255,255,.8)",marginTop:4}}>{community.description}</div>
            <div style={{fontSize:12,color:"rgba(255,255,255,.7)",marginTop:6}}>{memberCount} members</div>
          </div>
          {user && (
            <button
  onClick={handleJoinToggle}
  style={{
    padding:"8px 20px",
    borderRadius:20,
    fontWeight:600,
    fontSize:13,
    border:"2px solid #fff",
    background: joined ? "#ef4444" : "#fff",
    color: joined ? "#fff" : (community.color || "#2563eb"),
    cursor:"pointer"
  }}
>
  {joined ? "Leave Community" : "Join Community"}
</button>
          )}
        </div>
      </div>

      <div style={{maxWidth:720,margin:"20px auto",padding:"0 16px"}}>
        {user && joined && <CreatePost communities={communities} onCreated={handlePostCreated} />}
        {posts.length === 0
          ? <div className="empty-state"><h3>No posts in c/{community.name} yet</h3><p>Join and be the first to post!</p></div>
          : posts.map(p => <PostCard key={p._id} post={p} />)
        }
      </div>
    </>
  );
}
