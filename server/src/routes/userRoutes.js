const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Middleware to check if user is admin (you might want to extract this to a shared middleware file)
const isAdmin = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Token não fornecido' });

    const token = authHeader.split(' ')[1];
    const { supabase } = require('../db');

    try {
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (error || !user) throw new Error('Usuário não autenticado');

        // Check role in metadata or profile
        const role = user.user_metadata?.role;
        if (role !== 'admin') {
            return res.status(403).json({ error: 'Acesso negado' });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error('Auth error:', error);
        res.status(401).json({ error: 'Token inválido' });
    }
};

router.get('/', isAdmin, userController.getAllUsers);
router.put('/:id/promote', isAdmin, userController.promoteUser);
router.put('/:id/demote', isAdmin, userController.demoteUser);
router.delete('/:id', isAdmin, userController.deleteUser);

module.exports = router;
