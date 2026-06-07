import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import {
    Users, CheckCircle, AlertTriangle, Clock,
    Search, UserPlus, Shield, ChevronRight, LayoutDashboard, Database, MapPin, X,
    RotateCcw, Phone, User, Briefcase, Calendar, Building2, FileText, Mail, TrendingUp, ThumbsUp, ThumbsDown,
    BarChart2, RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChartCard, StatusPieChart, PriorityDonutChart, CategoryBarChart,
    MonthlyTrendChart, ResolutionGauge, DepartmentBarChart, ChartSkeleton
} from '../components/AnalyticsCharts';

const AdminDashboard = () => {
    const { t } = useTranslation();
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedComplaint, setSelectedComplaint] = useState(null);
    const [employees, setEmployees] = useState([]);
    const [offices, setOffices] = useState([]);
    const [assigning, setAssigning] = useState(false);
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterCategory, setFilterCategory] = useState('all');
    const [filterPriority, setFilterPriority] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDepartment, setSelectedDepartment] = useState('all');
    const [activeTab, setActiveTab] = useState('complaints');
    const [sortByRanking, setSortByRanking] = useState(false);
    const [analytics, setAnalytics] = useState(null);
    const [analyticsLoading, setAnalyticsLoading] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const complaintsEndpoint = sortByRanking ? '/complaints/ranked' : '/complaints/all';
            const [complaintsRes, employeesRes, officesRes] = await Promise.all([
                api.get(complaintsEndpoint),
                api.get('/admin/employees'),
                api.get('/admin/offices'),
            ]);
            setComplaints(complaintsRes.data);
            setEmployees(employeesRes.data);
            setOffices(officesRes.data);
        } catch (err) {
            console.error('Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, [sortByRanking]);

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

    const handleAssign = async (employeeId) => {
        setAssigning(true);
        try {
            await api.patch(`/complaints/${selectedComplaint._id}/assign`, {
                employeeId,
                department: employees.find(e => e._id === employeeId)?.department
            });
            setSelectedComplaint(null);
            setSelectedDepartment('all');
            fetchData();
        } catch (err) {
            alert('Failed to assign employee');
        } finally {
            setAssigning(false);
        }
    };

    const handleVerify = async (action) => {
        try {
            await api.patch(`/complaints/${selectedComplaint._id}/verify`, { action });
            setSelectedComplaint(null);
            fetchData();
        } catch (err) { alert('Failed to verify complaint'); }
    };

    const handleReopen = async () => {
        try {
            await api.patch(`/complaints/${selectedComplaint._id}/reopen`);
            setSelectedComplaint(null);
            fetchData();
        } catch (err) { alert('Failed to reopen complaint'); }
    };

    const statuses = ['Pending', 'Assigned', 'In Progress', 'Completed', 'Resolved', 'Rejected'];
    const categories = ['road', 'water', 'electricity', 'sanitation', 'others'];
    const priorityList = ['Low', 'Medium', 'High'];

    // Get unique departments from employees
    const departments = [...new Set(employees.map(e => e.department).filter(Boolean))];

    const filteredComplaints = complaints.filter(c => {
        if (filterStatus !== 'all' && c.status !== filterStatus) return false;
        if (filterCategory !== 'all' && c.category !== filterCategory) return false;
        if (filterPriority !== 'all' && c.priority !== filterPriority) return false;
        if (searchTerm && !c.complaintId.toLowerCase().includes(searchTerm.toLowerCase())) return false;
        return true;
    });

    const filteredEmployees = selectedDepartment === 'all'
        ? employees
        : employees.filter(e => e.department === selectedDepartment);

    const hasFilters = filterStatus !== 'all' || filterCategory !== 'all' || filterPriority !== 'all' || searchTerm;

    const getPriorityBadge = (p) => {
        switch (p) {
            case 'High': return 'bg-rose-50 text-rose-600 border-rose-100';
            case 'Medium': return 'bg-amber-50 text-amber-600 border-amber-100';
            default: return 'bg-emerald-50 text-emerald-600 border-emerald-100';
        }
    };

    const stats = [
        { label: t('admin.unassigned'), count: complaints.filter(c => c.status === 'Pending').length, color: 'text-amber-500', bg: 'bg-amber-50', icon: <Clock className="w-5 h-5" /> },
        { label: t('admin.work_in_progress'), count: complaints.filter(c => ['Assigned', 'In Progress'].includes(c.status)).length, color: 'text-blue-500', bg: 'bg-blue-50', icon: <Database className="w-5 h-5" /> },
        { label: t('admin.awaiting_verification'), count: complaints.filter(c => c.status === 'Completed').length, color: 'text-purple-500', bg: 'bg-purple-50', icon: <Shield className="w-5 h-5" /> },
        { label: t('admin.status_resolved'), count: complaints.filter(c => c.status === 'Resolved').length, color: 'text-emerald-500', bg: 'bg-emerald-50', icon: <CheckCircle className="w-5 h-5" /> },
    ];

    const tabs = [
        { id: 'complaints', label: 'Complaints', icon: <FileText className="w-4 h-4" />, count: complaints.length },
        { id: 'employees', label: 'Employees', icon: <Users className="w-4 h-4" />, count: employees.length },
        { id: 'offices', label: 'Offices', icon: <Building2 className="w-4 h-4" />, count: offices.length },
        { id: 'analytics', label: 'Analytics', icon: <BarChart2 className="w-4 h-4" />, count: null },
    ];

    return (
        <div className="min-h-screen bg-slate-50/50 pt-24 pb-20 px-4 sm:px-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-slate-900 rounded-lg"><LayoutDashboard className="w-5 h-5 text-white" /></div>
                            <span className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">Command Center</span>
                        </div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight">{t('admin.command_center')}</h1>
                    </motion.div>
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-4">
                        <div className="hidden sm:flex -space-x-3">
                            {employees.slice(0, 5).map((emp, i) => (
                                <div key={i} className="w-10 h-10 rounded-full bg-white border-4 border-slate-50 flex items-center justify-center text-[10px] font-black text-slate-400 shadow-sm" title={emp.name}>{emp.name.charAt(0)}</div>
                            ))}
                            {employees.length > 5 && <div className="w-10 h-10 rounded-full bg-slate-900 border-4 border-slate-50 flex items-center justify-center text-[10px] font-black text-white shadow-sm">+{employees.length - 5}</div>}
                        </div>
                        <div className="text-right">
                            <p className="text-sm font-black text-slate-900 leading-none">{employees.length}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Active Workforce</p>
                        </div>
                    </motion.div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                    {stats.map((stat, idx) => (
                        <motion.div key={idx} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}
                            className="bg-white p-7 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group">
                            <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform`}>{stat.icon}</div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                            <p className={`text-3xl font-black ${stat.color} leading-none`}>{stat.count}</p>
                        </motion.div>
                    ))}
                </div>

                {/* Tab Navigation */}
                <div className="mb-8">
                    <div className="flex items-center gap-2 p-1.5 bg-white rounded-2xl border border-slate-100 shadow-sm inline-flex flex-wrap">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => { setActiveTab(tab.id); setSelectedComplaint(null); }}
                                className={`flex items-center gap-2.5 px-5 py-3 rounded-xl text-sm font-black uppercase tracking-wider transition-all ${
                                    activeTab === tab.id
                                        ? tab.id === 'analytics'
                                            ? 'bg-indigo-600 text-white shadow-lg'
                                            : 'bg-slate-900 text-white shadow-lg'
                                        : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                                }`}
                            >
                                {tab.icon}
                                <span className="hidden sm:inline">{tab.label}</span>
                                {tab.count !== null && (
                                    <span className={`text-[10px] px-2 py-0.5 rounded-lg font-black ${activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                        {tab.count}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ═══════════════════════════════════════════════════ */}
                {/* COMPLAINTS TAB                                     */}
                {/* ═══════════════════════════════════════════════════ */}
                {activeTab === 'complaints' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col xl:flex-row gap-10">
                        {/* Table */}
                        <div className="flex-grow">
                            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                                <div className="p-8 border-b border-slate-50 flex flex-wrap items-center justify-between gap-6 bg-slate-50/30">
                                    <div>
                                        <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">{t('admin.active_complaints')}</h2>
                                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1 italic">Real-time status monitor • {filteredComplaints.length} results</p>
                                    </div>
                                    <div className="flex items-center gap-3 flex-wrap">
                                        <div className="relative">
                                            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input type="text" placeholder="Search by ID..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                                                className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:ring-4 focus:ring-blue-500/10 outline-none transition-all w-48" />
                                        </div>
                                        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:ring-4 focus:ring-blue-500/10 outline-none transition-all cursor-pointer">
                                            <option value="all">{t('admin.filter_status')}</option>
                                            {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                        <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:ring-4 focus:ring-blue-500/10 outline-none transition-all cursor-pointer capitalize">
                                            <option value="all">{t('admin.filter_category')}</option>
                                            {categories.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
                                        </select>
                                        <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)} className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:ring-4 focus:ring-blue-500/10 outline-none transition-all cursor-pointer">
                                            <option value="all">{t('admin.filter_priority')}</option>
                                            {priorityList.map(p => <option key={p} value={p}>{p}</option>)}
                                        </select>
                                        {hasFilters && (
                                            <button onClick={() => { setFilterStatus('all'); setFilterCategory('all'); setFilterPriority('all'); setSearchTerm(''); }}
                                                className="p-2.5 bg-red-50 border border-red-100 rounded-xl hover:bg-red-100 transition-colors text-red-500" title="Clear filters">
                                                <X className="w-4 h-4" />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => setSortByRanking(!sortByRanking)}
                                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider border transition-all ${sortByRanking
                                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100'
                                                : 'bg-white text-slate-400 border-slate-200 hover:border-indigo-300 hover:text-indigo-600'
                                                }`}
                                            title={sortByRanking ? t('admin.sort_by_date') : t('admin.sort_by_ranking')}
                                        >
                                            <TrendingUp className="w-4 h-4" />
                                            {sortByRanking ? t('admin.sort_by_date') : t('admin.sort_by_ranking')}
                                        </button>
                                    </div>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="bg-slate-50/50">
                                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{t('common.complaint_id')}</th>
                                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{t('common.category')}</th>
                                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Priority</th>
                                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{t('common.location')}</th>
                                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{t('common.status')}</th>
                                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Date</th>
                                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Score</th>
                                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{t('common.assigned_to')}</th>
                                                <th className="px-6 py-5"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {filteredComplaints.length === 0 ? (
                                                <tr><td colSpan="9" className="px-8 py-20 text-center">
                                                    <Database className="w-12 h-12 text-slate-100 mx-auto mb-4" />
                                                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs italic">No data records found</p>
                                                </td></tr>
                                            ) : filteredComplaints.map((c) => (
                                                <tr key={c._id} className={`group hover:bg-blue-50/30 transition-colors cursor-pointer ${selectedComplaint?._id === c._id ? 'bg-blue-50/50' : ''}`} onClick={() => setSelectedComplaint(c)}>
                                                    <td className="px-6 py-5"><span className="inline-block px-3 py-1 bg-slate-900 text-white text-[10px] font-black rounded-lg">{c.complaintId}</span></td>
                                                    <td className="px-6 py-5"><span className="text-sm font-black text-slate-900 capitalize italic leading-none whitespace-nowrap">{c.category.replace('_', ' ')}</span></td>
                                                    <td className="px-6 py-5">
                                                        <span className={`inline-block px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${getPriorityBadge(c.priority)}`}>{c.priority}</span>
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        <div className="flex items-center gap-2 max-w-[160px]">
                                                            <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                                                            <span className="text-xs font-bold text-slate-500 truncate">{c.location?.address}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${c.status === 'Pending' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                            c.status === 'Resolved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                                c.status === 'Completed' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                                                                    c.status === 'Rejected' ? 'bg-red-50 text-red-600 border-red-100' :
                                                                        'bg-blue-50 text-blue-600 border-blue-100'}`}>
                                                            <div className={`w-1.5 h-1.5 rounded-full ${c.status === 'Pending' ? 'bg-amber-500' : c.status === 'Resolved' ? 'bg-emerald-500' : c.status === 'Completed' ? 'bg-purple-500' : c.status === 'Rejected' ? 'bg-red-500' : 'bg-blue-500'} animate-pulse`}></div>
                                                            {c.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-5"><span className="text-[10px] font-bold text-slate-400">{new Date(c.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span></td>
                                                    <td className="px-6 py-5">
                                                        <div className="flex items-center gap-2">
                                                            <div className="flex items-center gap-0.5">
                                                                <ThumbsUp className="w-3 h-3 text-emerald-500" />
                                                                <span className="text-[10px] font-black text-slate-600">{c.upvotes || 0}</span>
                                                            </div>
                                                            <div className="flex items-center gap-0.5">
                                                                <ThumbsDown className="w-3 h-3 text-rose-500" />
                                                                <span className="text-[10px] font-black text-slate-600">{c.downvotes || 0}</span>
                                                            </div>
                                                            <span className={`ml-1 inline-block px-2 py-0.5 rounded-md text-[10px] font-black ${(c.rankingScore || 0) > 0 ? 'bg-indigo-50 text-indigo-600' : (c.rankingScore || 0) < 0 ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-400'}`}>
                                                                {c.rankingScore?.toFixed(1) || '0.0'}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-5"><span className="text-xs font-bold text-slate-500">{c.assignedEmployee?.name || '—'}</span></td>
                                                    <td className="px-6 py-5 text-right"><ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-slate-900 transition-colors ml-auto" /></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* Detail Panel */}
                        <AnimatePresence>
                            {selectedComplaint && (
                                <motion.div initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 50, opacity: 0 }} className="w-full xl:w-[420px] shrink-0">
                                    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl p-8 sticky top-28 overflow-hidden group">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-1000"></div>

                                        <div className="flex justify-between items-center mb-8 relative z-10">
                                            <h3 className="text-2xl font-black text-slate-900 tracking-tight">{t('admin.manage_complaint')}</h3>
                                            <button onClick={() => { setSelectedComplaint(null); setSelectedDepartment('all'); }}
                                                className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors">
                                                <X className="w-5 h-5" />
                                            </button>
                                        </div>

                                        <div className="space-y-6 relative z-10">
                                            {/* Before Image */}
                                            {selectedComplaint.imageBefore && (
                                                <div className="relative rounded-[2rem] overflow-hidden shadow-lg border-4 border-white aspect-video bg-slate-50">
                                                    <img src={`http://localhost:5000${selectedComplaint.imageBefore}`} alt="Issue Before" className="w-full h-full object-cover" />
                                                    <div className="absolute top-4 left-4 px-3 py-1 bg-black/40 backdrop-blur-md rounded-lg text-[10px] font-black text-white uppercase shadow-sm">Before Repair</div>
                                                </div>
                                            )}

                                            {/* Citizen Info */}
                                            {selectedComplaint.citizenId && (
                                                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-4">
                                                    <div className="w-10 h-10 bg-slate-200 rounded-xl flex items-center justify-center text-slate-500 font-black text-sm">
                                                        <User className="w-5 h-5" />
                                                    </div>
                                                    <div className="flex-grow">
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Reported By</p>
                                                        <p className="text-sm font-black text-slate-900">{selectedComplaint.citizenId.name}</p>
                                                    </div>
                                                    {selectedComplaint.citizenId.mobile && (
                                                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                                                            <Phone className="w-3.5 h-3.5" />
                                                            {selectedComplaint.citizenId.mobile}
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Description + Status + Priority */}
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 italic">Report Details</p>
                                                <p className="text-sm font-bold text-slate-900 leading-relaxed italic">"{selectedComplaint.description}"</p>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Status</p>
                                                    <p className="text-sm font-black text-blue-600 uppercase mt-1">{selectedComplaint.status}</p>
                                                </div>
                                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Priority</p>
                                                    <p className={`text-sm font-black uppercase mt-1 ${selectedComplaint.priority === 'High' ? 'text-rose-600' : selectedComplaint.priority === 'Medium' ? 'text-amber-600' : 'text-emerald-600'}`}>{selectedComplaint.priority}</p>
                                                </div>
                                            </div>

                                            {selectedComplaint.assignedEmployee && (
                                                <div className="p-5 bg-blue-50 rounded-2xl border border-blue-100 flex items-center gap-4">
                                                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black text-sm">{selectedComplaint.assignedEmployee.name?.charAt(0)}</div>
                                                    <div>
                                                        <p className="text-sm font-black text-blue-900">{selectedComplaint.assignedEmployee.name}</p>
                                                        <p className="text-[10px] font-bold text-blue-500 uppercase tracking-tighter">{selectedComplaint.assignedDepartment}</p>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Assign — Department first */}
                                            {selectedComplaint.status === 'Pending' && (
                                                <div className="pt-6 border-t border-slate-50">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Select Department, Then Assign</p>

                                                    <div className="flex flex-wrap gap-2 mb-5">
                                                        <button onClick={() => setSelectedDepartment('all')}
                                                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all ${selectedDepartment === 'all' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-400 border-slate-100 hover:border-slate-300'}`}>
                                                            All
                                                        </button>
                                                        {departments.map(d => (
                                                            <button key={d} onClick={() => setSelectedDepartment(d)}
                                                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all ${selectedDepartment === d ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-400 border-slate-100 hover:border-blue-200'}`}>
                                                                {d}
                                                            </button>
                                                        ))}
                                                    </div>

                                                    <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                                                        {filteredEmployees.map(emp => (
                                                            <button key={emp._id} onClick={() => handleAssign(emp._id)} disabled={assigning}
                                                                className="w-full text-left p-4 rounded-2xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/50 transition-all flex items-center justify-between group/item">
                                                                <div className="flex items-center gap-4">
                                                                    <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 font-black group-hover/item:bg-blue-600 group-hover/item:text-white transition-all">{emp.name.charAt(0)}</div>
                                                                    <div>
                                                                        <p className="text-sm font-black text-slate-900">{emp.name}</p>
                                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{emp.department}</p>
                                                                    </div>
                                                                </div>
                                                                <UserPlus className="w-4 h-4 text-slate-300 group-hover/item:text-blue-600 transition-all" />
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Verify */}
                                            {selectedComplaint.status === 'Completed' && (
                                                <div className="pt-6 border-t border-slate-50 space-y-6">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Verification Protocol</p>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        {selectedComplaint.imageBefore && (
                                                            <div className="relative rounded-2xl overflow-hidden shadow-lg border-2 border-white aspect-square bg-slate-50">
                                                                <img src={`http://localhost:5000${selectedComplaint.imageBefore}`} alt="Before" className="w-full h-full object-cover" />
                                                                <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/40 backdrop-blur-md rounded-md text-[8px] font-black text-white uppercase">Before</div>
                                                            </div>
                                                        )}
                                                        {selectedComplaint.imageAfter && (
                                                            <div className="relative rounded-2xl overflow-hidden shadow-lg border-2 border-white aspect-square bg-emerald-50">
                                                                <img src={`http://localhost:5000${selectedComplaint.imageAfter}`} alt="After" className="w-full h-full object-cover" />
                                                                <div className="absolute top-2 left-2 px-2 py-0.5 bg-emerald-600 rounded-md text-[8px] font-black text-white uppercase">After</div>
                                                            </div>
                                                        )}
                                                    </div>
                                                    {selectedComplaint.resolutionRemarks && (
                                                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-1">Resolution Remarks</p>
                                                            <p className="text-sm font-bold text-slate-700 italic">"{selectedComplaint.resolutionRemarks}"</p>
                                                        </div>
                                                    )}
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <button onClick={() => handleVerify('resolve')}
                                                            className="group flex flex-col items-center justify-center gap-2 p-5 bg-emerald-600 text-white rounded-3xl font-black text-xs hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100 active:scale-95">
                                                            <CheckCircle className="w-6 h-6 group-hover:scale-110 transition-transform" />
                                                            {t('common.resolve').toUpperCase()}
                                                        </button>
                                                        <button onClick={() => handleVerify('reject')}
                                                            className="group flex flex-col items-center justify-center gap-2 p-5 bg-rose-50 text-rose-600 border border-rose-100 rounded-3xl font-black text-xs hover:bg-rose-100 transition-all active:scale-95">
                                                            <AlertTriangle className="w-6 h-6" />
                                                            REJECT
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Reopen for Resolved/Rejected */}
                                            {(selectedComplaint.status === 'Resolved' || selectedComplaint.status === 'Rejected') && (
                                                <div className="pt-6 border-t border-slate-50">
                                                    <button onClick={handleReopen}
                                                        className="w-full flex items-center justify-center gap-3 p-5 bg-slate-100 text-slate-700 rounded-3xl font-black text-sm hover:bg-slate-200 transition-all active:scale-95">
                                                        <RotateCcw className="w-5 h-5" />
                                                        {t('admin.reopen_complaint')}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                )}

                {/* ═══════════════════════════════════════════════════ */}
                {/* EMPLOYEES TAB                                      */}
                {/* ═══════════════════════════════════════════════════ */}
                {activeTab === 'employees' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                            <div className="p-8 border-b border-slate-50 bg-slate-50/30">
                                <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Municipal Workforce</h2>
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1 italic">All registered employees • {employees.length} total</p>
                            </div>

                            {/* Department quick-filter */}
                            {departments.length > 0 && (
                                <div className="px-8 pt-6 flex flex-wrap gap-2">
                                    <button onClick={() => setSelectedDepartment('all')}
                                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all ${selectedDepartment === 'all' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-400 border-slate-100 hover:border-slate-300'}`}>
                                        All Departments
                                    </button>
                                    {departments.map(d => (
                                        <button key={d} onClick={() => setSelectedDepartment(d)}
                                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all ${selectedDepartment === d ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-400 border-slate-100 hover:border-blue-200'}`}>
                                            {d}
                                        </button>
                                    ))}
                                </div>
                            )}

                            <div className="p-8">
                                {filteredEmployees.length === 0 ? (
                                    <div className="py-16 text-center">
                                        <Users className="w-12 h-12 text-slate-100 mx-auto mb-4" />
                                        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs italic">No employees found</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                        {filteredEmployees.map((emp, idx) => (
                                            <motion.div key={emp._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
                                                className="p-6 rounded-[2rem] border border-slate-100 hover:border-blue-200 hover:shadow-xl transition-all group bg-white">
                                                <div className="flex items-start gap-4 mb-5">
                                                    <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-lg shadow-blue-100 group-hover:scale-110 transition-transform">
                                                        {emp.name?.charAt(0)?.toUpperCase()}
                                                    </div>
                                                    <div className="flex-grow min-w-0">
                                                        <p className="text-lg font-black text-slate-900 truncate leading-tight">{emp.name}</p>
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Employee</p>
                                                    </div>
                                                </div>

                                                <div className="space-y-3">
                                                    {emp.department && (
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                                                                <Briefcase className="w-4 h-4 text-blue-500" />
                                                            </div>
                                                            <div>
                                                                <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Department</p>
                                                                <p className="text-sm font-bold text-slate-700 capitalize">{emp.department}</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                    {emp.mobile && (
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                                                                <Phone className="w-4 h-4 text-emerald-500" />
                                                            </div>
                                                            <div>
                                                                <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Mobile</p>
                                                                <p className="text-sm font-bold text-slate-700">{emp.mobile}</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                    {emp.officeId && (
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
                                                                <Building2 className="w-4 h-4 text-purple-500" />
                                                            </div>
                                                            <div>
                                                                <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Office</p>
                                                                <p className="text-sm font-bold text-slate-700">{emp.officeId?.officeName || '—'}</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Assigned work count */}
                                                <div className="mt-5 pt-4 border-t border-slate-50 flex items-center justify-between">
                                                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Active Tasks</span>
                                                    <span className="text-sm font-black text-blue-600">
                                                        {complaints.filter(c => c.assignedEmployee?._id === emp._id && !['Resolved', 'Rejected'].includes(c.status)).length}
                                                    </span>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* ═══════════════════════════════════════════════════ */}
                {/* OFFICES TAB                                        */}
                {/* ═══════════════════════════════════════════════════ */}
                {activeTab === 'offices' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                            <div className="p-8 border-b border-slate-50 bg-slate-50/30">
                                <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Municipal Offices</h2>
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1 italic">Registered office locations • {offices.length} total</p>
                            </div>

                            <div className="p-8">
                                {offices.length === 0 ? (
                                    <div className="py-16 text-center">
                                        <Building2 className="w-12 h-12 text-slate-100 mx-auto mb-4" />
                                        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs italic">No offices registered yet</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                        {offices.map((office, idx) => (
                                            <motion.div key={office._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
                                                className="p-6 rounded-[2rem] border border-slate-100 hover:border-purple-200 hover:shadow-xl transition-all group bg-white">
                                                <div className="flex items-start gap-4 mb-5">
                                                    <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-fuchsia-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-purple-100 group-hover:scale-110 transition-transform">
                                                        <Building2 className="w-7 h-7" />
                                                    </div>
                                                    <div className="flex-grow min-w-0">
                                                        <p className="text-lg font-black text-slate-900 truncate leading-tight">{office.officeName}</p>
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Municipal Office</p>
                                                    </div>
                                                </div>

                                                <div className="space-y-3">
                                                    {office.address && (
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 bg-rose-50 rounded-lg flex items-center justify-center">
                                                                <MapPin className="w-4 h-4 text-rose-500" />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Address</p>
                                                                <p className="text-sm font-bold text-slate-700 truncate">{office.location?.address || '—'}</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                    {office.phone && (
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                                                                <Phone className="w-4 h-4 text-emerald-500" />
                                                            </div>
                                                            <div>
                                                                <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Phone</p>
                                                                <p className="text-sm font-bold text-slate-700">{office.phone}</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                    {office.zone && (
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center">
                                                                <Shield className="w-4 h-4 text-amber-500" />
                                                            </div>
                                                            <div>
                                                                <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Zone</p>
                                                                <p className="text-sm font-bold text-slate-700 capitalize">{office.zoneName}</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Employee count for this office */}
                                                <div className="mt-5 pt-4 border-t border-slate-50 flex items-center justify-between">
                                                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Staff Count</span>
                                                    <span className="text-sm font-black text-purple-600">
                                                        {employees.filter(e => e.officeId?._id === office._id || e.officeId === office._id).length}
                                                    </span>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* ═══════════════════════════════════════════════════ */}
                {/* ANALYTICS TAB                                      */}
                {/* ═══════════════════════════════════════════════════ */}
                {activeTab === 'analytics' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        {/* Header bar */}
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Visual Analytics</h2>
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1 italic">Real-time complaint data insights</p>
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
                                {/* ── Row 1: Status + Priority + Resolution ── */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                                    <ChartCard title="Complaint Status" subtitle="Distribution" delay={0}>
                                        <StatusPieChart data={analytics.statusDistribution} />
                                    </ChartCard>
                                    <ChartCard title="Priority Breakdown" subtitle="AI-Assigned Levels" delay={0.08}>
                                        <PriorityDonutChart data={analytics.priorityDistribution} />
                                    </ChartCard>
                                    <ChartCard title="Resolution Rate" subtitle="Overall Performance" delay={0.16}>
                                        <ResolutionGauge rate={analytics.resolutionRate} kpis={analytics.kpis} />
                                    </ChartCard>
                                </div>

                                {/* ── Row 2: Monthly Trend ── */}
                                <div className="mb-6">
                                    <ChartCard title="Monthly Complaint Trend" subtitle="Last 6 Months" delay={0.24}>
                                        <MonthlyTrendChart data={analytics.monthlyTrend} />
                                    </ChartCard>
                                </div>

                                {/* ── Row 3: Category + Department ── */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <ChartCard title="Category Distribution" subtitle="By Issue Type" delay={0.32}>
                                        <CategoryBarChart data={analytics.categoryDistribution} />
                                    </ChartCard>
                                    <ChartCard title="Department Workload" subtitle="Assigned Complaints" delay={0.40}>
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
        </div>
    );
};

export default AdminDashboard;
