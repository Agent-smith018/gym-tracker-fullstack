import { useState } from "react";
import api from "../api/api";
import { Link, useNavigate } from "react-router-dom";

export default function Signup() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const navigate = useNavigate();

    const handleSignup = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        try {
            const res = await api.post("/auth/signup", { name, email, password });
            setSuccess(res.data.message);

            setTimeout(() => {
                navigate("/login");
            }, 1200);
        } catch (err) {
            setError(err.response?.data?.message || "Signup failed");
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
                <h1 className="text-3xl font-bold text-gray-900 text-center">
                    🏋️ Gym Tracker
                </h1>
                <p className="text-gray-500 text-center mt-2">
                    Create an account to start tracking
                </p>

                {error && (
                    <div className="bg-red-100 text-red-700 px-4 py-3 rounded-lg mt-4">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="bg-green-100 text-green-700 px-4 py-3 rounded-lg mt-4">
                        {success}
                    </div>
                )}

                <form onSubmit={handleSignup} className="space-y-4 mt-6">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                            Full Name
                        </label>
                        <input
                            type="text"
                            placeholder="Your Name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900"
                        />
                    </div>

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
                            placeholder="Create password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900"
                        />
                    </div>

                    <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-semibold transition">
                        Signup
                    </button>
                </form>

                <p className="text-center text-gray-600 mt-6">
                    Already have an account?{" "}
                    <Link to="/login" className="text-blue-600 font-semibold">
                        Login
                    </Link>
                </p>
            </div>
        </div>
    );
}