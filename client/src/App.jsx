import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProfileProvider } from './context/ProfileContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import AdminDashboard from './pages/AdminDashboard';
import Analytics from './pages/Analytics';
import Profile from './pages/Profile';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import CheckInScanner from './pages/CheckInScanner';
import Timeline from './pages/Timeline';
import EventGallery from './pages/EventGallery';
import { Toaster } from 'react-hot-toast';

import { SkeletonTheme } from 'react-loading-skeleton';

function App() {
    return (
        <Router>
            <AuthProvider>
                <ProfileProvider>
                    <SkeletonTheme baseColor="#2a2a2a" highlightColor="#3a3a3a">
                        <Navbar />
                        <Toaster position="top-right" reverseOrder={false} />
                        <div style={{ paddingBottom: '50px' }}>
                            <Routes>
                                <Route path="/" element={<Home />} />
                                <Route path="/login" element={<Login />} />
                                <Route path="/register" element={<Register />} />
                                <Route path="/forgot-password" element={<ForgotPassword />} />
                                <Route path="/reset-password" element={<ResetPassword />} />
                                <Route path="/profile" element={<Profile />} />
                                <Route path="/admin" element={<AdminDashboard />} />
                                <Route path="/admin/analytics" element={<Analytics />} />
                                <Route path="/admin/checkin-scanner" element={<CheckInScanner />} />
                                <Route path="/timeline" element={<Timeline />} />
                                <Route path="/gallery/:eventId" element={<EventGallery />} />
                            </Routes>
                        </div>
                        <footer style={{ textAlign: 'center', padding: '20px', color: '#666', fontSize: '0.9rem' }}>
                            "Se é estrada, é lar. Se é Elithe, é família."
                        </footer>
                    </SkeletonTheme>
                </ProfileProvider>
            </AuthProvider>
        </Router>
    );
}

export default App;
