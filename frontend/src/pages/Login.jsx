import { useState, useContext } from "react";
import api from "../api/api";
import { AuthContext } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const { login } = useContext(AuthContext);
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            const res = await api.post("/auth/login", { email, password });
            login(res.data.token);
            navigate("/");
        } catch (err) {
            setError(err.response?.data?.message || "Login failed");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-bg">
            <div className="auth-card">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="auth-title">
                        Gym Tracker
                    </h1>
                    <p className="auth-subtitle">
                        Log in to manage your workouts and track progress.
                    </p>
                </div>

                {/* Error */}
                {error && (
                    <div className="auth-error">
                        <span className="text-lg">⚠️</span>
                        {error}
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleLogin} className="space-y-5">
                    <div>
                        <label className="auth-label">
                            Email Address
                        </label>
                        <input
                            type="email"
                            placeholder="name@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="auth-input"
                            required
                        />
                    </div>

                    <div>
                        <label className="auth-label">
                            Password
                        </label>
                        <input
                            type="password"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="auth-input"
                            required
                        />
                    </div>

                    <button
                        disabled={isLoading}
                        className={isLoading ? "auth-btn auth-btn-disabled" : "auth-btn"}
                    >
                        {isLoading ? (
                            <>
                                <svg
                                    className="animate-spin mr-3 h-5 w-5 text-white"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                >
                                    <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                    ></circle>
                                    <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                    ></path>
                                </svg>
                                Signing in...
                            </>
                        ) : (
                            "Sign In"
                        )}
                    </button>
                </form>

                {/* Footer */}
                <div className="mt-8 pt-6 border-t border-slate-100 text-center">
                    <p className="text-slate-600">
                        Don&apos;t have an account?{" "}
                        <Link
                            to="/signup"
                            className="text-slate-900 font-bold hover:underline"
                        >
                            Create Account
                        </Link>
                    </p>
                </div>

                <p className="text-center text-xs text-slate-400 mt-6">
                    © {new Date().getFullYear()} Gym Tracker. All rights reserved.
                </p>
            </div>
        </div>
    );
}