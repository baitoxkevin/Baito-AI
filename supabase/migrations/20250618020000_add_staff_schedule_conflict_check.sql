-- Add staff schedule conflict check function
-- Checks if staff is already assigned to another project on the same dates

CREATE OR REPLACE FUNCTION check_staff_schedule_conflicts(
  p_staff_id TEXT,
  p_working_dates TEXT[],
  p_exclude_project_id TEXT DEFAULT NULL
)
RETURNS TABLE (
  date TEXT,
  project_id TEXT,
  project_title TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate the input
  IF p_staff_id IS NULL OR p_working_dates IS NULL OR array_length(p_working_dates, 1) IS NULL THEN
    RETURN;
  END IF;

  -- Return conflicts by finding other projects this staff is assigned to on the given dates
  RETURN QUERY
  WITH staff_dates AS (
    SELECT unnest(p_working_dates) AS check_date
  )
  SELECT 
    CAST(sd.check_date AS TEXT),
    ps.project_id,
    p.title AS project_title
  FROM staff_dates sd
  JOIN project_staff ps ON ps.id = p_staff_id
  JOIN projects p ON p.id = ps.project_id
  WHERE 
    -- Skip the current project being edited if specified
    (p_exclude_project_id IS NULL OR ps.project_id != p_exclude_project_id)
    -- Check each existing working date
    AND EXISTS (
      SELECT 1
      FROM jsonb_array_elements(
        CASE 
          WHEN jsonb_typeof(ps.working_dates_with_salary) = 'array' THEN ps.working_dates_with_salary
          ELSE '[]'::jsonb
        END
      ) AS dates(d)
      WHERE 
        -- Compare date strings - handle both date formats
        CASE 
          WHEN jsonb_typeof(dates.d->'date') = 'string' THEN 
            dates.d->>'date' = sd.check_date
          ELSE
            to_char(
              to_timestamp((dates.d->>'date')::bigint / 1000), 
              'YYYY-MM-DD'
            ) = sd.check_date
        END
    );
END;
$$;

COMMENT ON FUNCTION check_staff_schedule_conflicts IS 'Checks if staff is already scheduled on specific dates for other projects';

-- Grant access to authenticated users
GRANT EXECUTE ON FUNCTION check_staff_schedule_conflicts TO authenticated;