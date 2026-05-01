import { useContext, useEffect, useState } from "react";
import api from "../api/api";
import { AuthContext } from "../context/AuthContext";
import socket from "../api/socket";

export default function Dashboard() {
    const { logout } = useContext(AuthContext);

    const [workouts, setWorkouts] = useState([]);
    const [logs, setLogs] = useState([]);

    const [selectedWorkout, setSelectedWorkout] = useState(null);

    const [title, setTitle] = useState("");
    const [notes, setNotes] = useState("");

    const [exerciseName, setExerciseName] = useState("");
    const [sets, setSets] = useState("");
    const [reps, setReps] = useState("");
    const [weight, setWeight] = useState("");

    const [error, setError] = useState("");
    const [notification, setNotification] = useState("");

    // Fetch workouts
    const fetchWorkouts = async () => {
        try {
            const res = await api.get("/workouts");
            setWorkouts(res.data);
        } catch (err) {
            setError("Failed to load workouts");
        }
    };

    // Fetch logs by workout
    const fetchLogsByWorkout = async (workoutId) => {
        try {
            const res = await api.get(`/logs/workout/${workoutId}`);
            setLogs(res.data);
        } catch (err) {
            setError("Failed to load logs");
        }
    };

    // Load workouts on page load
    useEffect(() => {
        fetchWorkouts();
    }, []);

    // Socket.io real-time listeners
    useEffect(() => {
        socket.on("workout:created", (workout) => {
            setNotification(`New workout added: ${workout.title}`);
            fetchWorkouts();

            setTimeout(() => setNotification(""), 3000);
        });

        socket.on("log:added", (log) => {
            setNotification(`New log added: ${log.exerciseName}`);

            if (selectedWorkout && log.workout === selectedWorkout._id) {
                fetchLogsByWorkout(selectedWorkout._id);
            }

            setTimeout(() => setNotification(""), 3000);
        });

        return () => {
            socket.off("workout:created");
            socket.off("log:added");
        };
    }, [selectedWorkout]);

    // Create workout
    const handleCreateWorkout = async (e) => {
        e.preventDefault();
        setError("");

        try {
            await api.post("/workouts", { title, notes });
            setTitle("");
            setNotes("");
            fetchWorkouts();
        } catch (err) {
            setError(err.response?.data?.message || "Failed to create workout");
        }
    };

    // Delete workout
    const handleDeleteWorkout = async (id) => {
        try {
            await api.delete(`/workouts/${id}`);
            fetchWorkouts();

            if (selectedWorkout?._id === id) {
                setSelectedWorkout(null);
                setLogs([]);
            }
        } catch (err) {
            setError("Failed to delete workout");
        }
    };

    // Select workout
    const handleSelectWorkout = (workout) => {
        setSelectedWorkout(workout);
        fetchLogsByWorkout(workout._id);
    };

    // Create exercise log
    const handleCreateLog = async (e) => {
        e.preventDefault();
        setError("");

        if (!selectedWorkout) {
            return setError("Please select a workout first");
        }

        try {
            await api.post("/logs", {
                workout: selectedWorkout._id,
                exerciseName,
                sets: Number(sets),
                reps: Number(reps),
                weight: Number(weight),
            });

            setExerciseName("");
            setSets("");
            setReps("");
            setWeight("");

            fetchLogsByWorkout(selectedWorkout._id);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to create log");
        }
    };

    // Delete log
    const handleDeleteLog = async (logId) => {
        try {
            await api.delete(`/logs/${logId}`);
            fetchLogsByWorkout(selectedWorkout._id);
        } catch (err) {
            setError("Failed to delete log");
        }
    };

    return (
        <div style={{ padding: "40px" }}>
            <h1>Gym Tracker Dashboard</h1>
            <button onClick={logout}>Logout</button>

            <hr />

            {/* Notification */}
            {notification && (
                <p style={{ background: "lightgreen", padding: "10px" }}>
                    {notification}
                </p>
            )}

            {/* Error */}
            {error && <p style={{ color: "red" }}>{error}</p>}

            <h2>Create Workout</h2>
            <form onSubmit={handleCreateWorkout}>
                <input
                    type="text"
                    placeholder="Workout Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                />
                <br />
                <br />

                <input
                    type="text"
                    placeholder="Notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                />
                <br />
                <br />

                <button type="submit">Add Workout</button>
            </form>

            <hr />

            <h2>Your Workouts</h2>
            {workouts.length === 0 ? (
                <p>No workouts yet.</p>
            ) : (
                <ul>
                    {workouts.map((workout) => (
                        <li key={workout._id} style={{ marginBottom: "15px" }}>
                            <b>{workout.title}</b> - {workout.notes}
                            <br />

                            <button onClick={() => handleSelectWorkout(workout)}>
                                View Logs
                            </button>

                            <button
                                style={{ marginLeft: "10px" }}
                                onClick={() => handleDeleteWorkout(workout._id)}
                            >
                                Delete Workout
                            </button>
                        </li>
                    ))}
                </ul>
            )}

            <hr />

            <h2>Exercise Logs</h2>

            {!selectedWorkout ? (
                <p>Select a workout to view logs.</p>
            ) : (
                <>
                    <h3>Workout: {selectedWorkout.title}</h3>

                    <form onSubmit={handleCreateLog}>
                        <input
                            type="text"
                            placeholder="Exercise Name"
                            value={exerciseName}
                            onChange={(e) => setExerciseName(e.target.value)}
                        />
                        <br />
                        <br />

                        <input
                            type="number"
                            placeholder="Sets"
                            value={sets}
                            onChange={(e) => setSets(e.target.value)}
                        />
                        <br />
                        <br />

                        <input
                            type="number"
                            placeholder="Reps"
                            value={reps}
                            onChange={(e) => setReps(e.target.value)}
                        />
                        <br />
                        <br />

                        <input
                            type="number"
                            placeholder="Weight"
                            value={weight}
                            onChange={(e) => setWeight(e.target.value)}
                        />
                        <br />
                        <br />

                        <button type="submit">Add Log</button>
                    </form>

                    <h3>Logs List</h3>

                    {logs.length === 0 ? (
                        <p>No logs found for this workout.</p>
                    ) : (
                        <ul>
                            {logs.map((log) => (
                                <li key={log._id} style={{ marginBottom: "10px" }}>
                                    <b>{log.exerciseName}</b> - {log.sets} sets x {log.reps} reps
                                    (Weight: {log.weight}kg)
                                    <br />
                                    <button onClick={() => handleDeleteLog(log._id)}>
                                        Delete Log
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </>
            )}
        </div>
    );
}