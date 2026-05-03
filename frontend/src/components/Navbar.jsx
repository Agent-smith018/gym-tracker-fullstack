import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaDumbbell } from 'react-icons/fa';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav style={styles.nav}>
            <Link to="/dashboard" style={styles.brand}>
                <FaDumbbell style={{ marginRight: 8 }} />
                GymTracker
            </Link>

            <div style={styles.right}>
                {user ? (
                    <>
                        <span style={styles.username}>Hey, {user.name} 👋</span>
                        <button onClick={handleLogout} style={styles.btn}>
                            Logout
                        </button>
                    </>
                ) : (
                    <>
                        <Link to="/login" style={styles.link}>Login</Link>
                        <Link to="/signup" style={styles.link}>Signup</Link>
                    </>
                )}
            </div>
        </nav>
    );
};

const styles = {
    nav: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '14px 32px',
        backgroundColor: '#1a1a2e',
        color: 'white',
    },
    brand: {
        color: '#e94560',
        fontSize: '1.4rem',
        fontWeight: 'bold',
        textDecoration: 'none',
        display: 'flex',
        alignItems: 'center',
    },
    right: {
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
    },
    username: {
        color: '#a8a8b3',
        fontSize: '0.95rem',
    },
    link: {
        color: 'white',
        textDecoration: 'none',
        fontSize: '0.95rem',
    },
    btn: {
        backgroundColor: '#e94560',
        color: 'white',
        border: 'none',
        padding: '8px 16px',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '0.9rem',
    },
};

export default Navbar;