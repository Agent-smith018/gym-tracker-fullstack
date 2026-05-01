const express = require("express");
const cors = require("cors");
require("dotenv").config();
const http = require("http");
const { Server } = require("socket.io");

const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const workoutRoutes = require("./routes/workoutRoutes");
const exerciseLogRoutes = require("./routes/exerciseLogRoutes");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/workouts", workoutRoutes);
app.use("/api/logs", exerciseLogRoutes);

app.get("/", (req, res) => {
    res.send("Gym Tracker API is running...");
});

const PORT = process.env.PORT || 5001;

// Create HTTP server
const server = http.createServer(app);

// Create socket.io server
const io = new Server(server, {
    cors: {
        origin: "*",
    },
});

// Socket connection
io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
    });
});

// Make io accessible in routes/controllers
app.set("io", io);

connectDB().then(() => {
    server.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
});