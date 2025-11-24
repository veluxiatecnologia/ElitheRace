const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { authenticateToken, isAdmin } = require('../middleware/authMiddleware');

// Public or Protected? Admin only for update, maybe public/protected for get if needed by client generation
// For now, let's protect both, assuming generation happens in Admin Dashboard
router.get('/whatsapp-template', authenticateToken, isAdmin, settingsController.getWhatsAppTemplate);
router.put('/whatsapp-template', authenticateToken, isAdmin, settingsController.updateWhatsAppTemplate);

module.exports = router;
