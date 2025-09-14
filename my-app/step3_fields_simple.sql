-- Simple SQL commands to add step3Form fields
-- Copy and paste these one by one into Supabase SQL editor if needed

-- 1. Add interests field
ALTER TABLE subscribers ADD COLUMN interests TEXT;

-- 2. Add interested companies field  
ALTER TABLE subscribers ADD COLUMN interested_companies TEXT;

-- 3. Add known cohort members array
ALTER TABLE subscribers ADD COLUMN known_cohort_members JSONB DEFAULT '[]'::jsonb;

-- 4. Add network recommendations array
ALTER TABLE subscribers ADD COLUMN network_recommendations JSONB DEFAULT '[]'::jsonb;