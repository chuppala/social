const express = require("express");
const router  = express.Router();
const Post    = require("../models/Post");
const Comment = require("../models/Comment");
const User    = require("../models/User");
const Community = require("../models/Community");
const { protect, optionalAuth, requireVerified } = require("../middleware/auth");
const { moderateContent } = require("../middleware/moderation");

const CATEGORY_KEYWORDS = {
  
  "Travel": [
    "travel","trip","tour","vacation","hotel","flight","beach","mountain"
  ],


  "Food and Cooking": [
    "food","recipe","cooking","kitchen","meal","restaurant","dish","cook"
  ],

  "Sports": [
    "sports","cricket","football","tennis","match","player","team","ipl"
  ],

  "Fashion": [
    "fashion","dress","style","outfit","clothes","trend","wear"
  ],

  "Art and Design": [
    "art","design","drawing","painting","illustration","ui","ux","logo"
  ],

  "Business and Entrepreneurship": [
    "business","startup","entrepreneur","investment","revenue","marketing"
  ],

  "Education": [
    "study","education","college","school","exam","learning","student"
  ],

  "Programming": [
    "code","programming","javascript","python","react","node","mongodb"
  ],

  "Health and Fitness": [
    "health","fitness","exercise","workout","diet","gym","nutrition"
  ],
};

router.get("/", optionalAuth, async (req, res) => {
  try {
    const { community, sort="new", page=1, limit=20 } = req.query;
    const filter = { isRemoved:false };
    if (community) filter.community = community;
    let posts = await Post.find(filter)
      .sort({ createdAt:-1 }).skip((page-1)*limit).limit(Number(limit))
      .populate("author","firstName lastName username avatar")
      .populate("community","name color").lean();
    const ids    = posts.map(p=>p._id);
    const counts = await Comment.aggregate([{ $match:{ post:{ $in:ids }, isRemoved:false } },{ $group:{ _id:"$post", count:{ $sum:1 } } }]);
    const cmap   = {}; counts.forEach(c=>{ cmap[c._id.toString()]=c.count; });
    posts = posts.map(p=>({ ...p, commentCount:cmap[p._id.toString()]||0 }));
    if (sort==="popular") posts.sort((a,b)=>b.likes.length-a.likes.length);
    res.json({ posts });
  } catch (e) { console.error("GET POSTS:",e.message); res.status(500).json({ message:"Server error." }); }
});

router.get("/:id", optionalAuth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate("author","firstName lastName username").populate("community","name color");
    if (!post||post.isRemoved) return res.status(404).json({ message:"Post not found." });
    res.json({ post });
  } catch { res.status(500).json({ message:"Server error." }); }
});

router.post("/", protect, requireVerified, async (req, res) => {
  try {
    const { title, content, community, tag, image } = req.body;
    if (!title?.trim()||!content?.trim()||!community)
      return res.status(400).json({ message:"Title, content, and community are required." });
    const mod  = await moderateContent(title + " " + content);
    let offTopic = false, offTopicWarning = null;
    const comm = await Community.findById(community);
    if (comm && CATEGORY_KEYWORDS[comm.name]) {
      const kws  = CATEGORY_KEYWORDS[comm.name];
      const text = (title+" "+content).toLowerCase();
      if (!kws.some(k=>text.includes(k))) {
        offTopic = true;
        offTopicWarning = `⚠️ This post doesn't seem related to "${comm.name}". It may not get much engagement here.`;
      }
    }
    const post = await Post.create({ author:req.user._id, community, title:title.trim(), content:content.trim(), tag:tag||"", image,isFlagged:mod.isFlagged||offTopic, flagReason:mod.reason||offTopicWarning||"" });
    const populated = await Post.findById(post._id).populate("author","firstName lastName username avatar").populate("community","name color");
    res.status(201).json({ post:populated, flagged:mod.isFlagged, flagReason:mod.reason, severity:mod.severity, offTopic, offTopicWarning });
  } catch (e) { console.error("CREATE POST:",e.message); res.status(500).json({ message:"Server error." }); }
});

router.delete("/:id", protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message:"Not found." });
    if (post.author.toString()!==req.user._id.toString()&&req.user.role!=="admin")
      return res.status(403).json({ message:"Not authorised." });
    post.isRemoved=true; await post.save();
    res.json({ message:"Post removed." });
  } catch { res.status(500).json({ message:"Server error." }); }
});

router.post("/:id/like", protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post||post.isRemoved) return res.status(404).json({ message:"Not found." });
    const idx = post.likes.findIndex(id=>id.toString()===req.user._id.toString());
    idx===-1 ? post.likes.push(req.user._id) : post.likes.splice(idx,1);
    await post.save();
    res.json({ likes:post.likes.length, liked:idx===-1 });
  } catch { res.status(500).json({ message:"Server error." }); }
});

router.post("/:id/save", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const idx  = user.savedPosts.findIndex(id=>id.toString()===req.params.id);
    idx===-1 ? user.savedPosts.push(req.params.id) : user.savedPosts.splice(idx,1);
    await user.save();
    res.json({ saved:idx===-1 });
  } catch { res.status(500).json({ message:"Server error." }); }
});

router.post("/:id/report", protect, async (req, res) => {
  try {
    const { reason, details } = req.body;
    if (!reason) return res.status(400).json({ message:"Reason required." });
    const post = await Post.findById(req.params.id);
    if (post.author.toString() === req.user._id.toString()) {
  return res.status(400).json({
    message: "You cannot report your own post."
  });
}
    if (!post||post.isRemoved) return res.status(404).json({ message:"Not found." });
    if (post.reports.some(r=>r.reportedBy.toString()===req.user._id.toString()))
      return res.status(400).json({ message:"Already reported." });
    post.reports.push({ reportedBy:req.user._id, reason, details:details||"" });
    if (post.reports.length>=3) { post.isFlagged=true; post.flagReason="Multiple user reports"; }
    await post.save();
    res.json({ message:"Report submitted. Our team will review it." });
  } catch { res.status(500).json({ message:"Server error." }); }
});

module.exports = router;
