import { io } from 'socket.io-client';

const SOCKET_URL = 'https://english-club-v1.onrender.com';

export function useSocket(userId, username, role) {
  const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });

  socket.on('connect', () => {
    socket.emit('join', { uid: userId, uname: username, role });
  });

  return socket;
}
