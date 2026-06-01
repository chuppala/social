import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import Navbar       from "../components/layout/Navbar";
import Sidebar      from "../components/layout/Sidebar";
import Rightbar     from "../components/layout/Rightbar";
import PostCard     from "../components/posts/PostCard";
import CreatePost   from "../components/posts/CreatePost";
import "../styles/layout.css";
import "../styles/posts.css";

export default function Home() {
  const { user } = useAuth();
  const [posts,       setPosts]       = useState([]);
  const [communities, setCommunities] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [sort,        setSort]        = useState("new");
  const [search,      setSearch]      = useState("");

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/posts", { params: { sort, limit: 30 } });
      setPosts(res.data.posts || []);
    } catch {}
    finally { setLoading(false); }
  }, [sort]);

  const fetchCommunities = async () => {
    try {
      const res = await api.get("/communities");
      setCommunities(res.data.communities || []);
    } catch {}
  };

  useEffect(() => { fetchPosts(); }, [fetchPosts]);
  useEffect(() => { fetchCommunities(); }, []);

  const handlePostCreated = (post) => setPosts(p => [post, ...p]);
  const handlePostUpdate  = (updated) => setPosts(p => p.map(x => x._id === updated._id ? updated : x));

  const filtered = search
    ? posts.filter(p =>
        p.title?.toLowerCase().includes(search.toLowerCase()) ||
        p.content?.toLowerCase().includes(search.toLowerCase())
      )
    : posts;

  return (
    <>
      <Navbar onSearch={setSearch} />
      <div className="page-layout">
        <Sidebar communities={communities} />

        <main>
          {user && <CreatePost communities={communities} onCreated={handlePostCreated} />}

          <div className="feed-tabs">
            {["new","popular","top"].map(t => (
              <button key={t} className={`ftab ${sort===t?"active":""}`} onClick={() => setSort(t)}>
                {t.charAt(0).toUpperCase()+t.slice(1)}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="loading-state">Loading posts...</div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <h3>{search ? "No posts match your search" : "No posts yet"}</h3>
              <p>{search ? "Try a different keyword" : "Be the first to post in a community!"}</p>
            </div>
          ) : (
            filtered.map(p => <PostCard key={p._id} post={p} onUpdate={handlePostUpdate} />)
          )}
        </main>

        <Rightbar communities={communities} onCommunitiesUpdate={fetchCommunities} />
      </div>
    </>
  );
}
