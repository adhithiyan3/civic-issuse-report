import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api, { API_BASE_URL } from '../services/api';
import {
    Briefcase, CheckCircle, Clock, Camera,
    MapPin, AlertCircle, PlayCircle, ChevronRight, X, ArrowRight, Upload, User, Phone, Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const EmployeeDashboard = () => {
    const { t } = useTranslation();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTask, setSelectedTask] = useState(null);
    const [imageAfter, setImageAfter] = useState(null);
    const [remarks, setRemarks] = useState('');
    const [updating, setUpdating] = useState(false);

    const fetchTasks = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/complaints/assigned');
            setTasks(data);
        } catch (err) {
            console.error('Failed to fetch tasks');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchTasks(); }, []);

    const handleUpdateStatus = async (status) => {
        setUpdating(true);
        const formData = new FormData();
        formData.append('status', status);
        formData.append('remarks', remarks);
        if (imageAfter) formData.append('imageAfter', imageAfter);

        try {
            await api.patch(`/complaints/${selectedTask._id}/status`, formData);
            setSelectedTask(null);
            setImageAfter(null);
            setRemarks('');
            fetchTasks();
        } catch (err) {
            alert('Failed to update task');
        } finally {
            setUpdating(false);
        }
    };

    const getPriorityBadge = (p) => {
        switch (p) {
            case 'High': return 'bg-rose-50 text-rose-600 border-rose-100';
            case 'Medium': return 'bg-amber-50 text-amber-600 border-amber-100';
            default: return 'bg-emerald-50 text-emerald-600 border-emerald-100';
        }
    };

    return (
        <div className="min-h-screen bg-slate-50/50 pt-24 pb-20 px-4 sm:px-6">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-blue-600 rounded-lg shadow-lg shadow-blue-200"><Briefcase className="w-5 h-5 text-white" /></div>
                            <span className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] font-mono">Field Workforce</span>
                        </div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight">{t('employee.portal')}</h1>
                    </motion.div>
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                        className="bg-white px-6 py-4 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-5 group hover:shadow-md transition-shadow">
                        <div className="text-right">
                            <p className="text-2xl font-black text-slate-900 leading-none">{tasks.length}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Active Tasks</p>
                        </div>
                        <div className="w-1.5 h-10 bg-blue-500 rounded-full animate-pulse group-hover:scale-y-125 transition-transform"></div>
                    </motion.div>
                </div>

                {loading ? (
                    <div className="bg-white rounded-[2.5rem] p-24 text-center border border-slate-100 shadow-sm">
                        <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-6"></div>
                        <p className="text-slate-400 font-black uppercase tracking-widest text-sm italic">Syncing assignments...</p>
                    </div>
                ) : tasks.length === 0 ? (
                    <div className="bg-white rounded-[3rem] p-20 text-center border border-slate-100 shadow-sm relative overflow-hidden group">
                        <div className="absolute inset-0 bg-emerald-50/30 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="relative z-10">
                            <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-8 group-hover:rotate-12 transition-transform shadow-inner">
                                <CheckCircle className="w-12 h-12 text-emerald-400" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 mb-4">{t('employee.no_tasks')}</h3>
                            <p className="text-slate-500 max-w-sm mx-auto font-medium">{t('employee.no_tasks_desc')}</p>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-8">
                        {tasks.map((task, idx) => (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}
                                key={task._id} onClick={() => setSelectedTask(task)}
                                className="bg-white p-5 sm:p-7 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all cursor-pointer flex flex-col md:flex-row gap-8 items-start relative group overflow-hidden">
                                <div className={`absolute top-0 right-0 w-24 h-24 blur-3xl opacity-10 -mr-12 -mt-12 transition-all group-hover:opacity-40 ${task.status === 'Assigned' ? 'bg-blue-500' : task.status === 'In Progress' ? 'bg-indigo-600' : 'bg-emerald-500'}`}></div>

                                <div className="w-full md:w-56 h-40 rounded-3xl bg-slate-50 overflow-hidden shrink-0 border border-slate-100 relative shadow-inner">
                                    {task.imageBefore && <img src={`${API_BASE_URL}${task.imageBefore}`} alt="Incident" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />}
                                    <div className="absolute top-4 left-4 px-3 py-1 bg-black/30 backdrop-blur-md rounded-lg text-[10px] font-black text-white uppercase shadow-sm">Before Repair</div>
                                </div>

                                <div className="flex-grow space-y-4 pt-2">
                                    <div className="flex items-center gap-3 flex-wrap">
                                        <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-lg border border-blue-100">AID: {task.complaintId}</span>
                                        <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${task.status === 'Assigned' ? 'text-blue-600 bg-blue-50 border-blue-100' : task.status === 'In Progress' ? 'text-indigo-600 bg-indigo-50 border-indigo-100' : 'text-emerald-600 bg-emerald-50 border-emerald-100'}`}>
                                            <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse"></div>
                                            {task.status}
                                        </span>
                                        <span className={`inline-block px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${getPriorityBadge(task.priority)}`}>{task.priority}</span>
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-slate-900 capitalize group-hover:text-blue-600 transition-colors leading-tight mb-2">{task.category} Restoration</h3>
                                        <p className="text-slate-500 font-medium italic line-clamp-2 leading-relaxed">"{task.description}"</p>
                                    </div>
                                    <div className="flex items-center gap-5 pt-2 flex-wrap">
                                        <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                                            <MapPin className="w-4 h-4 text-rose-500" />
                                            {task.location.address}
                                        </div>
                                        {task.citizenId && (
                                            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                                                <User className="w-3.5 h-3.5" />
                                                {task.citizenId.name}
                                            </div>
                                        )}
                                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-300">
                                            <Calendar className="w-3.5 h-3.5" />
                                            {new Date(task.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                        </div>
                                    </div>
                                </div>

                                <div className="self-end md:self-center">
                                    <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-blue-600 group-hover:text-white group-hover:rotate-12 transition-all shadow-sm">
                                        <ChevronRight className="w-6 h-6" />
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal */}
            <AnimatePresence>
                {selectedTask && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedTask(null)}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-xl"></motion.div>
                        <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="bg-white w-full max-w-3xl rounded-[3rem] shadow-2xl relative z-10 overflow-hidden max-h-[90vh] overflow-y-auto custom-scrollbar">

                            <div className="relative h-72 bg-slate-100 border-b-8 border-white overflow-hidden group/img">
                                {selectedTask.imageBefore && <img src={`${API_BASE_URL}${selectedTask.imageBefore}`} alt="Repair site" className="w-full h-full object-cover group-hover/img:scale-110 transition-transform duration-1000" />}
                                <button onClick={() => setSelectedTask(null)} className="absolute top-6 right-6 w-12 h-12 bg-white rounded-2xl shadow-xl flex items-center justify-center text-slate-900 hover:rotate-90 transition-all duration-300"><X className="w-6 h-6" /></button>
                                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                                <div className="absolute bottom-6 left-8 px-5 py-2 bg-white/20 backdrop-blur-md border border-white/30 rounded-2xl text-xs font-black text-white uppercase tracking-widest shadow-lg">Original Incident Report</div>
                            </div>

                            <div className="p-8 sm:p-12 space-y-10">
                                <div>
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
                                        <h3 className="text-3xl font-black text-slate-900 tracking-tight capitalize leading-none">{selectedTask.category} Repair Workflow</h3>
                                    </div>
                                    <p className="text-slate-500 font-medium italic text-lg leading-relaxed">"{selectedTask.description}"</p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Field Coordinates</p>
                                        <div className="flex items-start gap-3">
                                            <MapPin className="w-5 h-5 text-rose-500 shrink-0" />
                                            <p className="text-sm font-bold text-slate-800 leading-tight">{selectedTask.location.address}</p>
                                        </div>
                                    </div>
                                    <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 flex items-center justify-between">
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Operational State</p>
                                            <p className="text-lg font-black text-blue-600 uppercase tracking-tighter italic">{selectedTask.status}</p>
                                        </div>
                                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm"><PlayCircle className="w-6 h-6 text-blue-400" /></div>
                                    </div>
                                </div>

                                {/* Citizen Info */}
                                {selectedTask.citizenId && (
                                    <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 flex items-center gap-4">
                                        <div className="w-12 h-12 bg-slate-200 rounded-2xl flex items-center justify-center text-slate-500"><User className="w-6 h-6" /></div>
                                        <div className="flex-grow">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Citizen Reporter</p>
                                            <p className="text-sm font-black text-slate-900">{selectedTask.citizenId.name}</p>
                                        </div>
                                        {selectedTask.citizenId.mobile && (
                                            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-slate-100">
                                                <Phone className="w-4 h-4 text-slate-400" />
                                                <span className="text-xs font-bold text-slate-600">{selectedTask.citizenId.mobile}</span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Priority Badge */}
                                <div className="flex items-center gap-3">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Priority:</span>
                                    <span className={`inline-block px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider border ${getPriorityBadge(selectedTask.priority)}`}>{selectedTask.priority}</span>
                                </div>

                                {selectedTask.status === 'Assigned' && (
                                    <button disabled={updating} onClick={() => handleUpdateStatus('In Progress')}
                                        className="w-full group bg-slate-900 text-white p-6 rounded-3xl font-black text-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-4 shadow-2xl shadow-slate-200 active:scale-95">
                                        INITIATE REPAIR PROTOCOL <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
                                    </button>
                                )}

                                {selectedTask.status === 'In Progress' && (
                                    <div className="space-y-10">
                                        <div className="pt-8 border-t border-slate-100">
                                            <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-3 italic">
                                                <Camera className="w-5 h-5 text-blue-600" />Visual Evidence Upload
                                            </h4>
                                            <div onClick={() => document.getElementById('image-after').click()}
                                                className="relative h-64 rounded-[2.5rem] border-4 border-dashed border-slate-100 bg-slate-50 flex flex-col items-center justify-center cursor-pointer hover:border-blue-200 hover:bg-blue-50/30 transition-all overflow-hidden group/upload">
                                                {imageAfter ? (
                                                    <img src={URL.createObjectURL(imageAfter)} alt="Proof" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="text-center p-8">
                                                        <div className="w-16 h-16 bg-white rounded-3xl shadow-sm flex items-center justify-center mx-auto mb-4 group-hover/upload:scale-110 group-hover/upload:rotate-12 transition-all"><Upload className="w-8 h-8 text-blue-400" /></div>
                                                        <p className="text-sm font-black text-slate-900 uppercase">Upload Resolution Proof</p>
                                                        <p className="text-xs text-slate-400 font-bold tracking-tighter mt-1 italic">Click to select high-res photo</p>
                                                    </div>
                                                )}
                                                <input id="image-after" type="file" accept="image/*" className="hidden" onChange={(e) => setImageAfter(e.target.files[0])} />
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest italic ml-1">Field Observer Remarks</label>
                                            <textarea placeholder="Document specific restoration details here..."
                                                className="w-full px-8 py-6 rounded-3xl bg-slate-50 border border-slate-100 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 focus:bg-white transition-all font-bold text-slate-900 placeholder:text-slate-300 italic"
                                                rows="4" value={remarks} onChange={(e) => setRemarks(e.target.value)} />
                                        </div>
                                        <button disabled={updating || !imageAfter} onClick={() => handleUpdateStatus('Completed')}
                                            className="w-full bg-blue-600 text-white p-6 rounded-3xl font-black text-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-4 shadow-xl shadow-blue-100 disabled:opacity-50 disabled:grayscale disabled:scale-95 active:scale-95">
                                            <CheckCircle className="w-7 h-7" /> SUBMIT FOR VERIFICATION
                                        </button>
                                    </div>
                                )}

                                {selectedTask.status === 'Completed' && (
                                    <div className="p-8 bg-blue-50/50 rounded-[2.5rem] border border-blue-100 flex items-start gap-5 shadow-inner">
                                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shrink-0 shadow-sm border border-blue-100"><AlertCircle className="w-6 h-6 text-blue-500" /></div>
                                        <div className="space-y-1">
                                            <p className="text-sm font-black text-blue-900 uppercase tracking-tight">Review Protocol Initiated</p>
                                            <p className="text-sm text-blue-700 font-medium italic leading-relaxed">Your report has been submitted to the Command Center. Resolution status will be updated upon municipal admin verification.</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default EmployeeDashboard;
