const User = require("../models/User");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const catchAsync = require("../utils/catchAsync");

// Admin dashboard stats
exports.getStat = catchAsync(async (req, res) => {
  const [totalUsers, activeConversations, messagesToday] = await Promise.all([
    User.countDocuments(),
    Conversation.countDocuments(),
    Message.countDocuments({
      createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
    }),
  ]);

  res.status(200).json({
    status: "success",
    data: { totalUsers, activeConversations, messagesToday },
  });
});

// Get recent users
exports.getRecentUser = catchAsync(async (req, res) => {
  const users = await User.find()
    .sort("-createdAt")
    .limit(10)
    .select("-password");

  res.status(200).json({ status: "success", data: users });
});
