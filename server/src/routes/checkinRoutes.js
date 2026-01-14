const express = require('express');
const router = express.Router();
const { supabase } = require('../db');
const { validateQRCodeData } = require('../services/qrCodeService');

/**
 * POST /api/checkin/validate
 * Validate a QR code token without registering check-in
 */
router.post('/validate', async (req, res) => {
    try {
        const { token, qrData, eventId } = req.body;

        let searchToken = token;
        let isMemberQr = false;

        // If QR data is provided, validate and extract token
        if (qrData) {
            // Try parsing as JSON (Event Token or Member Token)
            try {
                const parsed = JSON.parse(qrData);
                if (parsed.type === 'elithe_checkin') {
                    // Standard Event QR
                    if (validateQRCodeData(qrData)) {
                        searchToken = parsed.token;
                    } else {
                        return res.status(400).json({ error: 'QR Code de evento inválido' });
                    }
                } else if (parsed.type === 'elithe_member') {
                    // New Member QR
                    searchToken = parsed.userId;
                    isMemberQr = true;
                } else {
                    // Unknown JSON
                    return res.status(400).json({ error: 'Tipo de QR Code desconhecido' });
                }
            } catch (e) {
                // Not JSON, assume it might be a raw UUID (Member ID)
                // or a raw token string
                searchToken = qrData;
                // If it looks like a UUID and we have an eventId, treated as Member ID
                const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
                if (uuidRegex.test(qrData) && eventId) {
                    isMemberQr = true;
                }
            }
        }

        if (!searchToken) {
            return res.status(400).json({
                error: 'Token não fornecido'
            });
        }

        let query = supabase
            .from('confirmations')
            .select(`
                *,
                profiles!inner(nome, email),
                events!inner(id, nome, data, destino)
            `)
            .single();

        if (isMemberQr) {
            // Member QR: Find confirmation by User ID + Event ID
            if (!eventId) {
                return res.status(400).json({ error: 'Selecione um evento para validar Carteirinha de Membro' });
            }
            query = query
                .eq('usuario_id', searchToken)
                .eq('evento_id', eventId);
        } else {
            // Event QR: Find confirmation by QR Token (Unique to confirmation)
            query = query.eq('qr_token', searchToken);
        }

        const { data, error } = await query;

        if (error || !data) {
            if (isMemberQr) {
                return res.status(404).json({
                    error: 'Membro não inscrito neste evento'
                });
            } else {
                return res.status(404).json({
                    error: 'QR Code inválido ou não encontrado'
                });
            }
        }

        res.json({
            valid: true,
            confirmation: {
                id: data.id,
                qrToken: data.qr_token, // Include QR token for registration
                userName: data.profiles.nome,
                userEmail: data.profiles.email,
                eventName: data.events.nome,
                eventId: data.events.id, // Include Event ID for validation
                eventDate: data.events.data,
                eventDestination: data.events.destino,
                peEscolhido: data.pe_escolhido,
                motoDia: data.moto_dia,
                checkedIn: !!data.checked_in_at,
                checkedInAt: data.checked_in_at
            }
        });

    } catch (error) {
        console.error('Error validating QR code:', error);
        res.status(500).json({ error: 'Erro ao validar QR Code' });
    }
});

/**
 * POST /api/checkin/register
 * Register a check-in using QR code token
 * Requires admin authentication
 */
router.post('/register', async (req, res) => {
    try {
        const { token, qrData } = req.body;

        let searchToken = token;

        // If QR data is provided, validate and extract token
        if (qrData) {
            const parsed = validateQRCodeData(qrData);
            if (!parsed) {
                return res.status(400).json({
                    error: 'Formato de QR Code inválido'
                });
            }
            searchToken = parsed.token;
        }

        if (!searchToken) {
            return res.status(400).json({
                error: 'Token não fornecido'
            });
        }

        // Register check-in (only if not already checked in)
        const { data, error } = await supabase
            .from('confirmations')
            .update({ checked_in_at: new Date().toISOString() })
            .eq('qr_token', searchToken)
            .is('checked_in_at', null) // Prevent duplicate check-ins
            .select(`
                *,
                profiles!inner(nome, email),
                events!inner(nome, data, destino)
            `)
            .single();

        if (error) {
            // Check if it's because already checked in
            const { data: existing } = await supabase
                .from('confirmations')
                .select('checked_in_at, profiles(nome)')
                .eq('qr_token', searchToken)
                .single();

            if (existing?.checked_in_at) {
                return res.status(400).json({
                    error: 'Check-in já realizado',
                    alreadyCheckedIn: true,
                    checkedInAt: existing.checked_in_at,
                    userName: existing.profiles?.nome
                });
            }

            return res.status(404).json({
                error: 'QR Code não encontrado'
            });
        }

        if (!data) {
            return res.status(404).json({
                error: 'QR Code não encontrado ou já utilizado'
            });
        }

        res.json({
            success: true,
            checkedIn: {
                id: data.id,
                userName: data.profiles.nome,
                userEmail: data.profiles.email,
                eventName: data.events.nome,
                eventDate: data.events.data,
                peEscolhido: data.pe_escolhido,
                motoDia: data.moto_dia,
                checkedInAt: data.checked_in_at
            }
        });

    } catch (error) {
        console.error('Error registering check-in:', error);
        res.status(500).json({ error: 'Erro ao registrar check-in' });
    }
});

/**
 * GET /api/events/:eventId/attendance
 * Get attendance report for an event
 * Requires admin authentication
 */
router.get('/events/:eventId/attendance', async (req, res) => {
    try {
        const { eventId } = req.params;
        console.log('Fetching attendance stats for event:', eventId);

        // Get all confirmations for the event
        const { data, error } = await supabase
            .from('confirmations')
            .select(`
                id,
                pe_escolhido,
                moto_dia,
                nova_moto,
                aniversariante_semana,
                checked_in_at,
                profiles!inner(nome, email)
            `)
            .eq('evento_id', Number(eventId))
            .order('checked_in_at', { ascending: false, nullsFirst: false });

        console.log('Attendance query result:', { count: data?.length, error });

        if (error) {
            throw error;
        }

        const totalConfirmations = data.length;
        const checkedIn = data.filter(c => c.checked_in_at);
        const notCheckedIn = data.filter(c => !c.checked_in_at);

        const stats = {
            totalConfirmations,
            totalCheckedIn: checkedIn.length,
            totalNotCheckedIn: notCheckedIn.length,
            attendanceRate: totalConfirmations > 0
                ? Math.round((checkedIn.length / totalConfirmations) * 100)
                : 0,
            firstCheckIn: checkedIn.length > 0
                ? checkedIn[checkedIn.length - 1].checked_in_at
                : null,
            lastCheckIn: checkedIn.length > 0
                ? checkedIn[0].checked_in_at
                : null
        };

        const attendees = data.map(c => ({
            id: c.id,
            userName: c.profiles.nome,
            userEmail: c.profiles.email,
            peEscolhido: c.pe_escolhido,
            motoDia: c.moto_dia,
            novaMoto: c.nova_moto,
            aniversarianteSemana: c.aniversariante_semana,
            checkedIn: !!c.checked_in_at,
            checkedInAt: c.checked_in_at
        }));

        res.json({ stats, attendees });

    } catch (error) {
        console.error('Error getting attendance report:', error);
        res.status(500).json({ error: 'Erro ao gerar relatório de presença' });
    }
});

module.exports = router;
