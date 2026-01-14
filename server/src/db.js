const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

// Admin client with Service Role for user management (delete, promote)
const supabaseAdmin = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
  : null;

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
      const { data, error } = await supabase
        .from('confirmations')
        .insert(conf)
        .select()
        .single();
      if (error) throw error;
      return data;
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
    update: async (id, updates) => {
      const { data, error } = await supabase
        .from('confirmations')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
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
  },

  gallery: {
    // Photos
    createPhoto: async (photo) => {
      // Use Admin client if available to bypass RLS (since backend is trusted)
      const client = supabaseAdmin || supabase;
      const { data, error } = await client
        .from('event_photos')
        .insert(photo)
        .select('*, profiles(nome, avatar_url)')
        .single();
      if (error) throw error;
      return data;
    },
    getPhotosByEvent: async (eventId) => {
      const { data, error } = await supabase
        .from('event_photos')
        .select(`
          *,
          profiles (nome, avatar_url),
          likes (user_id),
          comments (id)
        `)
        .eq('evento_id', eventId)
        .eq('status', 'approved') // Only fetch approved photos by default
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform data to include counts and isLiked (will be handled in controller or frontend)
      return data.map(photo => ({
        ...photo,
        likeCount: photo.likes ? photo.likes.length : 0,
        commentCount: photo.comments ? photo.comments.length : 0,
        likes: photo.likes // Keep likes to check if user liked
      }));
    },
    // Admin: Get pending photos
    getPendingPhotos: async () => {
      const client = supabaseAdmin || supabase;
      const { data, error } = await client
        .from('event_photos')
        .select(`
          *,
          profiles (nome, avatar_url),
          events (nome)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    // Admin: Moderate photo
    moderatePhoto: async (photoId, status) => {
      const client = supabaseAdmin || supabase;
      const { data, error } = await client
        .from('event_photos')
        .update({ status })
        .eq('id', photoId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    deletePhoto: async (id) => {
      // Also delete from storage (will be handled in controller)
      const { error } = await supabase
        .from('event_photos')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },

    // Likes
    toggleLike: async (photoId, userId) => {
      const { data: existing } = await supabase
        .from('likes')
        .select('id')
        .eq('photo_id', photoId)
        .eq('user_id', userId)
        .single();

      const client = supabaseAdmin || supabase;
      if (existing) {
        const { error } = await client.from('likes').delete().eq('id', existing.id);
        if (error) throw error;
        return { liked: false };
      } else {
        const { error } = await client.from('likes').insert({ photo_id: photoId, user_id: userId });
        if (error) throw error;
        return { liked: true };
      }
    },

    // Comments
    addComment: async (comment) => {
      const client = supabaseAdmin || supabase;
      const { data, error } = await client
        .from('comments')
        .insert(comment)
        .select('*, profiles(nome, avatar_url)')
        .single();
      if (error) throw error;
      return data;
    },
    getCommentsByPhoto: async (photoId) => {
      const client = supabaseAdmin || supabase;
      const { data, error } = await client
        .from('comments')
        .select('*, profiles(nome, avatar_url)')
        .eq('photo_id', photoId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data;
    },
    deleteComment: async (id) => {
      const { error } = await supabase.from('comments').delete().eq('id', id);
      if (error) throw error;
    }
  }
};

module.exports = { db, supabase, supabaseAdmin };
