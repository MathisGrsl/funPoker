import { io, Socket } from 'socket.io-client';
import { SERVER_URL, SOCKET_OPTIONS } from '@/globalVariables';

let socket: Socket | null = null;

export function getSocket(): Socket {
    if (!socket) {
        socket = io(SERVER_URL, { ...SOCKET_OPTIONS, autoConnect: false });
    }
    return socket;
}

export function connectSocket(): Socket {
    const s = getSocket();
    if (!s.connected) s.connect();
    return s;
}

export function disconnectSocket(): void {
    socket?.disconnect();
}
