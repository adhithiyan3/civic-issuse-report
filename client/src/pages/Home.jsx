import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Shield, MapPin, CheckCircle, Clock, AlertTriangle, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const Home = () => {
    const { t } = useTranslation();

    const features = [
        {
            icon: <MapPin className="w-8 h-8 text-rose-500" />,
            title: t('complaint.easy_reporting', 'Precision Reporting'),
            desc: t('complaint.easy_desc', 'Pinpoint issues instantly with GPS-accurate locations and photographic evidence for faster verification.')
        },
        {
            icon: <Clock className="w-8 h-8 text-primary-500" />,
            title: t('complaint.realtime_tracking', 'Live Progress'),
            desc: t('complaint.tracking_desc', 'Stay informed with real-time status updates and direct access to assigned field employee details.')
        },
        {
            icon: <CheckCircle className="w-8 h-8 text-emerald-500" />,
            title: t('complaint.verified_fixes', 'Guaranteed Quality'),
            desc: t('complaint.verified_desc', 'Every resolution is backed by mandatory before-and-after proof and municipal admin verification.')
        },
    ];

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.2
            }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <div className="flex flex-col bg-white overflow-hidden">
            {/* Hero Section */}
            <section className="relative min-h-[90vh] flex items-center pt-20 pb-16 px-4">
                {/* Modern Background */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary-400/10 rounded-full blur-[120px] animate-blob"></div>
                    <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full blur-[150px] animate-blob animation-delay-2000"></div>
                    <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-purple-400/10 rounded-full blur-[100px] animate-blob animation-delay-4000"></div>
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03]"></div>
                </div>

                <div className="max-w-7xl mx-auto w-full relative z-10">
                    <div className="flex flex-col lg:flex-row items-center gap-16">
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className="lg:w-1/2 text-center lg:text-left"
                        >
                            <span className="inline-block px-4 py-2 rounded-full bg-primary-50 text-primary-600 text-xs font-black uppercase tracking-widest mb-6 shadow-sm border border-primary-100 italic">
                                Smart Governance for Smart Cities
                            </span>
                            <h1 className="text-5xl md:text-7xl font-black text-slate-900 mb-8 leading-[1.1] tracking-tighter">
                                Empowering <br />
                                <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary-600 via-indigo-600 to-violet-600">
                                    Citizens
                                </span> for a Better Tomorrow
                            </h1>
                            <p className="text-xl text-slate-600 mb-10 leading-relaxed max-w-xl mx-auto lg:mx-0 font-medium">
                                Bridge the gap between society and governance. A seamless, transparent platform to report, manage, and resolve civic issues with total accountability.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-5 justify-center lg:justify-start">
                                <Link
                                    to="/report"
                                    className="px-10 py-5 bg-slate-900 text-white rounded-2xl font-black text-lg hover:bg-primary-600 transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-3 active:scale-95 uppercase tracking-widest"
                                >
                                    {t('common.report_issue')}
                                    <ArrowRight className="w-6 h-6" />
                                </Link>
                                <Link
                                    to="/login"
                                    className="px-10 py-5 bg-white text-slate-900 border border-slate-200 rounded-2xl font-black text-lg hover:bg-slate-50 transition-all shadow-sm flex items-center justify-center gap-3 active:scale-95 uppercase tracking-widest"
                                >
                                    Track Status
                                </Link>
                            </div>

                            <div className="mt-12 flex items-center justify-center lg:justify-start gap-8 opacity-60">
                                <div className="text-center">
                                    <p className="text-2xl font-black text-slate-900 leading-none mb-1">5k+</p>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 font-mono italic">Issues Resolved</p>
                                </div>
                                <div className="w-px h-10 bg-slate-200"></div>
                                <div className="text-center">
                                    <p className="text-2xl font-black text-slate-900 leading-none mb-1">12</p>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 font-mono italic">Divisions Active</p>
                                </div>
                                <div className="w-px h-10 bg-slate-200"></div>
                                <div className="text-center">
                                    <p className="text-2xl font-black text-slate-900 leading-none mb-1">98%</p>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 font-mono italic">Satisfaction</p>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className="lg:w-1/2 relative"
                        >
                            <div className="relative rounded-[3rem] overflow-hidden shadow-2xl shadow-primary-200/50 border-[12px] border-white group">
                                <img
                                    src="https://images.unsplash.com/photo-1541888941259-7a9498ba732c?q=80&w=2070&auto=format&fit=crop"
                                    alt="City Infrastructure"
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[2000ms]"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent"></div>

                                {/* Floating Badge */}
                                <div className="absolute bottom-8 left-8 right-8 bg-white/80 backdrop-blur-xl p-6 rounded-[2rem] border border-white/50 shadow-2xl flex items-center gap-5 translate-y-2">
                                    <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center flex-shrink-0 animate-pulse">
                                        <CheckCircle className="w-7 h-7 text-emerald-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-slate-900 uppercase tracking-tight italic">Active Resolution</p>
                                        <p className="text-xs text-slate-500 font-bold">Water leakage repaired in Ward 12 by field agent.</p>
                                    </div>
                                </div>
                            </div>

                            {/* Decorative pieces */}
                            <div className="absolute -top-6 -right-6 w-32 h-32 bg-yellow-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
                            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-32 px-4 bg-slate-50 relative overflow-hidden">
                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="text-center max-w-2xl mx-auto mb-20">
                        <h2 className="text-[10px] font-black text-primary-600 uppercase tracking-[0.4em] mb-4 italic">Core Capabilities</h2>
                        <h3 className="text-4xl md:text-5xl font-black text-slate-900 leading-tight tracking-tighter capitalize">Engineered for Transparency and Efficiency</h3>
                    </div>

                    <motion.div
                        variants={container}
                        initial="hidden"
                        whileInView="show"
                        viewport={{ once: true, margin: "-100px" }}
                        className="grid grid-cols-1 md:grid-cols-3 gap-10"
                    >
                        {features.map((feature, index) => (
                            <motion.div
                                key={index}
                                variants={item}
                                className="bg-white p-12 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group"
                            >
                                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-10 group-hover:bg-primary-600 group-hover:rotate-6 transition-all duration-500">
                                    <div className="group-hover:text-white transition-colors">
                                        {feature.icon}
                                    </div>
                                </div>
                                <h4 className="text-2xl font-black mb-4 text-slate-900 italic capitalize tracking-tight">{feature.title}</h4>
                                <p className="text-slate-500 leading-relaxed text-lg font-medium">{feature.desc}</p>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 px-4">
                <div className="max-w-7xl mx-auto">
                    <div className="bg-gradient-to-r from-primary-600 to-indigo-700 rounded-[4rem] p-12 md:p-24 text-center relative overflow-hidden shadow-2xl shadow-primary-200">
                        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-[100px] -mr-48 -mt-48 animate-blob"></div>
                        <div className="absolute bottom-0 left-0 w-96 h-96 bg-black/20 rounded-full blur-[120px] -ml-48 -mb-48 animate-blob animation-delay-2000"></div>

                        <div className="relative z-10 max-w-3xl mx-auto">
                            <h3 className="text-4xl md:text-6xl font-black text-white mb-8 tracking-tighter leading-none">Ready to make an impact?</h3>
                            <p className="text-primary-100 text-xl mb-12 opacity-90 leading-relaxed font-medium italic">
                                Join thousands of citizens who are actively contributing to the well-being of our city. Your voice matters, and we are listening.
                            </p>
                            <Link
                                to="/report"
                                className="inline-flex px-14 py-6 bg-white text-primary-700 rounded-[2rem] font-black text-xl hover:bg-primary-50 transition-all shadow-xl active:scale-95 uppercase tracking-widest"
                            >
                                Get Started Now
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Home;
