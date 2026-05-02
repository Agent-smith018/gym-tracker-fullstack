const express = require('express');
const router = express.Router();
const Exercise = require('../models/Exercise');
const Workout = require('../models/Workout');
const auth = require('../middleware/auth');

// POST /api/exercises - Create an exercise
router.post('/', auth, async (req, res) => {
    try {
        const { workoutId, name, sets, reps, weight, notes } = req.body;

        // Make sure workout exists and belongs to user
        const workout = await Workout.findOne({
            _id: workoutId,
            user: req.user.id
        });

        if (!workout) {
            return res.status(404).json({ message: 'Workout not found' });
        }

        const exercise = new Exercise({
            workout: workoutId,
            user: req.user.id,
            name,
            sets,
            reps,
            weight,
            notes
        });

        await exercise.save();

        res.status(201).json(exercise);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// GET /api/exercises - Get all exercises for logged in user
router.get('/', auth, async (req, res) => {
    try {
        const exercises = await Exercise.find({ user: req.user.id })
            .populate('workout', 'title date') // attach workout title & date
            .sort({ createdAt: -1 });
        res.json(exercises);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// GET /api/exercises/workout/:workoutId - Get all exercises for a workout
router.get('/workout/:workoutId', auth, async (req, res) => {
    try {
        const exercises = await Exercise.find({
            workout: req.params.workoutId,
            user: req.user.id
        });
        res.json(exercises);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// GET /api/exercises/:id - Get a single exercise
router.get('/:id', auth, async (req, res) => {
    try {
        const exercise = await Exercise.findOne({
            _id: req.params.id,
            user: req.user.id
        }).populate('workout', 'title date');

        if (!exercise) {
            return res.status(404).json({ message: 'Exercise not found' });
        }

        res.json(exercise);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// PUT /api/exercises/:id - Update an exercise
router.put('/:id', auth, async (req, res) => {
    try {
        const { name, sets, reps, weight, notes } = req.body;

        const exercise = await Exercise.findOneAndUpdate(
            { _id: req.params.id, user: req.user.id },
            { name, sets, reps, weight, notes },
            { new: true }
        );

        if (!exercise) {
            return res.status(404).json({ message: 'Exercise not found' });
        }

        // 🔴 WebSocket Event 2: broadcast updated exercise to all clients
        const io = req.app.get('io');
        io.emit('exercise:updated', exercise);

        res.json(exercise);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// DELETE /api/exercises/:id - Delete an exercise
router.delete('/:id', auth, async (req, res) => {
    try {
        const exercise = await Exercise.findOneAndDelete({
            _id: req.params.id,
            user: req.user.id
        });

        if (!exercise) {
            return res.status(404).json({ message: 'Exercise not found' });
        }

        res.json({ message: 'Exercise deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

module.exports = router;