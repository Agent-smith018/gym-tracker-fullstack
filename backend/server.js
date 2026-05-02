const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// Use an array of allowed origins
const allowedOrigins = [
    "https://gym-tracker-fullstack-2.onrender.com", // Your Frontend URL
    "http://localhost:5173"                       // Local Dev
];

const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST"]
    }
});

app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

// Make io accessible in routes
app.set('io', io);
// Routes
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/workouts', require('./src/routes/workouts'));
app.use('/api/exercises', require('./src/routes/exercises'));

const PORT = process.env.PORT || 5001;
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        // IMPORTANT: Listen on 0.0.0.0 for Render
        server.listen(PORT, '0.0.0.0', () => console.log(`Server on ${PORT}`));
    })
    .catch(err => console.error(err));