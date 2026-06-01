const express   = require("express");
const router    = express.Router();
const Community = require("../models/Community");
const User      = require("../models/User");
const { protect } = require("../middleware/auth");

router.get("/", async (req, res) => {
  try {
    const communities = await Community.find().sort({ createdAt:-1 });
    res.json({ communities });
  } catch { res.status(500).json({ message:"Server error." }); }
});

router.get("/:name", async (req, res) => {
  try {
    const community = await Community.findOne({ name:req.params.name }).populate("moderators","firstName lastName username");
    if (!community) return res.status(404).json({ message:"Community not found." });
    res.json({ community });
  } catch { res.status(500).json({ message:"Server error." }); }
});

router.post("/", protect, async (req, res) => {
  try {
    const { name, description, color } = req.body;
    if (!name?.trim()) return res.status(400).json({ message:"Name required." });
    const community = await Community.create({ name:name.trim(), description:description||"", color:color||"#2563eb", creator:req.user._id, moderators:[req.user._id], members:[req.user._id] });
    await User.findByIdAndUpdate(req.user._id,{ $addToSet:{ joinedCommunities:community._id } });
    res.status(201).json({ community });
  } catch (e) {
    if (e.code===11000) return res.status(400).json({ message:"Name already taken." });
    res.status(500).json({ message:"Server error." });
  }
});

router.post("/:id/join", protect, async (req, res) => {
  try {
    const community = await Community.findById(req.params.id);
    if (!community) return res.status(404).json({ message:"Not found." });
    const uid = req.user._id.toString();
    const idx = community.members.findIndex(m=>m.toString()===uid);
    if (idx===-1) {
      community.members.push(req.user._id);
      await User.findByIdAndUpdate(req.user._id,{ $addToSet:{ joinedCommunities:community._id } });
    } else {
      community.members.splice(idx,1);
      await User.findByIdAndUpdate(req.user._id,{ $pull:{ joinedCommunities:community._id } });
    }
    await community.save();
    res.json({ joined:idx===-1, memberCount:community.members.length });
  } catch { res.status(500).json({ message:"Server error." }); }
});

module.exports = router;
