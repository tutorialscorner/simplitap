-- Migration to add notes to contacts_v2
ALTER TABLE contacts_v2 ADD COLUMN IF NOT EXISTS notes TEXT;
