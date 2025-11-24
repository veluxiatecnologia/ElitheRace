const { supabase } = require('../db');

async function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });

    try {
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (error || !user) {
            console.error('Auth Error:', error);
            return res.status(403).json({ error: 'Invalid token.' });
        }
        req.user = user;
        next();
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
}

function isAdmin(req, res, next) {
    // Check role in user metadata or profile
    // Supabase user object has user_metadata
    const role = req.user.user_metadata?.role || 'member';
    if (role === 'admin') {
        next();
    } else {
        res.status(403).json({ error: 'Access denied. Admins only.' });
    }
}

module.exports = { authenticateToken, isAdmin };
