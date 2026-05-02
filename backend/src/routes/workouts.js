const express = require('express');
const router = express.Router();
const Workout = require('../models/Workout');
const auth = require('../middleware/auth');

// POST /api/workouts - Create a workout
router.post('/', auth, async (req, res) => {
  try {
    const { title, date, duration, notes } = req.body;

    const workout = new Workout({
      user: req.user.id,
      title,
      date,
      duration,
      notes
    });

    await workout.save();

    // 🔴 WebSocket Event 1: broadcast to all connected clients
    const io = req.app.get('io');
    io.emit('workout:created', workout);

    res.status(201).json(workout);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/workouts - Get all workouts for logged in user
router.get('/', auth, async (req, res) => {
  try {
    const workouts = await Workout.find({ user: req.user.id })
      .sort({ date: -1 }); // newest first
    res.json(workouts);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/workouts/:id - Get a single workout
router.get('/:id', auth, async (req, res) => {
  try {
    const workout = await Workout.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!workout) {
      return res.status(404).json({ message: 'Workout not found' });
    }

    res.json(workout);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PUT /api/workouts/:id - Update a workout
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, date, duration, notes } = req.body;

    const workout = await Workout.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { title, date, duration, notes },
      { new: true } // return updated document
    );

    if (!workout) {
      return res.status(404).json({ message: 'Workout not found' });
    }

    res.json(workout);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// DELETE /api/workouts/:id - Delete a workout
router.delete('/:id', auth, async (req, res) => {
  try {
    const workout = await Workout.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id
    });

    if (!workout) {
      return res.status(404).json({ message: 'Workout not found' });
    }

    res.json({ message: 'Workout deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;