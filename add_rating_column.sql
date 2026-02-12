-- Add rating column to timeline_events table
ALTER TABLE timeline_events 
ADD COLUMN rating numeric(2, 1) CHECK (rating >= 0 AND rating <= 5);

COMMENT ON COLUMN timeline_events.rating IS 'Star rating for the memory, from 0.0 to 5.0 in 0.5 increments';
