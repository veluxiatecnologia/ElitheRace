const express = require('express');
const router = express.Router();
const { getDashboardStats, getTop10Participants, getUpcomingBirthdays } = require('../controllers/dashboardController');
const { authenticateToken, isAdmin } = require('../middleware/authMiddleware');

// Todas as rotas requerem autenticação de admin
router.use(authenticateToken);
router.use(isAdmin);

// GET /api/admin/dashboard/stats
router.get('/stats', getDashboardStats);

// GET /api/admin/dashboard/top10
router.get('/top10', getTop10Participants);

// GET /api/admin/dashboard/birthdays
router.get('/birthdays', getUpcomingBirthdays);

module.exports = router;
