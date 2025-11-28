-- Fix Storage Policies for Event Gallery
-- Revised version: Removed ALTER TABLE command which requires owner permissions

BEGIN;

-- 1. Create the bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('event-gallery', 'event-gallery', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Policies
-- We drop existing policies for this feature to ensure clean state
-- Note: If this fails, you may need to use the Supabase Dashboard UI

DROP POLICY IF EXISTS "Public can view photos" ON storage.objects;
CREATE POLICY "Public can view photos"
ON storage.objects FOR SELECT
TO public
USING ( bucket_id = 'event-gallery' );

DROP POLICY IF EXISTS "Authenticated users can upload photos" ON storage.objects;
CREATE POLICY "Authenticated users can upload photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'event-gallery' );

DROP POLICY IF EXISTS "Users can delete own photos" ON storage.objects;
CREATE POLICY "Users can delete own photos"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'event-gallery' AND auth.uid() = owner );

COMMIT;
