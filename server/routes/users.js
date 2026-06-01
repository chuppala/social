const express = require("express");
const router  = express.Router();
const User    = require("../models/User");
const Post    = require("../models/Post");
const { protect } = require("../middleware/auth");

// SPECIFIC routes FIRST — before /:username wildcard
router.get("/me/saved", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path:"savedPosts", match:{ isRemoved:false },
      populate:[{ path:"author",select:"firstName lastName username" },{ path:"community",select:"name color" }]
    });
    res.json({ posts:user.savedPosts||[] });
  } catch { res.status(500).json({ message:"Server error." }); }
});

router.put("/me/update", protect, async (req, res) => {
  try {
    const { firstName, lastName, bio, interests, avatar } = req.body;
    const updates = {};
    if (firstName!==undefined) updates.firstName=firstName.trim();
    if (lastName!==undefined)  updates.lastName=lastName.trim();
    if (bio!==undefined)       updates.bio=bio.trim();
    if (interests!==undefined) updates.interests=interests;
    if (avatar!==undefined) updates.avatar=avatar;
    const user = await User.findByIdAndUpdate(req.user._id,{ $set:updates },{ new:true, runValidators:false }).select("-password -trustedDevices");
    res.json({ user });
  } catch (e) { console.error("UPDATE:",e.message); res.status(500).json({ message:"Server error." }); }
});

router.post("/:id/follow", protect, async (req, res) => {
  try {
    if (req.params.id===req.user._id.toString()) return res.status(400).json({ message:"Cannot follow yourself." });
    const target  = await User.findById(req.params.id);
    const current = await User.findById(req.user._id);
    if (!target) return res.status(404).json({ message:"User not found." });
    const isFollowing = current.following.map(String).includes(req.params.id);
    if (isFollowing) {
      current.following = current.following.filter(id=>id.toString()!==req.params.id);
      target.followers  = target.followers.filter(id=>id.toString()!==req.user._id.toString());
    } else {
      current.following.push(req.params.id);
      target.followers.push(req.user._id);
    }
    await Promise.all([current.save(),target.save()]);
    res.json({ following:!isFollowing, followerCount:target.followers.length });
  } catch (e) { console.error("FOLLOW:",e.message); res.status(500).json({ message:"Server error." }); }
});

// WILDCARD route LAST
router.get("/:username", async (req, res) => {
  try {
    const user = await User.findOne({ username:req.params.username })
      .select("-password -emailVerifyOTP -resetOTP -trustedDevices")
      .populate("joinedCommunities","name color");
    if (!user) return res.status(404).json({ message:"User not found." });
    const posts = await Post.find({ author:user._id, isRemoved:false })
      .sort({ createdAt:-1 }).limit(20).populate("community","name color");
    res.json({ user, posts });
  } catch (e) { console.error("GET USER:",e.message); res.status(500).json({ message:"Server error." }); }
});

module.exports = router;
