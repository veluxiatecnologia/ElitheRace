import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import FormCard from '../components/FormCard';
import Button from '../components/Button';
import Input from '../components/Input';
import LoadingSpinner from '../components/LoadingSpinner';
import LoadingSkeleton from '../components/LoadingSkeleton';
import Badge from '../components/Badge';
import QRCodeDisplay from '../components/QRCodeDisplay';
import toast from 'react-hot-toast';
import API_URL from '../config/api';
import './Home.css';

const Home = () => {
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState(null);
    const [moto, setMoto] = useState('');
    const [pe, setPe] = useState('');
    const [confirming, setConfirming] = useState(false);
    const [result, setResult] = useState(null);
    const { user, logout } = useAuth();

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const [year, month, day] = dateString.split('T')[0].split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        return date.toLocaleDateString('pt-BR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    useEffect(() => {
        fetchEvent();
    }, [user]);

    const fetchEvent = async () => {
        try {
            const res = await fetch(`${API_URL}/api/events/active`);
            const data = await res.json();
            if (data.message) {
                setEvent(null);
            } else {
                setEvent(data);
                if (user) {
                    checkStatus(data.id);
                    if (user.moto_atual) setMoto(user.moto_atual);
                }
            }
        } catch (error) {
            console.error(error);
            toast.error('Erro ao carregar evento');
        } finally {
            setLoading(false);
        }
    };

    const getAuthHeader = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        return {
            'Authorization': `Bearer ${session?.access_token}`
        };
    };

    const checkStatus = async (eventId) => {
        try {
            const headers = await getAuthHeader();
            const res = await fetch(`${API_URL}/api/events/${eventId}/status`, { headers });

            if (res.status === 403 || res.status === 401) {
                await logout();
                return;
            }

            const data = await res.json();
            setStatus(data);
        } catch (error) {
            console.error(error);
        }
    };

    const handleConfirm = async (e) => {
        e.preventDefault();

        if (!pe) {
            toast.error('Selecione um Ponto de Encontro');
            return;
        }

        setConfirming(true);
        const confirmPromise = new Promise(async (resolve, reject) => {
            try {
                const headers = await getAuthHeader();
                const res = await fetch(`${API_URL}/api/events/${event.id}/attend`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...headers
                    },
                    body: JSON.stringify({ moto_dia: moto, pe_escolhido: pe })
                });
                const data = await res.json();
                if (res.ok) {
                    setResult(data);
                    setStatus({ confirmed: true, data: { moto_dia: moto, pe_escolhido: pe } });
                    resolve(data);
                } else {
                    reject(new Error(data.error));
                }
            } catch (error) {
                reject(error);
            }
        });

        toast.promise(confirmPromise, {
            loading: 'Confirmando presença...',
            success: 'Presença confirmada com sucesso! 🏍️',
            error: (err) => `Erro: ${err.message}`
        });

        try {
            await confirmPromise;
        } catch (error) {
            // Error handled by toast
        } finally {
            setConfirming(false);
        }
    };

    if (loading) return <LoadingSpinner fullPage text="Carregando evento..." />;

    if (!event) {
        return (
            <div className="home-page">
                <div className="empty-state">
                    <div className="empty-icon">🏍️</div>
                    <h2 className="text-gold mb-4">Nenhum Rolê Ativo</h2>
                    <p className="text-muted">Em breve teremos novidades! Fique ligado nas redes sociais do clube.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="home-page">
            <div className="home-container">
                {/* Hero Section */}
                <div className="home-hero">
                    {event.banner_url ? (
                        <img src={event.banner_url} alt={event.nome} className="home-hero-image" />
                    ) : (
                        <div className="home-hero-image" style={{ background: 'var(--gradient-carbon)' }}></div>
                    )}
                    <div className="home-hero-overlay">
                        <Badge variant="gold" className="mb-2">Próximo Evento</Badge>
                        <h1 className="home-hero-title">{event.nome}</h1>
                        <div className="home-hero-date">
                            <span>📅</span> {formatDate(event.data)}
                        </div>
                    </div>
                </div>

                {/* Content Grid - Only visible to logged users */}
                {user && (
                    <div className="home-grid">
                        {/* Destination Card */}
                        <FormCard className="info-card" maxWidth={800} centered={false}>
                            <div className="info-card-header">
                                <div className="info-card-icon">📍</div>
                                <h3 className="info-card-title">Destino</h3>
                            </div>
                            <div className="info-card-content">
                                <p className="text-xl font-bold mb-2">{event.destino}</p>
                                {event.link_maps_destino && (
                                    <a href={event.link_maps_destino} target="_blank" rel="noopener noreferrer" className="btn modern-btn-ghost modern-btn-small inline-flex items-center gap-2">
                                        Ver no Maps 🗺️
                                    </a>
                                )}
                            </div>
                        </FormCard>

                        {/* Observations Card */}
                        {event.observacoes && (
                            <FormCard className="info-card" maxWidth={800} centered={false}>
                                <div className="info-card-header">
                                    <div className="info-card-icon">📝</div>
                                    <h3 className="info-card-title">Observações</h3>
                                </div>
                                <div className="info-card-content">
                                    <p style={{ whiteSpace: 'pre-line' }}>{event.observacoes}</p>
                                </div>
                            </FormCard>
                        )}

                        {/* Pedagios Card */}
                        {event.pedagios && (
                            <FormCard className="info-card" maxWidth={800} centered={false}>
                                <div className="info-card-header">
                                    <div className="info-card-icon">💰</div>
                                    <h3 className="info-card-title">Pedágios</h3>
                                </div>
                                <div className="info-card-content">
                                    <p style={{ whiteSpace: 'pre-line' }}>{event.pedagios}</p>
                                </div>
                            </FormCard>
                        )}
                    </div>
                )}

                {/* PEs Section */}
                {user && event.pes && event.pes.length > 0 && (
                    <div className="mb-6">
                        <h2 className="text-gold mb-4 flex items-center gap-2">
                            <span>🅿️</span> Pontos de Encontro
                        </h2>
                        <div className="pe-list">
                            {event.pes.map(p => (
                                <div key={p.id} className="pe-item">
                                    <div className="pe-info">
                                        <h4>{p.nome}</h4>
                                        <div className="pe-time">
                                            <span>🕒</span> {p.horario}
                                        </div>
                                    </div>
                                    {p.localizacao && (
                                        <a href={p.localizacao} target="_blank" rel="noopener noreferrer" className="pe-link">
                                            Ver Localização 📍
                                        </a>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Action Area */}
                <div className="confirm-section">
                    {!user ? (
                        <FormCard title="Participe do Rolê" subtitle="Faça login para confirmar presença" centered>
                            <div className="text-center">
                                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔐</div>
                                <Link to="/login">
                                    <Button variant="primary" size="large" fullWidth>
                                        Fazer Login
                                    </Button>
                                </Link>
                            </div>
                        </FormCard>
                    ) : status && status.confirmed ? (
                        <>
                            <FormCard className="confirm-success" centered>
                                <div className="confirm-icon">✅</div>
                                <h2 className="text-success text-2xl font-bold mb-2">Presença Confirmada!</h2>
                                <p className="text-muted mb-4">Você já garantiu seu lugar neste rolê.</p>

                                {result && (
                                    <div className="confirm-stats">
                                        <div className="confirm-stat-item">
                                            <span>🏍️</span>
                                            <span>{result.stats.participacoes} participações</span>
                                        </div>
                                        <div className="confirm-stat-item">
                                            <span>⭐</span>
                                            <span>{result.stats.estrelinhas} estrelinhas</span>
                                        </div>
                                        {result.stats.aniversariante && (
                                            <Badge variant="gold" pulse className="mt-2">🎂 Aniversariante</Badge>
                                        )}
                                    </div>
                                )}
                            </FormCard>

                            {/* QR Code Display */}
                            {(result?.confirmation?.qr_code || status?.data?.qr_code) && (
                                <div className="mt-4">
                                    <QRCodeDisplay
                                        qrCode={result?.confirmation?.qr_code || status?.data?.qr_code}
                                        eventName={event.nome}
                                        userName={user?.user_metadata?.nome || user?.email}
                                        checkedInAt={status?.data?.checked_in_at}
                                        onDownload={() => toast.success('QR Code salvo!')}
                                    />
                                </div>
                            )}
                        </>
                    ) : (
                        <FormCard title="Confirmar Presença" subtitle="Garanta seu lugar no comboio" centered>
                            <form onSubmit={handleConfirm}>
                                <div className="mb-4">
                                    <label className="block text-muted mb-2 text-sm">Ponto de Encontro</label>
                                    <select
                                        value={pe}
                                        onChange={(e) => setPe(e.target.value)}
                                        required
                                        className="modern-input-field"
                                        style={{ width: '100%', padding: '12px', background: 'var(--color-carbon-lighter)', border: '1px solid var(--color-text-dimmed)', color: 'white' }}
                                    >
                                        <option value="">Selecione um PE...</option>
                                        {event.pes && event.pes.map(p => (
                                            <option key={p.id} value={p.nome}>{p.nome} - {p.horario}</option>
                                        ))}
                                    </select>
                                </div>

                                <Input
                                    label="Moto que usará"
                                    value={moto}
                                    onChange={(e) => setMoto(e.target.value)}
                                    icon="🏍️"
                                    required
                                    placeholder="Ex: Honda CB 500X"
                                />

                                <Button
                                    type="submit"
                                    variant="primary"
                                    size="large"
                                    fullWidth
                                    loading={confirming}
                                    icon="✓"
                                >
                                    Confirmar Presença
                                </Button>
                            </form>
                        </FormCard>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Home;
