const Workout = require("../models/Workout");

// CREATE workout
const createWorkout = async (req, res) => {
    try {
        const { title, date, notes } = req.body;

        if (!title) {
            return res.status(400).json({ message: "Workout title is required" });
        }

        const workout = await Workout.create({
            user: req.user.id,
            title,
            date,
            notes,
        });

        // Emit socket event
        const io = req.app.get("io");
        io.emit("workout:created", workout);

        res.status(201).json(workout);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET all workouts (only logged in user)
const getWorkouts = async (req, res) => {
    try {
        const workouts = await Workout.find({ user: req.user.id }).sort({ date: -1 });
        res.json(workouts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET single workout
const getWorkoutById = async (req, res) => {
    try {
        const workout = await Workout.findOne({
            _id: req.params.id,
            user: req.user.id,
        });

        if (!workout) {
            return res.status(404).json({ message: "Workout not found" });
        }

        res.json(workout);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// UPDATE workout
const updateWorkout = async (req, res) => {
    try {
        const workout = await Workout.findOneAndUpdate(
            { _id: req.params.id, user: req.user.id },
            req.body,
            { new: true }
        );

        if (!workout) {
            return res.status(404).json({ message: "Workout not found" });
        }

        res.json(workout);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// DELETE workout
const deleteWorkout = async (req, res) => {
    try {
        const workout = await Workout.findOneAndDelete({
            _id: req.params.id,
            user: req.user.id,
        });

        if (!workout) {
            return res.status(404).json({ message: "Workout not found" });
        }

        res.json({ message: "Workout deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createWorkout,
    getWorkouts,
    getWorkoutById,
    updateWorkout,
    deleteWorkout,
};