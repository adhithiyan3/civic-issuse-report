import React from 'react';
import { Shield } from 'lucide-react';

const Footer = () => {
    return (
        <footer className="py-12 px-6 border-t border-slate-100 bg-white text-center">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-center gap-2 mb-6">
                    <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center shadow-lg shadow-primary-100">
                        <Shield className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xl font-black text-slate-900 uppercase tracking-tighter">
                        Smart<span className="text-primary-600">Civic</span>
                    </span>
                </div>
                <p className="text-slate-400 text-sm font-medium">
                    © {new Date().getFullYear()} Smart Civic Issue Reporting and Management System. All rights reserved.
                </p>
                <div className="mt-4 flex justify-center gap-6 text-xs font-bold text-slate-400 uppercase tracking-widest">
                    <a href="#" className="hover:text-primary-600 transition-colors">Privacy Policy</a>
                    <a href="#" className="hover:text-primary-600 transition-colors">Terms of Service</a>
                    <a href="#" className="hover:text-primary-600 transition-colors">Contact Support</a>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
