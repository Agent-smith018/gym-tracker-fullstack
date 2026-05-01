import { useContext, useEffect, useState } from "react";
import api from "../api/api";
import { AuthContext } from "../context/AuthContext";

export default function Dashboard() {
    const { logout } = useContext(AuthContext);

    const [workouts, setWorkouts] = useState([]);
    const [title, setTitle] = useState("");
    const [notes, setNotes] = useState("");

    const [error, setError] = useState("");

    // Fetch workouts
    const fetchWorkouts = async () => {
        try {
            const res = await api.get("/workouts");
            setWorkouts(res.data);
        } catch (err) {
            setError("Failed to load workouts");
        }
    };

    useEffect(() => {
        fetchWorkouts();
    }, []);

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
        } catch (err) {
            setError("Failed to delete workout");
        }
    };

    return (
        <div style={{ padding: "40px" }}>
            <h1>Gym Tracker Dashboard</h1>

            <button onClick={logout}>Logout</button>

            <hr />

            <h2>Create Workout</h2>

            {error && <p style={{ color: "red" }}>{error}</p>}

            <form onSubmit={handleCreateWorkout}>
                <input
                    type="text"
                    placeholder="Workout Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                />
                <br /><br />

                <input
                    type="text"
                    placeholder="Notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                />
                <br /><br />

                <button type="submit">Add Workout</button>
            </form>

            <hr />

            <h2>Your Workouts</h2>

            {workouts.length === 0 ? (
                <p>No workouts yet.</p>
            ) : (
                <ul>
                    {workouts.map((workout) => (
                        <li key={workout._id} style={{ marginBottom: "10px" }}>
                            <b>{workout.title}</b> - {workout.notes}
                            <br />
                            <button onClick={() => handleDeleteWorkout(workout._id)}>
                                Delete
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}