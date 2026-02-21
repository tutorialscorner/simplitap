-- Create Enum for Card Status
DO $$ BEGIN
    CREATE TYPE card_status AS ENUM ('UNACTIVATED', 'IN_PROCESS', 'ACTIVATED', 'BLOCKED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create Cards Table
CREATE TABLE IF NOT EXISTS cards (
    id SERIAL PRIMARY KEY,
    card_uid TEXT UNIQUE NOT NULL,
    status card_status DEFAULT 'UNACTIVATED',
    activated_at TIMESTAMP WITH TIME ZONE,
    profile_uid UUID REFERENCES profiles(id), -- Mapping to profile.id
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_cards_card_uid ON cards(card_uid);

-- Create CardTapLog Table
CREATE TABLE IF NOT EXISTS card_tap_logs (
    id SERIAL PRIMARY KEY,
    card_uid TEXT NOT NULL,
    event TEXT NOT NULL, -- TAPPED, ACTIVATION_STARTED, ACTIVATED, REDIRECTED
    ip TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS and add basic policies (optional but recommended for Supabase)
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_tap_logs ENABLE ROW LEVEL SECURITY;

-- Allow public read of cards (needed for the redirection/activation flow)
CREATE POLICY "Public profiles can read card status" ON cards
    FOR SELECT USING (true);

-- Allow service role full access
CREATE POLICY "Service role full access" ON cards
    FOR ALL USING (true) WITH CHECK (true);

-- Allow public to insert tap logs
CREATE POLICY "Allow public tap log insertion" ON card_tap_logs
    FOR INSERT WITH CHECK (true);
