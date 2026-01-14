import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import Button from '../components/Button';
import LoadingSpinner from '../components/LoadingSpinner';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { API_URL } from '../config/api';

const Ranking = () => {
    const { user, session } = useAuth();
    const { theme } = useTheme();
    const navigate = useNavigate();
    const [ranking, setRanking] = useState([]);
    const [medals, setMedals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('leaderboard'); // 'leaderboard' or 'medals'

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const headers = {
                'Authorization': `Bearer ${session.access_token}`
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

    if (loading) return <div className="p-8 flex justify-center"><LoadingSpinner /></div>;

    const getMedalIcon = (rank) => {
        if (rank === 0) return '🥇';
        if (rank === 1) return '🥈';
        if (rank === 2) return '🥉';
        return `#${rank + 1}`;
    };

    const getLevelBadge = (level) => {
        if (level >= 10) return '👑 Lenda';
        if (level >= 5) return '🎖️ Veterano';
        return `Nível ${level}`;
    };

    return (
        <div className="min-h-screen bg-carbon-dark text-white pb-20">
            {/* Header */}
            <div className="p-4 border-b border-glass-border sticky top-0 bg-carbon-dark/95 backdrop-blur z-10 flex items-center justify-between">
                <Button variant="text" onClick={() => navigate('/')} icon="←">
                    Voltar
                </Button>
                <h1 className="text-xl font-oxanium font-bold text-gold uppercase tracking-wider">
                    Ranking Elithe
                </h1>
                <div className="w-10"></div> {/* Spacer */}
            </div>

            {/* Tabs */}
            <div className="flex p-4 gap-2">
                <button
                    onClick={() => setActiveTab('leaderboard')}
                    className={`flex-1 py-3 rounded-xl font-bold transition-all ${activeTab === 'leaderboard' ? 'bg-gold text-black shadow-gold-glow' : 'bg-carbon-lighter text-gray-400'
                        }`}
                >
                    🏆 Ranking
                </button>
                <button
                    onClick={() => setActiveTab('medals')}
                    className={`flex-1 py-3 rounded-xl font-bold transition-all ${activeTab === 'medals' ? 'bg-gold text-black shadow-gold-glow' : 'bg-carbon-lighter text-gray-400'
                        }`}
                >
                    🎖️ Medalhas
                </button>
            </div>

            {/* Content */}
            <div className="px-4 space-y-4">
                {activeTab === 'leaderboard' ? (
                    <div className="space-y-3">
                        {ranking.map((player, index) => (
                            <div
                                key={player.id}
                                className={`flex items-center p-3 rounded-xl border ${player.id === user.id
                                    ? 'bg-gold/10 border-gold shadow-[0_0_15px_rgba(255,215,0,0.2)] transform scale-[1.02]'
                                    : 'bg-carbon-lighter border-glass-border'
                                    }`}
                            >
                                <div className={`w-10 h-10 flex items-center justify-center font-bold text-lg rounded-full shrink-0 mr-3 ${index < 3 ? 'text-2xl shadow-text' : 'text-gray-400 bg-black/30'
                                    }`}>
                                    {getMedalIcon(index)}
                                </div>

                                <div className="relative shrink-0">
                                    <img
                                        src={player.avatar_url || `https://ui-avatars.com/api/?name=${player.nome}&background=random`}
                                        alt={player.nome}
                                        className="w-12 h-12 rounded-full object-cover border-2 border-carbon"
                                    />
                                    <div className="absolute -bottom-1 -right-1 bg-black text-[10px] px-1.5 py-0.5 rounded border border-gray-700 font-bold">
                                        LVL {player.level || 1}
                                    </div>
                                </div>

                                <div className="ml-3 flex-1 min-w-0">
                                    <h3 className={`font-bold truncate ${player.id === user.id ? 'text-gold' : 'text-white'}`}>
                                        {player.nome}
                                    </h3>
                                    <p className="text-xs text-gray-400">
                                        {player.checkins_count || 0} Eventos
                                    </p>
                                </div>

                                <div className="text-right shrink-0">
                                    <div className="text-gold font-oxanium font-bold text-lg">
                                        {player.xp || 0} XP
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-3">
                        {medals.map(medal => (
                            <div key={medal.id} className="bg-carbon-lighter border border-glass-border rounded-xl p-4 flex flex-col items-center text-center">
                                <div className="text-4xl mb-2 filter drop-shadow-md">
                                    {medal.icon_url}
                                </div>
                                <h3 className="font-bold text-gold text-sm mb-1">{medal.name}</h3>
                                <p className="text-xs text-gray-400 leading-tight mb-2 min-h-[2.5em]">
                                    {medal.description}
                                </p>
                                <span className="text-[10px] bg-black/30 px-2 py-1 rounded text-green-400 font-mono">
                                    +{medal.xp_reward} XP
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="h-4"></div>
        </div>
    );
};

export default Ranking;
