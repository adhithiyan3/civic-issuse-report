import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Navigation, Loader2, Search, CheckCircle2, X, Crosshair, RotateCcw, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import 'leaflet/dist/leaflet.css';

// Fix default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom animated marker
const selectedIcon = new L.DivIcon({
    html: `<div style="position:relative;">
        <div style="width:40px;height:40px;background:linear-gradient(135deg,#2563eb,#7c3aed);border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 4px 14px rgba(37,99,235,0.4);display:flex;align-items:center;justify-content:center;">
            <svg style="transform:rotate(45deg);" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
        </div>
        <div style="width:12px;height:12px;background:rgba(37,99,235,0.2);border-radius:50%;position:absolute;bottom:-8px;left:14px;animation:pulse-ring 1.5s infinite;"></div>
    </div>`,
    className: '',
    iconSize: [40, 48],
    iconAnchor: [20, 48],
});

// Click handler
const MapClickHandler = ({ onLocationSelect }) => {
    useMapEvents({ click: (e) => onLocationSelect(e.latlng.lat, e.latlng.lng) });
    return null;
};

// Fly & zoom
const FlyToLocation = ({ position, zoom }) => {
    const map = useMap();
    useEffect(() => {
        if (position) map.flyTo(position, zoom || 17, { duration: 1.2 });
    }, [position, zoom, map]);
    return null;
};

