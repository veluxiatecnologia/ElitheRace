import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

const Home = () => {
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState(null);
    const [moto, setMoto] = useState('');
    const [pe, setPe] = useState('');
    const [confirming, setConfirming] = useState(false);
    const [result, setResult] = useState(null);
    const { user, logout } = useAuth();

    // Função para formatar data sem problemas de timezone
    const formatDate = (dateString) => {
        if (!dateString) return '';
        // Parseia a data como local, não UTC
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
            const res = await fetch('/api/events/active');
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
            const res = await fetch(`/api/events/${eventId}/status`, { headers });

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
        setConfirming(true);
        try {
            const headers = await getAuthHeader();
            const res = await fetch(`/api/events/${event.id}/attend`, {
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
            } else {
                alert(data.error);
            }
        } catch (error) {
            alert('Erro ao confirmar presença');
        } finally {
            setConfirming(false);
        }
    };

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
            <div className="text-gold" style={{ fontSize: '20px' }}>Carregando...</div>
        </div>
    );

    if (!event) {
        return (
            <div style={{ background: '#0a0a0a', minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                <div className="card text-center" style={{ maxWidth: '500px', padding: '60px 40px' }}>
                    <div style={{ fontSize: '80px', marginBottom: '20px' }}>🏍️</div>
                    <h2 className="text-white" style={{ fontSize: '28px', marginBottom: '16px' }}>Nenhum Rolê Ativo</h2>
                    <p className="text-gray-400" style={{ fontSize: '16px' }}>Em breve teremos novidades! Fique ligado nas redes sociais do clube.</p>
                </div>
            </div>
        );
    }

    return (
        <div style={{ background: '#0a0a0a', minHeight: '100vh', paddingBottom: '60px' }}>
            <div className="container mx-auto px-4 py-6" style={{ maxWidth: '900px' }}>

                {/* Banner */}
                {event.banner_url && (
                    <div style={{
                        width: '100%',
                        height: '300px',
                        overflow: 'hidden',
                        borderRadius: '16px',
                        marginBottom: '24px',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
                    }}>
                        <img src={event.banner_url} alt="Banner do Evento" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                )}

                {/* Event Header Card */}
                <div className="card mb-6" style={{ textAlign: 'center', padding: '32px' }}>
                    <h1 className="text-gold" style={{ fontSize: '36px', fontWeight: 'bold', marginBottom: '12px' }}>{event.nome}</h1>
                    <div style={{ fontSize: '20px', color: '#999', marginBottom: '8px' }}>
                        📅 {formatDate(event.data)}
                    </div>
                </div>

                {/* Event Details Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                    {/* Destination */}
                    <div className="card">
                        <div style={{ fontSize: '32px', marginBottom: '12px' }}>📍</div>
                        <h3 className="text-red" style={{ fontSize: '14px', textTransform: 'uppercase', marginBottom: '8px' }}>Destino</h3>
                        <p className="text-white" style={{ fontSize: '16px', marginBottom: '12px' }}>{event.destino}</p>
                        {event.link_maps_destino && (
                            <a href={event.link_maps_destino} target="_blank" rel="noopener noreferrer" className="text-gold" style={{ fontSize: '14px', textDecoration: 'none' }}>
                                Ver no Maps →
                            </a>
                        )}
                    </div>

                    {/* Pedagios */}
                    {event.pedagios && (
                        <div className="card">
                            <div style={{ fontSize: '32px', marginBottom: '12px' }}>💰</div>
                            <h3 className="text-gold" style={{ fontSize: '14px', textTransform: 'uppercase', marginBottom: '8px' }}>Pedágios</h3>
                            <p className="text-white" style={{ fontSize: '16px', whiteSpace: 'pre-line' }}>{event.pedagios}</p>
                        </div>
                    )}
                </div>

                {/* Observations */}
                {event.observacoes && (
                    <div className="card mb-6">
                        <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ fontSize: '28px' }}>📝</span>
                            <h3 className="text-gold" style={{ fontSize: '18px' }}>Observações</h3>
                        </div>
                        <p className="text-white" style={{ fontSize: '15px', lineHeight: '1.6', whiteSpace: 'pre-line' }}>{event.observacoes}</p>
                    </div>
                )}

                {/* PEs Section - Only visible when logged in */}
                {user && event.pes && event.pes.length > 0 && (
                    <div className="card mb-6">
                        <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ fontSize: '28px' }}>🅿️</span>
                            <h3 className="text-red" style={{ fontSize: '20px', fontWeight: 'bold' }}>Pontos de Encontro</h3>
                        </div>
                        <div style={{ display: 'grid', gap: '12px' }}>
                            {event.pes.map(p => (
                                <div key={p.id} style={{
                                    background: '#1a1a1a',
                                    padding: '16px',
                                    borderRadius: '12px',
                                    border: '1px solid #333',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    flexWrap: 'wrap',
                                    gap: '12px'
                                }}>
                                    <div>
                                        <div className="text-white" style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '4px' }}>
                                            {p.nome}
                                        </div>
                                        <div className="text-gray-400" style={{ fontSize: '14px' }}>
                                            🕒 {p.horario}
                                        </div>
                                    </div>
                                    {p.localizacao && (
                                        <a href={p.localizacao} target="_blank" rel="noopener noreferrer" className="text-gold" style={{ fontSize: '14px', textDecoration: 'none' }}>
                                            Ver Maps →
                                        </a>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Action Area */}
                {!user ? (
                    <div className="card text-center" style={{ padding: '60px 40px' }}>
                        <div style={{ fontSize: '60px', marginBottom: '20px' }}>🔐</div>
                        <p className="text-white" style={{ fontSize: '18px', marginBottom: '24px' }}>
                            Faça login para confirmar sua presença
                        </p>
                        <Link to="/login" className="btn btn-primary" style={{ padding: '12px 32px', fontSize: '16px' }}>
                            Entrar Agora
                        </Link>
                    </div>
                ) : status && status.confirmed ? (
                    <div className="card" style={{ background: 'linear-gradient(135deg, rgba(0,255,0,0.05) 0%, rgba(0,200,0,0.1) 100%)', border: '2px solid rgba(0,255,0,0.3)', padding: '32px', textAlign: 'center' }}>
                        <div style={{ fontSize: '60px', marginBottom: '16px' }}>✅</div>
                        <h2 className="text-white" style={{ fontSize: '28px', marginBottom: '16px' }}>Presença Confirmada!</h2>
                        {result ? (
                            <div className="text-white" style={{ fontSize: '16px', lineHeight: '1.8' }}>
                                <p>Bom rolê! Você já participou de <strong className="text-gold">{result.stats.participacoes}</strong> eventos.</p>
                                <p>⭐ Você tem <strong className="text-gold">{result.stats.estrelinhas}</strong> estrelinhas.</p>
                                {result.stats.aniversariante && <p className="text-gold">🎂 Parabéns pelo seu aniversário nesta semana!</p>}
                                {result.stats.nova_moto && <p className="text-gold">🏍 Parabéns pela nova moto!</p>}
                            </div>
                        ) : (
                            <p className="text-white">Você já garantiu seu lugar neste rolê!</p>
                        )}
                    </div>
                ) : (
                    <div className="card">
                        <div style={{ marginBottom: '24px', textAlign: 'center' }}>
                            <div style={{ fontSize: '48px', marginBottom: '12px' }}>🏍️</div>
                            <h2 className="text-gold" style={{ fontSize: '24px' }}>Confirmar Presença</h2>
                        </div>
                        <form onSubmit={handleConfirm} style={{ maxWidth: '500px', margin: '0 auto' }}>
                            <div style={{ marginBottom: '20px' }}>
                                <label className="text-white" style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold' }}>
                                    🅿️ Escolha seu PE
                                </label>
                                <select
                                    value={pe}
                                    onChange={(e) => setPe(e.target.value)}
                                    required
                                    style={{ width: '100%', padding: '12px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '8px', color: '#fff', fontSize: '15px' }}
                                >
                                    <option value="">Selecione um PE...</option>
                                    {event.pes && event.pes.map(p => (
                                        <option key={p.id} value={p.nome}>{p.nome} - {p.horario}</option>
                                    ))}
                                </select>
                            </div>

                            <div style={{ marginBottom: '28px' }}>
                                <label className="text-white" style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold' }}>
                                    🏍️ Moto que usará no dia
                                </label>
                                <input
                                    value={moto}
                                    onChange={(e) => setMoto(e.target.value)}
                                    placeholder="Ex: Honda CB 500X Vermelha"
                                    required
                                    style={{ width: '100%', padding: '12px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '8px', color: '#fff', fontSize: '15px' }}
                                />
                            </div>

                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={confirming}
                                style={{ width: '100%', padding: '14px', fontSize: '16px', fontWeight: 'bold' }}
                            >
                                {confirming ? 'Confirmando...' : '✓ Confirmar Presença'}
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Home;
