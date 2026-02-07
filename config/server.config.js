let io;

export const initSocket = async (server) => {
  io = new (await import("socket.io")).Server(server, {
    cors: {
      origin: "*",
    },
  });

  io.on("connection", (socket) => {
    console.log("Connected Successfully...");
    socket.on("disconnected", () => {
      console.log("Server Disconnected...");
    });
  });
};

export const getIo = () => {
  if (!io) {
    throw new Error("Socket not initialized...");
  } else {
    return io;
  }
};
