import React, { useState, useEffect } from "react";
import api from "../utils/api";
import Navbar   from "../components/layout/Navbar";
import PostCard from "../components/posts/PostCard";
import "../styles/layout.css";
import "../styles/posts.css";

export default function SavedPosts() {
  const [posts,   setPosts]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/users/me/saved")
      .then(r => setPosts(r.data.posts || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <Navbar />
      <div style={{maxWidth:720,margin:"24px auto",padding:"0 16px"}}>
        <h2 style={{fontSize:18,fontWeight:700,color:"#111827",marginBottom:16}}>🔖 Saved Posts</h2>
        {loading ? (
          <div className="loading-state">Loading...</div>
        ) : posts.length === 0 ? (
          <div className="empty-state"><h3>No saved posts yet</h3><p>Hit the bookmark icon on any post to save it here.</p></div>
        ) : (
          posts.map(p => <PostCard key={p._id} post={p} />)
        )}
      </div>
    </>
  );
}
