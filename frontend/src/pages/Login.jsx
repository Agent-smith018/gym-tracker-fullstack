import { useState, useContext } from "react";
import api from "../api/api";
import { AuthContext } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const { login } = useContext(AuthContext);
    const [error, setError] = useState("");

    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");

        try {
            const res = await api.post("/auth/login", { email, password });
            login(res.data.token);
            navigate("/");
        } catch (err) {
            setError(err.response?.data?.message || "Login failed");
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
                <h1 className="text-3xl font-bold text-gray-900 text-center">
                    🏋️ Gym Tracker
                </h1>
                <p className="text-gray-500 text-center mt-2">
                    Login to manage your workouts
                </p>

                {error && (
                    <div className="bg-red-100 text-red-700 px-4 py-3 rounded-lg mt-4">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-4 mt-6">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                            Email
                        </label>
                        <input
                            type="email"
                            placeholder="example@gmail.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                            Password
                        </label>
                        <input
                            type="password"
                            placeholder="Enter password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900"
                        />
                    </div>

                    <button className="w-full bg-gray-900 hover:bg-gray-800 text-white py-2 rounded-lg font-semibold transition">
                        Login
                    </button>
                </form>

                <p className="text-center text-gray-600 mt-6">
                    Don’t have an account?{" "}
                    <Link to="/signup" className="text-blue-600 font-semibold">
                        Signup
                    </Link>
                </p>
            </div>
        </div>
    );
}