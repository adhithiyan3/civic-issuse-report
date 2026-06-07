import React from 'react';
import {
    PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    AreaChart, Area, RadialBarChart, RadialBar
} from 'recharts';
import { motion } from 'framer-motion';

// ─── Design tokens ────────────────────────────────────────────────────────────
const STATUS_COLORS = {
    Pending: '#f59e0b',
    Assigned: '#3b82f6',
    'In Progress': '#8b5cf6',
    Completed: '#06b6d4',
    Resolved: '#10b981',
    Rejected: '#f43f5e',
};

const PRIORITY_COLORS = {
    High: '#f43f5e',
    Medium: '#f59e0b',
    Low: '#10b981',
};

const CATEGORY_COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#f43f5e'];

const ROLE_COLORS = {
    superadmin: '#8b5cf6',
    admin: '#3b82f6',
    employee: '#10b981',
    citizen: '#94a3b8',
};

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-slate-900 text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-2xl border border-white/10 backdrop-blur-xl">
            {label && <p className="text-slate-400 uppercase tracking-widest text-[10px] mb-1">{label}</p>}
            {payload.map((p, i) => (
                <div key={i} className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: p.color || p.fill }} />
                    <span className="text-slate-300">{p.name}:</span>
                    <span className="text-white font-black">{p.value}</span>
                </div>
            ))}
        </div>
    );
};

// ─── Chart Card Wrapper ───────────────────────────────────────────────────────
export const ChartCard = ({ title, subtitle, children, delay = 0 }) => (
    <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.4, ease: 'easeOut' }}
        className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-7 overflow-hidden group hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
    >
        <div className="mb-6">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{subtitle}</p>
            <h3 className="text-lg font-black text-slate-900 tracking-tight">{title}</h3>
        </div>
        {children}
    </motion.div>
);

// ─── 1. Status Donut Chart ───────────────────────────────────────────────────
export const StatusPieChart = ({ data }) => {
    if (!data?.length) return <EmptyChart />;

    const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
        if (percent < 0.06) return null;
        const RADIAN = Math.PI / 180;
        const r = innerRadius + (outerRadius - innerRadius) * 0.55;
        const x = cx + r * Math.cos(-midAngle * RADIAN);
        const y = cy + r * Math.sin(-midAngle * RADIAN);
        return (
            <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central"
                style={{ fontSize: '11px', fontWeight: '900' }}>
                {`${(percent * 100).toFixed(0)}%`}
            </text>
        );
    };

    return (
        <ResponsiveContainer width="100%" height={280}>
            <PieChart>
                <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={110}
                    paddingAngle={3}
                    dataKey="value"
                    labelLine={false}
                    label={renderCustomLabel}
                    animationBegin={0}
                    animationDuration={900}
                >
                    {data.map((entry, index) => (
                        <Cell
                            key={index}
                            fill={STATUS_COLORS[entry.name] || '#94a3b8'}
                            stroke="none"
                        />
                    ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                    iconType="circle"
                    iconSize={8}
                    formatter={(value) => (
                        <span style={{ fontSize: '11px', fontWeight: '700', color: '#475569' }}>{value}</span>
                    )}
                />
            </PieChart>
        </ResponsiveContainer>
    );
};

// ─── 2. Priority Donut Chart ─────────────────────────────────────────────────
export const PriorityDonutChart = ({ data }) => {
    if (!data?.length) return <EmptyChart />;

    const total = data.reduce((s, d) => s + d.value, 0);
    const highCount = data.find(d => d.name === 'High')?.value || 0;

    return (
        <div className="relative">
            <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={72}
                        outerRadius={100}
                        paddingAngle={4}
                        dataKey="value"
                        animationBegin={0}
                        animationDuration={900}
                    >
                        {data.map((entry, index) => (
                            <Cell
                                key={index}
                                fill={PRIORITY_COLORS[entry.name] || '#94a3b8'}
                                stroke="none"
                            />
                        ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                </PieChart>
            </ResponsiveContainer>
            {/* Center label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3xl font-black text-slate-900 leading-none">{total}</span>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Total</span>
            </div>
            {/* Legend */}
            <div className="flex justify-center gap-4 mt-2">
                {data.map((d) => (
                    <div key={d.name} className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: PRIORITY_COLORS[d.name] || '#94a3b8' }} />
                        <span className="text-[11px] font-bold text-slate-500">{d.name} <span className="font-black text-slate-800">{d.value}</span></span>
                    </div>
                ))}
            </div>
        </div>
    );
};

// ─── 3. Category Horizontal Bar Chart ────────────────────────────────────────
export const CategoryBarChart = ({ data }) => {
    if (!data?.length) return <EmptyChart />;
    return (
        <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data} layout="vertical" margin={{ left: 8, right: 24, top: 4, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis
                    type="number"
                    tick={{ fontSize: 11, fontWeight: 700, fill: '#94a3b8' }}
                    axisLine={false} tickLine={false}
                    allowDecimals={false}
                />
                <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 11, fontWeight: 700, fill: '#475569' }}
                    axisLine={false} tickLine={false}
                    width={80}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                <Bar dataKey="value" name="Complaints" radius={[0, 8, 8, 0]} animationDuration={900}>
                    {data.map((entry, index) => (
                        <Cell key={index} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                    ))}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    );
};

// ─── 4. Monthly Trend Area Chart ─────────────────────────────────────────────
export const MonthlyTrendChart = ({ data }) => {
    if (!data?.length) return <EmptyChart />;
    return (
        <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={data} margin={{ left: 0, right: 16, top: 8, bottom: 0 }}>
                <defs>
                    <linearGradient id="gradTotal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradResolved" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11, fontWeight: 700, fill: '#94a3b8' }}
                    axisLine={false} tickLine={false}
                />
                <YAxis
                    tick={{ fontSize: 11, fontWeight: 700, fill: '#94a3b8' }}
                    axisLine={false} tickLine={false}
                    allowDecimals={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                    iconType="circle" iconSize={8}
                    formatter={(v) => <span style={{ fontSize: '11px', fontWeight: '700', color: '#475569' }}>{v === 'total' ? 'Submitted' : 'Resolved'}</span>}
                />
                <Area
                    type="monotone"
                    dataKey="total"
                    name="total"
                    stroke="#3b82f6"
                    strokeWidth={2.5}
                    fill="url(#gradTotal)"
                    dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 6 }}
                    animationDuration={900}
                />
                <Area
                    type="monotone"
                    dataKey="resolved"
                    name="resolved"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    fill="url(#gradResolved)"
                    dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 6 }}
                    animationDuration={900}
                />
            </AreaChart>
        </ResponsiveContainer>
    );
};

