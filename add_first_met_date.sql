-- Check if couples table exists, if not create it
CREATE TABLE IF NOT EXISTS couples (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    first_met_date DATE
);

-- If table already exists, just add the column if it's missing
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'couples' AND column_name = 'first_met_date') THEN
        ALTER TABLE couples ADD COLUMN first_met_date DATE;
    END IF;
END $$;

-- Enable RLS
ALTER TABLE couples ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to read their own couple data
-- Assuming users table has a couple_id column that links to this table
CREATE POLICY "Users can view their own couple data" 
ON couples FOR SELECT 
USING (
    auth.uid() IN (
        SELECT id FROM users WHERE couple_id = couples.id
    )
);

-- Policy: Allow authenticated users to update their own couple data
CREATE POLICY "Users can update their own couple data" 
ON couples FOR UPDATE 
USING (
    auth.uid() IN (
        SELECT id FROM users WHERE couple_id = couples.id
    )
);

COMMENT ON COLUMN couples.first_met_date IS 'The date the couple first met';
