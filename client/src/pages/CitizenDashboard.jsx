import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import {
    FileText, Clock, CheckCircle2, AlertTriangle,
    MapPin, Calendar, Plus, RefreshCw, User, ArrowRight, Brain, Sparkles,
    ThumbsUp, ThumbsDown, TrendingUp, Navigation, Edit3, Search, Loader2, X, Crosshair
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const issueIcon = (color) => new L.DivIcon({
    html: `<div style="background:${color};width:28px;height:28px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
    </div>`,
    className: '',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
});

const categoryColors = {
    road: '#475569',
    water: '#2563eb',
    electricity: '#f59e0b',
    sanitation: '#10b981',
    others: '#8b5cf6',
};

// Fly map to new center
const MapUpdater = ({ center, zoom }) => {
    const map = useMap();
    useEffect(() => {
        if (center) map.flyTo(center, zoom || 13, { duration: 1.2 });
    }, [center, zoom, map]);
    return null;
};

const StatusTimeline = ({ status }) => {
    const steps = ['Pending', 'Assigned', 'In Progress', 'Completed', 'Resolved'];
    const currentIdx = steps.indexOf(status);
    const isRejected = status === 'Rejected';
    return (
        <div className="flex items-center gap-1 mt-4">
            {steps.map((step, idx) => {
                const isActive = idx <= currentIdx && !isRejected;
                const isCurrent = idx === currentIdx && !isRejected;
                return (
                    <React.Fragment key={step}>
                        <div className="flex flex-col items-center">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-black transition-all ${isActive
                                ? isCurrent ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 scale-110' : 'bg-blue-100 text-blue-600'
                                : 'bg-slate-100 text-slate-300'
                                }`}>{isActive ? '✓' : idx + 1}</div>
                            <span className={`text-[8px] font-bold mt-1 whitespace-nowrap ${isActive ? 'text-blue-600' : 'text-slate-300'}`}>{step}</span>
                        </div>
                        {idx < steps.length - 1 && (
                            <div className={`flex-grow h-0.5 rounded-full mt-[-12px] ${idx < currentIdx && !isRejected ? 'bg-blue-200' : 'bg-slate-100'}`}></div>
                        )}
                    </React.Fragment>
                );
            })}
            {isRejected && (
                <div className="flex flex-col items-center ml-2">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-black bg-red-100 text-red-600">✕</div>
                    <span className="text-[8px] font-bold mt-1 text-red-600">Rejected</span>
                </div>
            )}
        </div>
    );
};

const CitizenDashboard = () => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [votingId, setVotingId] = useState(null);

    // Location state
    const [userLocation, setUserLocation] = useState(null); // { lat, lng, address, pincode, area, city }
    const [locationMode, setLocationMode] = useState('all'); // 'gps', 'manual', 'all'
    const [gpsLoading, setGpsLoading] = useState(false);
    const [showLocationEditor, setShowLocationEditor] = useState(false);
    const [manualInput, setManualInput] = useState('');
    const [searchLoading, setSearchLoading] = useState(false);
    const [mapCenter, setMapCenter] = useState([11.0168, 76.9558]); // Default: Coimbatore

    const fetchComplaints = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/complaints/ranked');
            setComplaints(data);
        } catch (err) {
            console.error('Failed to fetch complaints');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchComplaints(); }, [fetchComplaints]);

    // Reverse geocode a lat/lng
    const reverseGeocode = async (lat, lng) => {
        try {
            const res = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&zoom=18`,
                { headers: { 'Accept-Language': 'en' } }
            );
            const data = await res.json();
            if (data?.address) {
                const a = data.address;
                return {
                    lat, lng,
                    address: data.display_name || '',
                    area: a.suburb || a.village || a.town || a.city_district || '',
                    city: a.city || a.town || a.village || a.county || '',
                    pincode: a.postcode || '',
                };
            }
        } catch { /* fallback below */ }
        return { lat, lng, address: `${lat.toFixed(4)}, ${lng.toFixed(4)}`, area: '', city: '', pincode: '' };
    };

    // GPS location
    const handleUseGPS = () => {
        if (!navigator.geolocation) return;
        setGpsLoading(true);
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const loc = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
                setUserLocation(loc);
                setLocationMode('gps');
                setMapCenter([loc.lat, loc.lng]);
                setShowLocationEditor(false);
                setGpsLoading(false);
            },
            () => {
                setGpsLoading(false);
                alert('Unable to detect location. Please allow GPS access.');
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    // Manual search
    const handleManualSearch = async (e) => {
        e?.preventDefault();
        if (!manualInput.trim()) return;
        setSearchLoading(true);
        try {
            const res = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(manualInput)}&limit=1&addressdetails=1`,
                { headers: { 'Accept-Language': 'en' } }
            );
            const results = await res.json();
            if (results?.length > 0) {
                const r = results[0];
                const loc = await reverseGeocode(parseFloat(r.lat), parseFloat(r.lon));
                setUserLocation(loc);
                setLocationMode('manual');
                setMapCenter([loc.lat, loc.lng]);
                setShowLocationEditor(false);
                setManualInput('');
            } else {
                alert('Location not found. Try a more specific search.');
            }
        } catch { /* silent fail */ }
        setSearchLoading(false);
    };

    // Clear location filter
    const handleClearLocation = () => {
        setUserLocation(null);
        setLocationMode('all');
        setMapCenter([11.0168, 76.9558]);
    };

    // Filter complaints by proximity (within ~10km of user location)
    const filteredComplaints = userLocation
        ? complaints.filter(c => {
            if (!c.location?.lat || !c.location?.lng) return false;
            const dlat = c.location.lat - userLocation.lat;
            const dlng = c.location.lng - userLocation.lng;
            const approxKm = Math.sqrt(dlat * dlat + dlng * dlng) * 111;
            return approxKm <= 10;
        })
        : complaints;

    // Compute map center from complaints if no user location
    useEffect(() => {
        if (!userLocation && complaints.length > 0) {
            const withCoords = complaints.filter(c => c.location?.lat && c.location?.lng);
            if (withCoords.length > 0) {
                const avgLat = withCoords.reduce((s, c) => s + c.location.lat, 0) / withCoords.length;
                const avgLng = withCoords.reduce((s, c) => s + c.location.lng, 0) / withCoords.length;
                setMapCenter([avgLat, avgLng]);
            }
        }
    }, [complaints, userLocation]);

    const handleVote = async (complaintId, vote) => {
        setVotingId(complaintId);
        try {
            const { data } = await api.post(`/complaints/${complaintId}/vote`, { vote });
            setComplaints(prev => prev.map(c =>
                c._id === complaintId
                    ? { ...c, upvotes: data.upvotes, downvotes: data.downvotes, rankingScore: data.rankingScore, _userVote: data.userVote }
                    : c
            ));
        } catch { /* silent */ }
        setVotingId(null);
    };

    const getUserVote = (complaint) => {
        if (complaint._userVote !== undefined) return complaint._userVote;
        const voter = complaint.voters?.find(v => v.userId === user?._id || v.userId?._id === user?._id);
        return voter?.vote || null;
    };

    const getStatusInfo = (status) => {
        switch (status) {
            case 'Pending': return { color: 'text-amber-600 bg-amber-50', border: 'border-amber-100', icon: <Clock className="w-4 h-4" /> };
            case 'Assigned': return { color: 'text-blue-600 bg-blue-50', border: 'border-blue-100', icon: <RefreshCw className="w-4 h-4" /> };
            case 'In Progress': return { color: 'text-indigo-600 bg-indigo-50', border: 'border-indigo-100', icon: <RefreshCw className="w-4 h-4" /> };
            case 'Completed': return { color: 'text-purple-600 bg-purple-50', border: 'border-purple-100', icon: <Calendar className="w-4 h-4" /> };
            case 'Resolved': return { color: 'text-green-600 bg-green-50', border: 'border-green-100', icon: <CheckCircle2 className="w-4 h-4" /> };
            case 'Rejected': return { color: 'text-red-600 bg-red-50', border: 'border-red-100', icon: <AlertTriangle className="w-4 h-4" /> };
            default: return { color: 'text-slate-600 bg-slate-50', border: 'border-slate-100', icon: <FileText className="w-4 h-4" /> };
        }
    };

    const stats = [
        { label: 'Total', count: complaints.length, color: 'text-blue-600', bg: 'bg-blue-50', icon: <FileText className="w-5 h-5" /> },
        { label: 'In Fix', count: complaints.filter(c => ['Assigned', 'In Progress'].includes(c.status)).length, color: 'text-indigo-600', bg: 'bg-indigo-50', icon: <RefreshCw className="w-5 h-5" /> },
        { label: 'Resolved', count: complaints.filter(c => c.status === 'Resolved').length, color: 'text-emerald-600', bg: 'bg-emerald-50', icon: <CheckCircle2 className="w-5 h-5" /> },
    ];

    return (
        <div className="min-h-screen bg-slate-50/50 pt-24 pb-20 px-4 sm:px-6">
            <div className="max-w-7xl mx-auto">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-8">
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">{t('common.dashboard')}</h1>
                        <p className="text-slate-500 font-medium text-lg">Your contribution to a better city starts here.</p>
                    </motion.div>
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                        <Link to="/report" className="inline-flex items-center justify-center gap-3 bg-slate-900 text-white px-8 py-4 rounded-2xl font-black transition-all shadow-xl shadow-slate-200 hover:bg-slate-800 active:scale-95">
                            <Plus className="w-6 h-6 border-2 border-white/20 rounded-lg p-0.5" />
                            {t('complaint.report_new')}
                        </Link>
                    </motion.div>
                </div>

                {/* Location Context Banner + Map */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden"
                >
                    <div className="grid grid-cols-1 lg:grid-cols-5">
                        {/* Location Info Panel */}
                        <div className="lg:col-span-2 p-8 flex flex-col justify-between">
                            <div>
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="p-2 bg-rose-50 rounded-xl">
                                        <MapPin className="w-5 h-5 text-rose-500" />
                                    </div>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{t('complaint.your_location')}</span>
                                </div>

                                {userLocation ? (
                                    <div className="space-y-3">
                                        <h2 className="text-2xl font-black text-slate-900 leading-tight">
                                            {userLocation.area || userLocation.city || 'Selected Location'}
                                        </h2>
                                        {userLocation.city && userLocation.area && (
                                            <p className="text-sm font-bold text-slate-500">{userLocation.city}</p>
                                        )}
                                        {userLocation.pincode && (
                                            <span className="inline-block px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-black border border-blue-100">
                                                PIN: {userLocation.pincode}
                                            </span>
                                        )}
                                        <div className="flex items-center gap-2">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider ${locationMode === 'gps'
                                                ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-violet-50 text-violet-600 border border-violet-100'}`}>
                                                {locationMode === 'gps' ? <Navigation className="w-3 h-3" /> : <Edit3 className="w-3 h-3" />}
                                                {locationMode === 'gps' ? t('complaint.using_gps') : t('complaint.manual_location')}
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-slate-400 italic font-medium leading-relaxed truncate">📍 {userLocation.address}</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <h2 className="text-2xl font-black text-slate-900">All Locations</h2>
                                        <p className="text-sm text-slate-500 font-medium italic">Set your location to see nearby issues</p>
                                    </div>
                                )}
                            </div>

                            {/* Location Action Buttons */}
                            <div className="mt-6 space-y-3">
                                <AnimatePresence>
                                    {showLocationEditor && (
                                        <motion.form
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            onSubmit={handleManualSearch}
                                            className="overflow-hidden"
                                        >
                                            <div className="relative mb-3">
                                                <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                                <input
                                                    type="text"
                                                    placeholder={t('complaint.enter_pincode')}
                                                    value={manualInput}
                                                    onChange={(e) => setManualInput(e.target.value)}
                                                    autoFocus
                                                    className="w-full pl-11 pr-12 py-3.5 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-bold text-slate-900 placeholder:text-slate-300 text-sm"
                                                />
                                                {searchLoading ? (
                                                    <Loader2 className="w-5 h-5 absolute right-4 top-1/2 -translate-y-1/2 text-blue-500 animate-spin" />
                                                ) : (
                                                    <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-blue-50 rounded-lg transition-colors">
                                                        <ArrowRight className="w-4 h-4 text-blue-500" />
                                                    </button>
                                                )}
                                            </div>
                                        </motion.form>
                                    )}
                                </AnimatePresence>

                                <div className="flex flex-wrap gap-2">
                                    <button
                                        onClick={handleUseGPS}
                                        disabled={gpsLoading}
                                        className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-black uppercase tracking-wider border border-emerald-100 hover:bg-emerald-100 transition-all active:scale-95 disabled:opacity-50"
                                    >
                                        {gpsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Crosshair className="w-4 h-4" />}
                                        {gpsLoading ? t('complaint.detecting_location') : t('complaint.using_gps')}
                                    </button>
                                    <button
                                        onClick={() => setShowLocationEditor(!showLocationEditor)}
                                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider border transition-all active:scale-95 ${showLocationEditor
                                            ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200 hover:border-violet-300 hover:text-violet-600'}`}
                                    >
                                        {showLocationEditor ? <X className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                                        {showLocationEditor ? 'Cancel' : t('complaint.change_location')}
                                    </button>
                                    {userLocation && (
                                        <button
                                            onClick={handleClearLocation}
                                            className="flex items-center gap-2 px-4 py-2.5 bg-rose-50 text-rose-600 rounded-xl text-xs font-black uppercase tracking-wider border border-rose-100 hover:bg-rose-100 transition-all active:scale-95"
                                        >
                                            <X className="w-4 h-4" />
                                            {t('complaint.all_issues')}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Interactive Map */}
                        <div className="lg:col-span-3 relative" style={{ minHeight: '320px' }}>
                            <MapContainer
                                center={mapCenter}
                                zoom={13}
                                style={{ height: '100%', width: '100%', minHeight: '320px' }}
                                className="z-0"
                            >
                                <TileLayer
                                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                />
                                <MapUpdater center={mapCenter} zoom={userLocation ? 14 : 13} />

                                {/* User location marker */}
                                {userLocation && (
                                    <Marker position={[userLocation.lat, userLocation.lng]}>
                                        <Popup>
                                            <strong>📍 Your Location</strong><br />
                                            {userLocation.area || userLocation.city}
                                            {userLocation.pincode && <><br />PIN: {userLocation.pincode}</>}
                                        </Popup>
                                    </Marker>
                                )}

                                {/* Complaint markers */}
                                {filteredComplaints.filter(c => c.location?.lat && c.location?.lng).map(c => (
                                    <Marker
                                        key={c._id}
                                        position={[c.location.lat, c.location.lng]}
                                        icon={issueIcon(categoryColors[c.category] || '#64748b')}
                                    >
                                        <Popup>
                                            <div className="text-xs">
                                                <strong className="capitalize">{c.category.replace('_', ' ')}</strong>
                                                <span className={`ml-2 px-1.5 py-0.5 rounded text-[9px] font-bold ${c.priority === 'High' ? 'bg-rose-100 text-rose-600' : c.priority === 'Medium' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                                    {c.priority}
                                                </span>
                                                <p className="mt-1 text-slate-500 line-clamp-2">{c.description}</p>
                                                <p className="mt-1 font-bold text-blue-600">{c.complaintId}</p>
                                            </div>
                                        </Popup>
                                    </Marker>
                                ))}
                            </MapContainer>

                            {/* Complaints count on map */}
                            <div className="absolute bottom-4 left-4 z-[1000] bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl shadow-lg border border-slate-100">
                                <p className="text-[10px] font-black text-slate-600 uppercase tracking-wider">
                                    {userLocation ? t('complaint.nearby_issues') : t('complaint.all_issues')}: {filteredComplaints.length}
                                </p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Stats Row */}
                <div className="grid grid-cols-3 gap-4 mb-8">
                    {stats.map((stat, idx) => (
                        <motion.div key={idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}
                            className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-all group">
                            <div className={`w-11 h-11 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform`}>{stat.icon}</div>
                            <div>
                                <p className="text-2xl font-black text-slate-900 leading-none">{stat.count}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">{stat.label}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Complaints Header */}
                <div className="mb-6 flex items-center justify-between">
                    <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight italic">
                        {userLocation ? t('complaint.nearby_issues') : t('complaint.all_issues')}
                    </h2>
                    <button onClick={fetchComplaints} className="flex items-center gap-2 text-slate-400 font-bold hover:text-blue-600 transition-all text-sm">
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        Sync
                    </button>
                </div>

                {/* Complaint Cards */}
                {loading ? (
                    <div className="bg-white rounded-[2rem] p-20 text-center border border-slate-100 shadow-sm">
                        <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-6"></div>
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-sm italic">Retrieving data...</p>
                    </div>
                ) : filteredComplaints.length === 0 ? (
                    <div className="bg-white rounded-[2.5rem] p-16 text-center border border-slate-100 shadow-sm relative overflow-hidden group">
                        <div className="absolute inset-0 bg-blue-50/30 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="relative z-10">
                            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-8 group-hover:rotate-12 transition-transform">
                                <FileText className="w-12 h-12 text-slate-200" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 mb-4">
                                {userLocation ? 'No nearby issues found' : 'The city is quiet...'}
                            </h3>
                            <p className="text-slate-500 mb-10 max-w-sm mx-auto font-medium">
                                {userLocation
                                    ? 'No civic issues reported near your location. Try a wider area or report a new issue.'
                                    : "You haven't reported any civic issues yet. Be the eyes of your community and start today."}
                            </p>
                            <Link to="/report" className="inline-flex items-center gap-2 text-blue-600 font-black hover:gap-4 transition-all">
                                SUBMIT A REPORT <ArrowRight className="w-5 h-5" />
                            </Link>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {filteredComplaints.map((complaint, idx) => {
                            const status = getStatusInfo(complaint.status);
                            const isClosed = ['Resolved', 'Rejected'].includes(complaint.status);
                            return (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.04 }}
                                    key={complaint._id}
                                    className="bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:border-blue-100 transition-all relative group overflow-hidden"
                                >
                                    {/* Card Image */}
                                    <div className="w-full h-40 bg-slate-50 overflow-hidden relative">
                                        {complaint.imageBefore ? (
                                            <img src={`http://localhost:5000${complaint.imageBefore}`} alt="Issue" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
                                                <FileText className="w-12 h-12 text-slate-200" />
                                            </div>
                                        )}
                                        <div className="absolute top-3 left-3 px-2.5 py-1 bg-white/90 backdrop-blur-md rounded-lg text-[10px] font-black text-slate-900 shadow-sm uppercase">
                                            {complaint.complaintId}
                                        </div>
                                        <div className={`absolute top-3 right-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider ${status.color} border ${status.border} backdrop-blur-md`}>
                                            {status.icon}
                                            {complaint.status}
                                        </div>
                                    </div>

                                    {/* Card Body */}
                                    <div className="p-5 space-y-3">
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-lg font-black text-slate-900 leading-tight capitalize flex-grow">
                                                {complaint.category.replace('_', ' ')}
                                            </h3>
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-[9px] font-black rounded-lg border uppercase shrink-0 ${complaint.priority === 'High' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                                complaint.priority === 'Medium' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                                                <Sparkles className="w-3 h-3" />
                                                {complaint.priority}
                                            </span>
                                        </div>

                                        <p className="text-slate-500 font-medium line-clamp-2 italic leading-relaxed text-sm">"{complaint.description}"</p>

                                        {/* Location */}
                                        <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                                            <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                                            <span className="truncate">{complaint.location?.area || complaint.location?.city || complaint.location?.address || 'Unknown'}</span>
                                            {complaint.location?.pincode && (
                                                <span className="text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded text-[9px] font-black shrink-0">{complaint.location.pincode}</span>
                                            )}
                                        </div>

                                        {complaint.assignedEmployee && (
                                            <div className="flex items-center gap-2 text-xs font-bold text-blue-500 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100">
                                                <User className="w-3.5 h-3.5" />
                                                <span>{complaint.assignedEmployee.name}</span>
                                                {complaint.assignedEmployee.department && <span className="text-blue-400">• {complaint.assignedEmployee.department}</span>}
                                            </div>
                                        )}

                                        {/* AI Analysis */}
                                        {complaint.aiAnalysis && (
                                            <div className="flex items-start gap-2 p-3 bg-violet-50/50 rounded-xl border border-violet-100">
                                                <Brain className="w-3.5 h-3.5 text-violet-400 mt-0.5 shrink-0" />
                                                <p className="text-[11px] text-slate-500 italic leading-relaxed font-medium line-clamp-2">{complaint.aiAnalysis}</p>
                                            </div>
                                        )}

                                        {/* Voting & Ranking */}
                                        <div className={`flex items-center gap-3 pt-3 border-t border-slate-50 ${isClosed ? 'opacity-60' : ''}`}>
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => handleVote(complaint._id, 'up')}
                                                    disabled={isClosed || votingId === complaint._id}
                                                    className={`p-1.5 rounded-lg transition-all ${isClosed ? 'cursor-not-allowed opacity-50' : 'active:scale-90'} ${getUserVote(complaint) === 'up' ? 'bg-emerald-100 text-emerald-600' : isClosed ? 'text-slate-300' : 'hover:bg-emerald-50 text-slate-400 hover:text-emerald-600'}`}
                                                    title={isClosed ? t('complaint.voting_closed') : t('complaint.upvote')}
                                                >
                                                    <ThumbsUp className="w-3.5 h-3.5" />
                                                </button>
                                                <span className="text-xs font-black text-slate-700">{complaint.upvotes || 0}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => handleVote(complaint._id, 'down')}
                                                    disabled={isClosed || votingId === complaint._id}
                                                    className={`p-1.5 rounded-lg transition-all ${isClosed ? 'cursor-not-allowed opacity-50' : 'active:scale-90'} ${getUserVote(complaint) === 'down' ? 'bg-rose-100 text-rose-600' : isClosed ? 'text-slate-300' : 'hover:bg-rose-50 text-slate-400 hover:text-rose-600'}`}
                                                    title={isClosed ? t('complaint.voting_closed') : t('complaint.downvote')}
                                                >
                                                    <ThumbsDown className="w-3.5 h-3.5" />
                                                </button>
                                                <span className="text-xs font-black text-slate-700">{complaint.downvotes || 0}</span>
                                            </div>
                                            {isClosed && (
                                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded">{t('complaint.voting_closed')}</span>
                                            )}
                                            <div className="ml-auto flex items-center gap-1 px-2 py-1 bg-indigo-50 rounded-lg border border-indigo-100">
                                                <TrendingUp className="w-3 h-3 text-indigo-500" />
                                                <span className="text-[9px] font-black text-indigo-600">{complaint.rankingScore?.toFixed(1) || '0.0'}</span>
                                            </div>
                                        </div>

                                        <StatusTimeline status={complaint.status} />
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CitizenDashboard;
