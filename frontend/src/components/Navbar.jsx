import { Link } from "react-router-dom";

export default function Navbar({ onLogout }) {
    return (
        <nav className="sticky top-0 z-40 w-full bg-white border border-slate-200 shadow-xl border-b border-slate-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-20">
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 tracking-tight">
                            GymTracker<span className="text-slate-600">Pro</span>
                        </h1>
                    </div>

                    <button
                        onClick={onLogout}
                        className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-5 py-2.5 rounded-full text-sm font-semibold transition-all shadow-sm hover:shadow hover:-translate-y-0.5"
                    >
                        <span>Sign Out</span>
                        
                    </button>
                </div>
            </div>
        </nav>
    );
}