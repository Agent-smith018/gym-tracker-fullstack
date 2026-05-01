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

    // Sorting
    const [workoutSort, setWorkoutSort] = useState("newest");
    const [logSort, setLogSort] = useState("newest");

    // Pagination
    const [workoutPage, setWorkoutPage] = useState(1);
    const [logPage, setLogPage] = useState(1);

    const workoutsPerPage = 5;
    const logsPerPage = 5;

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
        setLogPage(1);
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

    // Filter + Sort Workouts
    let filteredWorkouts = workouts.filter((w) =>
        w.title.toLowerCase().includes(workoutSearch.toLowerCase())
    );

    if (workoutSort === "newest") {
        filteredWorkouts.sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
    }

    if (workoutSort === "oldest") {
        filteredWorkouts.sort(
            (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
        );
    }

    if (workoutSort === "az") {
        filteredWorkouts.sort((a, b) => a.title.localeCompare(b.title));
    }

    // Filter + Sort Logs
    let filteredLogs = logs.filter((log) => {
        const matchName = log.exerciseName
            .toLowerCase()
            .includes(logSearch.toLowerCase());

        const matchWeight =
            minWeight === "" || Number(log.weight) >= Number(minWeight);

        const matchReps = minReps === "" || Number(log.reps) >= Number(minReps);

        return matchName && matchWeight && matchReps;
    });

    if (logSort === "newest") {
        filteredLogs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    if (logSort === "oldest") {
        filteredLogs.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    }

    if (logSort === "weightHigh") {
        filteredLogs.sort((a, b) => Number(b.weight) - Number(a.weight));
    }

    if (logSort === "weightLow") {
        filteredLogs.sort((a, b) => Number(a.weight) - Number(b.weight));
    }

    // Pagination logic
    const totalWorkoutPages = Math.ceil(filteredWorkouts.length / workoutsPerPage);
    const totalLogPages = Math.ceil(filteredLogs.length / logsPerPage);

    const paginatedWorkouts = filteredWorkouts.slice(
        (workoutPage - 1) * workoutsPerPage,
        workoutPage * workoutsPerPage
    );

    const paginatedLogs = filteredLogs.slice(
        (logPage - 1) * logsPerPage,
        logPage * logsPerPage
    );

    return (
        <div className="min-h-screen bg-slate-50">
            <Navbar onLogout={logout} />

            {/* Notification */}
            {notification && (
                <div className="fixed top-24 right-5 bg-slate-600 text-white px-6 py-4 rounded-2xl shadow-xl shadow-slate-500/20 font-medium z-50 flex items-center gap-3 border border-slate-500">
                    
                    {notification}
                </div>
            )}

            <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
                {/* Error */}
                {error && (
                    <div className="bg-red-50 text-red-600 border border-red-200 px-5 py-4 rounded-2xl mb-6 text-sm flex items-center shadow-sm">
                        
                        {error}
                    </div>
                )}

                {/* Profile */}
                <div className="bg-white border border-slate-200 shadow-xl rounded-3xl p-8 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center relative overflow-hidden group">

                    <div className="relative z-10">
                        <h2 className="text-3xl font-bold text-slate-900 mb-1">
                            Welcome back, {user?.name || "User"}
                        </h2>
                        <p className="text-slate-500 font-medium">{user?.email}</p>
                    </div>

                    <div className="relative z-10 mt-4 md:mt-0 bg-white/60 px-5 py-2.5 rounded-full border border-slate-200 shadow-sm">
                        <p className="text-sm font-medium text-slate-600 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                            Ready to crush your goals
                        </p>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white border border-slate-200 shadow-xl rounded-3xl p-6 hover:-translate-y-1 transition-transform duration-300">
                        <div className="flex items-center gap-4">

                            <div>
                                <p className="text-slate-500 text-sm font-medium">Total Workouts</p>
                                <h3 className="text-3xl font-bold text-slate-900">{totalWorkouts}</h3>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white border border-slate-200 shadow-xl rounded-3xl p-6 hover:-translate-y-1 transition-transform duration-300 delay-100">
                        <div className="flex items-center gap-4">

                            <div>
                                <p className="text-slate-500 text-sm font-medium">Total Exercises Logged</p>

                            </div>
                        </div>
                    </div>

                    <div className="bg-white border border-slate-200 shadow-xl rounded-3xl p-6 hover:-translate-y-1 transition-transform duration-300 delay-200">
                        <div className="flex items-center gap-4">

                            <div>
                                <p className="text-slate-500 text-sm font-medium">Total Volume</p>
                                <h3 className="text-3xl font-bold text-slate-900">{totalWeightLifted} <span className="text-lg text-slate-500">kg</span></h3>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Chart */}
                <div className="bg-white border border-slate-200 shadow-xl rounded-3xl p-6 lg:p-8 mb-8">
                    <div className="flex items-center gap-3 mb-6">
<h2 className="text-2xl font-bold text-slate-900">Progress Overview</h2>
                    </div>

                    {logs.length === 0 ? (
                        <div className="h-72 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
<p className="font-medium">Start logging exercises to see your progress chart.</p>
                        </div>
                    ) : (
                        <div className="w-full h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                    <Tooltip
                                        cursor={{ fill: '#f1f5f9' }}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)', padding: '12px' }}
                                    />
                                    <Bar dataKey="weight" fill="#0f172a" radius={[4, 4, 0, 0]} maxBarSize={50} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>

                {/* Main grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Workouts */}
                    <div className="lg:col-span-5 bg-white border border-slate-200 shadow-xl rounded-3xl p-6 lg:p-8">
                        <div className="flex items-center gap-3 mb-6">
<h2 className="text-2xl font-bold text-slate-900">Workouts</h2>
                        </div>

                        <div className="flex gap-3 mb-6">
                            <div className="relative flex-1">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    
                                </div>
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    value={workoutSearch}
                                    onChange={(e) => {
                                        setWorkoutSearch(e.target.value);
                                        setWorkoutPage(1);
                                    }}
                                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition"
                                />
                            </div>
                            <select
                                value={workoutSort}
                                onChange={(e) => {
                                    setWorkoutSort(e.target.value);
                                    setWorkoutPage(1);
                                }}
                                className="w-32 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition bg-white"
                            >
                                <option value="newest">Newest</option>
                                <option value="oldest">Oldest</option>
                                <option value="az">A-Z</option>
                            </select>
                        </div>

                        <form onSubmit={handleCreateWorkout} className="bg-slate-50/50 rounded-2xl p-4 border border-slate-100 mb-6 space-y-3">
                            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-2">Create New</h3>
                            <input
                                type="text"
                                placeholder="Workout Title (e.g. Leg Day)"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition bg-white"
                            />

                            <input
                                type="text"
                                placeholder="Notes (Optional)"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition bg-white"
                            />

                            <button
                                disabled={creatingWorkout}
                                className={`w-full py-2.5 rounded-xl font-semibold shadow-md transition-all ${creatingWorkout
                                    ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                                    : "bg-slate-900 hover:bg-slate-800 text-white hover:shadow-lg hover:-translate-y-0.5"
                                    }`}
                            >
                                {creatingWorkout ? "Creating..." : "Add Workout"}
                            </button>
                        </form>

                        {loadingWorkouts ? (
                            <div className="flex justify-center py-8">
                                <svg className="animate-spin h-8 w-8 text-slate-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            </div>
                        ) : paginatedWorkouts.length === 0 ? (
                            <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-500">
                                No workouts found.
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {paginatedWorkouts.map((workout) => (
                                    <div
                                        key={workout._id}
                                        onClick={() => handleSelectWorkout(workout)}
                                        className={`p-5 rounded-2xl border cursor-pointer transition-all duration-200 ${selectedWorkout?._id === workout._id
                                            ? "border-slate-500 bg-slate-50 shadow-md transform scale-[1.01]"
                                            : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-md"
                                            }`}
                                    >
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <h3 className={`font-bold text-lg ${selectedWorkout?._id === workout._id ? "text-slate-700" : "text-slate-900"}`}>
                                                    {workout.title}
                                                </h3>
                                                <p className="text-sm text-slate-500 line-clamp-1">{workout.notes || "No notes"}</p>
                                            </div>

                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    askDeleteWorkout(workout._id);
                                                }}
                                                className="text-slate-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                                                title="Delete Workout"
                                            >
                                                
                                            </button>
                                        </div>

                                        <div className="flex items-center text-xs font-semibold text-slate-600 bg-slate-100/50 px-3 py-1.5 rounded-lg w-max">
                                            View Details →
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {totalWorkoutPages > 1 && (
                            <div className="flex justify-between items-center mt-6 pt-6 border-t border-slate-100">
                                <button
                                    disabled={workoutPage === 1}
                                    onClick={() => setWorkoutPage((p) => p - 1)}
                                    className="px-4 py-2 rounded-xl border border-slate-200 font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors"
                                >
                                    Previous
                                </button>
                                <p className="text-slate-500 font-medium text-sm">
                                    {workoutPage} / {totalWorkoutPages}
                                </p>
                                <button
                                    disabled={workoutPage === totalWorkoutPages}
                                    onClick={() => setWorkoutPage((p) => p + 1)}
                                    className="px-4 py-2 rounded-xl border border-slate-200 font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors"
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Logs */}
                    <div className="lg:col-span-7 bg-white border border-slate-200 shadow-xl rounded-3xl p-6 lg:p-8">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white shadow-md">
                                
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900">Exercise Details</h2>
                        </div>

                        {!selectedWorkout ? (
                            <div className="h-96 flex flex-col items-center justify-center text-center p-8 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
<h3 className="text-lg font-bold text-slate-800 mb-2">No Workout Selected</h3>
                                <p className="text-slate-500 max-w-sm">
                                    Select a workout from the list on the left to view and manage its exercises.
                                </p>
                            </div>
                        ) : (
                            <div className="">
                                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 mb-6 flex justify-between items-center">
                                    <div>
                                        <p className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Current Workout</p>
                                        <h3 className="text-xl font-bold text-slate-900">{selectedWorkout.title}</h3>
                                    </div>
                                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm text-slate-500 font-bold">
                                        {logs.length}
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                                    <div className="relative flex-1">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Search exercises..."
                                            value={logSearch}
                                            onChange={(e) => {
                                                setLogSearch(e.target.value);
                                                setLogPage(1);
                                            }}
                                            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition"
                                        />
                                    </div>

                                    <div className="flex gap-3">
                                        <select
                                            value={logSort}
                                            onChange={(e) => {
                                                setLogSort(e.target.value);
                                                setLogPage(1);
                                            }}
                                            className="border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition bg-white flex-1 sm:w-auto"
                                        >
                                            <option value="newest">Newest</option>
                                            <option value="oldest">Oldest</option>
                                            <option value="weightHigh">Heaviest</option>
                                            <option value="weightLow">Lightest</option>
                                        </select>
                                    </div>
                                </div>

                                <form onSubmit={handleCreateLog} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm mb-6 space-y-4">
                                    <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Log Exercise</h3>

                                    <input
                                        type="text"
                                        placeholder="Exercise Name (e.g. Bench Press)"
                                        value={exerciseName}
                                        onChange={(e) => setExerciseName(e.target.value)}
                                        className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition bg-slate-50"
                                    />

                                    <div className="grid grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-500 mb-1 ml-1">Sets</label>
                                            <input
                                                type="number"
                                                placeholder="0"
                                                value={sets}
                                                onChange={(e) => setSets(e.target.value)}
                                                className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition bg-slate-50 text-center"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-500 mb-1 ml-1">Reps</label>
                                            <input
                                                type="number"
                                                placeholder="0"
                                                value={reps}
                                                onChange={(e) => setReps(e.target.value)}
                                                className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition bg-slate-50 text-center"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-500 mb-1 ml-1">Weight (kg)</label>
                                            <input
                                                type="number"
                                                placeholder="0"
                                                value={weight}
                                                onChange={(e) => setWeight(e.target.value)}
                                                className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition bg-slate-50 text-center"
                                            />
                                        </div>
                                    </div>

                                    <button
                                        disabled={creatingLog}
                                        className={`w-full py-3 rounded-xl font-bold bg-slate-900 hover:bg-slate-800 text-white transition shadow-md mt-2 ${creatingLog ? "opacity-70 cursor-not-allowed" : ""}`}
                                    >
                                        {creatingLog ? "Adding..." : "Add to Workout"}
                                    </button>
                                </form>

                                {loadingLogs ? (
                                    <div className="flex justify-center py-8">
                                        <svg className="animate-spin h-8 w-8 text-slate-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                    </div>
                                ) : paginatedLogs.length === 0 ? (
                                    <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-500">
                                        No exercises logged yet.
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {paginatedLogs.map((log) => (
                                            <div
                                                key={log._id}
                                                className="p-5 border border-slate-200 bg-white rounded-2xl flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:shadow-md transition-shadow group"
                                            >
                                                <div className="flex items-center gap-4">
<div>
                                                        <h4 className="font-bold text-lg text-slate-900">{log.exerciseName}</h4>
                                                        <div className="flex items-center gap-3 text-sm text-slate-500 mt-1">
                                                            <span className="bg-slate-100 px-2.5 py-1 rounded-md font-medium text-slate-700">{log.sets} sets</span>
                                                            <span className="text-slate-300">•</span>
                                                            <span className="bg-slate-100 px-2.5 py-1 rounded-md font-medium text-slate-700">{log.reps} reps</span>
                                                            <span className="text-slate-300">•</span>
                                                            <span className="bg-slate-50 text-slate-700 px-2.5 py-1 rounded-md font-bold">{log.weight} kg</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => askDeleteLog(log._id)}
                                                    className="self-end sm:self-auto text-slate-400 hover:text-red-500 p-2 rounded-xl hover:bg-red-50 transition-colors opacity-100 sm:opacity-0 group-hover:opacity-100"
                                                    title="Delete Log"
                                                >
                                                    
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {totalLogPages > 1 && (
                                    <div className="flex justify-between items-center mt-6 pt-6 border-t border-slate-100">
                                        <button
                                            disabled={logPage === 1}
                                            onClick={() => setLogPage((p) => p - 1)}
                                            className="px-4 py-2 rounded-xl border border-slate-200 font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors"
                                        >
                                            Previous
                                        </button>
                                        <p className="text-slate-500 font-medium text-sm">
                                            {logPage} / {totalLogPages}
                                        </p>
                                        <button
                                            disabled={logPage === totalLogPages}
                                            onClick={() => setLogPage((p) => p + 1)}
                                            className="px-4 py-2 rounded-xl border border-slate-200 font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors"
                                        >
                                            Next
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* MODALS */}
                <ConfirmModal
                    isOpen={showWorkoutModal}
                    title="Delete Workout"
                    message="Are you sure you want to delete this workout? All associated exercise logs will also be permanently deleted. This action cannot be undone."
                    onCancel={() => setShowWorkoutModal(false)}
                    onConfirm={confirmDeleteWorkout}
                />

                <ConfirmModal
                    isOpen={showLogModal}
                    title="Delete Exercise Log"
                    message="Are you sure you want to delete this exercise? It will be removed from your workout history."
                    onCancel={() => setShowLogModal(false)}
                    onConfirm={confirmDeleteLog}
                />
            </div>
        </div>
    );
}