const db = require('../db').db;

exports.getPeTemplates = async (req, res) => {
    try {
        const templates = await db.peTemplates.findAll();
        res.json(templates);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.createPeTemplate = async (req, res) => {
    try {
        const { nome, localizacao } = req.body;
        console.log('Creating PE template:', { nome, localizacao });
        const template = await db.peTemplates.create({ nome, localizacao });
        res.status(201).json(template);
    } catch (error) {
        console.error('Error creating PE template:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};

exports.deletePeTemplate = async (req, res) => {
    try {
        await db.peTemplates.delete(req.params.id);
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};
