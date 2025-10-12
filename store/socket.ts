import { io } from "socket.io-client";

export const socket = io("https://api.agapespringsint.com", {
  transports: ["websocket"],
  reconnection: true,
  reconnectionAttempts: 5,
});
