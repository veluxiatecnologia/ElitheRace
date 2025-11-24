import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';

const Navbar = () => {
    const { user, logout } = useAuth();
    const { profile } = useProfile();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const displayName = profile?.nome || user?.user_metadata?.nome || user?.email || '';

    return (
        <nav style={{ background: 'var(--color-carbon-light)', padding: '1rem 0', borderBottom: '1px solid #333' }}>
            <div className="container flex justify-between items-center">
                <Link to="/" style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white' }}>
                    ELITHE <span className="text-gold">RACING</span>
                </Link>
                <div className="flex gap-2 items-center">
                    {user ? (
                        <>
                            <Link to="/profile" style={{ marginRight: '10px', color: '#888', textDecoration: 'none' }} className="hover:text-gold">
                                Olá, {displayName}
                            </Link>
                            {user.user_metadata?.role === 'admin' && <Link to="/admin" className="btn" style={{ background: 'var(--color-gold)', color: 'black', marginRight: '10px' }}>Admin</Link>}
                            <button onClick={handleLogout} className="btn btn-danger" style={{ fontSize: '0.8rem', padding: '5px 10px' }}>Sair</button>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className="btn">Entrar</Link>
                            <Link to="/register" className="btn btn-primary">Cadastrar</Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
