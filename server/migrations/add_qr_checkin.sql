-- Add QR code token and check-in timestamp to confirmations table
-- Migration: add_qr_checkin
-- Created: 2025-11-27

-- Add new columns for QR code check-in functionality
ALTER TABLE confirmations 
ADD COLUMN IF NOT EXISTS qr_token VARCHAR(255) UNIQUE,
ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMPTZ;

-- Create index for faster QR token lookups
CREATE INDEX IF NOT EXISTS idx_confirmations_qr_token 
ON confirmations(qr_token) 
WHERE qr_token IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN confirmations.qr_token IS 'Unique UUID token for QR code check-in validation';
COMMENT ON COLUMN confirmations.checked_in_at IS 'Timestamp when user checked in at the event. NULL means no check-in yet';
