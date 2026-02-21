-- Migration to add visitor_phone to contact_exchanges
ALTER TABLE contact_exchanges ADD COLUMN IF NOT EXISTS visitor_phone TEXT;

-- Update existing policy to be explicit if needed (already allows all columns for insert)
-- Check if we need to update any CHECK constraints if they exist, but phone format varies widely.
