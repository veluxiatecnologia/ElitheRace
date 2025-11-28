import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';
import Button from './Button';
import './Navbar.css';

const Navbar = () => {
    const { user, logout } = useAuth();
    const { profile } = useProfile();
    const navigate = useNavigate();
    const location = useLocation();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
        setMobileMenuOpen(false);
    };

    const closeMobileMenu = () => {
        setMobileMenuOpen(false);
    };

    const displayName = profile?.nome || user?.user_metadata?.nome || user?.email || '';

    // Verifica se está nas páginas de autenticação
    const isAuthPage = ['/login', '/register', '/forgot-password', '/reset-password'].includes(location.pathname);

    return (
        <>
            <nav className="navbar">
                <div className="container navbar-container">
                    <Link to="/" className="navbar-brand" onClick={closeMobileMenu}>
                        <img
                            src="/assets/elithe-logo.png"
                            alt="Elithe Racing Team"
                            className="navbar-logo"
                        />
                        <span className="navbar-title">
                            ELITHE <span className="text-gold">RACING</span>
                        </span>
                    </Link>

                    {/* Desktop Menu */}
                    <div className="navbar-desktop-menu">
                        {user ? (
                            <>
                                <Link to="/timeline" className="navbar-profile-link" style={{ marginRight: '1rem' }}>
                                    <span>📷</span>
                                    <span>Galeria</span>
                                </Link>

                                <Link to="/profile" className="navbar-profile-link">
                                    <span>👤</span>
                                    <span className="truncate max-w-[150px]">{displayName}</span>
                                </Link>

                                {user.user_metadata?.role === 'admin' && (
                                    <Link to="/admin">
                                        <Button variant="primary">Admin</Button>
                                    </Link>
                                )}

                                <Button variant="danger" onClick={handleLogout}>Sair</Button>
                            </>
                        ) : (
                            !isAuthPage && (
                                <>
                                    <Link to="/login">
                                        <Button variant="secondary">Entrar</Button>
                                    </Link>
                                    <Link to="/register">
                                        <Button variant="primary">Cadastrar</Button>
                                    </Link>
                                </>
                            )
                        )}
                    </div>

                    {/* Mobile Hamburger Button */}
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="navbar-mobile-btn"
                        aria-label="Menu"
                    >
                        ☰
                    </button>
                </div>
            </nav>

            {/* Mobile Menu Overlay */}
            {mobileMenuOpen && (
                <>
                    <div className="mobile-menu-overlay" onClick={closeMobileMenu} />

                    <div className="mobile-menu-panel">
                        <button className="mobile-menu-close" onClick={closeMobileMenu} aria-label="Fechar">
                            ×
                        </button>

                        <div className="mobile-menu-logo">
                            <img src="/assets/elithe-logo.png" alt="Elithe Racing Team" />
                        </div>

                        <div className="mobile-menu-items">
                            {user ? (
                                <>
                                    <div className="mobile-user-info">
                                        <div className="text-xs text-gray-500 mb-1">Logado como</div>
                                        <div className="text-gold font-bold truncate">{displayName}</div>
                                    </div>

                                    <Link to="/" onClick={closeMobileMenu} className="mobile-menu-link">
                                        🏠 Início
                                    </Link>

                                    <Link to="/timeline" onClick={closeMobileMenu} className="mobile-menu-link">
                                        📷 Galeria
                                    </Link>

                                    <Link to="/profile" onClick={closeMobileMenu} className="mobile-menu-link">
                                        👤 Meu Perfil
                                    </Link>

                                    {user.user_metadata?.role === 'admin' && (
                                        <Link to="/admin" onClick={closeMobileMenu} className="mobile-menu-link text-gold">
                                            ⚙️ Painel Admin
                                        </Link>
                                    )}

                                    <div className="mt-4">
                                        <Button variant="danger" fullWidth onClick={handleLogout}>
                                            🚪 Sair
                                        </Button>
                                    </div>
                                </>
                            ) : (
                                !isAuthPage && (
                                    <>
                                        <Link to="/" onClick={closeMobileMenu} className="mobile-menu-link">
                                            🏠 Início
                                        </Link>

                                        <div className="grid gap-3 mt-4">
                                            <Link to="/login" onClick={closeMobileMenu}>
                                                <Button variant="secondary" fullWidth>Entrar</Button>
                                            </Link>
                                            <Link to="/register" onClick={closeMobileMenu}>
                                                <Button variant="primary" fullWidth>Cadastrar</Button>
                                            </Link>
                                        </div>
                                    </>
                                )
                            )}
                        </div>
                    </div>
                </>
            )}
        </>
    );
};

export default Navbar;
