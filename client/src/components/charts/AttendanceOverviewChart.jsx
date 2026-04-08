import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export const AttendanceOverviewChart = ({ data }) => (
  <div className="glass-card p-5">
    <h3 className="mb-4 text-lg font-semibold text-slate-950">Taux par segment</h3>
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="name" stroke="#64748b" />
          <YAxis stroke="#64748b" />
          <Tooltip />
          <Bar dataKey="rate" fill="#2563eb" radius={[10, 10, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  </div>
);
