const ExerciseLog = require("../models/ExerciseLog");
const Workout = require("../models/Workout");

// CREATE log
const createExerciseLog = async (req, res) => {
    try {
        const { workout, exerciseName, sets, reps, weight, notes } = req.body;

        if (!workout || !exerciseName || !sets || !reps) {
            return res.status(400).json({ message: "All fields are required" });
        }

        // check workout belongs to user
        const existingWorkout = await Workout.findOne({
            _id: workout,
            user: req.user.id,
        });

        if (!existingWorkout) {
            return res.status(404).json({ message: "Workout not found" });
        }

        const log = await ExerciseLog.create({
            user: req.user.id,
            workout,
            exerciseName,
            sets,
            reps,
            weight,
            notes,
        });

        // Emit socket event
        const io = req.app.get("io");
        io.emit("log:added", log);

        res.status(201).json(log);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET all logs for user
const getExerciseLogs = async (req, res) => {
    try {
        const logs = await ExerciseLog.find({ user: req.user.id })
            .populate("workout", "title date")
            .sort({ createdAt: -1 });

        res.json(logs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET logs by workout id
const getLogsByWorkout = async (req, res) => {
    try {
        const workoutId = req.params.workoutId;

        const logs = await ExerciseLog.find({
            user: req.user.id,
            workout: workoutId,
        }).sort({ createdAt: -1 });

        res.json(logs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// UPDATE log
const updateExerciseLog = async (req, res) => {
    try {
        const log = await ExerciseLog.findOneAndUpdate(
            { _id: req.params.id, user: req.user.id },
            req.body,
            { new: true }
        );

        if (!log) {
            return res.status(404).json({ message: "Exercise log not found" });
        }

        res.json(log);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// DELETE log
const deleteExerciseLog = async (req, res) => {
    try {
        const log = await ExerciseLog.findOneAndDelete({
            _id: req.params.id,
            user: req.user.id,
        });

        if (!log) {
            return res.status(404).json({ message: "Exercise log not found" });
        }

        res.json({ message: "Exercise log deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createExerciseLog,
    getExerciseLogs,
    getLogsByWorkout,
    updateExerciseLog,
    deleteExerciseLog,
};