import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import LoadingSpinner from '../components/LoadingSpinner';
import Button from '../components/Button';
import PhotoModal from '../components/PhotoModal';
import { toast } from 'react-hot-toast';
import API_URL from '../config/api';
import './EventGallery.css';

const EventGallery = () => {
    const { eventId } = useParams();
    const navigate = useNavigate();
    const [photos, setPhotos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [eventName, setEventName] = useState('');
    const [selectedPhoto, setSelectedPhoto] = useState(null);
    const fileInputRef = React.useRef(null);

    useEffect(() => {
        fetchPhotos();
        fetchEventDetails();
    }, [eventId]);

    const fetchEventDetails = async () => {
        try {
            const { data, error } = await supabase
                .from('events')
                .select('nome')
                .eq('id', eventId)
                .single();
            if (data) setEventName(data.nome);
        } catch (error) {
            console.error('Error fetching event:', error);
        }
    };

    const fetchPhotos = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            const response = await fetch(`${API_URL}/api/gallery/events/${eventId}/photos`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('Falha ao carregar fotos');

            const data = await response.json();
            setPhotos(data);
        } catch (error) {
            console.error('Error fetching photos:', error);
            toast.error('Erro ao carregar galeria');
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        // Validate file type and size (max 5MB)
        if (!file.type.startsWith('image/')) {
            toast.error('Por favor, selecione apenas imagens.');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            toast.error('A imagem deve ter no máximo 5MB.');
            return;
        }

        setUploading(true);
        const toastId = toast.loading('Enviando foto...');

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Usuário não autenticado');

            // 1. Upload to Supabase Storage
            const fileExt = file.name.split('.').pop();
            const fileName = `${eventId}/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('event-gallery')
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            // 2. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('event-gallery')
                .getPublicUrl(fileName);

            // 3. Save metadata to Backend
            const { data: { session } } = await supabase.auth.getSession();
            const response = await fetch(`${API_URL}/api/gallery/events/${eventId}/photos`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    url: publicUrl,
                    userId: user.id,
                    caption: '' // Optional caption
                })
            });

            if (!response.ok) throw new Error('Falha ao salvar metadados');

            const newPhoto = await response.json();
            setPhotos([newPhoto, ...photos]);
            toast.success('Foto enviada com sucesso!', { id: toastId });

        } catch (error) {
            console.error('Upload error:', error);
            toast.error('Erro ao enviar foto: ' + error.message, { id: toastId });
        } finally {
            setUploading(false);
            event.target.value = ''; // Reset input
        }
    };

    if (loading) return <div className="gallery-loading"><LoadingSpinner /></div>;

    return (
        <div className="gallery-container">
            <div className="gallery-header">
                <Button variant="text" onClick={() => navigate('/timeline')} icon="←">
                    Voltar
                </Button>
                <h1>{eventName || 'Galeria do Evento'}</h1>
                <div className="upload-btn-wrapper">
                    <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        onChange={handleFileUpload}
                        disabled={uploading}
                        style={{ display: 'none' }}
                    />
                    <Button
                        variant="primary"
                        disabled={uploading}
                        icon={uploading ? "⏳" : "📷"}
                        onClick={() => fileInputRef.current.click()}
                    >
                        {uploading ? 'Enviando...' : 'Adicionar Foto'}
                    </Button>
                </div>
            </div>

            {photos.length === 0 ? (
                <div className="empty-gallery">
                    <p>Nenhuma foto ainda. Seja o primeiro a postar!</p>
                </div>
            ) : (
                <div className="gallery-grid">
                    {photos.map((photo) => (
                        <div key={photo.id} className="gallery-item" onClick={() => setSelectedPhoto(photo)}>
                            <img src={photo.url} alt="Evento" loading="lazy" />
                            <div className="gallery-item-overlay">
                                <div className="photo-author">
                                    <img
                                        src={photo.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${photo.profiles?.nome}&background=random`}
                                        alt={photo.profiles?.nome}
                                    />
                                    <span>{photo.profiles?.nome}</span>
                                </div>
                                <div className="photo-stats">
                                    <span>❤️ {photo.likeCount || 0}</span>
                                    <span>💬 {photo.commentCount || 0}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {selectedPhoto && (
                <PhotoModal
                    photo={selectedPhoto}
                    onClose={() => setSelectedPhoto(null)}
                    onUpdate={fetchPhotos}
                />
            )}
        </div>
    );
};

export default EventGallery;
