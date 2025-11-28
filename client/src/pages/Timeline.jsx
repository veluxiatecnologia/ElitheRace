import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import LoadingSpinner from '../components/LoadingSpinner';
import Button from '../components/Button';
import API_URL from '../config/api';
import './Timeline.css';

const Timeline = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchTimeline();
    }, []);

    const fetchTimeline = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            const response = await fetch(`${API_URL}/api/gallery/timeline`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('Falha ao carregar timeline');

            const data = await response.json();
            setEvents(data);
        } catch (error) {
            console.error('Error fetching timeline:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="timeline-loading"><LoadingSpinner /></div>;

    return (
        <div className="timeline-container">
            <div className="timeline-header">
                <h1>Memórias Elithe</h1>
                <p>Reviva os melhores momentos da nossa história</p>
            </div>

            {events.length === 0 ? (
                <div className="empty-timeline">
                    <p>Nenhum evento passado encontrado.</p>
                </div>
            ) : (
                <div className="timeline-grid">
                    {events.map((event) => (
                        <div key={event.id} className="timeline-card" onClick={() => navigate(`/gallery/${event.id}`)}>
                            <div className="timeline-image" style={{ backgroundImage: `url(${event.banner_url || '/default-event.jpg'})` }}>
                                <div className="timeline-overlay">
                                    <span className="timeline-date">
                                        {new Date(event.data).toLocaleDateString('pt-BR')}
                                    </span>
                                </div>
                            </div>
                            <div className="timeline-content">
                                <h3>{event.nome}</h3>
                                <p className="timeline-location">📍 {event.destino}</p>
                                <Button variant="outline" size="small">Ver Fotos</Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Timeline;
