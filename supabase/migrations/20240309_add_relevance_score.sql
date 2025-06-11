-- Add relevance_score column to payarticles table
ALTER TABLE payarticles
ADD COLUMN relevance_score numeric(3,1) CHECK (relevance_score >= 0 AND relevance_score <= 10);

-- Update existing rows to have a default relevance score of 7.0
UPDATE payarticles
SET relevance_score = 7.0
WHERE relevance_score IS NULL; 