'use client';

import { io, Socket } from 'socket.io-client';

const WS_URL =
  process.env.NEXT_PUBLIC_WS_URL ||
  (process.env.NEXT_PUBLIC_API_URL
    ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api\/v1\/?$/, '')
    : 'http://localhost:4000');

let socketInstance: Socket | null = null;

export function getSocket(): Socket {
  if (typeof window === 'undefined') {
    // Return dummy socket during SSR
    return {} as Socket;
  }

  if (!socketInstance) {
    socketInstance = io(WS_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
    });
  }

  return socketInstance;
}

export function connectSocket(): Socket {
  const socket = getSocket();
  if (socket && typeof socket.connect === 'function' && !socket.connected) {
    socket.connect();
  }
  return socket;
}

export function disconnectSocket(): void {
  if (socketInstance && typeof socketInstance.disconnect === 'function') {
    socketInstance.disconnect();
  }
}
