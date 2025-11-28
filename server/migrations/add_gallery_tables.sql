-- Migration: add_gallery_tables
-- Created: 2025-11-27
-- Description: Creates tables for Photo Gallery feature (photos, likes, comments)

-- 1. Photos Table
CREATE TABLE IF NOT EXISTS photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evento_id BIGINT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    caption TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster photo retrieval by event
CREATE INDEX IF NOT EXISTS idx_photos_evento_id ON photos(evento_id);
CREATE INDEX IF NOT EXISTS idx_photos_created_at ON photos(created_at DESC);

-- 2. Likes Table
CREATE TABLE IF NOT EXISTS likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    photo_id UUID NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(photo_id, user_id) -- Prevent duplicate likes
);

-- Index for counting likes
CREATE INDEX IF NOT EXISTS idx_likes_photo_id ON likes(photo_id);

-- 3. Comments Table
CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    photo_id UUID NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for retrieving comments
CREATE INDEX IF NOT EXISTS idx_comments_photo_id ON comments(photo_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at ASC);

-- Add comments for documentation
COMMENT ON TABLE photos IS 'Stores photos uploaded by users for events';
COMMENT ON TABLE likes IS 'Stores user likes on photos';
COMMENT ON TABLE comments IS 'Stores user comments on photos';
