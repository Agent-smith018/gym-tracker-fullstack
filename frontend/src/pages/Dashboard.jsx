import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import socket from '../socket/socket';
import Calendar from 'react-calendar'; // Ensure you've run: npm install react-calendar
import 'react-calendar/dist/Calendar.css';

const Dashboard = () => {
    const [workouts, setWorkouts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [notification, setNotification] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ title: '', duration: '', notes: '' });
    const [submitting, setSubmitting] = useState(false);
    const navigate = useNavigate();

    // 1. Fetch workouts
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

    // 2. Calendar Logic: Highlight days with workouts
    const getTileClassName = ({ date, view }) => {
        if (view === 'month') {
            const dateString = date.toISOString().split('T')[0];
            const hasWorkout = workouts.some(w => w.date.split('T')[0] === dateString);
            return hasWorkout ? 'highlight-workout' : null;
        }
    };

    // 3. WebSocket Listener
    useEffect(() => {
        socket.on('workout:created', (newWorkout) => {
            setWorkouts((prev) => {
                const exists = prev.find((w) => w._id === newWorkout._id);
                if (exists) return prev;
                return [newWorkout, ...prev];
            });
            setNotification(`New workout logged: "${newWorkout.title}"`);
            setTimeout(() => setNotification(''), 4000);
        });
        return () => socket.off('workout:created');
    }, []);

    // 4. Global Stats Calculations
    const avgDuration = workouts.length > 0
        ? Math.round(workouts.reduce((acc, w) => acc + (w.duration || 0), 0) / workouts.length)
        : 0;

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

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
            weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
        });
    };

    if (loading) return <div style={styles.container}><p style={styles.empty}>Loading Dashboard...</p></div>;

    return (
        <div style={styles.container}>
            {/* Styles for Calendar Overrides */}
            <style>{`
                .react-calendar { background: #1a1a2e; border: 1px solid #2d2d44; color: white; border-radius: 12px; width: 100%; font-family: sans-serif; }
                .react-calendar__tile { color: white; padding: 12px; }
                .react-calendar__tile:hover { background: #e9456022 !important; }
                .react-calendar__navigation button { color: white; min-width: 44px; background: none; font-size: 16px; }
                .react-calendar__month-view__days__day--neighboringMonth { color: #555 !important; }
                .highlight-workout { background: #e94560 !important; color: white !important; border-radius: 50%; font-weight: bold; }
                .react-calendar__tile--active { background: #4ecca3 !important; color: #0f0f1a !important; border-radius: 8px; }
            `}</style>

            {notification && <div style={styles.notification}>🔔 {notification}</div>}

            <div style={styles.dashboardLayout}>
                {/* LEFT COLUMN: Stats & Calendar */}
                <div style={styles.sideCol}>
                    <h1 style={styles.title}>Dashboard</h1>

                    <div style={styles.statsRow}>
                        <div style={styles.statBox}>
                            <span style={styles.statVal}>{workouts.length}</span>
                            <span style={styles.statLbl}>Sessions</span>
                        </div>
                        <div style={styles.statBox}>
                            <span style={styles.statVal}>{avgDuration}m</span>
                            <span style={styles.statLbl}>Avg Time</span>
                        </div>
                    </div>

                    <div style={styles.calendarWrapper}>
                        <h3 style={styles.sectionTitle}>Consistency</h3>
                        <Calendar tileClassName={getTileClassName} />
                    </div>
                </div>

                {/* RIGHT COLUMN: Workouts & Form */}
                <div style={styles.mainCol}>
                    <div style={styles.header}>
                        <h2 style={styles.sectionTitle}>Recent Sessions</h2>
                        <button style={styles.addBtn} onClick={() => setShowForm(!showForm)}>
                            {showForm ? 'Cancel' : '+ New Workout'}
                        </button>
                    </div>

                    {showForm && (
                        <div style={styles.formCard}>
                            <h3 style={styles.formTitle}>Log a New Workout</h3>
                            <form onSubmit={handleCreate}>
                                <div style={styles.formGrid}>
                                    <div style={styles.field}>
                                        <label style={styles.label}>Title *</label>
                                        <input style={styles.input} type="text" name="title" value={form.title} onChange={handleChange} required placeholder="Chest Day" />
                                    </div>
                                    <div style={styles.field}>
                                        <label style={styles.label}>Duration (mins)</label>
                                        <input style={styles.input} type="number" name="duration" value={form.duration} onChange={handleChange} />
                                    </div>
                                </div>
                                <div style={styles.field}>
                                    <label style={styles.label}>Notes</label>
                                    <textarea style={{ ...styles.input, height: '60px' }} name="notes" value={form.notes} onChange={handleChange} placeholder="Notes..." />
                                </div>
                                <button type="submit" style={styles.submitBtn} disabled={submitting}>{submitting ? 'Saving...' : 'Save Workout'}</button>
                            </form>
                        </div>
                    )}

                    <div style={styles.grid}>
                        {workouts.length === 0 ? (
                            <p style={styles.empty}>No workouts found. Start training!</p>
                        ) : (
                            workouts.map((workout) => (
                                <div key={workout._id} style={styles.card}>
                                    <div style={styles.cardHeader}>
                                        <h3 style={styles.cardTitle}>{workout.title}</h3>
                                        <span style={styles.badge}>{workout.duration ? `${workout.duration}m` : '--'}</span>
                                    </div>
                                    <p style={styles.cardDate}>{formatDate(workout.date)}</p>
                                    <div style={styles.cardActions}>
                                        <button style={styles.viewBtn} onClick={() => navigate(`/workout/${workout._id}`)}>View Log</button>
                                        <button style={styles.deleteBtn} onClick={() => handleDelete(workout._id)}>Delete</button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const styles = {
    container: { minHeight: '100vh', backgroundColor: '#0f0f1a', padding: '30px', color: 'white', fontFamily: 'sans-serif' },
    notification: { backgroundColor: '#1a472a', color: '#69db7c', padding: '12px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #2f9e44' },
    dashboardLayout: { display: 'grid', gridTemplateColumns: '350px 1fr', gap: '40px' },
    title: { fontSize: '2.2rem', marginBottom: '10px' },
    sectionTitle: { fontSize: '1.2rem', margin: '0 0 15px 0', color: '#e94560' },
    statsRow: { display: 'flex', gap: '15px', marginBottom: '30px' },
    statBox: { flex: 1, backgroundColor: '#16213e', padding: '15px', borderRadius: '12px', border: '1px solid #2d2d44', textAlign: 'center' },
    statVal: { display: 'block', fontSize: '1.5rem', fontWeight: 'bold', color: '#69db7c' },
    statLbl: { fontSize: '0.75rem', color: '#a8a8b3', textTransform: 'uppercase' },
    calendarWrapper: { backgroundColor: '#1a1a2e', padding: '15px', borderRadius: '15px' },
    mainCol: { display: 'flex', flexDirection: 'column' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
    addBtn: { backgroundColor: '#e94560', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' },
    formCard: { backgroundColor: '#1a1a2e', padding: '20px', borderRadius: '12px', marginBottom: '25px', border: '1px solid #e94560' },
    formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' },
    field: { marginBottom: '12px' },
    label: { display: 'block', color: '#a8a8b3', fontSize: '0.8rem', marginBottom: '5px' },
    input: { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #2d2d44', backgroundColor: '#0f0f1a', color: 'white', boxSizing: 'border-box' },
    submitBtn: { backgroundColor: '#e94560', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' },
    card: { backgroundColor: '#1a1a2e', padding: '20px', borderRadius: '12px', border: '1px solid #2d2d44' },
    cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    cardTitle: { fontSize: '1.1rem', margin: 0 },
    badge: { backgroundColor: '#e9456022', color: '#e94560', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem' },
    cardDate: { color: '#a8a8b3', fontSize: '0.85rem', margin: '5px 0 15px 0' },
    cardActions: { display: 'flex', gap: '10px' },
    viewBtn: { flex: 1, padding: '8px', backgroundColor: '#16213e', color: 'white', border: '1px solid #2d2d44', borderRadius: '6px', cursor: 'pointer' },
    deleteBtn: { padding: '8px', background: 'none', color: '#e94560', border: '1px solid #e94560', borderRadius: '6px', cursor: 'pointer' },
    empty: { color: '#a8a8b3', textAlign: 'center', marginTop: '20px' }
};

export default Dashboard;