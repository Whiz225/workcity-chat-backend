const path = require("path");
const fs = require("fs");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const catchAsync = require("../utils/catchAsync");
const User = require("../models/User");
const { sendEmailNotification } = require("../utils/notifications");

exports.getConversations = catchAsync(async (req, res) => {
  const conversations = await Conversation.find({
    participants: req.user._id,
  })
    .populate("participants", "name email role online lastSeen avatar")
    .populate("lastMessage")
    .sort("-updatedAt");

  res.status(200).json({ status: "success", data: conversations });
});

exports.getOrCreateConversation = catchAsync(async (req, res) => {
  const { participantId } = req.params;

  let conversation = await Conversation.findOne({
    participants: { $all: [req.user._id, participantId], $size: 2 },
  })
    .populate("participants", "name email role online lastSeen avatar")
    .populate("lastMessage");

  if (!conversation) {
    conversation = new Conversation({
      participants: [req.user._id, participantId],
    });
    await conversation.save();
  }

  res.status(200).json({ status: "success", data: conversation });
});

exports.getMessages = catchAsync(async (req, res, next) => {
  const { conversationId } = req.params;

  const conversationExists = await Conversation.exists({ _id: conversationId });
  if (!conversationExists) {
    return next(new AppError("No conversation found with that ID", 404));
  }

  const messages = await Message.find({ conversation: conversationId })
    .populate({
      path: "sender",
      select: "name avatar",
    })
    .populate({
      path: "conversation",
      select: "participants",
      populate: {
        path: "participants",
        select: "name avatar",
      },
    })
    .sort({ createdAt: 1 });

  res.status(200).json({
    status: "success",
    results: messages.length,
    data: {
      messages,
    },
  });
});

exports.sendMessage = catchAsync(async (req, res) => {
  const { conversation, content } = req.body;
  let attachment;

  if (req.files?.attachment) {
    const file = req.files.attachment;
    const uploadPath = path.join(__dirname, "../uploads", file.name);

    await file.mv(uploadPath);
    attachment = `/uploads/${file.name}`;
  }

  const message = new Message({
    conversation,
    sender: req.user._id,
    content,
    attachment,
  });
  await message.save();

  const updatedConversation = await Conversation.findByIdAndUpdate(
    conversation,
    {
      lastMessage: message._id,
      $inc: { unreadCount: 1 },
    },
    { new: true }
  ).populate("participants");

  const otherParticipants = updatedConversation.participants.filter(
    (p) => p._id.toString() !== req.user._id.toString()
  );

  otherParticipants.forEach(async (user) => {
    if (user.notificationPreferences?.email) {
      await sendEmailNotification({
        to: user.email,
        subject: "New message received",
        text: `You have a new message from ${req.user.name}`,
      });
    }
  });

  req.app.get("io").to(conversation).emit("message", message);

  res.status(201).json({ status: "success", data: message });
});

exports.startTyping = catchAsync(async (req, res) => {
  const { conversationId } = req.params;
  req.app.get("io").to(conversationId).emit("typing", {
    userId: req.user._id,
    userName: req.user.name,
  });
  res.json({ success: true });
});

exports.stopTyping = catchAsync(async (req, res) => {
  const { conversationId } = req.params;
  req.app.get("io").to(conversationId).emit("stopTyping", req.user._id);
  res.json({ success: true });
});
