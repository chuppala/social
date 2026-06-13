const express = require("express");
const router  = express.Router();
const User    = require("../models/User");
const Post    = require("../models/Post");
const Comment = require("../models/Comment");
const Community = require("../models/Community");
const { protect } = require("../middleware/auth");

const isAdmin = (req,res,next) => {
  if (req.user.role!=="admin") return res.status(403).json({ message:"Admin access required." });
  next();
};

router.get("/stats", protect, isAdmin, async (req,res) => {
  try {
    const [users,posts,comments,communities,flaggedPosts,flaggedComments,bannedUsers,reportedPosts] = await Promise.all([
      User.countDocuments(), Post.countDocuments({ isRemoved:false }), Comment.countDocuments({ isRemoved:false }),
      Community.countDocuments(), Post.countDocuments({ isFlagged:true,isRemoved:false }),
      Comment.countDocuments({ isFlagged:true,isRemoved:false }), User.countDocuments({ isBanned:true }),
      Post.countDocuments({ "reports.0":{ $exists:true },isRemoved:false }),
    ]);
    res.json({ users,posts,comments,communities,flaggedPosts,flaggedComments,bannedUsers,reportedPosts });
  } catch { res.status(500).json({ message:"Server error." }); }
});

router.get("/users", protect, isAdmin, async (req,res) => {
  try {
    const { search="" } = req.query;
    const filter = search ? { $or:[{ email:new RegExp(search,"i") },{ username:new RegExp(search,"i") },{ firstName:new RegExp(search,"i") }] } : {};
    const users  = await User.find(filter).select("-password -trustedDevices -emailVerifyOTP -resetOTP").sort({ createdAt:-1 }).limit(50);
    res.json({ users, total:await User.countDocuments(filter) });
  } catch { res.status(500).json({ message:"Server error." }); }
});

router.put("/users/:id/ban", protect, isAdmin, async (req,res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message:"Not found." });
    if (user.role==="admin") return res.status(400).json({ message:"Cannot ban an admin." });
    user.isBanned=true; user.banReason=req.body.reason||"Policy violation";
    await user.save();
    res.json({ message:"User banned." });
  } catch { res.status(500).json({ message:"Server error." }); }
});

router.put("/users/:id/unban", protect, isAdmin, async (req,res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message:"Not found." });
    user.isBanned=false; user.banReason=""; user.warnings=0;
    await user.save();
    res.json({ message:"User unbanned." });
  } catch { res.status(500).json({ message:"Server error." }); }
});

router.put("/users/:id/make-admin", protect, isAdmin, async (req,res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id,{ role:"admin" },{ new:true });
    res.json({ message:user.username+" is now an admin." });
  } catch { res.status(500).json({ message:"Server error." }); }
});

router.get("/flagged-posts", protect, isAdmin, async (req,res) => {
  try {
    const posts = await Post.find({ isFlagged:true,isRemoved:false })
      .populate("author","firstName lastName username").populate("community","name color").sort({ createdAt:-1 });
    res.json({ posts });
  } catch { res.status(500).json({ message:"Server error." }); }
});

router.get("/reported-posts", protect, isAdmin, async (req,res) => {
  try {
    const posts = await Post.find({ "reports.0":{ $exists:true },isRemoved:false })
      .populate("author","firstName lastName username").populate("community","name color").sort({ createdAt:-1 });
    res.json({ posts });
  } catch { res.status(500).json({ message:"Server error." }); }
});

router.get("/flagged-comments", protect, isAdmin, async (req,res) => {
  try {
    const comments = await Comment.find({ isFlagged:true,isRemoved:false })
      .populate("author","firstName lastName username").populate("post","title").sort({ createdAt:-1 });
    res.json({ comments });
  } catch { res.status(500).json({ message:"Server error." }); }
});

router.get("/posts", protect, isAdmin, async (req,res) => {
  try {
    const posts = await Post.find({ isRemoved:false })
      .populate("author","firstName lastName username").populate("community","name color").sort({ createdAt:-1 }).limit(50);
    res.json({ posts, total:await Post.countDocuments({ isRemoved:false }) });
  } catch { res.status(500).json({ message:"Server error." }); }
});

router.put("/posts/:id/remove", protect, isAdmin, async (req,res) => {
  try {
    await Post.findByIdAndUpdate(req.params.id,{ isRemoved:true,isFlagged:false });
    res.json({ message:"Post removed." });
  } catch { res.status(500).json({ message:"Server error." }); }
});

router.put("/posts/:id/approve", protect, isAdmin, async (req,res) => {
  try {
    await Post.findByIdAndUpdate(req.params.id,{ isFlagged:false,flagReason:"",reports:[] });
    res.json({ message:"Post approved." });
  } catch { res.status(500).json({ message:"Server error." }); }
});

router.put("/comments/:id/remove", protect, isAdmin, async (req,res) => {
  try {
    await Comment.findByIdAndUpdate(req.params.id,{ isRemoved:true,isFlagged:false });
    res.json({ message:"Comment removed." });
  } catch { res.status(500).json({ message:"Server error." }); }
});

router.put("/users/:id/make-moderator", protect, isAdmin, async (req, res) => {
  try {

    const { communityId } = req.body;

    const user = await User.findById(req.params.id);

    if (!user)
      return res.status(404).json({
        message: "User not found."
      });

    const community = await Community.findById(communityId);

    if (!community)
      return res.status(404).json({
        message: "Community not found."
      });

    if (user.role === "admin")
      return res.status(400).json({
        message: "Admin cannot be changed."
      });

    user.role = "moderator";

    if (
      !community.moderators
        .map(id => id.toString())
        .includes(user._id.toString())
    ) {
      community.moderators.push(user._id);
    }

    await user.save();
    await community.save();

    res.json({
      message: `${user.username} is now moderator of c/${community.name}`
    });

  } catch (err) {
    res.status(500).json({
      message: "Server error."
    });
  }
});
router.put("/users/:id/remove-moderator", protect, isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user)
      return res.status(404).json({
        message: "User not found."
      });

    if (user.role === "admin")
      return res.status(400).json({
        message: "Admin cannot be changed."
      });

    user.role = "user";

    await user.save();

    res.json({
      message: "Moderator removed."
    });

  } catch {
    res.status(500).json({
      message: "Server error."
    });
  }
});
module.exports = router;
