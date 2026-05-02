const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: '*' }
});

app.use(cors());
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

mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        server.listen(process.env.PORT || 5001, () =>
            console.log('Server running on port 5001')
        );
    })
    .catch(err => console.error(err));