import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import Button from './Button';
import { toast } from 'react-hot-toast';
import './PhotoModal.css';

const PhotoModal = ({ photo, onClose, onUpdate }) => {
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [liked, setLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(photo.likeCount || 0);
    const [loadingComments, setLoadingComments] = useState(true);
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        getCurrentUser();
        fetchComments();
        checkIfLiked();
    }, [photo.id]);

    const getCurrentUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUser(user);
    };

    const checkIfLiked = () => {
        // Check if current user is in the likes array
        // Note: In a real app with many likes, we should check this on backend or use a separate endpoint
        // For now, we rely on the passed photo object which has 'likes' array of objects {user_id: ...}
        if (currentUser && photo.likes) {
            const isLiked = photo.likes.some(l => l.user_id === currentUser.id);
            setLiked(isLiked);
        }
    };

    // Update liked state when currentUser is set
    useEffect(() => {
        if (currentUser && photo.likes) {
            const isLiked = photo.likes.some(l => l.user_id === currentUser.id);
            setLiked(isLiked);
        }
    }, [currentUser, photo.likes]);

    const fetchComments = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const response = await fetch(`http://localhost:3000/api/gallery/photos/${photo.id}/comments`, {
                headers: {
                    'Authorization': `Bearer ${session?.access_token}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setComments(data);
            }
        } catch (error) {
            console.error('Error fetching comments:', error);
        } finally {
            setLoadingComments(false);
        }
    };

    const handleLike = async () => {
        if (!currentUser) return;

        // Optimistic update
        const newLiked = !liked;
        setLiked(newLiked);
        setLikeCount(prev => newLiked ? prev + 1 : prev - 1);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const response = await fetch(`http://localhost:3000/api/gallery/photos/${photo.id}/like`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({ userId: currentUser.id })
            });

            if (!response.ok) throw new Error('Falha ao curtir');

            // Notify parent to update the grid
            onUpdate();

        } catch (error) {
            // Revert on error
            setLiked(!newLiked);
            setLikeCount(prev => !newLiked ? prev + 1 : prev - 1);
            toast.error('Erro ao curtir foto');
        }
    };

    const handleComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim() || !currentUser) return;

        const tempComment = {
            id: 'temp-' + Date.now(),
            content: newComment,
            created_at: new Date().toISOString(),
            profiles: {
                nome: currentUser.user_metadata?.nome || 'Você',
                avatar_url: currentUser.user_metadata?.avatar_url
            }
        };

        setComments([...comments, tempComment]);
        setNewComment('');

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const response = await fetch(`http://localhost:3000/api/gallery/photos/${photo.id}/comments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    userId: currentUser.id,
                    content: tempComment.content
                })
            });

            if (!response.ok) throw new Error('Falha ao comentar');

            const savedComment = await response.json();
            // Replace temp comment with real one
            setComments(prev => prev.map(c => c.id === tempComment.id ? savedComment : c));
            onUpdate();

        } catch (error) {
            setComments(prev => prev.filter(c => c.id !== tempComment.id));
            toast.error('Erro ao enviar comentário');
        }
    };

    const handleDeleteComment = async (commentId) => {
        // ... (existing code)
    };

    const handleDeletePhoto = async () => {
        if (!window.confirm('Tem certeza que deseja excluir esta foto?')) return;

        const toastId = toast.loading('Excluindo foto...');
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const response = await fetch(`http://localhost:3000/api/gallery/photos/${photo.id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${session.access_token}`
                }
            });

            if (!response.ok) throw new Error('Falha ao excluir');

            toast.success('Foto excluída', { id: toastId });
            onClose(); // Close modal
            onUpdate(); // Refresh grid
        } catch (error) {
            console.error('Error deleting photo:', error);
            toast.error('Erro ao excluir foto', { id: toastId });
        }
    };

    return (
        <div className="photo-modal-overlay" onClick={onClose}>
            <div className="photo-modal-content" onClick={e => e.stopPropagation()}>
                <button className="photo-modal-close" onClick={onClose}>×</button>

                <div className="photo-modal-image-container">
                    <img src={photo.url} alt="Foto do evento" />
                </div>

                <div className="photo-modal-sidebar">
                    <div className="photo-author-header">
                        <img
                            src={photo.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${photo.profiles?.nome}&background=random`}
                            alt={photo.profiles?.nome}
                        />
                        <div>
                            <strong>{photo.profiles?.nome}</strong>
                            <span className="photo-date">{new Date(photo.created_at).toLocaleDateString('pt-BR')}</span>
                        </div>
                    </div>

                    <div className="photo-actions">
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <Button
                                variant={liked ? "primary" : "outline"}
                                onClick={handleLike}
                                className="like-btn"
                                style={{ flex: 1 }}
                            >
                                {liked ? '❤️' : '🤍'} {likeCount} Curtidas
                            </Button>

                            {(currentUser && (currentUser.user_metadata?.role === 'admin' || currentUser.id === photo.user_id)) && (
                                <Button
                                    variant="danger"
                                    onClick={handleDeletePhoto}
                                    icon="🗑️"
                                    title="Excluir foto"
                                />
                            )}
                        </div>
                    </div>

                    <div className="comments-section">
                        <h3>Comentários</h3>
                        <div className="comments-list">
                            {loadingComments ? (
                                <p>Carregando...</p>
                            ) : comments.length === 0 ? (
                                <p className="no-comments">Seja o primeiro a comentar!</p>
                            ) : (
                                comments.map(comment => (
                                    <div key={comment.id} className="comment-item">
                                        <img
                                            src={comment.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${comment.profiles?.nome}&background=random`}
                                            alt={comment.profiles?.nome}
                                        />
                                        <div className="comment-content">
                                            <strong>{comment.profiles?.nome}</strong>
                                            <p>{comment.content}</p>
                                        </div>
                                        {currentUser && currentUser.id === comment.user_id && (
                                            <button
                                                className="delete-comment-btn"
                                                onClick={() => handleDeleteComment(comment.id)}
                                            >
                                                🗑️
                                            </button>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>

                        <form onSubmit={handleComment} className="comment-form">
                            <input
                                type="text"
                                value={newComment}
                                onChange={e => setNewComment(e.target.value)}
                                placeholder="Adicione um comentário..."
                            />
                            <Button type="submit" disabled={!newComment.trim()}>Enviar</Button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PhotoModal;
