-- Phase 1: Database Aggregation
-- Create an RPC to compute compensation analytics so the backend doesn't have to pull raw rows into memory.

CREATE OR REPLACE FUNCTION get_compensation_analytics()
RETURNS json AS $$
DECLARE
  result json;
BEGIN
  SELECT json_agg(t) INTO result
  FROM (
    SELECT 
      COALESCE(category, 'Other') as department,
      COALESCE(category_group, 'General') as role_type,
      PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY ctc) as median_ctc,
      MAX(ctc) as max_ctc,
      COUNT(id) as total_offers
    FROM jobs
    WHERE ctc IS NOT NULL AND is_active = true
    GROUP BY category, category_group
    ORDER BY total_offers DESC
  ) t;
  
  RETURN COALESCE(result, '[]'::json);
END;
$$ LANGUAGE plpgsql;
