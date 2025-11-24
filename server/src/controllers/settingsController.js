const { supabase } = require('../db');

const getWhatsAppTemplate = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('app_settings')
            .select('value')
            .eq('key', 'whatsapp_template')
            .single();

        if (error) throw error;

        res.json({ template: data?.value || '' });
    } catch (error) {
        console.error('Erro ao buscar template:', error);
        res.status(500).json({ error: 'Erro ao buscar template' });
    }
};

const updateWhatsAppTemplate = async (req, res) => {
    const { template } = req.body;

    try {
        const { error } = await supabase
            .from('app_settings')
            .upsert({ key: 'whatsapp_template', value: template });

        if (error) throw error;

        res.json({ message: 'Template atualizado com sucesso' });
    } catch (error) {
        console.error('Erro ao atualizar template:', error);
        res.status(500).json({ error: 'Erro ao atualizar template' });
    }
};

module.exports = {
    getWhatsAppTemplate,
    updateWhatsAppTemplate
};
