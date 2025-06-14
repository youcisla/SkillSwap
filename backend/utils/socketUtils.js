// Socket.io instance that can be shared across routes
let io = null;

const setSocketIO = (socketIOInstance) => {
  io = socketIOInstance;
};

const getSocketIO = () => {
  return io;
};

// Helper functions to emit events
const emitToUser = (userId, event, data) => {
  if (io) {
    io.to(`user-${userId}`).emit(event, data);
    console.log(`📡 Emitted ${event} to user ${userId}:`, data);
  }
};

const emitToChat = (chatId, event, data) => {
  if (io) {
    io.to(chatId).emit(event, data);
    console.log(`📡 Emitted ${event} to chat ${chatId}:`, data);
  }
};

const emitNewMatch = (user1Id, user2Id, matchData) => {
  if (io) {
    // Emit to both users
    emitToUser(user1Id, 'new-match', {
      matchId: matchData._id,
      userId: user2Id,
      userName: matchData.user2Id.name,
      compatibilityScore: matchData.compatibilityScore
    });

    emitToUser(user2Id, 'new-match', {
      matchId: matchData._id,
      userId: user1Id,
      userName: matchData.user1Id.name,
      compatibilityScore: matchData.compatibilityScore
    });
  }
};

const emitNewFollower = (followedUserId, followerData) => {
  if (io) {
    emitToUser(followedUserId, 'new-follower', {
      userId: followerData.followerId,
      userName: followerData.followerName
    });
  }
};

const emitSessionUpdate = (participantIds, sessionData) => {
  if (io) {
    participantIds.forEach(userId => {
      emitToUser(userId, 'session-update', {
        sessionId: sessionData._id,
        status: sessionData.status,
        scheduledAt: sessionData.scheduledAt
      });
    });
  }
};

module.exports = {
  setSocketIO,
  getSocketIO,
  emitToUser,
  emitToChat,
  emitNewMatch,
  emitNewFollower,
  emitSessionUpdate
};
