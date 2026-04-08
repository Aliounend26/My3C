import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export const MonthlyPresenceChart = ({ data }) => (
  <div className="glass-card p-5">
    <h3 className="mb-4 text-lg font-semibold text-slate-950">Présences mensuelles</h3>
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="presentGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="month" stroke="#64748b" />
          <YAxis stroke="#64748b" />
          <Tooltip />
          <Legend />
          <Area type="monotone" dataKey="present" stroke="#10b981" fill="url(#presentGradient)" />
          <Area type="monotone" dataKey="late" stroke="#f59e0b" fill="#fde68a" fillOpacity={0.3} />
          <Area type="monotone" dataKey="absent" stroke="#f43f5e" fill="#fecdd3" fillOpacity={0.25} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  </div>
);
