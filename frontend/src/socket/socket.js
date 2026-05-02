import { io } from 'socket.io-client';

const URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5001';

const socket = io(URL, {
    autoConnect: true,
});

export default socket;