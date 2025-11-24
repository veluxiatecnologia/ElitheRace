const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const attendanceController = require('../controllers/attendanceController');
const { authenticateToken, isAdmin } = require('../middleware/authMiddleware');

// Public
router.get('/active', eventController.getActiveEvent);

// Protected (Member)
router.get('/history', authenticateToken, attendanceController.getUserHistory);

// Protected (Member)
router.post('/:id/attend', authenticateToken, attendanceController.confirmAttendance);
router.get('/:id/status', authenticateToken, attendanceController.getUserStatus);

// Admin
router.get('/', authenticateToken, isAdmin, eventController.getAllEvents);
router.get('/:id', authenticateToken, isAdmin, eventController.getEventById);
router.post('/', authenticateToken, isAdmin, eventController.createEvent);
router.put('/:id', authenticateToken, isAdmin, eventController.updateEvent);
router.put('/:id/active', authenticateToken, isAdmin, eventController.toggleActive);
router.delete('/:id', authenticateToken, isAdmin, eventController.deleteEvent);
router.get('/:id/pes', authenticateToken, isAdmin, attendanceController.getEventPes);
router.get('/:id/confirmations', authenticateToken, isAdmin, attendanceController.getConfirmations);
router.get('/:id/whatsapp', authenticateToken, isAdmin, attendanceController.generateWhatsAppList);

module.exports = router;
