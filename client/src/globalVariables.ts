export const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL ?? 'http://localhost:5000';

export const SOCKET_OPTIONS = {
  	transports: ['websocket', 'polling'] as const,
  	withCredentials: true,
};
