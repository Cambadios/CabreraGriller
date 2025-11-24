// backend/src/socket.js
import { Server } from "socket.io";
import jwt from "jsonwebtoken";

let io;

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || "*",
      methods: ["GET", "POST", "PUT", "DELETE"],
    },
  });

  // ✅ Auth por token (JWT)
  io.use((socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.split(" ")[1];

      if (!token) return next(new Error("No token"));

      const payload = jwt.verify(
        token,
        process.env.JWT_SECRET || "clave_super_secreta"
      );

      socket.user = payload; // { id_usuario, rol, ... }
      return next();
    } catch (err) {
      return next(new Error("Token inválido"));
    }
  });

  io.on("connection", (socket) => {
    console.log("🟢 Socket conectado:", socket.id, socket.user);

    // unir a salas por rol (para notificaciones)
    const rol = socket.user?.rol;
    if (rol) socket.join(`rol:${rol}`);

    socket.on("disconnect", () => {
      console.log("🔴 Socket desconectado:", socket.id);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) throw new Error("Socket.io no inicializado");
  return io;
};
