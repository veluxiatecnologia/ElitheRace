import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProfileProvider } from './context/ProfileContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import AdminDashboard from './pages/AdminDashboard';
import Profile from './pages/Profile';

function App() {
    return (
        <Router>
            <AuthProvider>
                <ProfileProvider>
                    <Navbar />
                    <div style={{ paddingBottom: '50px' }}>
                        <Routes>
                            <Route path="/" element={<Home />} />
                            <Route path="/login" element={<Login />} />
                            <Route path="/register" element={<Register />} />
                            <Route path="/profile" element={<Profile />} />
                            <Route path="/admin" element={<AdminDashboard />} />
                        </Routes>
                    </div>
                    <footer style={{ textAlign: 'center', padding: '20px', color: '#666', fontSize: '0.9rem' }}>
                        "Se é estrada, é lar. Se é Elithe, é família."
                    </footer>
                </ProfileProvider>
            </AuthProvider>
        </Router>
    );
}

export default App;
