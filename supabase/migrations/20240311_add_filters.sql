-- Add filter-related columns to articles table
ALTER TABLE payarticles
ADD COLUMN companies text[] DEFAULT '{}',
ADD COLUMN topics text[] DEFAULT '{}',
ADD COLUMN published_at timestamp with time zone DEFAULT now(),
ADD COLUMN created_at timestamp with time zone DEFAULT now();

-- Create indexes for better query performance
CREATE INDEX idx_payarticles_companies ON payarticles USING GIN (companies);
CREATE INDEX idx_payarticles_topics ON payarticles USING GIN (topics);
CREATE INDEX idx_payarticles_published_at ON payarticles (published_at);

-- Add a function to extract companies from text
CREATE OR REPLACE FUNCTION extract_companies(text_content text)
RETURNS text[] AS $$
DECLARE
  companies text[] := ARRAY[]::text[];
  company_patterns text[] := ARRAY[
    'Stripe', 'PayOS', 'Sardine', 'Plaid', 'Visa', 'Mastercard'
  ];
  pattern text;
BEGIN
  FOREACH pattern IN ARRAY company_patterns LOOP
    IF text_content ILIKE '%' || pattern || '%' THEN
      companies := array_append(companies, pattern);
    END IF;
  END LOOP;
  RETURN companies;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Add a function to extract topics from text
CREATE OR REPLACE FUNCTION extract_topics(text_content text)
RETURNS text[] AS $$
DECLARE
  topics text[] := ARRAY[]::text[];
  topic_patterns text[] := ARRAY[
    'AI', 'Fraud', 'Payments', 'Risk', 'Compliance',
    'Machine Learning', 'Automation', 'Security'
  ];
  pattern text;
BEGIN
  FOREACH pattern IN ARRAY topic_patterns LOOP
    IF text_content ILIKE '%' || pattern || '%' THEN
      topics := array_append(topics, pattern);
    END IF;
  END LOOP;
  RETURN topics;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Add a trigger to automatically extract companies and topics
CREATE OR REPLACE FUNCTION update_article_metadata()
RETURNS TRIGGER AS $$
BEGIN
  -- Extract companies and topics from title and summary
  NEW.companies := (
    SELECT ARRAY(
      SELECT DISTINCT unnest(
        extract_companies(NEW.title) || 
        extract_companies(NEW.summary)
      )
    )
  );
  
  NEW.topics := (
    SELECT ARRAY(
      SELECT DISTINCT unnest(
        extract_topics(NEW.title) || 
        extract_topics(NEW.summary)
      )
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER article_metadata_trigger
  BEFORE INSERT OR UPDATE ON payarticles
  FOR EACH ROW
  EXECUTE FUNCTION update_article_metadata(); 