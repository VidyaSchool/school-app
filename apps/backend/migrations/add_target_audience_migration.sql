-- Migration: Add target_audience column to slider_image table
-- This allows filtering slider images by role (all, students, teachers)

-- Add the new column with default value 'all'
ALTER TABLE slider_image 
ADD COLUMN IF NOT EXISTS target_audience VARCHAR(20) DEFAULT 'all';

-- Update existing records to have 'all' as target_audience
UPDATE slider_image 
SET target_audience = 'all' 
WHERE target_audience IS NULL;

-- Add a check constraint to ensure valid values
ALTER TABLE slider_image 
ADD CONSTRAINT check_target_audience 
CHECK (target_audience IN ('all', 'students', 'teachers'));
