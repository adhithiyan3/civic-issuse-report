import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Home from './pages/Home';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import CitizenDashboard from './pages/CitizenDashboard';
import AdminDashboard from './pages/AdminDashboard';
import EmployeeDashboard from './pages/EmployeeDashboard';
import SuperAdminPanel from './pages/SuperAdminPanel';
import ReportIssue from './pages/ReportIssue';

function App() {
    const { user } = useAuth();

    const getDashboard = () => {
        if (!user) return <Navigate to="/signin" />;
        switch (user.role) {
            case 'admin': return <AdminDashboard />;
            case 'employee': return <EmployeeDashboard />;
            case 'superadmin': return <SuperAdminPanel />;
            default: return <CitizenDashboard />;
        }
    };

    return (
        <Router>
            <div className="min-h-screen bg-slate-50 flex flex-col">
                <Navbar />
                <main className="flex-grow pt-16">
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/signin" element={<SignIn />} />
                        <Route path="/signup" element={<SignUp />} />

                        <Route path="/dashboard" element={
                            <ProtectedRoute>
                                {getDashboard()}
                            </ProtectedRoute>
                        } />

                        <Route path="/admin" element={
                            <ProtectedRoute roles={['admin']}>
                                <AdminDashboard />
                            </ProtectedRoute>
                        } />

                        <Route path="/report" element={
                            <ProtectedRoute roles={['citizen']}>
                                <ReportIssue />
                            </ProtectedRoute>
                        } />

                        {/* Redirect old /login to /signin */}
                        <Route path="/login" element={<Navigate to="/signin" replace />} />
                        <Route path="*" element={<Navigate to="/" />} />
                    </Routes>
                </main>
                <Footer />
            </div>
        </Router>
    );
}

export default App;
