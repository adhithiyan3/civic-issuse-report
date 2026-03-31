import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { Shield, LogOut, Globe, User as UserIcon, Menu, X, LayoutDashboard } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar = () => {
    const { t, i18n } = useTranslation();
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = React.useState(false);
    const [scrolled, setScrolled] = React.useState(false);

    React.useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const toggleLanguage = () => {
        const newLang = i18n.language === 'en' ? 'ta' : 'en';
        i18n.changeLanguage(newLang);
    };

    const handleLogout = () => {
        logout();
        navigate('/signin');
    };

    return (
        <nav className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 ${scrolled ? 'py-3 bg-white/70 backdrop-blur-xl border-b border-slate-200/50 shadow-sm' : 'py-6 bg-transparent'
            }`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-12">
                    <div className="flex items-center">
                        <Link to="/" className="group flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-200 group-hover:rotate-6 transition-transform">
                                <Shield className="h-6 w-6 text-white" />
                            </div>
                            <div className="flex flex-col">
                                <span className="font-black text-xl leading-none text-slate-900 tracking-tighter">
                                    SMART<span className="text-primary-600">CIVIC</span>
                                </span>
                                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Gov. Platform</span>
                            </div>
                        </Link>
                    </div>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center gap-2">
                        <button
                            onClick={toggleLanguage}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all border ${scrolled
                                ? 'text-slate-600 border-slate-200 hover:bg-slate-50'
                                : 'text-slate-700 border-slate-200/50 bg-white/50 backdrop-blur-sm hover:bg-white'
                                }`}
                        >
                            <Globe className="h-4 w-4" />
                            {i18n.language === 'en' ? 'தமிழ்' : 'English'}
                        </button>

                        <div className="h-6 w-px bg-slate-200 mx-2"></div>

                        {user ? (
                            <div className="flex items-center gap-3">
                                <Link
                                    to="/dashboard"
                                    className="px-4 py-2 rounded-xl text-sm font-bold text-slate-600 hover:text-primary-600 hover:bg-primary-50 transition-all uppercase tracking-wider"
                                >
                                    {t('common.dashboard')}
                                </Link>
                                {user.role === 'admin' && (
                                    <Link
                                        to="/admin"
                                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-slate-600 hover:text-primary-600 hover:bg-primary-50 transition-all uppercase tracking-wider"
                                    >
                                        <LayoutDashboard className="w-4 h-4" />
                                        Admin Panel
                                    </Link>
                                )}
                                <div className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-primary-600 bg-primary-50 rounded-xl border border-primary-100">
                                    <div className="w-6 h-6 bg-primary-600 rounded-lg flex items-center justify-center">
                                        <UserIcon className="h-3 w-3 text-white" />
                                    </div>
                                    <span className="max-w-[120px] truncate">{user.name}</span>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="p-2.5 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all"
                                    title={t('common.logout')}
                                >
                                    <LogOut className="h-5 w-5" />
                                </button>
                            </div>
                        ) : (
                            <Link
                                to="/signin"
                                className="bg-slate-900 text-white px-6 py-2.5 rounded-xl text-sm font-black uppercase tracking-widest hover:bg-primary-600 transition-all shadow-lg active:scale-95"
                            >
                                {t('common.login')}
                            </Link>
                        )}
                    </div>

                    {/* Mobile menu button */}
                    <div className="md:hidden flex items-center gap-3">
                        <button
                            onClick={toggleLanguage}
                            className="p-2 rounded-lg text-slate-600 border border-slate-200"
                        >
                            <Globe className="h-5 w-5" />
                        </button>
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="p-2 rounded-lg bg-slate-900 text-white shadow-lg"
                        >
                            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="md:hidden absolute top-full left-0 right-0 bg-white border-b border-slate-100 shadow-2xl p-4 space-y-3"
                    >
                        {user ? (
                            <>
                                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl mb-4">
                                    <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
                                        <UserIcon className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-900">{user.name}</p>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mt-1">{user.role}</p>
                                    </div>
                                </div>
                                <Link
                                    to="/dashboard"
                                    className="flex items-center gap-3 p-4 rounded-xl text-slate-700 font-bold hover:bg-primary-50 hover:text-primary-600 transition-all"
                                    onClick={() => setIsOpen(false)}
                                >
                                    {t('common.dashboard')}
                                </Link>
                                {user.role === 'admin' && (
                                    <Link
                                        to="/admin"
                                        className="flex items-center gap-3 p-4 rounded-xl text-slate-700 font-bold hover:bg-primary-50 hover:text-primary-600 transition-all"
                                        onClick={() => setIsOpen(false)}
                                    >
                                        <LayoutDashboard className="w-5 h-5" />
                                        Admin Panel
                                    </Link>
                                )}
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center gap-3 p-4 rounded-xl text-rose-600 font-bold hover:bg-rose-50 transition-all"
                                >
                                    <LogOut className="h-5 w-5" />
                                    {t('common.logout')}
                                </button>
                            </>
                        ) : (
                            <Link
                                to="/signin"
                                className="flex items-center justify-center p-5 rounded-2xl bg-slate-900 text-white font-black uppercase tracking-widest hover:bg-primary-600"
                                onClick={() => setIsOpen(false)}
                            >
                                {t('common.login')}
                            </Link>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
};

export default Navbar;
