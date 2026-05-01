const { io } = require("socket.io-client");

console.log("Starting socket client...");

const socket = io("http://localhost:5001");

socket.on("connect", () => {
    console.log("Connected to server:", socket.id);
});

socket.on("connect_error", (err) => {
    console.log("Connection error:", err.message);
});

socket.on("disconnect", () => {
    console.log("Disconnected from server");
});

socket.on("workout:created", (data) => {
    console.log("Workout created event received:", data.title);
});

socket.on("log:added", (data) => {
    console.log("Log added event received:", data.exerciseName);
});