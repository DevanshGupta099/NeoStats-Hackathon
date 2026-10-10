'use client';

import { io, Socket } from 'socket.io-client';

const WS_URL =
  process.env.NEXT_PUBLIC_WS_URL ||
  (process.env.NEXT_PUBLIC_API_URL
    ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api\/v1\/?$/, '')
    : 'http://localhost:4000');

let socketInstance: Socket | null = null;

export function getSocket(token?: string | null): Socket {
  if (typeof window === 'undefined') {
    // Return dummy socket during SSR
    return {} as Socket;
  }

  const effectiveToken =
    token || (typeof window !== 'undefined' ? localStorage.getItem('forgeline_token') : null);

  if (!socketInstance) {
    socketInstance = io(WS_URL, {
      withCredentials: true,
      transports: ['polling', 'websocket'],
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 15,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
      auth: (cb) => {
        const currentToken =
          typeof window !== 'undefined' ? localStorage.getItem('forgeline_token') : null;
        cb({ token: currentToken });
      },
    });
  } else if (effectiveToken) {
    socketInstance.auth = { token: effectiveToken };
  }

  return socketInstance;
}

export function connectSocket(token?: string | null): Socket {
  const socket = getSocket(token);
  if (socket && typeof socket.connect === 'function' && !socket.connected) {
    if (token) {
      socket.auth = { token };
    }
    socket.connect();
  }
  return socket;
}

export function disconnectSocket(): void {
  if (socketInstance && typeof socketInstance.disconnect === 'function') {
    socketInstance.disconnect();
  }
}
