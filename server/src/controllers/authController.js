const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../db');
const { JWT_SECRET } = require('../middleware/authMiddleware');

const saltRounds = 10;

exports.register = async (req, res) => {
    const { nome, data_nascimento, email, senha, moto_atual } = req.body;

    if (!nome || !email || !senha) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const existingUser = db.users.findByEmail(email);
        if (existingUser) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        const senha_hash = await bcrypt.hash(senha, saltRounds);

        const result = db.users.create({
            nome,
            data_nascimento,
            email,
            senha_hash,
            moto_atual: moto_atual || '',
            participacoes_totais: 0,
            estrelinhas: 0,
            role: 'member'
        });

        const token = jwt.sign({ id: result.lastInsertRowid, email, role: 'member' }, JWT_SECRET, { expiresIn: '7d' });

        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: { id: result.lastInsertRowid, nome, email, role: 'member', moto_atual }
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.login = async (req, res) => {
    const { email, senha } = req.body;

    try {
        const user = db.users.findByEmail(email);
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const match = await bcrypt.compare(senha, user.senha_hash);
        if (!match) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                nome: user.nome,
                email: user.email,
                role: user.role,
                moto_atual: user.moto_atual,
                estrelinhas: user.estrelinhas,
                participacoes_totais: user.participacoes_totais
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
