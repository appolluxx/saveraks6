-- Migration: Add commute verification and duplicate image protection fields
-- Run this migration on your PostgreSQL database

-- 🔐 Add imageHash column for duplicate image detection
ALTER TABLE eco_actions ADD COLUMN IF NOT EXISTS image_hash VARCHAR(64);

-- 📍 Add commute verification columns
ALTER TABLE eco_actions ADD COLUMN IF NOT EXISTS ticket_type VARCHAR(50);
ALTER TABLE eco_actions ADD COLUMN IF NOT EXISTS ticket_image_url TEXT;
ALTER TABLE eco_actions ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP;
ALTER TABLE eco_actions ADD COLUMN IF NOT EXISTS distance_km DECIMAL(5, 2);

-- Create index on image_hash for fast duplicate lookup
CREATE INDEX IF NOT EXISTS idx_eco_actions_image_hash ON eco_actions(image_hash);

-- Create index for commute queries (by action type and date)
CREATE INDEX IF NOT EXISTS idx_eco_actions_type_date ON eco_actions(action_type, created_at DESC);

-- Verify columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'eco_actions' 
ORDER BY ordinal_position;
