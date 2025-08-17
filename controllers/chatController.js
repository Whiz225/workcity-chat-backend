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

// exports.sendMessage = catchAsync(async (req, res) => {

//   console.log("Sending", req.body, req.files?.attachment)
//   const { conversation, content } = req.body;
//   let attachment;

//   if (req.files?.attachment) {
//     const file = req.files.attachment;
//     const uploadPath = path.join(__dirname, "../uploads", file.name);

//     await file.mv(uploadPath);
//     attachment = `/uploads/${file.name}`;
//   }

//   console.log("DDD")

//   const message = new Message({
//     conversation,
//     sender: req.user._id,
//     content,
//     attachment,
//   });
//   await message.save();

//   console.log("DDD222")

//   const updatedConversation = await Conversation.findByIdAndUpdate(
//     conversation,
//     {
//       lastMessage: message._id,
//       $inc: { unreadCount: 1 },
//     },
//     { new: true }
//   ).populate("participants");

//   console.log("DDD333")

//   const otherParticipants = updatedConversation.participants.filter(
//     (p) => p._id.toString() !== req.user._id.toString()
//   );

//   console.log("DDD444")

//   otherParticipants.forEach(async (user) => {
//     if (user.notificationPreferences?.email) {
//       await sendEmailNotification({
//         to: user.email,
//         subject: "New message received",
//         text: `You have a new message from ${req.user.name}`,
//       });
//     }
//   });

//   console.log("DDD555")

//   req.app.get("io").to(conversation).emit("message", message);

//   console.log("DDD666")

//   res.status(201).json({ status: "success", data: message });
// });

exports.sendMessage = catchAsync(async (req, res) => {
  const { conversation, content } = req.body;
  let attachment;

  console.log("body", req.body);
  console.log("file", req.file?.attachment);

  // 1. Handle file upload
  if (req.files?.attachment) {
    const file = req.files.attachment;

    // Create uploads directory if it doesn't exist
    const uploadDir = path.join(__dirname, "../uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    console.log("uploadDir", uploadDir);

    const uniqueFileName = `${Date.now()}-${file.name}`;
    const uploadPath = path.join(uploadDir, uniqueFileName);

    console.log("fileName", uniqueFileName, uploadPath);

    await file.mv(uploadPath);
    attachment = `/uploads/${uniqueFileName}`;
  }

  // 2. Create and save message
  const message = new Message({
    conversation,
    sender: req.user._id,
    content,
    attachment,
  });
  await message.save();

  console.log("message", message);

  // 3. Update conversation
  const updatedConversation = await Conversation.findByIdAndUpdate(
    conversation,
    {
      lastMessage: message._id,
      $inc: { unreadCount: 1 },
    },
    { new: true }
  ).populate("participants");

  console.log("updateCon:", updatedConversation);

  // 4. Send notifications
  const otherParticipants = updatedConversation.participants.filter(
    (p) => p._id.toString() !== req.user._id.toString()
  );

  console.log("participants", otherParticipants);
  await Promise.all(
    otherParticipants.map(async (user) => {
      if (user.notificationPreferences?.email) {
        await sendEmailNotification({
          to: user.email,
          subject: "New message received",
          text: `You have a new message from ${req.user.name}`,
        });
      }
    })
  );

  // 5. Emit socket event
  // req.app.get("io").to(conversation).emit("message", message);
  try {
    req.app.get("io").to(conversation).emit("message", message);
  } catch (socketError) {
    console.error("Socket error:", socketError);
  }

  console.log("message2", message, conversation);

  // 6. Send response
  res.status(201).json({
    status: "success",
    data: message,
  });
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
