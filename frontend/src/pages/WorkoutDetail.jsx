import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../api/axios';
import socket from '../socket/socket';

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

    const emptyForm = { name: '', sets: '', reps: '', weight: '', notes: '' };
    const [form, setForm] = useState(emptyForm);

    // Fetch workout + exercises
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

    // 🔴 WebSocket Event 2: listen for exercise updates
    useEffect(() => {
        socket.on('exercise:updated', (updatedExercise) => {
            setExercises((prev) =>
                prev.map((ex) =>
                    ex._id === updatedExercise._id ? updatedExercise : ex
                )
            );
            setNotification(`Exercise updated: "${updatedExercise.name}"`);
            setTimeout(() => setNotification(''), 4000);
        });

        return () => socket.off('exercise:updated');
    }, []);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    // Create exercise
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
        } catch (err) {
            console.error('Failed to create exercise', err);
        } finally {
            setSubmitting(false);
        }
    };

    // Start editing
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

    // Update exercise
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
            // WebSocket will update the list automatically
            setEditingId(null);
            setForm(emptyForm);
        } catch (err) {
            console.error('Failed to update exercise', err);
        } finally {
            setSubmitting(false);
        }
    };

    // Delete exercise
    const handleDelete = async (exerciseId) => {
        if (!window.confirm('Delete this exercise?')) return;
        try {
            await API.delete(`/exercises/${exerciseId}`);
            setExercises((prev) => prev.filter((ex) => ex._id !== exerciseId));
        } catch (err) {
            console.error('Failed to delete exercise', err);
        }
    };

    const cancelEdit = () => {
        setEditingId(null);
        setForm(emptyForm);
    };

    if (loading) {
        return (
            <div style={styles.container}>
                <p style={styles.empty}>Loading workout...</p>
            </div>
        );
    }

    if (!workout) {
        return (
            <div style={styles.container}>
                <p style={styles.empty}>Workout not found.</p>
            </div>
        );
    }

    return (
        <div style={styles.container}>

            {/* Live notification */}
            {notification && (
                <div style={styles.notification}>
                    🔔 {notification}
                </div>
            )}

            {/* Back button */}
            <button style={styles.backBtn} onClick={() => navigate('/dashboard')}>
                ← Back to Dashboard
            </button>

            {/* Workout Header */}
            <div style={styles.workoutHeader}>
                <div>
                    <h1 style={styles.title}>{workout.title}</h1>
                    <p style={styles.meta}>
                        {new Date(workout.date).toLocaleDateString('en-US', {
                            weekday: 'long', year: 'numeric',
                            month: 'long', day: 'numeric'
                        })}
                        {workout.duration ? ` • ${workout.duration} mins` : ''}
                    </p>
                    {workout.notes && (
                        <p style={styles.workoutNotes}>{workout.notes}</p>
                    )}
                </div>
                <div style={styles.statBox}>
                    <span style={styles.statNumber}>{exercises.length}</span>
                    <span style={styles.statLabel}>Exercises</span>
                </div>
            </div>

            {/* Add Exercise Button */}
            <div style={styles.sectionHeader}>
                <h2 style={styles.sectionTitle}>Exercises</h2>
                <button
                    style={styles.addBtn}
                    onClick={() => {
                        setShowForm(!showForm);
                        setEditingId(null);
                        setForm(emptyForm);
                    }}
                >
                    {showForm ? 'Cancel' : '+ Add Exercise'}
                </button>
            </div>

            {/* Create Exercise Form */}
            {showForm && (
                <div style={styles.formCard}>
                    <h3 style={styles.formTitle}>New Exercise</h3>
                    <form onSubmit={handleCreate}>
                        <div style={styles.field}>
                            <label style={styles.label}>Exercise Name *</label>
                            <input
                                style={styles.input}
                                type="text"
                                name="name"
                                placeholder="e.g. Bench Press"
                                value={form.name}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div style={styles.formGrid}>
                            <div style={styles.field}>
                                <label style={styles.label}>Sets *</label>
                                <input
                                    style={styles.input}
                                    type="number"
                                    name="sets"
                                    placeholder="4"
                                    value={form.sets}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div style={styles.field}>
                                <label style={styles.label}>Reps *</label>
                                <input
                                    style={styles.input}
                                    type="number"
                                    name="reps"
                                    placeholder="10"
                                    value={form.reps}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div style={styles.field}>
                                <label style={styles.label}>Weight (kg)</label>
                                <input
                                    style={styles.input}
                                    type="number"
                                    name="weight"
                                    placeholder="80"
                                    value={form.weight}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>
                        <div style={styles.field}>
                            <label style={styles.label}>Notes</label>
                            <input
                                style={styles.input}
                                type="text"
                                name="notes"
                                placeholder="Any notes..."
                                value={form.notes}
                                onChange={handleChange}
                            />
                        </div>
                        <button
                            type="submit"
                            style={styles.submitBtn}
                            disabled={submitting}
                        >
                            {submitting ? 'Saving...' : 'Add Exercise'}
                        </button>
                    </form>
                </div>
            )}

            {/* Edit Exercise Form */}
            {editingId && (
                <div style={{ ...styles.formCard, borderColor: '#e94560' }}>
                    <h3 style={styles.formTitle}>Edit Exercise</h3>
                    <form onSubmit={handleUpdate}>
                        <div style={styles.field}>
                            <label style={styles.label}>Exercise Name *</label>
                            <input
                                style={styles.input}
                                type="text"
                                name="name"
                                value={form.name}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div style={styles.formGrid}>
                            <div style={styles.field}>
                                <label style={styles.label}>Sets *</label>
                                <input
                                    style={styles.input}
                                    type="number"
                                    name="sets"
                                    value={form.sets}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div style={styles.field}>
                                <label style={styles.label}>Reps *</label>
                                <input
                                    style={styles.input}
                                    type="number"
                                    name="reps"
                                    value={form.reps}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div style={styles.field}>
                                <label style={styles.label}>Weight (kg)</label>
                                <input
                                    style={styles.input}
                                    type="number"
                                    name="weight"
                                    value={form.weight}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>
                        <div style={styles.field}>
                            <label style={styles.label}>Notes</label>
                            <input
                                style={styles.input}
                                type="text"
                                name="notes"
                                value={form.notes}
                                onChange={handleChange}
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button
                                type="submit"
                                style={styles.submitBtn}
                                disabled={submitting}
                            >
                                {submitting ? 'Updating...' : 'Update Exercise'}
                            </button>
                            <button
                                type="button"
                                style={styles.cancelBtn}
                                onClick={cancelEdit}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Exercise List */}
            {exercises.length === 0 ? (
                <div style={styles.emptyState}>
                    <p style={styles.emptyIcon}>💪</p>
                    <p style={styles.emptyText}>No exercises yet. Add your first one!</p>
                </div>
            ) : (
                <div style={styles.exerciseList}>
                    {exercises.map((exercise, index) => (
                        <div key={exercise._id} style={styles.exerciseCard}>
                            <div style={styles.exerciseLeft}>
                                <span style={styles.exerciseNumber}>{index + 1}</span>
                                <div>
                                    <h3 style={styles.exerciseName}>{exercise.name}</h3>
                                    {exercise.notes && (
                                        <p style={styles.exerciseNotes}>{exercise.notes}</p>
                                    )}
                                </div>
                            </div>
                            <div style={styles.exerciseStats}>
                                <div style={styles.stat}>
                                    <span style={styles.statVal}>{exercise.sets}</span>
                                    <span style={styles.statLbl}>sets</span>
                                </div>
                                <div style={styles.statDivider}>×</div>
                                <div style={styles.stat}>
                                    <span style={styles.statVal}>{exercise.reps}</span>
                                    <span style={styles.statLbl}>reps</span>
                                </div>
                                {exercise.weight > 0 && (
                                    <>
                                        <div style={styles.statDivider}>@</div>
                                        <div style={styles.stat}>
                                            <span style={styles.statVal}>{exercise.weight}</span>
                                            <span style={styles.statLbl}>kg</span>
                                        </div>
                                    </>
                                )}
                            </div>
                            <div style={styles.exerciseActions}>
                                <button
                                    style={styles.editBtn}
                                    onClick={() => handleEdit(exercise)}
                                >
                                    Edit
                                </button>
                                <button
                                    style={styles.deleteBtn}
                                    onClick={() => handleDelete(exercise._id)}
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const styles = {
    container: {
        minHeight: '100vh',
        backgroundColor: '#0f0f1a',
        padding: '32px',
        color: 'white',
    },
    notification: {
        backgroundColor: '#1a472a',
        color: '#69db7c',
        padding: '12px 20px',
        borderRadius: '8px',
        marginBottom: '24px',
        fontSize: '0.95rem',
        border: '1px solid #2f9e44',
    },
    backBtn: {
        backgroundColor: 'transparent',
        color: '#a8a8b3',
        border: 'none',
        cursor: 'pointer',
        fontSize: '0.9rem',
        marginBottom: '24px',
        padding: 0,
    },
    workoutHeader: {
        backgroundColor: '#1a1a2e',
        padding: '24px',
        borderRadius: '12px',
        marginBottom: '28px',
        border: '1px solid #2d2d44',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    title: {
        fontSize: '1.8rem',
        marginBottom: '6px',
        color: 'white',
    },
    meta: {
        color: '#a8a8b3',
        fontSize: '0.9rem',
        marginBottom: '8px',
    },
    workoutNotes: {
        color: '#c0c0cc',
        fontSize: '0.9rem',
    },
    statBox: {
        backgroundColor: '#e9456022',
        border: '1px solid #e94560',
        borderRadius: '10px',
        padding: '16px 24px',
        textAlign: 'center',
    },
    statNumber: {
        display: 'block',
        color: '#e94560',
        fontSize: '2rem',
        fontWeight: 'bold',
    },
    statLabel: {
        color: '#a8a8b3',
        fontSize: '0.8rem',
    },
    sectionHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
    },
    sectionTitle: {
        color: 'white',
        fontSize: '1.3rem',
    },
    addBtn: {
        backgroundColor: '#e94560',
        color: 'white',
        border: 'none',
        padding: '10px 20px',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '0.9rem',
        fontWeight: 'bold',
    },
    formCard: {
        backgroundColor: '#1a1a2e',
        padding: '24px',
        borderRadius: '12px',
        marginBottom: '24px',
        border: '1px solid #2d2d44',
    },
    formTitle: {
        color: 'white',
        marginBottom: '20px',
        fontSize: '1rem',
    },
    formGrid: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        gap: '16px',
    },
    field: {
        marginBottom: '16px',
    },
    label: {
        display: 'block',
        color: '#a8a8b3',
        marginBottom: '6px',
        fontSize: '0.85rem',
    },
    input: {
        width: '100%',
        padding: '10px 14px',
        borderRadius: '8px',
        border: '1px solid #2d2d44',
        backgroundColor: '#0f0f1a',
        color: 'white',
        fontSize: '0.95rem',
        boxSizing: 'border-box',
    },
    submitBtn: {
        backgroundColor: '#e94560',
        color: 'white',
        border: 'none',
        padding: '10px 24px',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '0.95rem',
    },
    cancelBtn: {
        backgroundColor: 'transparent',
        color: '#a8a8b3',
        border: '1px solid #2d2d44',
        padding: '10px 24px',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '0.95rem',
    },
    exerciseList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
    },
    exerciseCard: {
        backgroundColor: '#1a1a2e',
        padding: '20px',
        borderRadius: '12px',
        border: '1px solid #2d2d44',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '16px',
    },
    exerciseLeft: {
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        flex: 1,
    },
    exerciseNumber: {
        backgroundColor: '#e9456022',
        color: '#e94560',
        width: '32px',
        height: '32px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '0.85rem',
        fontWeight: 'bold',
        flexShrink: 0,
    },
    exerciseName: {
        color: 'white',
        fontSize: '1rem',
        margin: 0,
    },
    exerciseNotes: {
        color: '#a8a8b3',
        fontSize: '0.8rem',
        margin: '4px 0 0 0',
    },
    exerciseStats: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
    },
    stat: {
        textAlign: 'center',
    },
    statVal: {
        display: 'block',
        color: 'white',
        fontWeight: 'bold',
        fontSize: '1.1rem',
    },
    statLbl: {
        color: '#a8a8b3',
        fontSize: '0.75rem',
    },
    statDivider: {
        color: '#a8a8b3',
        fontSize: '1rem',
    },
    exerciseActions: {
        display: 'flex',
        gap: '8px',
    },
    editBtn: {
        padding: '6px 14px',
        backgroundColor: '#16213e',
        color: 'white',
        border: '1px solid #2d2d44',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '0.85rem',
    },
    deleteBtn: {
        padding: '6px 14px',
        backgroundColor: 'transparent',
        color: '#e94560',
        border: '1px solid #e94560',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '0.85rem',
    },
    emptyState: {
        textAlign: 'center',
        padding: '60px 0',
    },
    emptyIcon: {
        fontSize: '3rem',
        marginBottom: '12px',
    },
    emptyText: {
        color: '#a8a8b3',
        fontSize: '1rem',
    },
    empty: {
        color: '#a8a8b3',
        textAlign: 'center',
        marginTop: '40px',
    },
};

export default WorkoutDetail;