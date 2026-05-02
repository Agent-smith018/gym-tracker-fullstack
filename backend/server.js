const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// 1. Define allowed origins
// Use an environment variable for production, fallback to localhost for dev
const allowedOrigins = [
    process.env.FRONTEND_URL,
    "https://gym-tracker-fullstack-2.onrender.com", // Your specific frontend URL
    "http://localhost:5173", // Default Vite port
    "http://localhost:3000"
];

// 2. Configure Socket.io with specific CORS
const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST"],
        credentials: true
    }
});

// 3. Configure Express CORS
app.use(cors({
    origin: allowedOrigins,
    credentials: true
}));

app.use(express.json());

// Make io accessible in routes
app.set('io', io);

// Routes
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/workouts', require('./src/routes/workouts'));
app.use('/api/exercises', require('./src/routes/exercises'));

// WebSocket events
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    socket.on('disconnect', () => console.log('Client disconnected'));
});

// 4. Database Connection & Server Start
const PORT = process.env.PORT || 5001;

mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        // Use PORT variable instead of hardcoding 5001
        server.listen(PORT, '0.0.0.0', () =>
            console.log(`Server running on port ${PORT}`)
        );
    })
    .catch(err => console.error('MongoDB connection error:', err));