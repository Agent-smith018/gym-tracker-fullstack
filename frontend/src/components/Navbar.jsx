export default function Navbar({ onLogout }) {
    return (
        <div className="w-full bg-gray-900 text-white px-6 py-4 flex justify-between items-center shadow-md">
            <h1 className="text-xl font-bold tracking-wide">🏋️ Gym Tracker</h1>

            <button
                onClick={onLogout}
                className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg text-sm font-semibold transition"
            >
                Logout
            </button>
        </div>
    );
}