import { useContext, useEffect, useState } from "react";
import api from "../api/api";
import { AuthContext } from "../context/AuthContext";
import socket from "../api/socket";
import Navbar from "../components/Navbar";
import ConfirmModal from "../components/ConfirmModal";

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
} from "recharts";

export default function Dashboard() {
    const { logout } = useContext(AuthContext);

    const [user, setUser] = useState(null);

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

    const [loadingWorkouts, setLoadingWorkouts] = useState(false);
    const [loadingLogs, setLoadingLogs] = useState(false);
    const [creatingWorkout, setCreatingWorkout] = useState(false);
    const [creatingLog, setCreatingLog] = useState(false);

    // Search + Filters
    const [workoutSearch, setWorkoutSearch] = useState("");
    const [logSearch, setLogSearch] = useState("");
    const [minWeight, setMinWeight] = useState("");
    const [minReps, setMinReps] = useState("");

    // Modal states
    const [showWorkoutModal, setShowWorkoutModal] = useState(false);
    const [showLogModal, setShowLogModal] = useState(false);
    const [workoutToDelete, setWorkoutToDelete] = useState(null);
    const [logToDelete, setLogToDelete] = useState(null);

    // Fetch current user
    const fetchMe = async () => {
        try {
            const res = await api.get("/auth/me");
            setUser(res.data);
        } catch (err) {
            setError("Failed to load user profile");
        }
    };

    // Fetch workouts
    const fetchWorkouts = async () => {
        try {
            setLoadingWorkouts(true);
            const res = await api.get("/workouts");
            setWorkouts(res.data);
        } catch (err) {
            setError("Failed to load workouts");
        } finally {
            setLoadingWorkouts(false);
        }
    };

    // Fetch logs by workout
    const fetchLogsByWorkout = async (workoutId) => {
        try {
            setLoadingLogs(true);
            const res = await api.get(`/logs/workout/${workoutId}`);
            setLogs(res.data);
        } catch (err) {
            setError("Failed to load logs");
        } finally {
            setLoadingLogs(false);
        }
    };

    useEffect(() => {
        fetchMe();
        fetchWorkouts();
    }, []);

    // Socket.io realtime updates
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

        if (!title.trim()) {
            return setError("Workout title is required.");
        }

        try {
            setCreatingWorkout(true);
            await api.post("/workouts", { title, notes });
            setTitle("");
            setNotes("");
            fetchWorkouts();
        } catch (err) {
            setError(err.response?.data?.message || "Failed to create workout");
        } finally {
            setCreatingWorkout(false);
        }
    };

    // Select workout
    const handleSelectWorkout = (workout) => {
        setSelectedWorkout(workout);
        fetchLogsByWorkout(workout._id);
    };

    // Create log
    const handleCreateLog = async (e) => {
        e.preventDefault();
        setError("");

        if (!selectedWorkout) {
            return setError("Please select a workout first.");
        }

        if (!exerciseName.trim()) {
            return setError("Exercise name is required.");
        }

        try {
            setCreatingLog(true);

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
        } finally {
            setCreatingLog(false);
        }
    };

    // Ask delete workout
    const askDeleteWorkout = (id) => {
        setWorkoutToDelete(id);
        setShowWorkoutModal(true);
    };

    // Confirm delete workout
    const confirmDeleteWorkout = async () => {
        try {
            await api.delete(`/workouts/${workoutToDelete}`);
            fetchWorkouts();

            if (selectedWorkout?._id === workoutToDelete) {
                setSelectedWorkout(null);
                setLogs([]);
            }
        } catch (err) {
            setError("Failed to delete workout");
        } finally {
            setShowWorkoutModal(false);
            setWorkoutToDelete(null);
        }
    };

    // Ask delete log
    const askDeleteLog = (logId) => {
        setLogToDelete(logId);
        setShowLogModal(true);
    };

    // Confirm delete log
    const confirmDeleteLog = async () => {
        try {
            await api.delete(`/logs/${logToDelete}`);
            fetchLogsByWorkout(selectedWorkout._id);
        } catch (err) {
            setError("Failed to delete log");
        } finally {
            setShowLogModal(false);
            setLogToDelete(null);
        }
    };

    // Stats calculations
    const totalWorkouts = workouts.length;
    const totalLogs = logs.length;

    const totalWeightLifted = logs.reduce((sum, log) => {
        const logWeight = Number(log.weight) || 0;
        const logReps = Number(log.reps) || 0;
        const logSets = Number(log.sets) || 0;
        return sum + logWeight * logReps * logSets;
    }, 0);

    // Chart data
    const chartData = logs.map((log) => ({
        name: log.exerciseName,
        weight: Number(log.weight),
        reps: Number(log.reps),
    }));

    // Filter workouts
    const filteredWorkouts = workouts.filter((w) =>
        w.title.toLowerCase().includes(workoutSearch.toLowerCase())
    );

    // Filter logs
    const filteredLogs = logs.filter((log) => {
        const matchName = log.exerciseName
            .toLowerCase()
            .includes(logSearch.toLowerCase());

        const matchWeight =
            minWeight === "" || Number(log.weight) >= Number(minWeight);

        const matchReps = minReps === "" || Number(log.reps) >= Number(minReps);

        return matchName && matchWeight && matchReps;
    });

    return (
        <div className="min-h-screen bg-gray-100">
            <Navbar onLogout={logout} />

            {/* Notification */}
            {notification && (
                <div className="fixed top-5 right-5 bg-green-500 text-white px-5 py-3 rounded-xl shadow-lg font-semibold z-50">
                    {notification}
                </div>
            )}

            <div className="max-w-6xl mx-auto p-6">
                {/* Error */}
                {error && (
                    <div className="bg-red-100 text-red-700 px-4 py-3 rounded-lg mb-4">
                        {error}
                    </div>
                )}

                {/* Profile */}
                <div className="bg-white rounded-2xl shadow-md p-6 mb-6 flex flex-col md:flex-row justify-between items-start md:items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">
                            Welcome {user?.name || "User"} 👋
                        </h2>
                        <p className="text-gray-500">{user?.email}</p>
                    </div>

                    <p className="text-sm text-gray-500 mt-3 md:mt-0">
                        Track your workouts and improve your fitness 💪
                    </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-white rounded-2xl shadow-md p-5">
                        <p className="text-gray-500 text-sm">Total Workouts</p>
                        <h3 className="text-2xl font-bold">{totalWorkouts}</h3>
                    </div>

                    <div className="bg-white rounded-2xl shadow-md p-5">
                        <p className="text-gray-500 text-sm">Total Logs</p>
                        <h3 className="text-2xl font-bold">{totalLogs}</h3>
                    </div>

                    <div className="bg-white rounded-2xl shadow-md p-5">
                        <p className="text-gray-500 text-sm">Total Weight Lifted</p>
                        <h3 className="text-2xl font-bold">{totalWeightLifted} kg</h3>
                    </div>
                </div>

                {/* Chart */}
                <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
                    <h2 className="text-xl font-bold mb-4">📈 Workout Progress Chart</h2>

                    {logs.length === 0 ? (
                        <p className="text-gray-500">
                            No logs available to generate chart.
                        </p>
                    ) : (
                        <div className="w-full h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip />
                                    <Bar dataKey="weight" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>

                {/* Main grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Workouts */}
                    <div className="bg-white rounded-2xl shadow-md p-6">
                        <h2 className="text-xl font-bold mb-4">📌 Workouts</h2>

                        {/* Search workout */}
                        <input
                            type="text"
                            placeholder="Search workout..."
                            value={workoutSearch}
                            onChange={(e) => setWorkoutSearch(e.target.value)}
                            className="w-full border rounded-lg px-4 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-gray-800"
                        />

                        <form onSubmit={handleCreateWorkout} className="space-y-3 mb-6">
                            <input
                                type="text"
                                placeholder="Workout Title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gray-800"
                            />

                            <input
                                type="text"
                                placeholder="Notes"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gray-800"
                            />

                            <button
                                disabled={creatingWorkout}
                                className={`w-full py-2 rounded-lg font-semibold transition ${creatingWorkout
                                    ? "bg-gray-400 cursor-not-allowed"
                                    : "bg-gray-900 hover:bg-gray-800 text-white"
                                    }`}
                            >
                                {creatingWorkout ? "Adding..." : "Add Workout"}
                            </button>
                        </form>

                        {loadingWorkouts ? (
                            <p className="text-gray-500">Loading workouts...</p>
                        ) : filteredWorkouts.length === 0 ? (
                            <p className="text-gray-500">No workouts found.</p>
                        ) : (
                            <div className="space-y-3">
                                {filteredWorkouts.map((workout) => (
                                    <div
                                        key={workout._id}
                                        className={`p-4 border rounded-xl transition ${selectedWorkout?._id === workout._id
                                            ? "border-gray-900 bg-gray-50"
                                            : "hover:bg-gray-50"
                                            }`}
                                    >
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <h3 className="font-bold text-lg">{workout.title}</h3>
                                                <p className="text-sm text-gray-500">{workout.notes}</p>
                                            </div>

                                            <button
                                                onClick={() => askDeleteWorkout(workout._id)}
                                                className="text-red-500 hover:text-red-700 font-semibold text-sm"
                                            >
                                                Delete
                                            </button>
                                        </div>

                                        <button
                                            onClick={() => handleSelectWorkout(workout)}
                                            className="mt-3 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-semibold transition"
                                        >
                                            View Logs
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Logs */}
                    <div className="bg-white rounded-2xl shadow-md p-6">
                        <h2 className="text-xl font-bold mb-4">📊 Exercise Logs</h2>

                        {!selectedWorkout ? (
                            <p className="text-gray-500">
                                Select a workout to view and add logs.
                            </p>
                        ) : (
                            <>
                                <h3 className="text-lg font-semibold mb-3">
                                    Workout:{" "}
                                    <span className="text-blue-600">{selectedWorkout.title}</span>
                                </h3>

                                {/* Search + Filter logs */}
                                <div className="space-y-3 mb-5">
                                    <input
                                        type="text"
                                        placeholder="Search exercise..."
                                        value={logSearch}
                                        onChange={(e) => setLogSearch(e.target.value)}
                                        className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />

                                    <div className="grid grid-cols-2 gap-3">
                                        <input
                                            type="number"
                                            placeholder="Min Weight"
                                            value={minWeight}
                                            onChange={(e) => setMinWeight(e.target.value)}
                                            className="border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />

                                        <input
                                            type="number"
                                            placeholder="Min Reps"
                                            value={minReps}
                                            onChange={(e) => setMinReps(e.target.value)}
                                            className="border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>

                                <form onSubmit={handleCreateLog} className="space-y-3 mb-6">
                                    <input
                                        type="text"
                                        placeholder="Exercise Name"
                                        value={exerciseName}
                                        onChange={(e) => setExerciseName(e.target.value)}
                                        className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />

                                    <div className="grid grid-cols-3 gap-2">
                                        <input
                                            type="number"
                                            placeholder="Sets"
                                            value={sets}
                                            onChange={(e) => setSets(e.target.value)}
                                            className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                        <input
                                            type="number"
                                            placeholder="Reps"
                                            value={reps}
                                            onChange={(e) => setReps(e.target.value)}
                                            className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                        <input
                                            type="number"
                                            placeholder="Weight"
                                            value={weight}
                                            onChange={(e) => setWeight(e.target.value)}
                                            className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>

                                    <button
                                        disabled={creatingLog}
                                        className={`w-full py-2 rounded-lg font-semibold transition ${creatingLog
                                            ? "bg-gray-400 cursor-not-allowed"
                                            : "bg-blue-600 hover:bg-blue-700 text-white"
                                            }`}
                                    >
                                        {creatingLog ? "Adding..." : "Add Log"}
                                    </button>
                                </form>

                                {loadingLogs ? (
                                    <p className="text-gray-500">Loading logs...</p>
                                ) : filteredLogs.length === 0 ? (
                                    <p className="text-gray-500">No logs found.</p>
                                ) : (
                                    <div className="space-y-3">
                                        {filteredLogs.map((log) => (
                                            <div
                                                key={log._id}
                                                className="p-4 border rounded-xl flex justify-between items-center hover:bg-gray-50 transition"
                                            >
                                                <div>
                                                    <h4 className="font-bold">{log.exerciseName}</h4>
                                                    <p className="text-sm text-gray-500">
                                                        {log.sets} sets × {log.reps} reps | Weight:{" "}
                                                        {log.weight} kg
                                                    </p>
                                                </div>

                                                <button
                                                    onClick={() => askDeleteLog(log._id)}
                                                    className="text-red-500 hover:text-red-700 font-semibold text-sm"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* MODALS */}
                <ConfirmModal
                    isOpen={showWorkoutModal}
                    title="Delete Workout"
                    message="Are you sure you want to delete this workout? This action cannot be undone."
                    onCancel={() => setShowWorkoutModal(false)}
                    onConfirm={confirmDeleteWorkout}
                />

                <ConfirmModal
                    isOpen={showLogModal}
                    title="Delete Exercise Log"
                    message="Are you sure you want to delete this exercise log?"
                    onCancel={() => setShowLogModal(false)}
                    onConfirm={confirmDeleteLog}
                />
            </div>
        </div>
    );
}