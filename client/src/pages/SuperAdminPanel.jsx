import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import {
    Building2, UserPlus, Users, Briefcase, Shield, Plus,
    ChevronRight, X, MapPin, Phone, Lock, User, Edit2, Trash2,
    BarChart2, RefreshCw, TrendingUp, CheckCircle, AlertCircle, Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChartCard, StatusPieChart, PriorityDonutChart, CategoryBarChart,
    MonthlyTrendChart, ResolutionGauge, DepartmentBarChart,
    UserRolePieChart, ChartSkeleton
} from '../components/AnalyticsCharts';

const SuperAdminPanel = () => {
    const { t } = useTranslation();
    const [users, setUsers] = useState([]);
    const [offices, setOffices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('users');
    const [showModal, setShowModal] = useState(null);
    const [editingOffice, setEditingOffice] = useState(null);
    const [formData, setFormData] = useState({});
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [analytics, setAnalytics] = useState(null);
    const [analyticsLoading, setAnalyticsLoading] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [usersRes, officesRes] = await Promise.all([
                api.get('/admin/users'),
                api.get('/admin/offices'),
            ]);
            setUsers(usersRes.data);
            setOffices(officesRes.data);
        } catch (err) {
            console.error('Failed to fetch data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const fetchAnalytics = async () => {
        setAnalyticsLoading(true);
        try {
            const res = await api.get('/admin/analytics');
            setAnalytics(res.data);
        } catch (err) {
            console.error('Failed to fetch analytics');
        } finally {
            setAnalyticsLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'analytics') fetchAnalytics();
    }, [activeTab]);

    const resetForm = () => {
        setFormData({});
        setError('');
        setShowModal(null);
        setEditingOffice(null);
    };

    const handleCreateOffice = async (e) => {
        e.preventDefault();
        setError('');
        setSubmitting(true);
        try {
            const { officeName, zoneName, wardsCovered, address, pincodes } = formData;
            const payload = {
                officeName,
                zoneName,
                wardsCovered: typeof wardsCovered === 'string' ? wardsCovered.split(',').map(w => w.trim()) : wardsCovered,
                pincodes: typeof pincodes === 'string' ? pincodes.split(',').map(p => p.trim()) : pincodes,
                location: { address },
            };

            if (editingOffice) {
                await api.patch(`/admin/offices/${editingOffice._id}`, payload);
            } else {
                await api.post('/admin/offices', payload);
            }

            resetForm();
            fetchData();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save office');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteOffice = async (id) => {
        if (!window.confirm('Are you sure you want to delete this office? This action cannot be undone.')) return;
        try {
            await api.delete(`/admin/offices/${id}`);
            fetchData();
        } catch (err) {
            alert('Failed to delete office');
        }
    };

    const handleEditOffice = (office) => {
        setEditingOffice(office);
        setFormData({
            officeName: office.officeName,
            zoneName: office.zoneName,
            wardsCovered: office.wardsCovered?.join(', '),
            pincodes: office.pincodes?.join(', '),
            address: office.location?.address,
        });
        setShowModal('office');
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        setError('');
        setSubmitting(true);
        try {
            const { username, password, mobile, name, role, department, officeId } = formData;
            await api.post('/admin/users', {
                username,
                password,
                mobile,
                name: name || username,
                role: role || showModal,
                department,
                officeId,
            });
            resetForm();
            fetchData();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create user');
        } finally {
            setSubmitting(false);
        }
    };

    const getRoleBadge = (role) => {
        const styles = {
            superadmin: 'bg-purple-50 text-purple-600 border-purple-100',
            admin: 'bg-blue-50 text-blue-600 border-blue-100',
            employee: 'bg-emerald-50 text-emerald-600 border-emerald-100',
            citizen: 'bg-slate-50 text-slate-600 border-slate-100',
        };
        return styles[role] || styles.citizen;
    };

    const tabs = [
        { key: 'users', label: t('superadmin.all_users'), icon: <Users className="w-4 h-4" />, count: users.length },
        { key: 'offices', label: t('superadmin.all_offices'), icon: <Building2 className="w-4 h-4" />, count: offices.length },
        { key: 'analytics', label: 'System Analytics', icon: <BarChart2 className="w-4 h-4" />, count: null },
    ];

    return (
        <div className="min-h-screen bg-slate-50/50 pt-24 pb-20 px-4 sm:px-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-purple-600 rounded-lg shadow-lg shadow-purple-200">
                                <Shield className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">{t('superadmin.panel')}</span>
                        </div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight">{t('superadmin.panel')}</h1>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-3"
                    >
                        <button
                            onClick={() => { setFormData({}); setError(''); setShowModal('office'); }}
                            className="inline-flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-5 py-3 rounded-2xl font-black text-sm hover:bg-slate-50 transition-all shadow-sm active:scale-95"
                        >
                            <Building2 className="w-4 h-4" /> {t('superadmin.create_office')}
                        </button>
                        <button
                            onClick={() => { setFormData({ role: 'admin' }); setError(''); setShowModal('admin'); }}
                            className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-3 rounded-2xl font-black text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 active:scale-95"
                        >
                            <UserPlus className="w-4 h-4" /> {t('superadmin.create_admin')}
                        </button>
                        <button
                            onClick={() => { setFormData({ role: 'employee' }); setError(''); setShowModal('employee'); }}
                            className="inline-flex items-center gap-2 bg-emerald-600 text-white px-5 py-3 rounded-2xl font-black text-sm hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 active:scale-95"
                        >
                            <Briefcase className="w-4 h-4" /> {t('superadmin.create_employee')}
                        </button>
                    </motion.div>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-2 mb-8 flex-wrap">
                    {tabs.map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-sm uppercase tracking-wider transition-all ${activeTab === tab.key
                                ? tab.key === 'analytics'
                                    ? 'bg-indigo-600 text-white shadow-xl'
                                    : 'bg-slate-900 text-white shadow-xl'
                                : 'bg-white text-slate-400 border border-slate-100 hover:bg-slate-50'
                                }`}
                        >
                            {tab.icon}
                            {tab.label}
                            {tab.count !== null && (
                                <span className={`ml-1 px-2 py-0.5 rounded-lg text-[10px] font-black ${activeTab === tab.key ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Content */}
                {loading ? (
                    <div className="bg-white rounded-[2.5rem] p-24 text-center border border-slate-100 shadow-sm">
                        <div className="animate-spin w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-6"></div>
                        <p className="text-slate-400 font-black uppercase tracking-widest text-sm italic">Loading data...</p>
                    </div>
                ) : activeTab === 'users' ? (
                    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-slate-50/50">
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{t('auth.username')}</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{t('auth.name')}</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{t('auth.mobile_number')}</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Role</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Department</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Office</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {users.map((u) => (
                                        <tr key={u._id} className="hover:bg-blue-50/30 transition-colors">
                                            <td className="px-8 py-5">
                                                <span className="text-sm font-black text-slate-900">{u.username}</span>
                                            </td>
                                            <td className="px-8 py-5 text-sm font-bold text-slate-600">{u.name}</td>
                                            <td className="px-8 py-5 text-sm font-bold text-slate-500">{u.mobile}</td>
                                            <td className="px-8 py-5">
                                                <span className={`inline-block px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${getRoleBadge(u.role)}`}>
                                                    {u.role}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5 text-sm font-bold text-slate-500">{u.department || '—'}</td>
                                            <td className="px-8 py-5 text-sm font-bold text-slate-500">{u.officeId?.officeName || '—'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {offices.map((office) => (
                            <motion.div
                                key={office._id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group"
                            >
                                <div className="flex justify-between items-start mb-6">
                                    <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                                        <Building2 className="w-6 h-6" />
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleEditOffice(office)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => handleDeleteOffice(office._id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                                <h3 className="text-xl font-black text-slate-900 mb-2">{office.officeName}</h3>
                                <p className="text-sm font-bold text-slate-500 mb-4">{office.zoneName}</p>
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {office.wardsCovered?.map((ward, i) => (
                                        <span key={i} className="px-3 py-1 bg-slate-50 text-slate-500 text-[10px] font-black rounded-lg border border-slate-100 uppercase">
                                            Ward {ward}
                                        </span>
                                    ))}
                                </div>
                                {office.pincodes?.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mb-4">
                                        {office.pincodes.map((p, i) => (
                                            <span key={i} className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[8px] font-black rounded border border-blue-100">
                                                {p}
                                            </span>
                                        ))}
                                    </div>
                                )}
                                {office.location?.address && (
                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                                        <MapPin className="w-3.5 h-3.5 text-rose-500" />
                                        {office.location.address}
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </div>
                )}
                {/* ── System Analytics Tab ── */}
                {activeTab === 'analytics' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        {/* Header bar */}
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">System Analytics</h2>
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1 italic">Platform-wide operational insights</p>
                            </div>
                            <button
                                onClick={fetchAnalytics}
                                disabled={analyticsLoading}
                                className="flex items-center gap-2 px-5 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-black text-slate-500 hover:bg-slate-50 transition-all shadow-sm"
                            >
                                <RefreshCw className={`w-4 h-4 ${analyticsLoading ? 'animate-spin' : ''}`} />
                                Refresh
                            </button>
                        </div>

                        {analyticsLoading ? (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {[...Array(6)].map((_, i) => (
                                    <div key={i} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-7">
                                        <ChartSkeleton />
                                    </div>
                                ))}
                            </div>
                        ) : analytics ? (
                            <>
                                {/* ── KPI Summary Row ── */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                                    {[
                                        { label: 'Total Complaints', val: analytics.kpis.total, color: 'text-slate-900', bg: 'bg-slate-50', icon: <TrendingUp className="w-5 h-5 text-slate-500" /> },
                                        { label: 'Resolved', val: analytics.kpis.resolved, color: 'text-emerald-600', bg: 'bg-emerald-50', icon: <CheckCircle className="w-5 h-5 text-emerald-500" /> },
                                        { label: 'Pending', val: analytics.kpis.pending, color: 'text-amber-600', bg: 'bg-amber-50', icon: <Clock className="w-5 h-5 text-amber-500" /> },
                                        { label: 'Rejected', val: analytics.kpis.rejected, color: 'text-rose-600', bg: 'bg-rose-50', icon: <AlertCircle className="w-5 h-5 text-rose-500" /> },
                                    ].map(({ label, val, color, bg, icon }, idx) => (
                                        <motion.div
                                            key={label}
                                            initial={{ opacity: 0, y: 16 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.07 }}
                                            className="bg-white rounded-[1.5rem] border border-slate-100 shadow-sm p-6 flex items-center gap-4 hover:shadow-lg transition-all"
                                        >
                                            <div className={`w-11 h-11 ${bg} rounded-xl flex items-center justify-center flex-shrink-0`}>{icon}</div>
                                            <div>
                                                <p className={`text-2xl font-black ${color} leading-none`}>{val}</p>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{label}</p>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>

                                {/* ── Row 1: User Roles + Status Pie + Priority ── */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                                    <ChartCard title="User Distribution" subtitle="By Role" delay={0}>
                                        <UserRolePieChart data={analytics.userRoleDistribution} />
                                    </ChartCard>
                                    <ChartCard title="Complaint Status" subtitle="System-wide" delay={0.08}>
                                        <StatusPieChart data={analytics.statusDistribution} />
                                    </ChartCard>
                                    <ChartCard title="Resolution Rate" subtitle="Overall Performance" delay={0.16}>
                                        <ResolutionGauge rate={analytics.resolutionRate} kpis={analytics.kpis} />
                                    </ChartCard>
                                </div>

                                {/* ── Row 2: Monthly Trend ── */}
                                <div className="mb-6">
                                    <ChartCard title="Monthly Complaint Trend" subtitle="Last 6 Months — System Wide" delay={0.24}>
                                        <MonthlyTrendChart data={analytics.monthlyTrend} />
                                    </ChartCard>
                                </div>

                                {/* ── Row 3: Category + Department ── */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <ChartCard title="Category Breakdown" subtitle="Issue Types System-wide" delay={0.32}>
                                        <CategoryBarChart data={analytics.categoryDistribution} />
                                    </ChartCard>
                                    <ChartCard title="Department Workload" subtitle="Assigned vs. Resolved" delay={0.40}>
                                        <DepartmentBarChart data={analytics.departmentStats} />
                                    </ChartCard>
                                </div>
                            </>
                        ) : (
                            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-24 text-center">
                                <BarChart2 className="w-12 h-12 text-slate-100 mx-auto mb-4" />
                                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs italic">Failed to load analytics. Click Refresh to retry.</p>
                            </div>
                        )}
                    </motion.div>
                )}

            </div>

            {/* Create Modal */}
            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={resetForm}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-xl"
                        ></motion.div>

                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden"
                        >
                            <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                                <h3 className="text-2xl font-black text-slate-900">
                                    {showModal === 'office'
                                        ? (editingOffice ? 'Update Office' : t('superadmin.create_office'))
                                        : showModal === 'admin'
                                            ? t('superadmin.create_admin')
                                            : t('superadmin.create_employee')}
                                </h3>
                                <button
                                    onClick={resetForm}
                                    className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form
                                onSubmit={showModal === 'office' ? handleCreateOffice : handleCreateUser}
                                className="p-8 space-y-5"
                            >
                                {showModal === 'office' ? (
                                    <>
                                        <InputField
                                            label={t('superadmin.office_name')}
                                            icon={<Building2 className="w-5 h-5" />}
                                            placeholder="e.g. Central Zone Office"
                                            value={formData.officeName || ''}
                                            onChange={(v) => setFormData({ ...formData, officeName: v })}
                                            required
                                        />
                                        <InputField
                                            label={t('superadmin.zone_name')}
                                            icon={<MapPin className="w-5 h-5" />}
                                            placeholder="e.g. Chennai North"
                                            value={formData.zoneName || ''}
                                            onChange={(v) => setFormData({ ...formData, zoneName: v })}
                                            required
                                        />
                                        <InputField
                                            label={t('superadmin.wards_covered')}
                                            icon={<MapPin className="w-5 h-5" />}
                                            placeholder="e.g. 1, 2, 3"
                                            value={formData.wardsCovered || ''}
                                            onChange={(v) => setFormData({ ...formData, wardsCovered: v })}
                                        />
                                        <InputField
                                            label="Pincodes (comma separated)"
                                            icon={<MapPin className="w-5 h-5" />}
                                            placeholder="e.g. 600001, 600002"
                                            value={formData.pincodes || ''}
                                            onChange={(v) => setFormData({ ...formData, pincodes: v })}
                                        />
                                        <InputField
                                            label={t('superadmin.address')}
                                            icon={<MapPin className="w-5 h-5" />}
                                            placeholder="Office address"
                                            value={formData.address || ''}
                                            onChange={(v) => setFormData({ ...formData, address: v })}
                                        />
                                    </>
                                ) : (
                                    <>
                                        <InputField
                                            label={t('auth.username')}
                                            icon={<User className="w-5 h-5" />}
                                            placeholder={t('auth.enter_username')}
                                            value={formData.username || ''}
                                            onChange={(v) => setFormData({ ...formData, username: v })}
                                            required
                                        />
                                        <InputField
                                            label={t('auth.name')}
                                            icon={<User className="w-5 h-5" />}
                                            placeholder="Full Name"
                                            value={formData.name || ''}
                                            onChange={(v) => setFormData({ ...formData, name: v })}
                                        />
                                        <InputField
                                            label={t('auth.mobile_number')}
                                            icon={<Phone className="w-5 h-5" />}
                                            placeholder={t('auth.enter_mobile')}
                                            value={formData.mobile || ''}
                                            onChange={(v) => setFormData({ ...formData, mobile: v.replace(/\D/g, '') })}
                                            maxLength="10"
                                            required
                                        />
                                        <InputField
                                            label={t('auth.password')}
                                            icon={<Lock className="w-5 h-5" />}
                                            placeholder={t('auth.enter_password')}
                                            value={formData.password || ''}
                                            onChange={(v) => setFormData({ ...formData, password: v })}
                                            type="password"
                                            required
                                        />
                                        {showModal === 'employee' && (
                                            <>
                                                <InputField
                                                    label={t('superadmin.department')}
                                                    icon={<Briefcase className="w-5 h-5" />}
                                                    placeholder="e.g. Roads, Water, Sanitation"
                                                    value={formData.department || ''}
                                                    onChange={(v) => setFormData({ ...formData, department: v })}
                                                    required
                                                />
                                            </>
                                        )}
                                        <div className="space-y-2">
                                            <label className="block text-sm font-black text-slate-800 uppercase tracking-wider">
                                                {t('superadmin.assign_office')}
                                            </label>
                                            <select
                                                value={formData.officeId || ''}
                                                onChange={(e) => setFormData({ ...formData, officeId: e.target.value })}
                                                className="w-full px-4 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-lg font-bold text-slate-900"
                                            >
                                                <option value="">Select Office (optional)</option>
                                                {offices.map((o) => (
                                                    <option key={o._id} value={o._id}>{o.officeName} — {o.zoneName}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </>
                                )}

                                {error && (
                                    <motion.p
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="text-red-500 text-sm font-bold bg-red-50 p-4 rounded-xl border border-red-100 flex items-center gap-2"
                                    >
                                        <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                                        {error}
                                    </motion.p>
                                )}

                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-lg hover:bg-slate-800 transition-all flex items-center justify-center gap-3 shadow-xl active:scale-95 disabled:opacity-50"
                                >
                                    {submitting ? (
                                        <div className="w-6 h-6 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                        <>
                                            {editingOffice ? <Edit2 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                                            {editingOffice ? 'Update Office' : t('common.submit')}
                                        </>
                                    )}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

// Reusable Input Field Component
const InputField = ({ label, icon, placeholder, value, onChange, type = 'text', required = false, maxLength }) => (
    <div className="space-y-2">
        <label className="block text-sm font-black text-slate-800 uppercase tracking-wider">{label}</label>
        <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center text-slate-400 group-focus-within:text-blue-600 transition-colors">
                {icon}
            </div>
            <input
                type={type}
                required={required}
                maxLength={maxLength}
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-lg font-bold text-slate-900 placeholder:text-slate-300 placeholder:font-medium"
            />
        </div>
    </div>
);

export default SuperAdminPanel;
