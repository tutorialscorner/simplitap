-- Add columns for multiple phones and emails
ALTER TABLE public.contacts_v2 
ADD COLUMN IF NOT EXISTS phone_2 text DEFAULT '-',
ADD COLUMN IF NOT EXISTS email_2 text DEFAULT '-',
ADD COLUMN IF NOT EXISTS address text,
ADD COLUMN IF NOT EXISTS business_name text;

-- Rename existing columns to phone_1 and email_1 for clarity, 
-- but wait, existing code uses 'phone' and 'email'.
-- Better to just add phone_2 and email_2 and keep original names for compatibility.
