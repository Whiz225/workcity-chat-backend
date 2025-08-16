const initializeSocket = (io) => {
  const onlineUsers = new Set();

  io.on("connection", (socket) => {
    console.log("New client connected:", socket.id);

    // Join user to their own room
    socket.on("join", (userId) => {
      socket.join(userId);
      console.log(`User ${userId} joined their room`);
    });

    // Handle sending messages
    socket.on("sendMessage", (message) => {
      const { conversation, sender } = message;
      io.to(conversation).emit("message", message);
      io.to(sender).emit("messageSent", message);
    });

    // Handle typing indicators
    socket.on("typing", ({ conversationId, userId }) => {
      socket.to(conversationId).emit("typing", userId);
    });

    socket.on("stopTyping", ({ conversationId, userId }) => {
      socket.to(conversationId).emit("stopTyping", userId);
    });

    // User goes online
    socket.on("online", (userId) => {
      onlineUsers.add(userId);
      io.emit("onlineUsers", Array.from(onlineUsers));
    });

    // User goes offline
    socket.on("disconnect", () => {
      const userId = Array.from(socket.rooms).find(
        (room) => room !== socket.id
      );
      if (userId) {
        onlineUsers.delete(userId);
        io.emit("onlineUsers", Array.from(onlineUsers));
      }
    });

    // Join conversation room
    socket.on("joinConversation", (conversationId) => {
      socket.join(conversationId);
    });

    // Leave conversation room
    socket.on("leaveConversation", (conversationId) => {
      socket.leave(conversationId);
    });
  });

  return io;
};

module.exports = { initializeSocket };
