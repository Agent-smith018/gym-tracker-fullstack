import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

export default function Dashboard() {
    const { logout } = useContext(AuthContext);

    return (
        <div style={{ padding: "40px" }}>
            <h1>Gym Tracker Dashboard</h1>
            <p>Welcome! You are logged in.</p>

            <button onClick={logout}>Logout</button>
        </div>
    );
}