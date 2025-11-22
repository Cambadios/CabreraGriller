// src/socket.js
import { io } from "socket.io-client";

const API_URL = import.meta.env.VITE_API_URL;

export const connectSocket = (token) => {
  return io(API_URL, {
    auth: { token },
    transports: ["websocket"],
    reconnection: true,
    reconnectionAttempts: 5,
  });
};
