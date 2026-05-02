import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';

const Signup = () => {
    const [form, setForm] = useState({ name: '', email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await API.post('/auth/signup', form);
            login(res.data.token, res.data.user);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Signup failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <h2 style={styles.title}>Create Account 💪</h2>
                <p style={styles.subtitle}>Start tracking your gains today</p>

                {error && <p style={styles.error}>{error}</p>}

                <form onSubmit={handleSubmit}>
                    <div style={styles.field}>
                        <label style={styles.label}>Username</label>
                        <input
                            style={styles.input}
                            type="text"
                            name="name"
                            placeholder="johndoe"
                            value={form.name}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div style={styles.field}>
                        <label style={styles.label}>Email</label>
                        <input
                            style={styles.input}
                            type="email"
                            name="email"
                            placeholder="john@example.com"
                            value={form.email}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div style={styles.field}>
                        <label style={styles.label}>Password</label>
                        <input
                            style={styles.input}
                            type="password"
                            name="password"
                            placeholder="••••••••"
                            value={form.password}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        style={styles.btn}
                        disabled={loading}
                    >
                        {loading ? 'Creating account...' : 'Sign Up'}
                    </button>
                </form>

                <p style={styles.footer}>
                    Already have an account?{' '}
                    <Link to="/login" style={styles.link}>Login</Link>
                </p>
            </div>
        </div>
    );
};

const styles = {
    container: {
        minHeight: '100vh',
        backgroundColor: '#0f0f1a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    card: {
        backgroundColor: '#1a1a2e',
        padding: '40px',
        borderRadius: '12px',
        width: '100%',
        maxWidth: '420px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
    },
    title: {
        color: 'white',
        marginBottom: '6px',
        fontSize: '1.8rem',
    },
    subtitle: {
        color: '#a8a8b3',
        marginBottom: '28px',
        fontSize: '0.95rem',
    },
    field: {
        marginBottom: '18px',
    },
    label: {
        display: 'block',
        color: '#a8a8b3',
        marginBottom: '6px',
        fontSize: '0.9rem',
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
    btn: {
        width: '100%',
        padding: '12px',
        backgroundColor: '#e94560',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        fontSize: '1rem',
        cursor: 'pointer',
        marginTop: '8px',
    },
    error: {
        backgroundColor: '#ff000022',
        color: '#ff6b6b',
        padding: '10px',
        borderRadius: '6px',
        marginBottom: '16px',
        fontSize: '0.9rem',
    },
    footer: {
        color: '#a8a8b3',
        textAlign: 'center',
        marginTop: '20px',
        fontSize: '0.9rem',
    },
    link: {
        color: '#e94560',
        textDecoration: 'none',
    },
};

export default Signup;