// ─── 5. Resolution Rate Radial Gauge ─────────────────────────────────────────
export const ResolutionGauge = ({ rate, kpis }) => {
    const gaugeData = [{ name: 'Resolved', value: rate, fill: '#10b981' }];
    return (
        <div className="relative">
            <ResponsiveContainer width="100%" height={200}>
                <RadialBarChart
                    cx="50%" cy="60%"
                    innerRadius="55%" outerRadius="85%"
                    startAngle={200} endAngle={-20}
                    data={gaugeData}
                    barSize={18}
                >
                    <RadialBar
                        dataKey="value"
                        cornerRadius={12}
                        background={{ fill: '#f1f5f9' }}
                        animationDuration={1000}
                    />
                    <Tooltip
                        content={({ active, payload }) =>
                            active && payload?.length ? (
                                <div className="bg-slate-900 text-white text-xs font-bold px-3 py-2 rounded-xl shadow-xl">
                                    Resolution Rate: <span className="text-emerald-400">{rate}%</span>
                                </div>
                            ) : null
                        }
                    />
                </RadialBarChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-4">
                <span className="text-4xl font-black text-slate-900 leading-none">{rate}%</span>
                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mt-1">Resolution Rate</span>
            </div>
            {kpis && (
                <div className="grid grid-cols-3 gap-2 mt-4">
                    {[
                        { label: 'Total', val: kpis.total, color: 'text-slate-700' },
                        { label: 'Resolved', val: kpis.resolved, color: 'text-emerald-600' },
                        { label: 'Pending', val: kpis.pending, color: 'text-amber-500' },
                    ].map(({ label, val, color }) => (
                        <div key={label} className="text-center p-3 bg-slate-50 rounded-2xl">
                            <p className={`text-xl font-black ${color}`}>{val}</p>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{label}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// ─── 6. Department Bar Chart ─────────────────────────────────────────────────
export const DepartmentBarChart = ({ data }) => {
    if (!data?.length) return <EmptyChart message="No department assignments yet" />;
    return (
        <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data} margin={{ left: 0, right: 16, top: 4, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                    axisLine={false} tickLine={false}
                />
                <YAxis
                    tick={{ fontSize: 11, fontWeight: 700, fill: '#94a3b8' }}
                    axisLine={false} tickLine={false}
                    allowDecimals={false}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                <Legend
                    iconType="circle" iconSize={8}
                    formatter={(v) => <span style={{ fontSize: '11px', fontWeight: '700', color: '#475569' }}>
                        {v === 'total' ? 'Total' : v === 'resolved' ? 'Resolved' : 'Pending'}
                    </span>}
                />
                <Bar dataKey="total" name="total" fill="#3b82f6" radius={[6, 6, 0, 0]} animationDuration={900} />
                <Bar dataKey="resolved" name="resolved" fill="#10b981" radius={[6, 6, 0, 0]} animationDuration={900} />
                <Bar dataKey="pending" name="pending" fill="#f59e0b" radius={[6, 6, 0, 0]} animationDuration={900} />
            </BarChart>
        </ResponsiveContainer>
    );
};

// ─── 7. User Role Pie (Super Admin) ─────────────────────────────────────────
export const UserRolePieChart = ({ data }) => {
    if (!data?.length) return <EmptyChart />;
    return (
        <ResponsiveContainer width="100%" height={240}>
            <PieChart>
                <Pie
                    data={data}
                    cx="50%" cy="50%"
                    outerRadius={95}
                    paddingAngle={4}
                    dataKey="value"
                    animationBegin={0}
                    animationDuration={900}
                    label={({ name, percent }) =>
                        percent > 0.06 ? `${(percent * 100).toFixed(0)}%` : ''
                    }
                    labelLine={false}
                >
                    {data.map((entry, index) => (
                        <Cell
                            key={index}
                            fill={ROLE_COLORS[entry.name] || '#94a3b8'}
                            stroke="none"
                        />
                    ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                    iconType="circle" iconSize={8}
                    formatter={(value) => (
                        <span style={{ fontSize: '11px', fontWeight: '700', color: '#475569', textTransform: 'capitalize' }}>{value}</span>
                    )}
                />
            </PieChart>
        </ResponsiveContainer>
    );
};

// ─── Empty / Loading States ───────────────────────────────────────────────────
export const EmptyChart = ({ message = 'No data available yet' }) => (
    <div className="flex flex-col items-center justify-center h-48 text-center">
        <div className="w-12 h-12 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
        </div>
        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest italic">{message}</p>
    </div>
);

export const ChartSkeleton = () => (
    <div className="animate-pulse">
        <div className="h-4 bg-slate-100 rounded-full w-1/3 mb-2" />
        <div className="h-3 bg-slate-50 rounded-full w-1/2 mb-6" />
        <div className="h-48 bg-slate-50 rounded-2xl" />
    </div>
);
