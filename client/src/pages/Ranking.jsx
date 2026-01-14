import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import LoadingSpinner from '../components/LoadingSpinner';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import API_URL from '../config/api';

// Responsive styles
const responsiveStyles = `
    @media (max-width: 640px) {
        .ranking-header h1 {
            font-size: 1rem !important;
        }
        .ranking-player-card {
            padding: 0.5rem !important;
        }
        .ranking-player-card img {
            width: 40px !important;
            height: 40px !important;
        }
        .ranking-player-card .medal-icon {
            width: 32px !important;
            height: 32px !important;
            font-size: 1.25rem !important;
        }
        .ranking-player-card .level-badge {
            font-size: 8px !important;
            padding: 1px 4px !important;
        }
        .ranking-player-card h3 {
            font-size: 0.875rem !important;
        }
        .ranking-player-card .xp-value {
            font-size: 1rem !important;
        }
        .ranking-tabs button {
            padding: 0.5rem !important;
            font-size: 0.875rem !important;
        }
        .medal-card {
            padding: 0.75rem !important;
        }
        .medal-card .medal-icon {
            font-size: 2rem !important;
        }
    }
`;


const Ranking = () => {
    const { user, session } = useAuth();
    const navigate = useNavigate();
    const [ranking, setRanking] = useState([]);
    const [medals, setMedals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('leaderboard');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            if (!session) return;
            const headers = {
                'Authorization': `Bearer ${session?.access_token}`
            };

            const [rankingRes, medalsRes] = await Promise.all([
                fetch(`${API_URL}/api/ranking`, { headers }),
                fetch(`${API_URL}/api/ranking/medals`, { headers })
            ]);

            if (!rankingRes.ok || !medalsRes.ok) throw new Error('Falha ao carregar dados');

            const rankingData = await rankingRes.json();
            const medalsData = await medalsRes.json();

            setRanking(rankingData);
            setMedals(medalsData);
        } catch (error) {
            console.error(error);
            toast.error('Erro ao carregar ranking');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div style={{ padding: '2rem', display: 'flex', justifyContent: 'center' }}><LoadingSpinner /></div>;

    const getMedalIcon = (rank) => {
        if (rank === 0) return '🥇';
        if (rank === 1) return '🥈';
        if (rank === 2) return '🥉';
        return `#${rank + 1}`;
    };

    return (
        <>
            <style>{responsiveStyles}</style>
            <div style={{ minHeight: '100vh', background: 'var(--carbon-dark)', color: 'white', paddingBottom: '5rem' }}>
                {/* Header */}
                <div className="ranking-header" style={{
                    padding: '1rem',
                    borderBottom: '1px solid var(--glass-border)',
                    position: 'sticky',
                    top: 0,
                    background: 'rgba(17, 17, 17, 0.95)',
                    backdropFilter: 'blur(10px)',
                    zIndex: 10,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <Button variant="text" onClick={() => navigate('/')} icon="←">
                        Voltar
                    </Button>
                    <h1 style={{
                        fontSize: '1.25rem',
                        fontWeight: 'bold',
                        color: 'var(--gold)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em'
                    }}>
                        Ranking Elithe
                    </h1>
                    <div style={{ width: '40px' }}></div>
                </div>

                {/* Tabs */}
                <div className="ranking-tabs" style={{ display: 'flex', padding: '1rem', gap: '0.5rem' }}>
                    <button
                        onClick={() => setActiveTab('leaderboard')}
                        style={{
                            flex: 1,
                            padding: '0.75rem',
                            borderRadius: '12px',
                            fontWeight: 'bold',
                            transition: 'all 0.2s',
                            background: activeTab === 'leaderboard' ? 'var(--gold)' : 'var(--carbon-lighter)',
                            color: activeTab === 'leaderboard' ? 'black' : 'var(--text-muted)',
                            border: 'none',
                            cursor: 'pointer',
                            boxShadow: activeTab === 'leaderboard' ? '0 0 20px rgba(212,175,55,0.4)' : 'none'
                        }}
                    >
                        🏆 Ranking
                    </button>
                    <button
                        onClick={() => setActiveTab('medals')}
                        style={{
                            flex: 1,
                            padding: '0.75rem',
                            borderRadius: '12px',
                            fontWeight: 'bold',
                            transition: 'all 0.2s',
                            background: activeTab === 'medals' ? 'var(--gold)' : 'var(--carbon-lighter)',
                            color: activeTab === 'medals' ? 'black' : 'var(--text-muted)',
                            border: 'none',
                            cursor: 'pointer',
                            boxShadow: activeTab === 'medals' ? '0 0 20px rgba(212,175,55,0.4)' : 'none'
                        }}
                    >
                        🎖️ Medalhas
                    </button>
                </div>

                {/* Content */}
                <div style={{ padding: '0 1rem' }}>
                    {activeTab === 'leaderboard' ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {ranking.map((player, index) => (
                                <div
                                    key={player.id}
                                    className="ranking-player-card"
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        padding: '0.75rem',
                                        borderRadius: '12px',
                                        border: player.id === user.id ? '1px solid var(--gold)' : '1px solid var(--glass-border)',
                                        background: player.id === user.id ? 'rgba(212,175,55,0.1)' : 'var(--carbon-lighter)',
                                        boxShadow: player.id === user.id ? '0 0 15px rgba(212,175,55,0.2)' : 'none',
                                        transform: player.id === user.id ? 'scale(1.02)' : 'scale(1)'
                                    }}
                                >
                                    <div className="medal-icon" style={{
                                        width: '40px',
                                        height: '40px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontWeight: 'bold',
                                        fontSize: index < 3 ? '1.5rem' : '1rem',
                                        borderRadius: '50%',
                                        flexShrink: 0,
                                        marginRight: '0.75rem',
                                        background: index >= 3 ? 'rgba(0,0,0,0.3)' : 'transparent',
                                        color: index >= 3 ? 'var(--text-muted)' : 'inherit'
                                    }}>
                                        {getMedalIcon(index)}
                                    </div>

                                    <div style={{ position: 'relative', flexShrink: 0 }}>
                                        <img
                                            src={player.avatar_url || `https://ui-avatars.com/api/?name=${player.nome}&background=random`}
                                            alt={player.nome}
                                            style={{
                                                width: '48px',
                                                height: '48px',
                                                borderRadius: '50%',
                                                objectFit: 'cover',
                                                border: '2px solid var(--carbon)'
                                            }}
                                        />
                                        <div className="level-badge" style={{
                                            position: 'absolute',
                                            bottom: '-4px',
                                            right: '-4px',
                                            background: 'black',
                                            fontSize: '10px',
                                            padding: '2px 6px',
                                            borderRadius: '4px',
                                            border: '1px solid var(--glass-border)',
                                            fontWeight: 'bold'
                                        }}>
                                            LVL {player.level || 1}
                                        </div>
                                    </div>

                                    <div style={{ marginLeft: '0.75rem', flex: 1, minWidth: 0 }}>
                                        <h3 style={{
                                            fontWeight: 'bold',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                            color: player.id === user.id ? 'var(--gold)' : 'white'
                                        }}>
                                            {player.nome}
                                        </h3>
                                        <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                            {player.checkins_count || 0} Eventos
                                        </p>
                                    </div>

                                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                        <div className="xp-value" style={{
                                            color: 'var(--gold)',
                                            fontWeight: 'bold',
                                            fontSize: '1.125rem'
                                        }}>
                                            {player.xp || 0} XP
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(2, 1fr)',
                            gap: '0.75rem'
                        }}>
                            {medals.map(medal => (
                                <div key={medal.id} className="medal-card" style={{
                                    background: 'var(--carbon-lighter)',
                                    border: '1px solid var(--glass-border)',
                                    borderRadius: '12px',
                                    padding: '1rem',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    textAlign: 'center'
                                }}>
                                    <div className="medal-icon" style={{
                                        fontSize: '2.5rem',
                                        marginBottom: '0.5rem',
                                        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))'
                                    }}>
                                        {medal.icon_url}
                                    </div>
                                    <h3 style={{
                                        fontWeight: 'bold',
                                        color: 'var(--gold)',
                                        fontSize: '0.875rem',
                                        marginBottom: '0.25rem'
                                    }}>
                                        {medal.name}
                                    </h3>
                                    <p style={{
                                        fontSize: '12px',
                                        color: 'var(--text-muted)',
                                        lineHeight: '1.3',
                                        marginBottom: '0.5rem',
                                        minHeight: '2.5em'
                                    }}>
                                        {medal.description}
                                    </p>
                                    <span style={{
                                        fontSize: '10px',
                                        background: 'rgba(0,0,0,0.3)',
                                        padding: '4px 8px',
                                        borderRadius: '4px',
                                        color: '#4ade80',
                                        fontFamily: 'monospace'
                                    }}>
                                        +{medal.xp_reward} XP
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div style={{ height: '1rem' }}></div>
            </div>
        </>
    );
};

export default Ranking;
