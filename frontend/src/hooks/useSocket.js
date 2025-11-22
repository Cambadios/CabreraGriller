// src/hooks/useSocket.js
import { useEffect, useRef } from "react";
import { connectSocket } from "../socket";

/**
 * Hook simple para escuchar eventos de Socket.IO
 * @param {string} token
 * @param {Object} handlers { evento: (payload)=>{} }
 */
export const useSocket = (token, handlers = {}) => {
  const socketRef = useRef(null);

  useEffect(() => {
    if (!token) return;

    const socket = connectSocket(token);
    socketRef.current = socket;

    // registrar eventos
    Object.entries(handlers).forEach(([event, fn]) => {
      socket.on(event, fn);
    });

    return () => {
      Object.entries(handlers).forEach(([event, fn]) => {
        socket.off(event, fn);
      });
      socket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return socketRef;
};
