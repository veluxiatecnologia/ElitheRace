const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { authenticateToken } = require('../middleware/authMiddleware');

/**
 * GET /api/ranking
 * Returns the leaderboard (top 50 users by XP)
 */
router.get('/', authenticateToken, async (req, res) => {
    try {
        const ranking = await db.gamification.getRanking();
        res.json(ranking);
    } catch (error) {
        console.error('Error fetching ranking:', error);
        res.status(500).json({ error: 'Erro ao carregar ranking' });
    }
});

/**
 * GET /api/ranking/medals
 * Returns all available medals
 */
router.get('/medals', authenticateToken, async (req, res) => {
    try {
        const medals = await db.gamification.getAllMedals();
        res.json(medals);
    } catch (error) {
        console.error('Error fetching medals:', error);
        res.status(500).json({ error: 'Erro ao carregar medalhas' });
    }
});

/**
 * GET /api/ranking/:userId/medals
 * Returns medals earned by a specific user
 */
router.get('/:userId/medals', authenticateToken, async (req, res) => {
    try {
        const { userId } = req.params;
        const medals = await db.gamification.getUserMedals(userId);
        res.json(medals);
    } catch (error) {
        console.error('Error fetching user medals:', error);
        res.status(500).json({ error: 'Erro ao carregar medalhas do usuário' });
    }
});

module.exports = router;
