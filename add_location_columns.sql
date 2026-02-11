-- Add location-related columns to timeline_events table

-- 1. Add 'location' column (text, optional)
ALTER TABLE timeline_events 
ADD COLUMN location text;

-- 2. Add 'latitude' column (float8, optional)
ALTER TABLE timeline_events 
ADD COLUMN latitude float8;

-- 3. Add 'longitude' column (float8, optional)
ALTER TABLE timeline_events 
ADD COLUMN longitude float8;
