const { db } = require('../db');

exports.getActiveEvent = async (req, res) => {
    try {
        const event = await db.events.findActive();
        if (!event) {
            return res.json({ message: 'Nenhum rolê ativo no momento' });
        }

        const pes = await db.pes.findByEventId(event.id);
        res.json({ ...event, pes });
    } catch (error) {
        console.error('Get active event error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getAllEvents = async (req, res) => {
    try {
        const events = await db.events.findAll();
        res.json(events);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getEventById = async (req, res) => {
    try {
        const { id } = req.params;
        const event = await db.events.findById(id);
        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }
        res.json(event);
    } catch (error) {
        console.error('Get event by ID error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.createEvent = async (req, res) => {
    const { nome, data, destino, link_maps_destino, link_inscricao, observacoes, pedagios, banner_url, pes } = req.body;

    if (!nome || !data || !destino) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const result = await db.events.create({
            nome, data, destino, link_maps_destino, link_inscricao, observacoes, pedagios, banner_url, ativo: false
        });
        const eventId = result.lastInsertRowid;

        if (pes && Array.isArray(pes)) {
            for (const pe of pes) {
                await db.pes.create({
                    evento_id: eventId,
                    nome: pe.nome_pe, // Fixed field name from nome_pe to nome based on db.js/sql
                    localizacao: pe.link_maps_pe, // Mapping link_maps_pe to localizacao
                    horario: pe.horario_pe,
                    destino_pe_id: pe.destino_pe_id || null
                });
            }
        }
        res.status(201).json({ message: 'Event created successfully', id: eventId });
    } catch (error) {
        console.error('Create event error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.updateEvent = async (req, res) => {
    const { id } = req.params;
    const { nome, data, destino, link_maps_destino, link_inscricao, observacoes, pedagios, banner_url, pes } = req.body;

    if (!nome || !data || !destino) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        // Update event
        await db.events.update(id, {
            nome, data, destino, link_maps_destino, link_inscricao, observacoes, pedagios, banner_url
        });

        // Delete existing PEs and recreate
        const existingPes = await db.pes.findByEventId(id);
        for (const pe of existingPes) {
            await db.pes.delete(pe.id);
        }

        // Create new PEs
        if (pes && Array.isArray(pes)) {
            for (const pe of pes) {
                await db.pes.create({
                    evento_id: id,
                    nome: pe.nome_pe,
                    localizacao: pe.link_maps_pe,
                    horario: pe.horario_pe,
                    destino_pe_id: pe.destino_pe_id || null
                });
            }
        }

        res.status(200).json({ message: 'Event updated successfully' });
    } catch (error) {
        console.error('Update event error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.toggleActive = async (req, res) => {
    const { id } = req.params;
    const { ativo } = req.body; // boolean

    try {
        if (ativo) {
            await db.events.deactivateAll();
        }
        await db.events.update(id, { ativo: ativo });
        res.json({ message: `Event ${ativo ? 'activated' : 'deactivated'}` });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.deleteEvent = async (req, res) => {
    const { id } = req.params;
    try {
        await db.events.delete(id);
        res.json({ message: 'Event deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};
