import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import socket from '../socket/socket';

const Dashboard = () => {
    const [workouts, setWorkouts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [notification, setNotification] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ title: '', duration: '', notes: '' });
    const [submitting, setSubmitting] = useState(false);
    const navigate = useNavigate();

    // Fetch workouts on mount
    useEffect(() => {
        const fetchWorkouts = async () => {
            try {
                const res = await API.get('/workouts');
                setWorkouts(res.data);
            } catch (err) {
                console.error('Failed to fetch workouts', err);
            } finally {
                setLoading(false);
            }
        };
        fetchWorkouts();
    }, []);

    // 🔴 WebSocket Event 1: listen for new workouts from any client
    useEffect(() => {
        socket.on('workout:created', (newWorkout) => {
            setWorkouts((prev) => {
                // avoid duplicates
                const exists = prev.find((w) => w._id === newWorkout._id);
                if (exists) return prev;
                return [newWorkout, ...prev];
            });
            setNotification(`New workout logged: "${newWorkout.title}"`);
            setTimeout(() => setNotification(''), 4000);
        });

        return () => socket.off('workout:created');
    }, []);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await API.post('/workouts', {
                title: form.title,
                duration: Number(form.duration),
                notes: form.notes,
            });
            setForm({ title: '', duration: '', notes: '' });
            setShowForm(false);
        } catch (err) {
            console.error('Failed to create workout', err);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this workout?')) return;
        try {
            await API.delete(`/workouts/${id}`);
            setWorkouts((prev) => prev.filter((w) => w._id !== id));
        } catch (err) {
            console.error('Failed to delete workout', err);
        }
    };

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    return (
        <div style={styles.container}>

            {/* Live notification banner */}
            {notification && (
                <div style={styles.notification}>
                    🔔 {notification}
                </div>
            )}

            {/* Header */}
            <div style={styles.header}>
                <div>
                    <h1 style={styles.title}>My Workouts</h1>
                    <p style={styles.subtitle}>
                        {workouts.length} workout{workouts.length !== 1 ? 's' : ''} logged
                    </p>
                </div>
                <button
                    style={styles.addBtn}
                    onClick={() => setShowForm(!showForm)}
                >
                    {showForm ? 'Cancel' : '+ New Workout'}
                </button>
            </div>

            {/* Create Workout Form */}
            {showForm && (
                <div style={styles.formCard}>
                    <h3 style={styles.formTitle}>Log a New Workout</h3>
                    <form onSubmit={handleCreate}>
                        <div style={styles.formGrid}>
                            <div style={styles.field}>
                                <label style={styles.label}>Title *</label>
                                <input
                                    style={styles.input}
                                    type="text"
                                    name="title"
                                    placeholder="e.g. Chest Day"
                                    value={form.title}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div style={styles.field}>
                                <label style={styles.label}>Duration (mins)</label>
                                <input
                                    style={styles.input}
                                    type="number"
                                    name="duration"
                                    placeholder="e.g. 60"
                                    value={form.duration}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>
                        <div style={styles.field}>
                            <label style={styles.label}>Notes</label>
                            <textarea
                                style={{ ...styles.input, height: '80px', resize: 'vertical' }}
                                name="notes"
                                placeholder="How did it go?"
                                value={form.notes}
                                onChange={handleChange}
                            />
                        </div>
                        <button
                            type="submit"
                            style={styles.submitBtn}
                            disabled={submitting}
                        >
                            {submitting ? 'Saving...' : 'Save Workout'}
                        </button>
                    </form>
                </div>
            )}

            {/* Workout List */}
            {loading ? (
                <p style={styles.empty}>Loading workouts...</p>
            ) : workouts.length === 0 ? (
                <div style={styles.emptyState}>
                    <p style={styles.emptyIcon}>🏋️</p>
                    <p style={styles.emptyText}>No workouts yet. Log your first one!</p>
                </div>
            ) : (
                <div style={styles.grid}>
                    {workouts.map((workout) => (
                        <div key={workout._id} style={styles.card}>
                            <div style={styles.cardHeader}>
                                <h3 style={styles.cardTitle}>{workout.title}</h3>
                                <span style={styles.badge}>
                                    {workout.duration ? `${workout.duration} min` : 'No duration'}
                                </span>
                            </div>
                            <p style={styles.cardDate}>{formatDate(workout.date)}</p>
                            {workout.notes && (
                                <p style={styles.cardNotes}>{workout.notes}</p>
                            )}
                            <div style={styles.cardActions}>
                                <button
                                    style={styles.viewBtn}
                                    onClick={() => navigate(`/workout/${workout._id}`)}
                                >
                                    View Exercises
                                </button>
                                <button
                                    style={styles.deleteBtn}
                                    onClick={() => handleDelete(workout._id)}
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
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '28px',
    },
    title: {
        fontSize: '2rem',
        marginBottom: '4px',
        color: 'white',
    },
    subtitle: {
        color: '#a8a8b3',
        fontSize: '0.95rem',
    },
    addBtn: {
        backgroundColor: '#e94560',
        color: 'white',
        border: 'none',
        padding: '10px 20px',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '0.95rem',
        fontWeight: 'bold',
    },
    formCard: {
        backgroundColor: '#1a1a2e',
        padding: '24px',
        borderRadius: '12px',
        marginBottom: '28px',
        border: '1px solid #2d2d44',
    },
    formTitle: {
        color: 'white',
        marginBottom: '20px',
        fontSize: '1.1rem',
    },
    formGrid: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
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
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '20px',
    },
    card: {
        backgroundColor: '#1a1a2e',
        padding: '20px',
        borderRadius: '12px',
        border: '1px solid #2d2d44',
        transition: 'border-color 0.2s',
    },
    cardHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '8px',
    },
    cardTitle: {
        color: 'white',
        fontSize: '1.1rem',
        margin: 0,
    },
    badge: {
        backgroundColor: '#e9456022',
        color: '#e94560',
        padding: '4px 10px',
        borderRadius: '20px',
        fontSize: '0.8rem',
    },
    cardDate: {
        color: '#a8a8b3',
        fontSize: '0.85rem',
        marginBottom: '8px',
    },
    cardNotes: {
        color: '#c0c0cc',
        fontSize: '0.9rem',
        marginBottom: '16px',
        lineHeight: '1.4',
    },
    cardActions: {
        display: 'flex',
        gap: '10px',
    },
    viewBtn: {
        flex: 1,
        padding: '8px',
        backgroundColor: '#16213e',
        color: 'white',
        border: '1px solid #2d2d44',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '0.85rem',
    },
    deleteBtn: {
        padding: '8px 14px',
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
        padding: '40px 0',
    },
};

export default Dashboard;