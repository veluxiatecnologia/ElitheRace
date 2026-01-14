const express = require('express');
const router = express.Router();
const { db, supabase } = require('../db');
const { authenticateToken } = require('../middleware/authMiddleware');

/**
 * GET /api/gallery/timeline
 * List past events for the timeline
 */
router.get('/timeline', async (req, res) => {
    try {
        const events = await db.events.findAll();
        // Filter for past events (assuming 'data' is date string)
        const now = new Date();
        const pastEvents = events.filter(e => new Date(e.data) < now);

        // TODO: Ideally fetch a cover photo for each event from gallery
        // For now, use event banner or first photo
        // We could enhance this by fetching 1 photo for each event

        res.json(pastEvents);
    } catch (error) {
        console.error('Error fetching timeline:', error);
        res.status(500).json({ error: 'Erro ao carregar timeline' });
    }
});

/**
 * GET /api/gallery/pending
 * Admin: List pending photos
 */
router.get('/pending', authenticateToken, async (req, res) => {
    try {
        if (req.user.user_metadata?.role !== 'admin') {
            return res.status(403).json({ error: 'Acesso negado' });
        }
        const photos = await db.gallery.getPendingPhotos();
        res.json(photos);
    } catch (error) {
        console.error('Error fetching pending photos:', error);
        res.status(500).json({ error: 'Erro ao carregar fotos pendentes' });
    }
});

/**
 * PUT /api/gallery/photos/:photoId/moderate
 * Admin: Approve or Reject photo
 */
router.put('/photos/:photoId/moderate', authenticateToken, async (req, res) => {
    try {
        if (req.user.user_metadata?.role !== 'admin') {
            return res.status(403).json({ error: 'Acesso negado' });
        }
        const { photoId } = req.params;
        const { status } = req.body; // 'approved' or 'rejected'

        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ error: 'Status inválido' });
        }

        const photo = await db.gallery.moderatePhoto(photoId, status);
        res.json(photo);
    } catch (error) {
        console.error('Error moderating photo:', error);
        res.status(500).json({ error: 'Erro ao moderar foto' });
    }
});

/**
 * GET /api/gallery/events/:eventId/photos
 * List photos for an event
 */
router.get('/events/:eventId/photos', async (req, res) => {
    try {
        const { eventId } = req.params;
        const photos = await db.gallery.getPhotosByEvent(eventId);

        // Add isLiked by current user if userId provided in query or auth header
        // For now, we return the list of likes, frontend can check

        res.json(photos);
    } catch (error) {
        console.error('Error fetching photos:', error);
        res.status(500).json({
            error: 'Erro ao carregar fotos',
            details: error.message,
            hint: error.hint
        });
    }
});

/**
 * POST /api/gallery/events/:eventId/photos
 * Add a new photo (metadata)
 * Client should upload file to Supabase Storage first
 */
router.post('/events/:eventId/photos', async (req, res) => {
    try {
        const { eventId } = req.params;
        const { url, caption, userId } = req.body; // userId should come from auth middleware in real app

        if (!url || !userId) {
            return res.status(400).json({ error: 'URL e User ID são obrigatórios' });
        }

        const photo = await db.gallery.createPhoto({
            evento_id: eventId,
            user_id: userId,
            url,
            caption
        });

        res.status(201).json(photo);
    } catch (error) {
        console.error('Error adding photo:', error);
        res.status(500).json({
            error: 'Erro ao salvar metadados da foto',
            details: error.message,
            hint: error.hint
        });
    }
});

/**
 * DELETE /api/gallery/photos/:photoId
 * Delete a photo
 */
router.delete('/photos/:photoId', authenticateToken, async (req, res) => {
    try {
        const { photoId } = req.params;
        const userId = req.user.id;
        const userRole = req.user.user_metadata?.role;

        // Get photo to check ownership
        const { data: photo, error: fetchError } = await supabase
            .from('photos')
            .select('user_id, url')
            .eq('id', photoId)
            .single();

        if (fetchError || !photo) {
            return res.status(404).json({ error: 'Foto não encontrada' });
        }

        // Check permission: Admin ONLY
        if (userRole !== 'admin') {
            return res.status(403).json({ error: 'Apenas administradores podem excluir fotos' });
        }

        // Delete from Storage
        const path = photo.url.split('/').pop(); // simplistic, might need better parsing depending on URL structure
        // Actually, better to parse the path from the URL if it's a full URL
        // Assuming URL is like: .../storage/v1/object/public/event-gallery/folder/filename
        // We need 'folder/filename'

        // For now, let's just delete the record. Storage cleanup can be a separate process or handled if we parse correctly.
        // But to be safe and clean:
        try {
            const urlParts = photo.url.split('/event-gallery/');
            if (urlParts.length > 1) {
                const storagePath = urlParts[1];
                await supabase.storage.from('event-gallery').remove([storagePath]);
            }
        } catch (storageError) {
            console.error('Error deleting file from storage:', storageError);
            // Continue to delete from DB even if storage fails
        }

        await db.gallery.deletePhoto(photoId);
        res.json({ message: 'Foto removida' });
    } catch (error) {
        console.error('Error deleting photo:', error);
        res.status(500).json({ error: 'Erro ao deletar foto' });
    }
});

/**
 * POST /api/gallery/photos/:photoId/like
 * Toggle like on a photo
 */
router.post('/photos/:photoId/like', async (req, res) => {
    try {
        const { photoId } = req.params;
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ error: 'User ID obrigatório' });
        }

        const result = await db.gallery.toggleLike(photoId, userId);
        res.json(result);
    } catch (error) {
        console.error('Error toggling like:', error);
        res.status(500).json({ error: 'Erro ao curtir foto' });
    }
});

/**
 * GET /api/gallery/photos/:photoId/comments
 * Get comments for a photo
 */
router.get('/photos/:photoId/comments', async (req, res) => {
    try {
        const { photoId } = req.params;
        const comments = await db.gallery.getCommentsByPhoto(photoId);
        res.json(comments);
    } catch (error) {
        console.error('Error fetching comments:', error);
        res.status(500).json({ error: 'Erro ao carregar comentários' });
    }
});

/**
 * POST /api/gallery/photos/:photoId/comments
 * Add a comment
 */
router.post('/photos/:photoId/comments', async (req, res) => {
    try {
        const { photoId } = req.params;
        const { userId, content } = req.body;

        if (!userId || !content) {
            return res.status(400).json({ error: 'User ID e conteúdo são obrigatórios' });
        }

        const comment = await db.gallery.addComment({
            photo_id: photoId,
            user_id: userId,
            content
        });

        res.status(201).json(comment);
    } catch (error) {
        console.error('Error adding comment:', error);
        res.status(500).json({ error: 'Erro ao comentar' });
    }
});

/**
 * DELETE /api/gallery/comments/:commentId
 * Delete a comment
 */
router.delete('/comments/:commentId', async (req, res) => {
    try {
        const { commentId } = req.params;
        // TODO: Check ownership
        await db.gallery.deleteComment(commentId);
        res.json({ message: 'Comentário removido' });
    } catch (error) {
        console.error('Error deleting comment:', error);
        res.status(500).json({ error: 'Erro ao remover comentário' });
    }
});

module.exports = router;
