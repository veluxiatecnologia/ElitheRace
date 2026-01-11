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
import Timeline from './pages/Timeline';
import EventGallery from './pages/EventGallery';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import { Toaster } from 'react-hot-toast';

import { SkeletonTheme } from 'react-loading-skeleton';

import OfflineNotice from './components/OfflineNotice';

function App() {
    return (
        <Router>
            <AuthProvider>
                <ProfileProvider>
                    <SkeletonTheme baseColor="#2a2a2a" highlightColor="#3a3a3a">
                        <OfflineNotice />
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
                                <Route path="/terms" element={<Terms />} />
                                <Route path="/privacy" element={<Privacy />} />
                            </Routes>
                        </div>
                        <footer style={{ textAlign: 'center', padding: '20px', color: '#666', fontSize: '0.9rem' }}>
                            <div style={{ marginBottom: '10px' }}>
                                <a
                                    href="https://instagram.com/elitheracingteam"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ color: '#E1306C', textDecoration: 'none', fontSize: '1rem', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                                    aria-label="Instagram"
                                >
                                    <svg
                                        width="24"
                                        height="24"
                                        viewBox="0 0 24 24"
                                        fill="currentColor"
                                        style={{ verticalAlign: 'middle' }}
                                    >
                                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                                    </svg>
                                    Instagram
                                </a>
                            </div>
                            "Se é estrada, é lar. Se é Elithe, é família."
                            <div style={{ marginTop: '10px', fontSize: '0.75rem', color: '#888' }}>
                                © 2025 Veluxia.com.br - Todos os direitos reservados.
                            </div>
                            <div style={{ marginTop: '5px', fontSize: '0.7rem' }}>
                                <a href="/terms" style={{ color: '#666', textDecoration: 'none', marginRight: '10px' }}>Termos de Uso</a>
                                <a href="/privacy" style={{ color: '#666', textDecoration: 'none' }}>Política de Privacidade</a>
                            </div>
                        </footer>
                    </SkeletonTheme>
                </ProfileProvider>
            </AuthProvider>
        </Router>
    );
}

export default App;
