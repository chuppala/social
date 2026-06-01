const express = require("express");
const router  = express.Router();
const Comment = require("../models/Comment");
const User    = require("../models/User");
const { protect, requireVerified } = require("../middleware/auth");
const { moderateContent } = require("../middleware/moderation");

router.get("/:postId", async (req, res) => {
  try {
    const comments = await Comment.find({ post:req.params.postId, isRemoved:false })
      .sort({ createdAt:1 }).populate("author","firstName lastName username avatar");
    res.json({ comments });
  } catch { res.status(500).json({ message:"Server error." }); }
});

router.post("/:postId", protect, requireVerified, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ message:"Comment cannot be empty." });
    const mod = await moderateContent(content);
    const comment = await Comment.create({ post:req.params.postId, author:req.user._id, content:content.trim(), isFlagged:mod.isFlagged, flagReason:mod.reason||"" });
    if (mod.isFlagged) await User.findByIdAndUpdate(req.user._id, { $inc:{ warnings:1 } });
    const populated = await Comment.findById(comment._id).populate("author","firstName lastName username avatar");
    res.status(201).json({ comment:populated, flagged:mod.isFlagged, severity:mod.severity||null, flagReason:mod.reason||null, source:mod.source||"keyword" });
  } catch (e) { console.error("COMMENT:",e.message); res.status(500).json({ message:"Server error." }); }
});

router.delete("/:id", protect, async (req, res) => {
  try {
    const c = await Comment.findById(req.params.id);
    if (!c) return res.status(404).json({ message:"Not found." });
    if (c.author.toString()!==req.user._id.toString()&&req.user.role!=="admin")
      return res.status(403).json({ message:"Not authorised." });
    c.isRemoved=true; await c.save();
    res.json({ message:"Comment removed." });
  } catch { res.status(500).json({ message:"Server error." }); }
});

router.post("/:id/like", protect, async (req, res) => {
  try {
    const c = await Comment.findById(req.params.id);
    if (!c) return res.status(404).json({ message:"Not found." });
    const idx = c.likes.findIndex(id=>id.toString()===req.user._id.toString());
    idx===-1 ? c.likes.push(req.user._id) : c.likes.splice(idx,1);
    await c.save();
    res.json({ likes:c.likes.length, liked:idx===-1 });
  } catch { res.status(500).json({ message:"Server error." }); }
});

router.post("/:id/report", protect, async (req, res) => {
  try {
    const c = await Comment.findById(req.params.id);
    if (!c) return res.status(404).json({ message:"Not found." });
    c.reports.push({ reportedBy:req.user._id, reason:req.body.reason||"Inappropriate" });
    if (c.reports.length>=3) c.isFlagged=true;
    await c.save();
    res.json({ message:"Comment reported." });
  } catch { res.status(500).json({ message:"Server error." }); }
});

module.exports = router;
