import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../api/axios';
import socket from '../socket/socket';
import ProgressChart from '../components/ProgressChart';

const WorkoutDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [workout, setWorkout] = useState(null);
    const [exercises, setExercises] = useState([]);
    const [loading, setLoading] = useState(true);
    const [notification, setNotification] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const [isCloning, setIsCloning] = useState(false);

    // REST TIMER STATE
    const [timeLeft, setTimeLeft] = useState(0);
    const [timerActive, setTimerActive] = useState(false);

    const emptyForm = { name: '', sets: '', reps: '', weight: '', notes: '' };
    const [form, setForm] = useState(emptyForm);

    // 1. Fetch workout + exercises
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [workoutRes, exercisesRes] = await Promise.all([
                    API.get(`/workouts/${id}`),
                    API.get(`/exercises/workout/${id}`),
                ]);
                setWorkout(workoutRes.data);
                setExercises(exercisesRes.data);
            } catch (err) {
                console.error('Failed to fetch data', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    const handleCloneAsTemplate = async () => {
        if (!window.confirm("Create a new workout for today using these exercises?")) return;

        setIsCloning(true);
        try {
            // 1. Create a new workout based on the current one
            const newWorkoutRes = await API.post('/workouts', {
                title: `${workout.title} (Template)`,
                date: new Date(), // Today's date
                notes: workout.notes
            });

            const newWorkoutId = newWorkoutRes.data._id;

            // 2. Map through existing exercises and create new entries for the new workout
            const clonePromises = exercises.map(ex =>
                API.post('/exercises', {
                    workoutId: newWorkoutId,
                    name: ex.name,
                    sets: ex.sets,
                    reps: ex.reps,
                    weight: ex.weight, // Users usually start with their last weight
                    notes: ex.notes
                })
            );

            await Promise.all(clonePromises);

            setNotification("Success! Redirecting to your new session...");
            setTimeout(() => navigate(`/workout/${newWorkoutId}`), 2000);
        } catch (err) {
            console.error("Cloning failed", err);
            setNotification("Error: Could not create template.");
        } finally {
            setIsCloning(false);
        }
    };
    // 2. REST TIMER LOGIC
    useEffect(() => {
        let interval = null;
        if (timerActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            setTimerActive(false);
            clearInterval(interval);
        }
        return () => clearInterval(interval);
    }, [timerActive, timeLeft]);

    const startTimer = (seconds) => {
        setTimeLeft(seconds);
        setTimerActive(true);
    };

    // 3. PR & VOLUME LOGIC (Calculated every render based on exercises state)
    const summaryStats = exercises.reduce((acc, ex) => {
        const volume = (Number(ex.sets) || 0) * (Number(ex.reps) || 0) * (Number(ex.weight) || 0);
        acc.totalVolume += volume;

        if (Number(ex.weight) > acc.maxWeight) {
            acc.maxWeight = Number(ex.weight);
            acc.bestExercise = ex.name;
        }
        return acc;
    }, { totalVolume: 0, maxWeight: 0, bestExercise: 'None' });

    // 4. WebSocket Event Listener
    useEffect(() => {
        socket.on('exercise:updated', (updatedExercise) => {
            setExercises((prev) =>
                prev.map((ex) =>
                    ex._id === updatedExercise._id ? updatedExercise : ex
                )
            );
            setNotification(`Updated: "${updatedExercise.name}"`);
            setTimeout(() => setNotification(''), 4000);
        });
        return () => socket.off('exercise:updated');
    }, []);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await API.post('/exercises', {
                workoutId: id,
                name: form.name,
                sets: Number(form.sets),
                reps: Number(form.reps),
                weight: Number(form.weight),
                notes: form.notes,
            });
            setExercises((prev) => [...prev, res.data]);
            setForm(emptyForm);
            setShowForm(false);
            startTimer(60); // Auto-start timer after logging
        } catch (err) {
            console.error('Failed to create exercise', err);
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (exercise) => {
        setEditingId(exercise._id);
        setForm({
            name: exercise.name,
            sets: exercise.sets,
            reps: exercise.reps,
            weight: exercise.weight,
            notes: exercise.notes || '',
        });
        setShowForm(false);
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await API.put(`/exercises/${editingId}`, {
                name: form.name,
                sets: Number(form.sets),
                reps: Number(form.reps),
                weight: Number(form.weight),
                notes: form.notes,
            });
            setEditingId(null);
            setForm(emptyForm);
        } catch (err) {
            console.error('Failed to update exercise', err);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (exerciseId) => {
        if (!window.confirm('Delete this exercise?')) return;
        try {
            await API.delete(`/exercises/${exerciseId}`);
            setExercises((prev) => prev.filter((ex) => ex._id !== exerciseId));
        } catch (err) {
            console.error('Failed to delete exercise', err);
        }
    };

    if (loading) return <div style={styles.container}><p style={styles.empty}>Loading workout details...</p></div>;
    if (!workout) return <div style={styles.container}><p style={styles.empty}>Workout not found.</p></div>;

    return (
        <div style={styles.container}>
            {notification && <div style={styles.notification}>🔔 {notification}</div>}

            <div style={styles.headerNav}>
                <button style={styles.backBtn} onClick={() => navigate('/dashboard')}>← Back to Dashboard</button>
                {/* 1. CLONE BUTTON */}
                <button
                    onClick={handleCloneAsTemplate}
                    disabled={isCloning}
                    style={{
                        ...styles.addBtn,
                        backgroundColor: '#667eea', // A nice purple/blue
                        marginLeft: '20px'
                    }}
                >
                    {isCloning ? 'Cloning...' : '📋 Create Workout Template'}
                </button>
            </div>
            <div style={styles.topGrid}>
                {/* Workout Header & Summary */}
                <div style={styles.workoutHeader}>
                    <h1 style={styles.title}>{workout.title}</h1>
                    <p style={styles.meta}>{new Date(workout.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>

                    <div style={styles.summaryRow}>
                        <div style={styles.miniStat}>
                            <span style={styles.miniLabel}>TOTAL VOLUME</span>
                            <span style={styles.miniValue}>{summaryStats.totalVolume.toLocaleString()} kg</span>
                        </div>
                        <div style={styles.miniStat}>
                            <span style={styles.miniLabel}>BEST LIFT</span>
                            <span style={styles.miniValue}>
                                {summaryStats.maxWeight > 0 ? `${summaryStats.maxWeight}kg (${summaryStats.bestExercise})` : 'N/A'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* REST TIMER CARD */}
                <div style={styles.timerCard}>
                    <h3 style={styles.timerTitle}>Rest Timer</h3>
                    <div style={styles.timerDisplay}>
                        {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                    </div>
                    <div style={styles.timerActions}>
                        <button style={styles.timerBtn} onClick={() => startTimer(60)}>1:00</button>
                        <button style={styles.timerBtn} onClick={() => startTimer(90)}>1:30</button>
                        <button style={{ ...styles.timerBtn, backgroundColor: '#e94560' }} onClick={() => setTimeLeft(0)}>Reset</button>
                    </div>
                </div>
            </div>

            {/* PROGRESS CHART SECTION */}
            {exercises.length > 1 && (
                <div style={styles.chartSection}>
                    <ProgressChart logs={exercises} />
                </div>
            )}

            <div style={styles.sectionHeader}>
                <h2 style={styles.sectionTitle}>Exercises</h2>
                <button style={styles.addBtn} onClick={() => { setShowForm(!showForm); setEditingId(null); }}>
                    {showForm ? 'Cancel' : '+ Add Exercise'}
                </button>
            </div>

            {/* FORM CARD (Create/Edit) */}
            {(showForm || editingId) && (
                <div style={styles.formCard}>
                    <h3 style={styles.formTitle}>{editingId ? 'Edit Exercise' : 'New Exercise'}</h3>
                    <form onSubmit={editingId ? handleUpdate : handleCreate}>
                        <div style={styles.field}>
                            <label style={styles.label}>Exercise Name</label>
                            <input style={styles.input} type="text" name="name" value={form.name} onChange={handleChange} required placeholder="e.g. Deadlift" />
                        </div>
                        <div style={styles.formGrid}>
                            <div style={styles.field}>
                                <label style={styles.label}>Sets</label>
                                <input style={styles.input} type="number" name="sets" value={form.sets} onChange={handleChange} required />
                            </div>
                            <div style={styles.field}>
                                <label style={styles.label}>Reps</label>
                                <input style={styles.input} type="number" name="reps" value={form.reps} onChange={handleChange} required />
                            </div>
                            <div style={styles.field}>
                                <label style={styles.label}>Weight (kg)</label>
                                <input style={styles.input} type="number" name="weight" value={form.weight} onChange={handleChange} />
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                            <button type="submit" style={styles.submitBtn} disabled={submitting}>
                                {submitting ? 'Saving...' : (editingId ? 'Update' : 'Add Exercise')}
                            </button>
                            <button type="button" style={styles.cancelBtn} onClick={() => { setEditingId(null); setShowForm(false); }}>Cancel</button>
                        </div>
                    </form>
                </div>
            )}

            {/* EXERCISE LIST */}
            <div style={styles.exerciseList}>
                {exercises.length === 0 ? (
                    <p style={styles.empty}>No exercises logged yet.</p>
                ) : (
                    exercises.map((ex, index) => (
                        <div key={ex._id} style={styles.exerciseCard}>
                            <div style={styles.exerciseLeft}>
                                <span style={styles.exerciseNumber}>{index + 1}</span>
                                <div>
                                    <h3 style={styles.exerciseName}>{ex.name}</h3>
                                    {ex.notes && <p style={styles.exerciseNotes}>{ex.notes}</p>}
                                </div>
                            </div>
                            <div style={styles.exerciseStats}>
                                <div style={styles.statGroup}>
                                    <span style={styles.statVal}>{ex.sets} × {ex.reps}</span>
                                    <span style={styles.statLbl}>Sets/Reps</span>
                                </div>
                                <div style={styles.statGroup}>
                                    <span style={styles.statVal}>{ex.weight}kg</span>
                                    <span style={styles.statLbl}>Weight</span>
                                </div>
                            </div>
                            <div style={styles.exerciseActions}>
                                <button style={styles.editBtn} onClick={() => handleEdit(ex)}>Edit</button>
                                <button style={styles.deleteBtn} onClick={() => handleDelete(ex._id)}>Delete</button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

const styles = {
    container: { minHeight: '100vh', backgroundColor: '#0f0f1a', padding: '30px', color: 'white', fontFamily: "'Inter', sans-serif" },
    notification: { backgroundColor: '#1a472a', color: '#69db7c', padding: '12px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #2f9e44' },
    backBtn: { background: 'none', color: '#a8a8b3', border: 'none', cursor: 'pointer', marginBottom: '20px', fontSize: '0.9rem' },
    topGrid: { display: 'grid', gridTemplateColumns: '1fr 320px', gap: '20px', marginBottom: '20px' },
    workoutHeader: { backgroundColor: '#1a1a2e', padding: '24px', borderRadius: '15px', border: '1px solid #2d2d44' },
    title: { fontSize: '1.8rem', margin: '0 0 5px 0' },
    meta: { color: '#a8a8b3', fontSize: '0.9rem', marginBottom: '20px' },
    summaryRow: { display: 'flex', gap: '30px', borderTop: '1px solid #2d2d44', paddingTop: '20px' },
    miniStat: { display: 'flex', flexDirection: 'column' },
    miniLabel: { fontSize: '0.7rem', color: '#a8a8b3', marginBottom: '5px' },
    miniValue: { fontSize: '1.2rem', fontWeight: 'bold', color: '#69db7c' },
    timerCard: { backgroundColor: '#16213e', padding: '20px', borderRadius: '15px', border: '1px solid #e94560', textAlign: 'center' },
    timerTitle: { fontSize: '0.9rem', color: '#a8a8b3', margin: '0 0 10px 0' },
    timerDisplay: { fontSize: '3.5rem', fontWeight: 'bold', color: '#e94560', margin: '10px 0' },
    timerActions: { display: 'flex', gap: '8px', justifyContent: 'center' },
    timerBtn: { padding: '8px 12px', borderRadius: '6px', border: 'none', backgroundColor: '#0f0f1a', color: 'white', cursor: 'pointer', fontSize: '0.8rem' },
    chartSection: { backgroundColor: '#1a1a2e', padding: '20px', borderRadius: '15px', border: '1px solid #2d2d44', marginBottom: '20px' },
    sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
    sectionTitle: { fontSize: '1.4rem' },
    addBtn: { backgroundColor: '#e94560', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' },
    formCard: { backgroundColor: '#1a1a2e', padding: '24px', borderRadius: '15px', border: '1px solid #e94560', marginBottom: '24px' },
    formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' },
    field: { marginBottom: '15px' },
    label: { display: 'block', color: '#a8a8b3', fontSize: '0.8rem', marginBottom: '8px' },
    input: { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #2d2d44', backgroundColor: '#0f0f1a', color: 'white' },
    submitBtn: { backgroundColor: '#e94560', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '8px', cursor: 'pointer' },
    cancelBtn: { backgroundColor: 'transparent', color: '#a8a8b3', border: '1px solid #2d2d44', padding: '12px 24px', borderRadius: '8px', cursor: 'pointer' },
    exerciseList: { display: 'flex', flexDirection: 'column', gap: '15px' },
    exerciseCard: { backgroundColor: '#1a1a2e', padding: '20px', borderRadius: '12px', border: '1px solid #2d2d44', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    exerciseLeft: { display: 'flex', alignItems: 'center', gap: '20px' },
    exerciseNumber: { backgroundColor: '#e9456022', color: '#e94560', width: '35px', height: '35px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' },
    exerciseName: { fontSize: '1.1rem', margin: 0 },
    exerciseNotes: { color: '#a8a8b3', fontSize: '0.8rem', margin: '5px 0 0 0' },
    exerciseStats: { display: 'flex', gap: '25px', textAlign: 'center' },
    statGroup: { display: 'flex', flexDirection: 'column' },
    statVal: { fontSize: '1.1rem', fontWeight: 'bold' },
    statLbl: { fontSize: '0.7rem', color: '#a8a8b3' },
    exerciseActions: { display: 'flex', gap: '10px' },
    editBtn: { background: 'none', color: '#a8a8b3', border: '1px solid #2d2d44', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' },
    deleteBtn: { background: 'none', color: '#e94560', border: '1px solid #e94560', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' },
    empty: { textAlign: 'center', color: '#a8a8b3', marginTop: '40px' }
};

export default WorkoutDetail;