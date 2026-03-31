import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import { Camera, MapPin, Send, AlertCircle, CheckCircle2, ChevronRight, Image as ImageIcon, Info, ArrowRight, Shield, Zap, Droplets, Lightbulb, Trash2, Package, Brain, Sparkles, Building2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import LocationPicker from '../components/LocationPicker';

const ReportIssue = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        category: '',
        description: '',
        location: { address: '', area: '', ward: '', lat: null, lng: null, pincode: '', landmark: '', city: '' },
    });
    const [image, setImage] = useState(null);
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [aiResult, setAiResult] = useState(null);

    const categories = [
        { id: 'road', label: t('complaint.road'), icon: <Zap className="w-5 h-5" />, color: 'bg-slate-100 text-slate-700 hover:bg-slate-900 hover:text-white', active: 'bg-slate-900 text-white border-slate-900 shadow-xl' },
        { id: 'water', label: t('complaint.water'), icon: <Droplets className="w-5 h-5" />, color: 'bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white', active: 'bg-blue-600 text-white border-blue-600 shadow-xl shadow-blue-100' },
        { id: 'electricity', label: t('complaint.electricity'), icon: <Lightbulb className="w-5 h-5" />, color: 'bg-amber-50 text-amber-700 hover:bg-amber-500 hover:text-white', active: 'bg-amber-500 text-white border-amber-500 shadow-xl shadow-amber-100' },
        { id: 'sanitation', label: t('complaint.sanitation'), icon: <Trash2 className="w-5 h-5" />, color: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white', active: 'bg-emerald-600 text-white border-emerald-600 shadow-xl shadow-emerald-100' },
        { id: 'others', label: t('complaint.others'), icon: <Package className="w-5 h-5" />, color: 'bg-purple-50 text-purple-700 hover:bg-purple-600 hover:text-white', active: 'bg-purple-600 text-white border-purple-600 shadow-xl shadow-purple-100' },
    ];

    const priorityStyles = {
        High: 'bg-rose-600 text-white',
        Medium: 'bg-amber-500 text-white',
        Low: 'bg-emerald-600 text-white',
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                setError('Image size should be less than 5MB');
                return;
            }
            setImage(file);
            setPreview(URL.createObjectURL(file));
            setError('');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.category || !formData.description || !formData.location.lat) {
            setError('Please fill in all mandatory fields and select a location on the map');
            return;
        }

        setLoading(true);
        setError('');

        const data = new FormData();
        data.append('category', formData.category);
        data.append('description', formData.description);
        data.append('location', JSON.stringify(formData.location));
        if (image) data.append('image', image);

        try {
            const response = await api.post('/complaints', data);
            setAiResult({
                priority: response.data.priority,
                reason: response.data.aiAnalysis,
                officeName: response.data.assignedOffice?.officeName || null,
            });
            setSuccess(true);
            setTimeout(() => navigate('/dashboard'), 4000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to submit complaint');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="max-w-md w-full bg-white p-12 rounded-[3rem] shadow-2xl border border-slate-100 text-center"
                >
                    <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                        <CheckCircle2 className="w-12 h-12 text-emerald-600" />
                    </div>
                    <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Report Logged!</h2>

                    {/* AI Priority Result */}
                    {aiResult && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="mb-8 p-6 bg-slate-50 rounded-3xl border border-slate-100"
                        >
                            <div className="flex items-center justify-center gap-2 mb-3">
                                <Sparkles className="w-4 h-4 text-violet-500" />
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{t('complaint.ai_assigned')}</span>
                            </div>
                            <span className={`inline-block px-5 py-2 rounded-2xl text-sm font-black uppercase tracking-wider ${priorityStyles[aiResult.priority] || 'bg-slate-200 text-slate-700'}`}>
                                {aiResult.priority} Priority
                            </span>
                            {aiResult.reason && (
                                <p className="text-xs text-slate-500 mt-4 italic leading-relaxed font-medium px-2">
                                    <Brain className="w-3.5 h-3.5 inline mr-1 text-violet-400" />
                                    {aiResult.reason}
                                </p>
                            )}
                            {aiResult.officeName && (
                                <div className="flex items-center justify-center gap-2 mt-4 pt-3 border-t border-slate-100">
                                    <Building2 className="w-4 h-4 text-blue-500" />
                                    <span className="text-xs font-bold text-blue-700">Routed to: {aiResult.officeName}</span>
                                </div>
                            )}
                        </motion.div>
                    )}

                    <p className="text-slate-500 font-medium italic mb-8 leading-relaxed px-4 text-sm">
                        Our field workforce will be dispatched to verify your report shortly.
                    </p>
                    <div className="flex items-center justify-center gap-3">
                        <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce delay-100"></div>
                        <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce delay-200"></div>
                        <span className="text-xs font-black text-blue-600 uppercase tracking-widest ml-2">Redirecting</span>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50/50 pt-28 pb-20 px-4 sm:px-6 relative overflow-hidden">
            {/* Background Orbs */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-400/5 rounded-full blur-3xl -mr-48 -mt-24 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-400/5 rounded-full blur-3xl -ml-48 -mb-24 pointer-events-none"></div>

            <div className="max-w-4xl mx-auto relative z-10">
                <div className="mb-12">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-3 mb-4"
                    >
                        <div className="p-2 bg-slate-900 rounded-xl shadow-lg shadow-slate-200">
                            <Shield className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Official Submission</span>
                    </motion.div>
                    <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight leading-none">{t('complaint.report_new')}</h1>
                    <p className="text-slate-500 font-medium text-lg mt-4 max-w-xl italic">Documenting civic issues with photographic precision facilitates rapid municipal intervention.</p>
                </div>

                {/* AI Priority Banner */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="mb-10 p-5 bg-gradient-to-r from-violet-50 via-purple-50 to-indigo-50 rounded-3xl border border-violet-100 flex items-center gap-4"
                >
                    <div className="p-3 bg-white rounded-2xl shadow-sm">
                        <Brain className="w-6 h-6 text-violet-500" />
                    </div>
                    <div>
                        <p className="text-sm font-black text-slate-800">{t('complaint.ai_analyzing')}</p>
                        <p className="text-xs text-slate-500 mt-0.5 font-medium italic">Our proprietary Neural Fusion Engine (CNN+RNN) will evaluate your report to automatically determine the priority.</p>
                    </div>
                    <Sparkles className="w-5 h-5 text-violet-400 ml-auto shrink-0" />
                </motion.div>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-5 gap-10">
                    <div className="lg:col-span-3 space-y-10">
                        {/* Section 1: Category */}
                        <motion.section
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-white p-8 sm:p-10 rounded-[2.5rem] border border-slate-100 shadow-sm"
                        >
                            <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-8">
                                <Info className="w-4 h-4 text-blue-500" />
                                {t('complaint.select_category')} *
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                {categories.map((cat) => (
                                    <button
                                        key={cat.id}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, category: cat.id })}
                                        className={`group relative py-4 px-4 rounded-2xl border-2 transition-all text-xs font-black uppercase tracking-tight overflow-hidden flex items-center gap-2 justify-center ${formData.category === cat.id ? cat.active : cat.color + ' border-transparent'
                                            }`}
                                    >
                                        {cat.icon}
                                        <span className="relative z-10">{cat.label}</span>
                                        <div className="absolute inset-0 bg-white/10 translate-x-full group-hover:translate-x-0 transition-transform skew-x-12"></div>
                                    </button>
                                ))}
                            </div>
                        </motion.section>

                        {/* Section 2: Details */}
                        <motion.section
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-white p-8 sm:p-10 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-10"
                        >
                            <div className="space-y-4">
                                <label className="flex items-center justify-between">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Observational Description *</span>
                                    <span className="text-[10px] font-bold text-slate-300 uppercase italic">Detailed context preferred</span>
                                </label>
                                <textarea
                                    required
                                    rows="4"
                                    placeholder="Briefly describe the issue in professional detail..."
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-8 py-6 rounded-3xl bg-slate-50 border border-slate-100 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 focus:bg-white transition-all font-bold text-slate-900 placeholder:text-slate-300 italic"
                                />
                            </div>

                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Visual Evidence Archive</label>
                                <div
                                    onClick={() => document.getElementById('image-upload').click()}
                                    className="relative h-64 rounded-[2.5rem] border-4 border-dashed border-slate-100 bg-slate-50 flex flex-col items-center justify-center cursor-pointer hover:border-blue-200 hover:bg-blue-50/20 transition-all overflow-hidden group/upload"
                                >
                                    <AnimatePresence mode="wait">
                                        {preview ? (
                                            <motion.img
                                                key="preview"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                src={preview}
                                                alt="Preview"
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <motion.div
                                                key="placeholder"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className="text-center p-8"
                                            >
                                                <div className="w-16 h-16 bg-white rounded-3xl shadow-sm flex items-center justify-center mx-auto mb-4 group-hover/upload:scale-110 group-hover/upload:rotate-12 transition-all">
                                                    <Camera className="w-8 h-8 text-blue-400" />
                                                </div>
                                                <p className="text-sm font-black text-slate-900 uppercase">Archive Photo</p>
                                                <p className="text-xs text-slate-400 font-bold tracking-tighter mt-1 italic">Click to capture or upload evidence</p>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                    <input
                                        id="image-upload"
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        className="hidden"
                                    />
                                </div>
                            </div>
                        </motion.section>
                    </div>

                    <div className="lg:col-span-2 space-y-10">
                        {/* Section 3: Location (Map) */}
                        <motion.section
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-white p-8 sm:p-10 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8 sticky top-28"
                        >
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-4">
                                {t('complaint.pick_location') || 'Select Location on Map'} *
                            </label>

                            <LocationPicker
                                t={t}
                                onChange={(locationData) => {
                                    setFormData({
                                        ...formData,
                                        location: {
                                            address: locationData.address,
                                            area: locationData.area,
                                            ward: locationData.ward || '',
                                            lat: locationData.lat,
                                            lng: locationData.lng,
                                            pincode: locationData.pincode,
                                            landmark: locationData.landmark,
                                            city: locationData.city,
                                        }
                                    });
                                }}
                            />

                            {/* Routed Office Display */}
                            {aiResult?.officeName && (
                                <motion.div
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex items-center gap-3 p-4 bg-blue-50 rounded-2xl border border-blue-100"
                                >
                                    <Building2 className="w-5 h-5 text-blue-600 shrink-0" />
                                    <div>
                                        <p className="text-[9px] font-black text-blue-400 uppercase tracking-wider">Routed to Office</p>
                                        <p className="text-sm font-bold text-blue-800">{aiResult.officeName}</p>
                                    </div>
                                </motion.div>
                            )}

                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="flex items-start gap-3 p-5 bg-rose-50 text-rose-700 rounded-2xl border border-rose-100 text-[11px] font-black uppercase italic"
                                >
                                    <AlertCircle className="w-5 h-5 shrink-0" />
                                    {error}
                                </motion.div>
                            )}

                            <div className="pt-6">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full group bg-gradient-to-r from-slate-900 via-slate-800 to-violet-900 text-white p-6 rounded-[2rem] font-black text-lg hover:opacity-90 transition-all flex items-center justify-center gap-4 shadow-xl active:scale-95 disabled:opacity-50"
                                >
                                    {loading ? (
                                        <div className="flex items-center gap-3">
                                            <div className="w-6 h-6 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                                            <span className="text-sm font-bold uppercase tracking-wider animate-pulse">{t('complaint.ai_analyzing')}...</span>
                                        </div>
                                    ) : (
                                        <>
                                            <Sparkles className="w-5 h-5 text-violet-300" />
                                            ANALYZE & SUBMIT
                                            <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
                                        </>
                                    )}
                                </button>
                                <p className="text-[10px] text-center mt-6 text-slate-400 font-bold uppercase tracking-widest leading-loose">
                                    AI will analyze your report to assign the appropriate priority level.
                                </p>
                            </div>
                        </motion.section>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ReportIssue;
