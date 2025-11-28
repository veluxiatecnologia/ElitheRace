const { db } = require('../db');
const { generateCheckInQRCode } = require('../services/qrCodeService');

// Helper to check if date is in the same week as birthday (ignoring year)
function isBirthdayWeek(eventDateStr, birthDateStr) {
    try {
        const eventDate = new Date(eventDateStr);
        const birthDate = new Date(birthDateStr);

        // Set birth year to event year for comparison
        const currentYearBirthday = new Date(eventDate.getFullYear(), birthDate.getMonth(), birthDate.getDate());

        // Calculate difference in days
        const diffTime = Math.abs(eventDate - currentYearBirthday);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        return diffDays <= 3; // Within 3 days before or after
    } catch (e) {
        return false;
    }
}

exports.confirmAttendance = async (req, res) => {
    const { id: eventId } = req.params;
    const userId = req.user.id;
    const { moto_dia, pe_escolhido } = req.body;

    if (!moto_dia || !pe_escolhido) {
        return res.status(400).json({ error: 'Moto and PE are required' });
    }

    try {
        // 1. Get User and Event
        const user = await db.users.findById(userId);
        const event = await db.events.findById(eventId);

        if (!event || (!event.ativo && event.ativo !== true)) { // Fixed boolean check
            return res.status(400).json({ error: 'Event not active or not found' });
        }

        // 2. Check if already confirmed
        const existing = await db.confirmations.findByEventAndUser(eventId, userId);
        if (existing) {
            return res.status(400).json({ error: 'Already confirmed for this event' });
        }

        // 3. Logic Checks
        let nova_moto = false;
        if (user.moto_atual && user.moto_atual.trim().toLowerCase() !== moto_dia.trim().toLowerCase()) {
            nova_moto = true;
            await db.users.update(userId, { moto_atual: moto_dia });
        } else if (!user.moto_atual) {
            await db.users.update(userId, { moto_atual: moto_dia });
        }

        // Check birthday if user has data_nascimento (might be null in Supabase profile initially)
        const aniversariante = user.data_nascimento && isBirthdayWeek(event.data, user.data_nascimento) ? true : false;

        // 4. Update Stats
        const newParticipacoes = (user.participacoes_totais || 0) + 1;
        const newEstrelinhas = Math.floor(newParticipacoes / 4);

        await db.users.update(userId, { participacoes_totais: newParticipacoes, estrelinhas: newEstrelinhas });

        // 5. Create Confirmation
        const confirmation = await db.confirmations.create({
            evento_id: Number(eventId),
            usuario_id: userId, // UUID
            moto_dia,
            pe_escolhido,
            nova_moto,
            aniversariante_semana: aniversariante,
            estrelinhas_snapshot: newEstrelinhas
        });

        // 6. Generate QR Code for check-in
        let qrCode = null;
        let qrToken = null;
        try {
            const { token, qrCodeDataURL } = await generateCheckInQRCode(confirmation.id);
            qrToken = token;
            qrCode = qrCodeDataURL;

            // Update confirmation with QR token
            await db.confirmations.update(confirmation.id, { qr_token: token });
        } catch (qrError) {
            console.error('QR Code generation error:', qrError);
            // Don't fail the whole confirmation if QR generation fails
        }

        res.status(201).json({
            message: 'Presença confirmada!',
            confirmation: {
                id: confirmation.id,
                qr_code: qrCode,
                qr_token: qrToken
            },
            stats: {
                participacoes: newParticipacoes,
                estrelinhas: newEstrelinhas,
                nova_moto: !!nova_moto,
                aniversariante: !!aniversariante
            }
        });

    } catch (error) {
        console.error('Attendance error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getConfirmations = async (req, res) => {
    const { id } = req.params;
    try {
        const confirmations = await db.confirmations.findByEventId(id);
        res.json(confirmations);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getUserStatus = async (req, res) => {
    const { id: eventId } = req.params;
    const userId = req.user.id;

    try {
        const confirmation = await db.confirmations.findByEventAndUser(eventId, userId);
        if (confirmation) {
            res.json({ confirmed: true, data: confirmation });
        } else {
            res.json({ confirmed: false });
        }
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.generateWhatsAppList = async (req, res) => {
    const { id } = req.params;

    try {
        const event = await db.events.findById(id);
        if (!event) return res.status(404).json({ error: 'Event not found' });

        const pes = await db.pes.findByEventId(id);
        const confirmations = await db.confirmations.findByEventId(id);
        // Sort by user name (joined from profiles)
        confirmations.sort((a, b) => (a.usuario_nome || '').localeCompare(b.usuario_nome || ''));

        let text = `🏍 *${event.nome}* – ${event.data}\n`;
        text += `📍 Destino: ${event.destino}\n`;
        if (event.link_maps_destino) text += `🗺️ Maps: ${event.link_maps_destino}\n`;
        if (event.pedagios) text += `💰 Pedágios: ${event.pedagios}\n`;
        text += `\n🅿️ *Pontos de Encontro*\n`;

        pes.forEach(pe => {
            text += `  - ${pe.nome} – ${pe.horario}`; // Fixed field names
            if (pe.localizacao) text += ` – ${pe.localizacao}`; // Fixed field name
            text += `\n`;
        });

        text += `\n📋 *Lista de Confirmados*\n`;
        confirmations.forEach((conf, index) => {
            const num = String(index + 1).padStart(2, '0');
            text += `🏍${num} ${conf.usuario_nome || 'Desconhecido'} – ${conf.moto_dia} – ${conf.pe_escolhido}`;
            if (conf.nova_moto) text += ` 🆕`;
            if (conf.aniversariante_semana) text += ` 🎂`;
            text += `\n`;
        });

        res.json({ text });
    } catch (error) {
        console.error('WhatsApp list error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getEventPes = async (req, res) => {
    const { id: eventId } = req.params;
    try {
        const pes = await db.pes.findByEventId(eventId);
        res.json(pes);
    } catch (error) {
        console.error('Get event PEs error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getUserHistory = async (req, res) => {
    const userId = req.user.id;
    try {
        const history = await db.confirmations.findByUserId(userId);
        res.json(history);
    } catch (error) {
        console.error('Get user history error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
