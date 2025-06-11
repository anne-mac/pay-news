-- Create payarticles table
CREATE TABLE IF NOT EXISTS payarticles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    summary TEXT NOT NULL,
    fetched_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, now()) NOT NULL
);

-- Create index on created_at for faster sorting
CREATE INDEX IF NOT EXISTS payarticles_created_at_idx ON payarticles(created_at DESC);

-- Create unique index on title to prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS payarticles_title_idx ON payarticles(title);

-- Enable Row Level Security (RLS)
ALTER TABLE payarticles ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows all operations for now
-- You can make this more restrictive later based on your auth requirements
CREATE POLICY "Allow all operations" ON payarticles
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true); 