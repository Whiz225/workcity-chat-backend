const express = require("express");
const router = express.Router();
const chatController = require("../controllers/chatController");
const { protect } = require("../middleware/authMiddleware");

router.get("/conversations", protect, chatController.getConversations);
router.get(
  "/conversations/:conversationId/messages",
  protect,
  chatController.getMessages
);
router.get(
  "/conversation/:participantId",
  protect,
  chatController.getOrCreateConversation
);
router.post("/messages", protect, chatController.sendMessage);

module.exports = router;
