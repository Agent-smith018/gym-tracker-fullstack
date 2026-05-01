const mongoose = require("mongoose");

const exerciseLogSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        workout: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Workout",
            required: true,
        },

        exerciseName: {
            type: String,
            required: true,
            trim: true,
        },

        sets: {
            type: Number,
            required: true,
            min: 1,
        },

        reps: {
            type: Number,
            required: true,
            min: 1,
        },

        weight: {
            type: Number,
            default: 0,
        },

        notes: {
            type: String,
            trim: true,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("ExerciseLog", exerciseLogSchema);