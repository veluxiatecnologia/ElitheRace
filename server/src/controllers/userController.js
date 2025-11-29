const { supabase, supabaseAdmin } = require('../db');

const userController = {
    // Get all users (profiles)
    getAllUsers: async (req, res) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('nome');

            if (error) throw error;

            res.json(data);
        } catch (error) {
            console.error('Error fetching users:', error);
            res.status(500).json({ error: 'Erro ao buscar usuários' });
        }
    },

    // Promote user to admin
    promoteUser: async (req, res) => {
        const { id } = req.params;

        try {
            if (!supabaseAdmin) {
                return res.status(503).json({ error: 'Funcionalidade indisponível: Chave de serviço não configurada' });
            }

            // 1. Update Profile
            const { error: profileError } = await supabase
                .from('profiles')
                .update({ role: 'admin' })
                .eq('id', id);

            if (profileError) throw profileError;

            // 2. Update Supabase Auth Metadata (so JWT has correct role)
            const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
                id,
                { user_metadata: { role: 'admin' } }
            );

            if (authError) throw authError;

            res.json({ message: 'Usuário promovido com sucesso' });
        } catch (error) {
            console.error('Error promoting user:', error);
            res.status(500).json({ error: 'Erro ao promover usuário' });
        }
    },

    // Delete user
    deleteUser: async (req, res) => {
        const { id } = req.params;

        try {
            if (!supabaseAdmin) {
                return res.status(503).json({ error: 'Funcionalidade indisponível: Chave de serviço não configurada' });
            }

            // 1. Delete from Supabase Auth (this usually cascades to profiles if set up, but we'll do both to be safe/explicit if needed)
            // Actually, deleting from Auth is the most important part.
            const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id);

            if (authError) throw authError;

            // 2. We can manually delete from profiles if cascade isn't set up, but let's assume Auth deletion is the primary action.
            // If we want to be sure profile is gone:
            const { error: profileError } = await supabase
                .from('profiles')
                .delete()
                .eq('id', id);

            // Ignore profile error if it was already deleted by cascade
            if (profileError && profileError.code !== 'PGRST116') {
                console.warn('Profile deletion warning:', profileError);
            }

            res.json({ message: 'Usuário excluído com sucesso' });
        } catch (error) {
            console.error('Error deleting user:', error);
            res.status(500).json({ error: 'Erro ao excluir usuário' });
        }
    }
};

// Demote a user to member
exports.demoteUser = async (req, res) => {
    const { id } = req.params;

    try {
        if (!supabaseAdmin) {
            throw new Error('SUPABASE_SERVICE_ROLE_KEY não configurada');
        }

        // 1. Update Profile
        const { error: profileError } = await supabase
            .from('profiles')
            .update({ role: 'member' })
            .eq('id', id);

        if (profileError) throw profileError;

        // 2. Update Supabase Auth Metadata
        const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
            id,
            { user_metadata: { role: 'member' } }
        );

        if (authError) throw authError;

        res.json({ message: 'Usuário despromovido com sucesso' });
    } catch (error) {
        console.error('Erro ao despromover usuário:', error);
        res.status(500).json({ error: error.message || 'Erro ao despromover usuário' });
    }
};

module.exports = userController;
