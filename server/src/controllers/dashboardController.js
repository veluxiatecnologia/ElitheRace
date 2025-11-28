const { supabase } = require('../db'); // IMPORT CORRETO!

// GET /api/admin/dashboard/stats
const getDashboardStats = async (req, res) => {
    console.log('📊 [DASHBOARD] getDashboardStats called');

    try {
        // Total de membros cadastrados
        const { count: totalMembers, error: membersError } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true });

        if (membersError) throw membersError;

        // Total de eventos ativos
        const { count: activeEvents, error: eventsError } = await supabase
            .from('events')
            .select('*', { count: 'exact', head: true })
            .eq('ativo', true);

        if (eventsError) throw eventsError;

        // Total de confirmações em eventos ativos
        const { data: activeEventIds, error: eventIdsError } = await supabase
            .from('events')
            .select('id')
            .eq('ativo', true);

        if (eventIdsError) throw eventIdsError;

        const eventIds = activeEventIds?.map(e => e.id) || [];

        let totalConfirmations = 0;
        if (eventIds.length > 0) {
            const { count, error: confirmError } = await supabase
                .from('confirmations')
                .select('*', { count: 'exact', head: true })
                .in('evento_id', eventIds);

            if (confirmError) throw confirmError;
            totalConfirmations = count || 0;
        }

        const avgAttendanceRate = totalMembers > 0
            ? (totalConfirmations / (totalMembers * (activeEvents || 1))).toFixed(2)
            : 0;

        const result = {
            totalMembers: totalMembers || 0,
            activeEvents: activeEvents || 0,
            totalConfirmations,
            avgAttendanceRate: parseFloat(avgAttendanceRate)
        };

        console.log('✅ [DASHBOARD] Stats:', result);
        res.json(result);
    } catch (error) {
        console.error('❌ [DASHBOARD] Error:', error);
        res.status(500).json({ error: error.message });
    }
};

// GET /api/admin/dashboard/top10
const getTop10Participants = async (req, res) => {
    console.log('🏆 [DASHBOARD] getTop10Participants called');

    try {
        const { data: users, error: usersError } = await supabase
            .from('profiles')
            .select('id, nome, email');

        if (usersError) throw usersError;

        const { count: totalEvents, error: eventsError } = await supabase
            .from('events')
            .select('*', { count: 'exact', head: true });

        if (eventsError) throw eventsError;

        if (!users || totalEvents === 0) {
            return res.json([]);
        }

        const userStats = await Promise.all(
            users.map(async (user) => {
                const { count: confirmedEvents } = await supabase
                    .from('confirmations')
                    .select('*', { count: 'exact', head: true })
                    .eq('usuario_id', user.id);

                const participationRate = totalEvents > 0
                    ? ((confirmedEvents || 0) / totalEvents) * 100
                    : 0;

                return {
                    userId: user.id,
                    name: user.nome || user.email,
                    confirmed: confirmedEvents || 0,
                    total: totalEvents,
                    rate: parseFloat(participationRate.toFixed(1))
                };
            })
        );

        const top10 = userStats
            .sort((a, b) => b.rate - a.rate)
            .slice(0, 10);

        console.log('✅ [DASHBOARD] Top10 count:', top10.length);
        res.json(top10);
    } catch (error) {
        console.error('❌ [DASHBOARD] Error:', error);
        res.status(500).json({ error: error.message });
    }
};

// GET /api/admin/dashboard/birthdays
const getUpcomingBirthdays = async (req, res) => {
    console.log('🎂 [DASHBOARD] getUpcomingBirthdays called');

    try {
        const { data: users, error: usersError } = await supabase
            .from('profiles')
            .select('id, nome, email, data_nascimento')
            .not('data_nascimento', 'is', null);

        if (usersError) throw usersError;

        if (!users || users.length === 0) {
            return res.json([]);
        }

        const today = new Date();
        const birthdays = [];

        users.forEach(user => {
            if (!user.data_nascimento) return;

            try {
                const birthDate = new Date(user.data_nascimento);
                const thisYearBirthday = new Date(
                    today.getFullYear(),
                    birthDate.getMonth(),
                    birthDate.getDate()
                );

                if (thisYearBirthday < today) {
                    thisYearBirthday.setFullYear(today.getFullYear() + 1);
                }

                const daysUntil = Math.ceil((thisYearBirthday - today) / (1000 * 60 * 60 * 24));

                if (daysUntil >= 0 && daysUntil <= 7) {
                    const dayNames = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
                    const dayOfWeek = dayNames[thisYearBirthday.getDay()];

                    birthdays.push({
                        userId: user.id,
                        name: user.nome || user.email,
                        birthDate: `${String(birthDate.getDate()).padStart(2, '0')}/${String(birthDate.getMonth() + 1).padStart(2, '0')}`,
                        dayOfWeek,
                        daysUntil,
                        isToday: daysUntil === 0
                    });
                }
            } catch (dateError) {
                console.error(`Error processing birthday for user ${user.id}:`, dateError);
            }
        });

        birthdays.sort((a, b) => a.daysUntil - b.daysUntil);

        console.log('✅ [DASHBOARD] Birthdays count:', birthdays.length);
        res.json(birthdays);
    } catch (error) {
        console.error('❌ [DASHBOARD] Error:', error);
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getDashboardStats,
    getTop10Participants,
    getUpcomingBirthdays
};
