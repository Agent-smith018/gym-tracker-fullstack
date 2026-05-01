import { useState } from "react";
import api from "../api/api";
import { Link, useNavigate } from "react-router-dom";

export default function Signup() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const navigate = useNavigate();

    const handleSignup = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        setIsLoading(true);

        try {
            const res = await api.post("/auth/signup", { name, email, password });
            setSuccess(res.data.message);

            setTimeout(() => {
                navigate("/login");
            }, 1200);
        } catch (err) {
            setError(err.response?.data?.message || "Signup failed");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-bg">
            <div className="auth-card">
                <div className="text-center mb-10">
                    <h1 className="auth-title">
                        Join Gym Tracker
                    </h1>
                    <p className="auth-subtitle">
                        Create an account to start tracking your progress.
                    </p>
                </div>

                {error && (
                    <div className="auth-error">
                        <span className="text-lg">⚠️</span>
                        {error}
                    </div>
                )}

                {success && (
                    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm mb-6 flex items-center gap-2">
                        <span className="text-lg">✅</span>
                        {success} Redirecting...
                    </div>
                )}

                <form onSubmit={handleSignup} className="space-y-5">
                    <div>
                        <label className="auth-label">
                            Full Name
                        </label>
                        <input
                            type="text"
                            placeholder="John Doe"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="auth-input"
                            required
                        />
                    </div>

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
                            placeholder="Create a strong password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="auth-input"
                            required
                        />
                    </div>

                    <button
                        disabled={isLoading || success}
                        className={(isLoading || success) ? "auth-btn auth-btn-disabled mt-6" : "auth-btn mt-6"}
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
                                Signing up...
                            </>
                        ) : (
                            "Sign Up"
                        )}
                    </button>
                </form>

                <div className="mt-8 pt-6 border-t border-slate-100 text-center">
                    <p className="text-slate-600">
                        Already have an account?{" "}
                        <Link to="/login" className="text-slate-900 font-bold hover:underline">
                            Sign In
                        </Link>
                    </p>
                </div>

                {/* Footer */}
                <p className="text-center text-xs text-slate-400 mt-8">
                    © {new Date().getFullYear()} Gym Tracker. All rights reserved.
                </p>
            </div>
        </div>
    );
}