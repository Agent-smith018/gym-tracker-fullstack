const express = require("express");
const protect = require("../middleware/authMiddleware");

const {
    createExerciseLog,
    getExerciseLogs,
    getLogsByWorkout,
    updateExerciseLog,
    deleteExerciseLog,
} = require("../controllers/exerciseLogController");

const router = express.Router();

router.post("/", protect, createExerciseLog);
router.get("/", protect, getExerciseLogs);
router.get("/workout/:workoutId", protect, getLogsByWorkout);
router.put("/:id", protect, updateExerciseLog);
router.delete("/:id", protect, deleteExerciseLog);

module.exports = router;