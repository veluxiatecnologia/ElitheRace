const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config();

const supabaseUrl = 'https://qzsimgtlhaebdtljyozt.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF6c2ltZ3RsaGFlYmR0bGp5b3p0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3NDg2OTAsImV4cCI6MjA3OTMyNDY5MH0.BmpdtrReuRkAo6QzZB4aSrFWbdVaWePz8WdhlAPD-d0';

const supabase = createClient(supabaseUrl, supabaseKey);

const db = {
  users: {
    create: async (user) => {
      // Users are created via Supabase Auth on client side, but we might need this for admin or syncing
      // For now, we assume this is mostly read-only or updating profiles
      // But wait, the original code created users. Now Supabase Auth handles it.
      // We will map this to creating a profile if needed, but mostly this might be unused or need adaptation.
      // Actually, authController.register used this. We should deprecate authController.register in favor of client-side auth.
      // But for compatibility, let's implement it as creating a profile? No, auth needs to happen via Supabase Auth API.
      // We will leave this as a placeholder or throw error.
      throw new Error('User creation should happen via Supabase Auth on client');
    },
    findByEmail: async (email) => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
        .single();
      if (error) return null;
      return data;
    },
    findById: async (id) => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();
      if (error) return null;
      return data;
    },
    update: async (id, updates) => {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    }
  },

  events: {
    create: async (event) => {
      const { data, error } = await supabase
        .from('events')
        .insert(event)
        .select()
        .single();
      if (error) throw error;
      return { lastInsertRowid: data.id, ...data };
    },
    findAll: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('data', { ascending: false });
      if (error) throw error;
      return data;
    },
    findActive: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('ativo', true)
        .single();
      if (error) return null; // Supabase returns error if no rows found for single()
      return data;
    },
    findById: async (id) => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .single();
      if (error) return null;
      return data;
    },
    update: async (id, updates) => {
      const { error } = await supabase
        .from('events')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    delete: async (id) => {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    deactivateAll: async () => {
      const { error } = await supabase
        .from('events')
        .update({ ativo: false })
        .neq('id', 0); // Hack to update all
      if (error) throw error;
    }
  },

  pes: {
    create: async (pe) => {
      const { error } = await supabase
        .from('pes')
        .insert(pe);
      if (error) throw error;
    },
    findByEventId: async (eventId) => {
      const { data, error } = await supabase
        .from('pes')
        .select('*')
        .eq('evento_id', eventId);
      if (error) throw error;
      return data;
    },
    delete: async (id) => {
      const { error } = await supabase
        .from('pes')
        .delete()
        .eq('id', id);
      if (error) throw error;
    }
  },

  confirmations: {
    create: async (conf) => {
      const { error } = await supabase
        .from('confirmations')
        .insert(conf);
      if (error) throw error;
    },
    findByEventAndUser: async (eventId, userId) => {
      const { data, error } = await supabase
        .from('confirmations')
        .select('*')
        .eq('evento_id', eventId)
        .eq('usuario_id', userId)
        .single();
      if (error) return null;
      return data;
    },
    findByEventId: async (eventId) => {
      const { data, error } = await supabase
        .from('confirmations')
        .select('*, profiles(*)') // Join with profiles to get user names
        .eq('evento_id', eventId);
      if (error) throw error;
      // Map to match expected output if needed, or update controller
      return data.map(c => ({
        ...c,
        usuario_nome: c.profiles?.nome,
        usuario_moto: c.profiles?.moto_atual
      }));
    },
    findByUserId: async (userId) => {
      const { data, error } = await supabase
        .from('confirmations')
        .select('*, events(*)')
        .eq('usuario_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data.map(c => ({
        ...c,
        evento_nome: c.events?.nome,
        evento_data: c.events?.data,
        evento_destino: c.events?.destino
      }));
    }
  },

  peTemplates: {
    create: async (template) => {
      const { data, error } = await supabase
        .from('pe_templates')
        .insert(template)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    findAll: async () => {
      const { data, error } = await supabase
        .from('pe_templates')
        .select('*')
        .order('nome');
      if (error) throw error;
      return data;
    },
    delete: async (id) => {
      const { error } = await supabase
        .from('pe_templates')
        .delete()
        .eq('id', id);
      if (error) throw error;
    }
  }
};

module.exports = { db, supabase };
