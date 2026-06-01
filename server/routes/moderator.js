const express   = require("express");
const router    = express.Router();
const Post      = require("../models/Post");
const Comment   = require("../models/Comment");
const Community = require("../models/Community");
const User      = require("../models/User");
const { protect } = require("../middleware/auth");

const isMod = async (req,res,next) => {
  try {
    const cid = req.params.communityId||req.body.communityId;
    if (!cid) return res.status(400).json({ message:"Community ID required." });
    const c = await Community.findById(cid);
    if (!c) return res.status(404).json({ message:"Community not found." });
    if (!c.moderators.map(String).includes(req.user._id.toString())&&req.user.role!=="admin")
      return res.status(403).json({ message:"Moderator access required." });
    req.community=c; next();
  } catch { res.status(500).json({ message:"Server error." }); }
};

router.get("/my-communities", protect, async (req,res) => {
  try {
    const communities = await Community.find({ moderators:req.user._id }).select("name color description members moderators");
    res.json({ communities });
  } catch { res.status(500).json({ message:"Server error." }); }
});

router.get("/community/:communityId/stats", protect, isMod, async (req,res) => {
  try {
    const cid = req.params.communityId;
    const [posts,flaggedPosts,reportedPosts] = await Promise.all([
      Post.countDocuments({ community:cid,isRemoved:false }),
      Post.countDocuments({ community:cid,isFlagged:true,isRemoved:false }),
      Post.countDocuments({ community:cid,"reports.0":{ $exists:true },isRemoved:false }),
    ]);
    const postIds = await Post.find({ community:cid }).distinct("_id");
    const flaggedComments = await Comment.countDocuments({ post:{ $in:postIds },isFlagged:true,isRemoved:false });
    res.json({ communityName:req.community.name, members:req.community.members.length, posts, flaggedPosts, reportedPosts, flaggedComments });
  } catch { res.status(500).json({ message:"Server error." }); }
});

router.get("/community/:communityId/flagged-posts", protect, isMod, async (req,res) => {
  try {
    const posts = await Post.find({ community:req.params.communityId,isFlagged:true,isRemoved:false })
      .populate("author","firstName lastName username").sort({ createdAt:-1 });
    res.json({ posts });
  } catch { res.status(500).json({ message:"Server error." }); }
});

router.get("/community/:communityId/reported-posts", protect, isMod, async (req,res) => {
  try {
    const posts = await Post.find({ community:req.params.communityId,"reports.0":{ $exists:true },isRemoved:false })
      .populate("author","firstName lastName username").sort({ createdAt:-1 });
    res.json({ posts });
  } catch { res.status(500).json({ message:"Server error." }); }
});

router.get("/community/:communityId/posts", protect, isMod, async (req,res) => {
  try {
    const posts = await Post.find({ community:req.params.communityId,isRemoved:false })
      .populate("author","firstName lastName username").sort({ createdAt:-1 }).limit(50);
    res.json({ posts });
  } catch { res.status(500).json({ message:"Server error." }); }
});

router.get("/community/:communityId/flagged-comments", protect, isMod, async (req,res) => {
  try {
    const ids = await Post.find({ community:req.params.communityId }).distinct("_id");
    const comments = await Comment.find({ post:{ $in:ids },isFlagged:true,isRemoved:false })
      .populate("author","firstName lastName username").populate("post","title").sort({ createdAt:-1 });
    res.json({ comments });
  } catch { res.status(500).json({ message:"Server error." }); }
});

router.put("/community/:communityId/posts/:postId/remove", protect, isMod, async (req,res) => {
  try {
    const post = await Post.findOne({ _id:req.params.postId,community:req.params.communityId });
    if (!post) return res.status(404).json({ message:"Post not found." });
    post.isRemoved=true; post.isFlagged=false; await post.save();
    res.json({ message:"Post removed." });
  } catch { res.status(500).json({ message:"Server error." }); }
});

router.put("/community/:communityId/posts/:postId/approve", protect, isMod, async (req,res) => {
  try {
    await Post.findByIdAndUpdate(req.params.postId,{ isFlagged:false,flagReason:"",reports:[] });
    res.json({ message:"Post approved." });
  } catch { res.status(500).json({ message:"Server error." }); }
});

router.put("/community/:communityId/comments/:commentId/remove", protect, isMod, async (req,res) => {
  try {
    await Comment.findByIdAndUpdate(req.params.commentId,{ isRemoved:true,isFlagged:false });
    res.json({ message:"Comment removed." });
  } catch { res.status(500).json({ message:"Server error." }); }
});

router.post("/community/:communityId/add-mod", protect, isMod, async (req,res) => {
  try {
    const newMod = await User.findOne({ username:req.body.username?.toLowerCase() });
    if (!newMod) return res.status(404).json({ message:"User not found." });
    if (req.community.moderators.map(String).includes(newMod._id.toString()))
      return res.status(400).json({ message:"Already a moderator." });
    req.community.moderators.push(newMod._id);
    await req.community.save();
    res.json({ message:"@"+newMod.username+" is now a moderator of c/"+req.community.name });
  } catch { res.status(500).json({ message:"Server error." }); }
});

module.exports = router;
