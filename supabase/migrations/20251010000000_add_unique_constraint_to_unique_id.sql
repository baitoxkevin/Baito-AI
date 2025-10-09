-- Add unique constraint to unique_id field
-- This ensures that each candidate has a truly unique identifier

-- First, check if there are any duplicate unique_ids and fix them
DO $$
DECLARE
  duplicate_record RECORD;
  new_unique_id TEXT;
BEGIN
  -- Find and fix any duplicate unique_ids
  FOR duplicate_record IN
    SELECT unique_id, array_agg(id) as ids
    FROM candidates
    WHERE unique_id IS NOT NULL
    GROUP BY unique_id
    HAVING COUNT(*) > 1
  LOOP
    -- Keep the first record, update the rest
    FOR i IN 2..array_length(duplicate_record.ids, 1) LOOP
      -- Generate a new unique ID
      new_unique_id := chr(97 + floor(random() * 26)::int) ||
                      lpad(floor(random() * 100000)::text, 5, '0');

      -- Update the duplicate record
      UPDATE candidates
      SET unique_id = new_unique_id
      WHERE id = duplicate_record.ids[i];

      RAISE NOTICE 'Fixed duplicate unique_id % for candidate %',
                   duplicate_record.unique_id, duplicate_record.ids[i];
    END LOOP;
  END LOOP;
END $$;

-- Now add the unique constraint
ALTER TABLE candidates
ADD CONSTRAINT candidates_unique_id_key UNIQUE (unique_id);

-- Add comment for documentation
COMMENT ON COLUMN candidates.unique_id IS 'Unique identifier for the candidate (format: [a-z][0-9]{5}). Must be unique across all candidates.';
