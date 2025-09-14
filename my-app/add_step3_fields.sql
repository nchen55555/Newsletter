-- SQL commands to add step3Form fields to the subscribers table
-- Run these commands in your Supabase SQL editor

-- Add interests field (text field for storing user interests)
ALTER TABLE subscribers 
ADD COLUMN IF NOT EXISTS interests TEXT;

-- Add interested_companies field (text field for storing companies of interest)
ALTER TABLE subscribers 
ADD COLUMN IF NOT EXISTS interested_companies TEXT;

-- Add known_cohort_members field (JSON array for storing IDs of known cohort members)
ALTER TABLE subscribers 
ADD COLUMN IF NOT EXISTS known_cohort_members JSONB DEFAULT '[]'::jsonb;

-- Add network_recommendations field (JSON array for storing name/email pairs)
ALTER TABLE subscribers 
ADD COLUMN IF NOT EXISTS network_recommendations JSONB DEFAULT '[]'::jsonb;

-- Add comments to document the new fields
COMMENT ON COLUMN subscribers.interests IS 'User interests from step 3 form (e.g., "Blockchain, Product Engineering, Series A-D Startups")';
COMMENT ON COLUMN subscribers.interested_companies IS 'Companies user is interested in from step 3 form (e.g., "Decagon, Vanta, Stripe")';
COMMENT ON COLUMN subscribers.known_cohort_members IS 'Array of cohort member IDs that the user knows (e.g., ["member1_id", "member2_id"])';
COMMENT ON COLUMN subscribers.network_recommendations IS 'Array of network recommendations with name and email (e.g., [{"name": "John Doe", "email": "john@example.com"}])';

-- Optional: Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_subscribers_interests ON subscribers USING gin(to_tsvector('english', interests));
CREATE INDEX IF NOT EXISTS idx_subscribers_interested_companies ON subscribers USING gin(to_tsvector('english', interested_companies));
CREATE INDEX IF NOT EXISTS idx_subscribers_known_cohort_members ON subscribers USING gin(known_cohort_members);
CREATE INDEX IF NOT EXISTS idx_subscribers_network_recommendations ON subscribers USING gin(network_recommendations);

-- Verify the new columns were added successfully
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'subscribers' 
AND column_name IN ('interests', 'interested_companies', 'known_cohort_members', 'network_recommendations')
ORDER BY column_name;