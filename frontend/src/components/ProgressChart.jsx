import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const ProgressChart = ({ logs }) => {
    // 1. Format the data: Recharts needs [{name: 'Date', weight: 100}]
    const data = logs
        .map(log => ({
            date: new Date(log.createdAt).toLocaleDateString(),
            weight: log.weight,
        }))
        .reverse(); // Show oldest to newest

    return (
        <div style={{ width: '100%', height: 300, marginTop: '20px' }}>
            <h3>Weight Progress</h3>
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line
                        type="monotone"
                        dataKey="weight"
                        stroke="#8884d8"
                        strokeWidth={3}
                        activeDot={{ r: 8 }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

export default ProgressChart;