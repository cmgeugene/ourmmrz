-- Function to get statistics for a specific couple
CREATE OR REPLACE FUNCTION get_couple_stats(cid UUID)
RETURNS JSON AS $$
DECLARE
  total_count INT;
  latest_date TIMESTAMP WITH TIME ZONE;
  top_places JSON;
  top_categories JSON;
BEGIN
  -- Total Memories
  SELECT COUNT(*) INTO total_count
  FROM timeline_events
  WHERE couple_id = cid;

  -- Latest Memory Date
  SELECT event_date INTO latest_date
  FROM timeline_events
  WHERE couple_id = cid
  ORDER BY event_date DESC
  LIMIT 1;

  -- Top Places (Location)
  -- Filter out empty locations
  SELECT json_agg(t) INTO top_places
  FROM (
    SELECT location, COUNT(*) as count
    FROM timeline_events
    WHERE couple_id = cid AND location IS NOT NULL AND location != ''
    GROUP BY location
    ORDER BY count DESC
    LIMIT 3
  ) t;

  -- Top Categories
  SELECT json_agg(t) INTO top_categories
  FROM (
    SELECT category, COUNT(*) as count
    FROM timeline_events
    WHERE couple_id = cid AND category IS NOT NULL
    GROUP BY category
    ORDER BY count DESC
    LIMIT 3
  ) t;

  RETURN json_build_object(
    'total_memories', total_count,
    'latest_memory_date', latest_date,
    'top_places', COALESCE(top_places, '[]'::json),
    'top_categories', COALESCE(top_categories, '[]'::json)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
