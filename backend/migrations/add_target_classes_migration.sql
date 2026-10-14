-- Migration: Add target_classes column to slider_image table
-- This allows filtering slider images by specific class numbers for students

-- Add the new column with default value 'all'
ALTER TABLE slider_image 
ADD COLUMN IF NOT EXISTS target_classes VARCHAR(50) DEFAULT 'all';

-- Update existing records to have 'all' as target_classes
UPDATE slider_image 
SET target_classes = 'all' 
WHERE target_classes IS NULL;

-- Add an index for faster filtering
CREATE INDEX IF NOT EXISTS idx_slider_target_classes ON slider_image(target_classes);

-- Comment for documentation
COMMENT ON COLUMN slider_image.target_classes IS 'Comma-separated class numbers (e.g., "1,2,3,10,11,12") or "all" for all classes';
