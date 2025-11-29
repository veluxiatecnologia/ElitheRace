import React, { useState, useEffect } from 'react';
import API_URL from '../config/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import QRScanner from '../components/QRScanner';
import Button from '../components/Button';
import Badge from '../components/Badge';
import LoadingSpinner from '../components/LoadingSpinner';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';
import './CheckInScanner.css';

const CheckInScanner = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [events, setEvents] = useState([]);
    const [selectedEventId, setSelectedEventId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [recentCheckIns, setRecentCheckIns] = useState([]);
    const [stats, setStats] = useState({ totalConfirmations: 0, totalCheckedIn: 0 });
    const [isScanning, setIsScanning] = useState(false);
    const [validationResult, setValidationResult] = useState(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    useEffect(() => {
        const role = user?.user_metadata?.role || user?.role;
        if (!user || role !== 'admin') {
            navigate('/');
            return;
        }
        fetchEvents();
    }, [user]);

    useEffect(() => {
        if (selectedEventId) {
            fetchAttendanceStats();
        }
    }, [selectedEventId]);

    const getAuthHeader = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        return { 'Authorization': `Bearer ${session?.access_token}` };
    };

    const fetchEvents = async () => {
        try {
            const headers = await getAuthHeader();
            const res = await fetch(`${API_URL}/api/events`, { headers });
            const data = await res.json();
            setEvents(data.filter(e => e.ativo)); // Only active events
            if (data.length > 0) {
                const activeEvent = data.find(e => e.ativo);
                if (activeEvent) {
                    setSelectedEventId(activeEvent.id);
                } else {
                    setSelectedEventId(data[0].id); // Fallback to first event if no active one
                }
            }
        } catch (error) {
            console.error('Error fetching events:', error);
            toast.error('Erro ao carregar eventos');
        } finally {
            setLoading(false);
        }
    };

    const fetchAttendanceStats = async () => {
        if (!selectedEventId) return;

        try {
            const headers = await getAuthHeader();
            const url = `${API_URL}/api/checkin/events/${selectedEventId}/attendance`;
            const res = await fetch(url, { headers });
            const data = await res.json();
            setStats(data.stats);
            // Get last 10 check-ins
            const checkedIn = data.attendees.filter(a => a.checkedIn).slice(0, 10);
            setRecentCheckIns(checkedIn);
        } catch (error) {
            console.error(error);
        }
    };

    const handleScanSuccess = async (decodedText) => {
        setIsScanning(false);

        try {
            // Validate QR code
            const res = await fetch(`${API_URL}/api/checkin/validate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ qrData: decodedText })
            });

            const data = await res.json();

            if (res.ok && data.valid) {
                // Auto-switch event if different
                if (data.confirmation.eventId && data.confirmation.eventId != selectedEventId) {
                    console.log(`Auto-switching event from ${selectedEventId} to ${data.confirmation.eventId}`);
                    setSelectedEventId(data.confirmation.eventId);
                    toast.info(`Alternado para o evento: ${data.confirmation.eventName}`);
                }

                setValidationResult(data.confirmation);
                setShowConfirmModal(true);
            } else {
                toast.error(data.error || 'QR Code inválido');
                setTimeout(() => setIsScanning(true), 2000);
            }
        } catch (error) {
            console.error(error);
            toast.error('Erro ao validar QR Code');
            setTimeout(() => setIsScanning(true), 2000);
        }
    };

    const handleConfirmCheckIn = async () => {
        if (!validationResult) return;

        const checkInPromise = new Promise(async (resolve, reject) => {
            try {
                const headers = await getAuthHeader();
                const res = await fetch(`${API_URL}/api/checkin/register`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...headers
                    },
                    body: JSON.stringify({
                        token: validationResult.qrToken // Use QR token for registration
                    })
                });

                const data = await res.json();

                if (res.ok) {
                    // Update stats and recent check-ins
                    await fetchAttendanceStats();
                    resolve(data);
                } else {
                    reject(new Error(data.error || 'Erro ao registrar check-in'));
                }
            } catch (error) {
                reject(error);
            }
        });

        toast.promise(checkInPromise, {
            loading: 'Registrando check-in...',
            success: (data) => {
                setShowConfirmModal(false);
                setValidationResult(null);
                setTimeout(() => setIsScanning(true), 1000);
                return `✅ Check-in registrado: ${data.checkedIn.userName}`;
            },
            error: (err) => {
                setShowConfirmModal(false);
                setValidationResult(null);
                setTimeout(() => setIsScanning(true), 2000);
                return err.message;
            }
        });
    };

    const handleScanError = (error) => {
        console.error('Scan error:', error);
    };

    if (loading) return <LoadingSpinner fullPage text="Carregando..." />;

    return (
        <div className="checkin-scanner-page">
            <div className="scanner-container">
                <div className="scanner-header">
                    <Button
                        variant="ghost"
                        onClick={() => navigate('/admin')}
                        icon="←"
                    >
                        Voltar
                    </Button>
                    <h1 className="scanner-title">📷 Scanner de Check-in</h1>
                </div>

                {/* Event Selector */}
                <div className="event-selector">
                    <label>Evento:</label>
                    <select
                        value={selectedEventId || ''}
                        onChange={(e) => setSelectedEventId(Number(e.target.value))}
                        className="event-select"
                    >
                        {events.map(event => (
                            <option key={event.id} value={event.id}>
                                {event.nome} (ID: {event.id}) - {new Date(event.data).toLocaleDateString()}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Stats */}
                <div className="scanner-stats">
                    <div className="stat-card">
                        <div className="stat-value">{stats.totalCheckedIn}</div>
                        <div className="stat-label">Presentes</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value">{stats.totalConfirmations}</div>
                        <div className="stat-label">Confirmados</div>
                    </div>
                    <div className="stat-card stat-highlight">
                        <div className="stat-value">{stats.attendanceRate || 0}%</div>
                        <div className="stat-label">Taxa de Presença</div>
                    </div>
                </div>

                {/* QR Scanner */}
                <div className="scanner-section">
                    {selectedEventId ? (
                        <QRScanner
                            onScanSuccess={handleScanSuccess}
                            onScanError={handleScanError}
                        />
                    ) : (
                        <div className="no-event-selected">
                            <p>Selecione um evento para iniciar o scanner</p>
                        </div>
                    )}
                </div>

                {/* Recent Check-ins */}
                <div className="recent-checkins">
                    <h3>Últimos Check-ins</h3>
                    {recentCheckIns.length > 0 ? (
                        <div className="checkin-list">
                            {recentCheckIns.map((checkin, index) => (
                                <div key={index} className="checkin-item">
                                    <div className="checkin-icon">✓</div>
                                    <div className="checkin-info">
                                        <div className="checkin-name">{checkin.userName}</div>
                                        <div className="checkin-details">
                                            {checkin.motoDia} • {checkin.peEscolhido}
                                        </div>
                                    </div>
                                    <div className="checkin-time">
                                        {new Date(checkin.checkedInAt).toLocaleTimeString('pt-BR', {
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-muted">Nenhum check-in realizado ainda</p>
                    )}
                </div>
            </div>

            {/* Confirmation Modal */}
            <Modal
                isOpen={showConfirmModal}
                onClose={() => {
                    setShowConfirmModal(false);
                    setValidationResult(null);
                    setTimeout(() => setIsScanning(true), 500);
                }}
                title="Confirmar Check-in"
                size="md"
                footer={
                    <>
                        <Button
                            variant="ghost"
                            onClick={() => {
                                setShowConfirmModal(false);
                                setValidationResult(null);
                                setTimeout(() => setIsScanning(true), 500);
                            }}
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="primary"
                            onClick={handleConfirmCheckIn}
                            icon="✓"
                        >
                            Confirmar Check-in
                        </Button>
                    </>
                }
            >
                {validationResult && (
                    <div className="validation-details">
                        <div className="validation-row">
                            <strong>Participante:</strong>
                            <span>{validationResult.userName}</span>
                        </div>
                        <div className="validation-row">
                            <strong>Evento:</strong>
                            <span>{validationResult.eventName} (ID: {validationResult.eventId})</span>
                            {validationResult.eventId != selectedEventId && (
                                <Badge variant="danger" className="ml-2">⚠️ Evento Diferente!</Badge>
                            )}
                        </div>
                        <div className="validation-row">
                            <strong>PE Escolhido:</strong>
                            <span>{validationResult.peEscolhido}</span>
                        </div>
                        <div className="validation-row">
                            <strong>Moto:</strong>
                            <span>{validationResult.motoDia}</span>
                        </div>
                        {validationResult.checkedIn && (
                            <div className="already-checked-in">
                                <Badge variant="warning">⚠️ Já fez check-in</Badge>
                                <p className="text-sm text-muted">
                                    Check-in realizado em {new Date(validationResult.checkedInAt).toLocaleString('pt-BR')}
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default CheckInScanner;