// Reverse geocode
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
                address: data.display_name || '',
                landmark: a.building || a.amenity || a.shop || a.tourism || a.road || '',
                area: a.suburb || a.village || a.town || a.city_district || a.neighbourhood || '',
                city: a.city || a.town || a.village || a.county || '',
                pincode: a.postcode || '',
                ward: a.ward || '',
                lat, lng,
            };
        }
    } catch { /* fallback */ }
    return { address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`, landmark: '', area: '', city: '', pincode: '', ward: '', lat, lng };
};

// Debounce hook
const useDebounce = (value, delay) => {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const t = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(t);
    }, [value, delay]);
    return debounced;
};

const LocationPicker = ({ onChange, t }) => {
    const [position, setPosition] = useState(null);
    const [locationData, setLocationData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [gpsLoading, setGpsLoading] = useState(false);
    const [confirmed, setConfirmed] = useState(false);

    // Search state
    const [searchQuery, setSearchQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const searchRef = useRef(null);

    const defaultCenter = [11.0168, 76.9558];

    // Debounced search for suggestions
    const debouncedQuery = useDebounce(searchQuery, 400);

    useEffect(() => {
        if (debouncedQuery.trim().length < 3) {
            setSuggestions([]);
            return;
        }
        let cancelled = false;
        const fetchSuggestions = async () => {
            setSearchLoading(true);
            try {
                const res = await fetch(
                    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(debouncedQuery)}&limit=5&addressdetails=1&countrycodes=in`,
                    { headers: { 'Accept-Language': 'en' } }
                );
                const data = await res.json();
                if (!cancelled) {
                    setSuggestions(data || []);
                    setShowSuggestions(true);
                }
            } catch { /* silent */ }
            if (!cancelled) setSearchLoading(false);
        };
        fetchSuggestions();
        return () => { cancelled = true; };
    }, [debouncedQuery]);

    // Close suggestions on outside click
    useEffect(() => {
        const handle = (e) => {
            if (searchRef.current && !searchRef.current.contains(e.target)) setShowSuggestions(false);
        };
        document.addEventListener('mousedown', handle);
        return () => document.removeEventListener('mousedown', handle);
    }, []);

    const handleLocationSelect = useCallback(async (lat, lng) => {
        setPosition([lat, lng]);
        setLoading(true);
        setConfirmed(false);
        try {
            const data = await reverseGeocode(lat, lng);
            setLocationData(data);
        } finally {
            setLoading(false);
        }
    }, []);

    const handleConfirmLocation = () => {
        if (locationData && onChange) {
            onChange(locationData);
            setConfirmed(true);
        }
    };

    const handleUseMyLocation = () => {
        if (!navigator.geolocation) return alert('Geolocation is not supported by your browser');
        setGpsLoading(true);
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                await handleLocationSelect(pos.coords.latitude, pos.coords.longitude);
                setGpsLoading(false);
            },
            () => {
                alert('Unable to get your location. Please allow location access.');
                setGpsLoading(false);
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    const handleSuggestionClick = async (item) => {
        setSearchQuery(item.display_name?.split(',').slice(0, 2).join(',') || '');
        setShowSuggestions(false);
        await handleLocationSelect(parseFloat(item.lat), parseFloat(item.lon));
    };

    const handleReset = () => {
        setPosition(null);
        setLocationData(null);
        setConfirmed(false);
        setSearchQuery('');
    };

    const label = (key, fallback) => t ? t(key) : fallback;

    return (
        <div className="space-y-5">
            {/* Search Bar with Suggestions */}
            <div ref={searchRef} className="relative">
                <div className="relative">
                    <Search className="w-5 h-5 absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                        type="text"
                        placeholder={label('complaint.search_location', 'Search for a location, landmark, or pincode...')}
                        value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); setShowSuggestions(true); }}
                        onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                        className="w-full pl-14 pr-16 py-4 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:bg-white outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-200 transition-all font-bold text-slate-900 placeholder:text-slate-300"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        {searchLoading && <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />}
                        {searchQuery && !searchLoading && (
                            <button type="button" onClick={() => { setSearchQuery(''); setSuggestions([]); }} className="p-1 hover:bg-slate-100 rounded-lg transition-colors">
                                <X className="w-4 h-4 text-slate-400" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Suggestions Dropdown */}
                <AnimatePresence>
                    {showSuggestions && suggestions.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            className="absolute top-full left-0 right-0 z-50 mt-2 bg-white rounded-2xl border border-slate-100 shadow-2xl shadow-slate-200/60 overflow-hidden max-h-72 overflow-y-auto"
                        >
                            {suggestions.map((item, idx) => (
                                <button
                                    key={idx}
                                    type="button"
                                    onClick={() => handleSuggestionClick(item)}
                                    className="w-full text-left px-5 py-3.5 hover:bg-blue-50 transition-colors flex items-start gap-3 border-b border-slate-50 last:border-b-0 group"
                                >
                                    <MapPin className="w-4 h-4 text-rose-400 mt-0.5 shrink-0 group-hover:text-rose-500" />
                                    <div className="flex-grow min-w-0">
                                        <p className="text-sm font-bold text-slate-800 truncate group-hover:text-blue-600">
                                            {item.display_name?.split(',').slice(0, 2).join(',')}
                                        </p>
                                        <p className="text-[11px] text-slate-400 truncate mt-0.5">{item.display_name}</p>
                                    </div>
                                    {item.address?.postcode && (
                                        <span className="shrink-0 bg-blue-50 text-blue-600 px-2 py-0.5 rounded text-[10px] font-black mt-0.5">{item.address.postcode}</span>
                                    )}
                                </button>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Action Buttons Row */}
            <div className="flex flex-wrap items-center gap-2">
                <button
                    type="button"
                    onClick={handleUseMyLocation}
                    disabled={gpsLoading}
                    className="flex items-center gap-2 px-5 py-3 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-black uppercase tracking-wider border border-emerald-100 hover:bg-emerald-100 transition-all active:scale-95 disabled:opacity-50"
                >
                    {gpsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Crosshair className="w-4 h-4" />}
                    {gpsLoading ? label('complaint.detecting_location', 'Detecting...') : label('complaint.use_my_location', 'Use My Location')}
                </button>

                {position && (
                    <button
                        type="button"
                        onClick={handleReset}
                        className="flex items-center gap-2 px-4 py-3 bg-slate-50 text-slate-500 rounded-xl text-xs font-black uppercase tracking-wider border border-slate-200 hover:bg-slate-100 transition-all active:scale-95"
                    >
                        <RotateCcw className="w-4 h-4" />
                        Reset
                    </button>
                )}
            </div>

            {/* Map Container */}
            <div className="relative rounded-3xl overflow-hidden border-2 border-slate-100 shadow-lg" style={{ height: '380px' }}>
                <MapContainer
                    center={defaultCenter}
                    zoom={13}
                    style={{ height: '100%', width: '100%' }}
                    className="z-0"
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <MapClickHandler onLocationSelect={handleLocationSelect} />
                    {position && (
                        <>
                            <Marker
                                position={position}
                                icon={selectedIcon}
                                draggable={true}
                                eventHandlers={{
                                    dragend: (e) => {
                                        const { lat, lng } = e.target.getLatLng();
                                        handleLocationSelect(lat, lng);
                                    },
                                }}
                            />
                            <FlyToLocation position={position} zoom={17} />
                        </>
                    )}
                </MapContainer>

                {/* Loading overlay */}
                <AnimatePresence>
                    {loading && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center z-[1000]"
                        >
                            <div className="flex items-center gap-3 bg-white px-6 py-3 rounded-2xl shadow-lg border border-slate-100">
                                <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                                <span className="text-sm font-bold text-slate-700">Resolving address...</span>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Click hint */}
                {!position && !loading && (
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-white/95 backdrop-blur-md px-6 py-3 rounded-2xl shadow-lg border border-slate-100">
                        <p className="text-xs font-black text-slate-600 uppercase tracking-wider flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-rose-500 animate-bounce" />
                            {label('complaint.click_map', 'Click on the map to select location')}
                        </p>
                    </div>
                )}

                {/* Drag hint */}
                {position && !loading && !confirmed && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1000] bg-slate-900/80 backdrop-blur-md px-5 py-2.5 rounded-2xl shadow-lg">
                        <p className="text-[10px] font-bold text-white uppercase tracking-wider">
                            ✋ Drag the marker to adjust • Click map to reposition
                        </p>
                    </div>
                )}

                {/* GPS button */}
                <button
                    type="button"
                    onClick={handleUseMyLocation}
                    disabled={gpsLoading}
                    className="absolute top-4 right-4 z-[1000] bg-white p-3 rounded-2xl shadow-xl border border-slate-100 hover:bg-blue-50 hover:border-blue-200 transition-all active:scale-95 disabled:opacity-50 group"
                    title={label('complaint.use_my_location', 'Use my location')}
                >
                    {gpsLoading ? (
                        <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                    ) : (
                        <Navigation className="w-5 h-5 text-blue-600 group-hover:text-blue-700" />
                    )}
                </button>
            </div>

            {/* Resolved Location Info Card */}
            <AnimatePresence>
                {locationData && (
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 16 }}
                        className={`rounded-3xl border-2 overflow-hidden transition-all ${confirmed
                            ? 'border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50'
                            : 'border-blue-200 bg-gradient-to-r from-blue-50 to-violet-50'}`}
                    >
                        {/* Header */}
                        <div className={`px-6 py-3 flex items-center gap-2 ${confirmed ? 'bg-emerald-100/50' : 'bg-blue-100/50'}`}>
                            {confirmed ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            ) : (
                                <MapPin className="w-4 h-4 text-blue-600" />
                            )}
                            <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${confirmed ? 'text-emerald-700' : 'text-blue-700'}`}>
                                {confirmed ? label('complaint.location_resolved', 'Location Confirmed ✓') : 'Selected Location — Please Confirm'}
                            </span>
                        </div>

                        {/* Location Details Grid */}
                        <div className="p-5 space-y-4">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {locationData.landmark && (
                                    <div className="bg-white/80 backdrop-blur px-4 py-3 rounded-xl border border-white/50">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">🏛️ Landmark</p>
                                        <p className="text-sm font-bold text-slate-800 truncate">{locationData.landmark}</p>
                                    </div>
                                )}
                                {locationData.area && (
                                    <div className="bg-white/80 backdrop-blur px-4 py-3 rounded-xl border border-white/50">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">📍 Area</p>
                                        <p className="text-sm font-bold text-slate-800 truncate">{locationData.area}</p>
                                    </div>
                                )}
                                {locationData.city && (
                                    <div className="bg-white/80 backdrop-blur px-4 py-3 rounded-xl border border-white/50">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">🏙️ City</p>
                                        <p className="text-sm font-bold text-slate-800 truncate">{locationData.city}</p>
                                    </div>
                                )}
                                {locationData.pincode && (
                                    <div className="bg-white/80 backdrop-blur px-4 py-3 rounded-xl border border-white/50">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">📮 Pincode</p>
                                        <p className="text-sm font-bold text-blue-700">{locationData.pincode}</p>
                                    </div>
                                )}
                            </div>

                            {/* Full address */}
                            <p className="text-[11px] text-slate-500 font-medium italic leading-relaxed line-clamp-2">
                                📍 {locationData.address}
                            </p>

                            {/* Confirm / Change buttons */}
                            {!confirmed ? (
                                <div className="flex items-center gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={handleConfirmLocation}
                                        className="flex-grow flex items-center justify-center gap-2 py-3.5 bg-blue-600 text-white rounded-xl font-black uppercase tracking-wider text-xs hover:bg-blue-700 transition-all active:scale-[0.98] shadow-lg shadow-blue-200"
                                    >
                                        <CheckCircle2 className="w-4 h-4" />
                                        Confirm This Location
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleReset}
                                        className="px-4 py-3.5 bg-white text-slate-500 rounded-xl font-black uppercase tracking-wider text-xs border border-slate-200 hover:bg-slate-50 transition-all active:scale-95"
                                    >
                                        Change
                                    </button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-3 pt-2">
                                    <div className="flex-grow flex items-center justify-center gap-2 py-3 bg-emerald-600/10 text-emerald-700 rounded-xl font-black uppercase tracking-wider text-xs border border-emerald-200">
                                        <CheckCircle2 className="w-4 h-4" />
                                        Location Confirmed
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => { setConfirmed(false); }}
                                        className="px-4 py-3 bg-white text-slate-500 rounded-xl font-black uppercase tracking-wider text-xs border border-slate-200 hover:bg-slate-50 transition-all active:scale-95"
                                    >
                                        Edit
                                    </button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Inline CSS for pulse animation */}
            <style>{`
                @keyframes pulse-ring {
                    0% { transform: scale(1); opacity: 0.6; }
                    100% { transform: scale(3); opacity: 0; }
                }
            `}</style>
        </div>
    );
};

export default LocationPicker;
