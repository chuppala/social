import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/layout/Navbar";
import PostCard from "../components/posts/PostCard";
import "../styles/layout.css";
import "../styles/posts.css";

const INTERESTS = ["Technology","Design","Gaming","Science","Photography","Startups","Music","Career","Sports","Art"];

export default function Profile() {
  const { username } = useParams();
  const { user, setUser } = useAuth();
  const fileRef = useRef();

  const [profile,       setProfile]       = useState(null);
  const [posts,         setPosts]         = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [following,     setFollowing]     = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [editMode,      setEditMode]      = useState(false);
  const [saving,        setSaving]        = useState(false);
  const [toast,         setToast]         = useState("");
  const [uploadingImg,  setUploadingImg]  = useState(false);

  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName,  setEditLastName]  = useState("");
  const [editBio,       setEditBio]       = useState("");
  const [editInterests, setEditInterests] = useState([]);

  const isMe = user?.username === username;

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  useEffect(() => {
    setLoading(true);
    api.get("/users/" + username)
      .then(r => {
        setProfile(r.data.user);
        setPosts(r.data.posts || []);
        setFollowerCount(r.data.user.followers?.length || 0);
        if (user && r.data.user.followers?.some(f => (f._id||f).toString() === user._id)) {
          setFollowing(true);
        }
      })
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, [username]);

  const openEdit = () => {
    setEditFirstName(profile.firstName || "");
    setEditLastName(profile.lastName   || "");
    setEditBio(profile.bio             || "");
    setEditInterests(profile.interests || []);
    setEditMode(true);
  };

  const toggleInterest = (i) =>
    setEditInterests(prev => prev.includes(i) ? prev.filter(x => x !== i) : prev.length < 3 ? [...prev, i] : prev);

  const saveProfile = async () => {
    setSaving(true);
    try {
      const res = await api.put("/users/me/update", {
        firstName: editFirstName,
        lastName:  editLastName,
        bio:       editBio,
        interests: editInterests,
      });
      const updated = res.data.user;
      setProfile(prev => ({ ...prev, ...updated }));
      const newUser = { ...user, firstName: updated.firstName, lastName: updated.lastName, bio: updated.bio, interests: updated.interests };
      localStorage.setItem("echo_user", JSON.stringify(newUser));
      if (setUser) setUser(newUser);
      setEditMode(false);
      showToast("✅ Profile updated!");
    } catch (e) {
      showToast("❌ " + (e.response?.data?.message || "Failed to update"));
    } finally { setSaving(false); }
  };

  // Convert image to base64 and save as avatar
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { showToast("❌ Image must be under 2MB"); return; }
    setUploadingImg(true);
    try {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const base64 = ev.target.result;
        const res = await api.put("/users/me/update", { avatar: base64 });
        setProfile(prev => ({ ...prev, avatar: base64 }));
        const newUser = { ...user, avatar: base64 };
        localStorage.setItem("echo_user", JSON.stringify(newUser));
        if (setUser) setUser(newUser);
        showToast("✅ Profile picture updated!");
        setUploadingImg(false);
      };
      reader.readAsDataURL(file);
    } catch {
      showToast("❌ Failed to upload image");
      setUploadingImg(false);
    }
  };

  const handleFollow = async () => {
    if (!user) return;
    try {
      const res = await api.post("/users/" + profile._id + "/follow");
      setFollowing(res.data.following);
      setFollowerCount(res.data.followerCount);
      showToast(res.data.following ? "✅ Following @" + profile.username : "Unfollowed @" + profile.username);
    } catch (e) {
      showToast("❌ " + (e.response?.data?.message || "Failed"));
    }
  };

  const handlePostDelete = (postId) => {
    setPosts(prev => prev.filter(p => p._id !== postId));
  };

  if (loading) return (<><Navbar /><div style={{padding:60,textAlign:"center",color:"#9ca3af"}}>Loading...</div></>);
  if (!profile) return (<><Navbar /><div style={{padding:60,textAlign:"center",color:"#ef4444"}}>User not found.</div></>);

  return (
    <>
      <Navbar />
      {toast && (
        <div style={{position:"fixed",bottom:24,right:24,background:"#111827",color:"#fff",
          padding:"12px 20px",borderRadius:10,fontSize:13,zIndex:9999,
          boxShadow:"0 4px 20px rgba(0,0,0,.2)"}}>
          {toast}
        </div>
      )}

      <div style={{maxWidth:700,margin:"28px auto",padding:"0 16px"}}>

        {/* Profile Card */}
        <div style={{background:"#fff",border:"1px solid #e5e7eb",borderRadius:12,
          padding:24,marginBottom:16,boxShadow:"0 1px 8px rgba(0,0,0,.04)"}}>

          {/* Avatar + Name row */}
          <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:16}}>

            {/* Avatar with upload */}
            <div style={{position:"relative",flexShrink:0}}>
              <div style={{width:72,height:72,borderRadius:"50%",overflow:"hidden",
                background:"linear-gradient(135deg,#2563eb,#7c3aed)",
                display:"flex",alignItems:"center",justifyContent:"center",
                fontSize:28,fontWeight:700,color:"#fff",cursor:isMe?"pointer":"default"}}
                onClick={() => isMe && fileRef.current?.click()}>
                {profile.avatar
                  ? <img src={profile.avatar} alt={profile.firstName}
                      style={{width:"100%",height:"100%",objectFit:"cover"}} />
                  : (profile.firstName || "?")?.[0]?.toUpperCase()
                }
              </div>
              {isMe && (
                <div onClick={() => fileRef.current?.click()}
                  style={{position:"absolute",bottom:0,right:0,width:22,height:22,
                    borderRadius:"50%",background:"#2563eb",color:"#fff",
                    display:"flex",alignItems:"center",justifyContent:"center",
                    fontSize:12,cursor:"pointer",border:"2px solid #fff",
                    boxShadow:"0 1px 4px rgba(0,0,0,.2)"}}>
                  {uploadingImg ? "⏳" : "📷"}
                </div>
              )}
              <input ref={fileRef} type="file" accept="image/*"
                style={{display:"none"}} onChange={handleImageUpload} />
            </div>

            {/* Name + username */}
            <div style={{flex:1}}>
              <div style={{fontSize:20,fontWeight:700,color:"#111827"}}>
                {profile.firstName} {profile.lastName}
              </div>
              <div style={{fontSize:13,color:"#6b7280",marginTop:2}}>@{profile.username}</div>
              {profile.role && profile.role !== "user" && (
                <span style={{display:"inline-block",marginTop:4,padding:"2px 8px",
                  borderRadius:10,background:"#eff6ff",color:"#1e40af",
                  fontSize:11,fontWeight:600}}>{profile.role}</span>
              )}
            </div>

            {/* Action button */}
            <div>
              {isMe ? (
                <button onClick={openEdit}
                  style={{padding:"8px 16px",borderRadius:8,border:"1px solid #d1d5db",
                    background:"#fff",fontSize:13,fontWeight:500,color:"#374151",cursor:"pointer"}}>
                  ✏️ Edit Profile
                </button>
              ) : user ? (
                <button onClick={handleFollow}
                  style={{padding:"8px 18px",borderRadius:8,
                    border:following?"1px solid #d1d5db":"none",
                    background:following?"#fff":"#2563eb",
                    color:following?"#374151":"#fff",
                    fontSize:13,fontWeight:600,cursor:"pointer"}}>
                  {following ? "✓ Following" : "+ Follow"}
                </button>
              ) : null}
            </div>
          </div>

          {/* Bio */}
          {profile.bio
            ? <p style={{fontSize:13,color:"#374151",lineHeight:1.7,
                background:"#f9fafb",padding:"10px 14px",borderRadius:8,marginBottom:14}}>
                {profile.bio}
              </p>
            : isMe && <p style={{fontSize:12,color:"#9ca3af",fontStyle:"italic",marginBottom:14}}>
                No bio yet — click Edit Profile to add one.
              </p>
          }

          {/* Stats */}
          <div style={{display:"flex",borderTop:"1px solid #f3f4f6",
            borderBottom:"1px solid #f3f4f6",padding:"12px 0",marginBottom:14}}>
            {[{label:"Posts",value:posts.length},{label:"Followers",value:followerCount},{label:"Following",value:profile.following?.length||0}]
              .map(s => (
                <div key={s.label} style={{flex:1,textAlign:"center"}}>
                  <div style={{fontSize:20,fontWeight:700,color:"#111827"}}>{s.value}</div>
                  <div style={{fontSize:12,color:"#6b7280",marginTop:2}}>{s.label}</div>
                </div>
              ))}
          </div>

          {/* Interests */}
          {profile.interests?.length > 0 && (
            <div style={{marginBottom:10}}>
              <div style={{fontSize:11,fontWeight:600,color:"#9ca3af",
                textTransform:"uppercase",letterSpacing:".06em",marginBottom:6}}>Interests</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                {profile.interests.map(i => (
                  <span key={i} style={{padding:"4px 12px",borderRadius:12,
                    background:"#eff6ff",color:"#1e40af",fontSize:12,fontWeight:500}}>{i}</span>
                ))}
              </div>
            </div>
          )}

          {/* Upload hint */}
          {isMe && (
            <div style={{fontSize:11,color:"#9ca3af",marginTop:8}}>
              📷 Click your avatar to upload a profile picture
            </div>
          )}
        </div>

        {/* Posts */}
        <div style={{fontSize:14,fontWeight:600,color:"#374151",marginBottom:10}}>
          Posts by @{profile.username} ({posts.length})
        </div>
        {posts.length === 0
          ? <div style={{background:"#fff",border:"1px solid #e5e7eb",borderRadius:10,
              padding:40,textAlign:"center",color:"#9ca3af"}}>
              {isMe ? "You haven't posted yet. Create your first post!" : "No posts yet."}
            </div>
          : posts.map(p => <PostCard key={p._id} post={p} onDelete={handlePostDelete} />)
        }
      </div>

      {/* Edit Profile Modal */}
      {editMode && (
        <div onClick={e => { if (e.target === e.currentTarget) setEditMode(false); }}
          style={{position:"fixed",inset:0,background:"rgba(0,0,0,.55)",
            zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
          <div style={{background:"#fff",borderRadius:14,width:"100%",maxWidth:460,
            padding:24,maxHeight:"90vh",overflowY:"auto"}}>

            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
              <div style={{fontSize:16,fontWeight:700,color:"#111827"}}>Edit Profile</div>
              <button onClick={() => setEditMode(false)}
                style={{fontSize:22,color:"#9ca3af",background:"none",border:"none",cursor:"pointer"}}>×</button>
            </div>

            <div style={{marginBottom:12}}>
              <label style={{display:"block",fontSize:12,fontWeight:500,color:"#374151",marginBottom:5}}>First Name</label>
              <input value={editFirstName} onChange={e => setEditFirstName(e.target.value)}
                style={{width:"100%",border:"1px solid #d1d5db",borderRadius:8,
                  padding:"9px 11px",fontSize:13,outline:"none",boxSizing:"border-box"}} />
            </div>

            <div style={{marginBottom:12}}>
              <label style={{display:"block",fontSize:12,fontWeight:500,color:"#374151",marginBottom:5}}>Last Name</label>
              <input value={editLastName} onChange={e => setEditLastName(e.target.value)}
                style={{width:"100%",border:"1px solid #d1d5db",borderRadius:8,
                  padding:"9px 11px",fontSize:13,outline:"none",boxSizing:"border-box"}} />
            </div>

            <div style={{marginBottom:12}}>
              <label style={{display:"block",fontSize:12,fontWeight:500,color:"#374151",marginBottom:5}}>Bio</label>
              <textarea value={editBio} onChange={e => setEditBio(e.target.value)}
                placeholder="Tell people about yourself..." rows={3}
                style={{width:"100%",border:"1px solid #d1d5db",borderRadius:8,
                  padding:"9px 11px",fontSize:13,outline:"none",resize:"none",
                  fontFamily:"inherit",boxSizing:"border-box"}} />
            </div>

            <div style={{marginBottom:20}}>
              <label style={{display:"block",fontSize:12,fontWeight:500,color:"#374151",marginBottom:7}}>
                Interests <span style={{color:"#9ca3af",fontWeight:400}}>(pick up to 3)</span>
              </label>
              <div style={{display:"flex",flexWrap:"wrap",gap:7}}>
                {INTERESTS.map(i => (
                  <span key={i} onClick={() => toggleInterest(i)}
                    style={{padding:"6px 14px",borderRadius:14,fontSize:12,cursor:"pointer",
                      border:editInterests.includes(i)?"1px solid #93c5fd":"1px solid #e5e7eb",
                      background:editInterests.includes(i)?"#eff6ff":"#fff",
                      color:editInterests.includes(i)?"#1e40af":"#374151",
                      fontWeight:editInterests.includes(i)?600:400}}>
                    {i}
                  </span>
                ))}
              </div>
            </div>

            <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
              <button onClick={() => setEditMode(false)}
                style={{padding:"9px 18px",borderRadius:8,border:"1px solid #d1d5db",
                  background:"#fff",fontSize:13,cursor:"pointer"}}>Cancel</button>
              <button onClick={saveProfile} disabled={saving}
                style={{padding:"9px 20px",borderRadius:8,
                  background:saving?"#93c5fd":"#2563eb",color:"#fff",
                  fontSize:13,fontWeight:600,border:"none",cursor:saving?"not-allowed":"pointer"}}>
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
