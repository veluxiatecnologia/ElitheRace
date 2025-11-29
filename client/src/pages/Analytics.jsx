import React, { useState, useEffect } from 'react';
import API_URL from '../config/api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';
import LoadingSkeleton from '../components/LoadingSkeleton';
import StatsCard from '../components/StatsCard';
import Top10List from '../components/Top10List';
import BirthdayList from '../components/BirthdayList';
import Button from '../components/Button';
import './Analytics.css';

const Analytics = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    const [stats, setStats] = useState(null);
    const [top10, setTop10] = useState([]);
    const [birthdays, setBirthdays] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                const { data: { session } } = await supabase.auth.getSession();
                const token = session?.access_token;

                if (!token) {
                    throw new Error('Usuário não autenticado');
                }

                const headers = {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                };

                // Fetch all data in parallel
                const [statsRes, top10Res, birthdaysRes] = await Promise.all([
                    fetch(`${API_URL}/api/admin/dashboard/stats`, { headers }),
                    fetch(`${API_URL}/api/admin/dashboard/top10`, { headers }),
                    fetch(`${API_URL}/api/admin/dashboard/birthdays`, { headers })
                ]);

                if (!statsRes.ok || !top10Res.ok || !birthdaysRes.ok) {
                    throw new Error('Falha ao carregar dados do dashboard');
                }

                const statsData = await statsRes.json();
                const top10Data = await top10Res.json();
                const birthdaysData = await birthdaysRes.json();

                setStats(statsData);
                setTop10(top10Data);
                setBirthdays(birthdaysData);
            } catch (err) {
                console.error('Error fetching dashboard data:', err);
                setError(err.message);
                toast.error('Erro ao carregar dados do dashboard');
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchDashboardData();
        }
    }, [user]);

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <LoadingSkeleton count={4} height={40} />
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="bg-red-500/10 border border-red-500 rounded-lg p-6 text-center">
                    <h3 className="text-red-500 font-bold mb-2">Erro ao carregar dashboard</h3>
                    <p className="text-gray-400 mb-4">{error}</p>
                    <Button onClick={() => window.location.reload()} variant="secondary">
                        Tentar Novamente
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="analytics-container">
            {/* Header with back button */}
            <div className="analytics-back-button">
                <Button
                    onClick={() => navigate('/admin')}
                    variant="ghost"
                    icon="⬅"
                >
                    Voltar
                </Button>
            </div>

            {/* Title and timestamp */}
            <div className="analytics-header">
                <h1 className="analytics-title">📊 Dashboard Analytics</h1>
                <div className="text-sm text-gray-500">
                    Atualizado em: {new Date().toLocaleTimeString()}
                </div>
            </div>

            {/* Stats Cards - Always 4 in a row as requested */}
            <div className="analytics-stats-grid">
                <StatsCard
                    icon="👥"
                    title="Total Membros"
                    value={stats?.totalMembers || 0}
                    color="blue"
                />
                <StatsCard
                    icon="🎉"
                    title="Eventos Ativos"
                    value={stats?.activeEvents || 0}
                    color="green"
                />
                <StatsCard
                    icon="✅"
                    title="Confirmações"
                    value={stats?.totalConfirmations || 0}
                    color="blue"
                />
                <StatsCard
                    icon="📈"
                    title="Taxa Presença"
                    value={`${stats?.avgAttendanceRate || 0}%`}
                    subtitle="Média por evento"
                    color="gold"
                />
            </div>

            {/* Top 10 and Birthdays */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Top10List data={top10} loading={loading} />
                <BirthdayList data={birthdays} loading={loading} />
            </div>
        </div>
    );
};

export default Analytics;
