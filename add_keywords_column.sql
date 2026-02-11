-- Add 'keywords' column to timeline_events table

-- 1. Add 'keywords' column (text[], optional)
ALTER TABLE timeline_events 
ADD COLUMN keywords text[];
