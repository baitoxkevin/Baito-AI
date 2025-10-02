-- Create backup metadata table for automated database backups
CREATE TABLE IF NOT EXISTS backup_metadata (
    id TEXT PRIMARY KEY,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    size BIGINT NOT NULL DEFAULT 0,
    tables TEXT[] NOT NULL DEFAULT '{}',
    status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed')) DEFAULT 'pending',
    checksum_hash TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_backup_metadata_timestamp ON backup_metadata(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_backup_metadata_status ON backup_metadata(status);

-- Create storage bucket for database backups (if not exists)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'database-backups',
    'database-backups',
    false,
    104857600, -- 100MB limit
    ARRAY['application/json']
)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for backup metadata
ALTER TABLE backup_metadata ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read backup metadata
CREATE POLICY "Allow authenticated users to read backup metadata" ON backup_metadata
    FOR SELECT TO authenticated USING (true);

-- Allow service role to manage backups
CREATE POLICY "Allow service role to manage backups" ON backup_metadata
    FOR ALL TO service_role USING (true);

-- Set up storage policies for backup files
CREATE POLICY "Allow authenticated users to read backup files" ON storage.objects
    FOR SELECT TO authenticated USING (bucket_id = 'database-backups');

CREATE POLICY "Allow service role to manage backup files" ON storage.objects
    FOR ALL TO service_role USING (bucket_id = 'database-backups');

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_backup_metadata_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER backup_metadata_updated_at
    BEFORE UPDATE ON backup_metadata
    FOR EACH ROW
    EXECUTE FUNCTION update_backup_metadata_updated_at();

-- Create a function to clean up old backup files
CREATE OR REPLACE FUNCTION cleanup_old_backups(retention_days INTEGER DEFAULT 30)
RETURNS TABLE(deleted_count INTEGER) AS $$
DECLARE
    cutoff_date TIMESTAMPTZ;
    backup_record RECORD;
    total_deleted INTEGER := 0;
BEGIN
    cutoff_date := NOW() - INTERVAL '1 day' * retention_days;

    -- Find old backups
    FOR backup_record IN
        SELECT id FROM backup_metadata
        WHERE timestamp < cutoff_date
    LOOP
        -- Delete from storage
        PERFORM storage.delete_object('database-backups', backup_record.id || '.json');

        -- Delete metadata record
        DELETE FROM backup_metadata WHERE id = backup_record.id;

        total_deleted := total_deleted + 1;
    END LOOP;

    RETURN QUERY SELECT total_deleted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to get backup statistics
CREATE OR REPLACE FUNCTION get_backup_statistics()
RETURNS TABLE(
    total_backups INTEGER,
    successful_backups INTEGER,
    failed_backups INTEGER,
    total_size_mb NUMERIC,
    latest_backup TIMESTAMPTZ,
    oldest_backup TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*)::INTEGER as total_backups,
        COUNT(*) FILTER (WHERE status = 'completed')::INTEGER as successful_backups,
        COUNT(*) FILTER (WHERE status = 'failed')::INTEGER as failed_backups,
        ROUND(SUM(size) / 1024.0 / 1024.0, 2) as total_size_mb,
        MAX(timestamp) as latest_backup,
        MIN(timestamp) as oldest_backup
    FROM backup_metadata;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert initial comment
COMMENT ON TABLE backup_metadata IS 'Stores metadata for automated database backups';
COMMENT ON FUNCTION cleanup_old_backups(INTEGER) IS 'Removes backup files and metadata older than specified days';
COMMENT ON FUNCTION get_backup_statistics() IS 'Returns comprehensive backup statistics';

-- Log the migration
INSERT INTO backup_metadata (id, timestamp, size, tables, status, checksum_hash)
VALUES (
    'migration_initial',
    NOW(),
    0,
    ARRAY['backup_metadata'],
    'completed',
    'migration'
) ON CONFLICT (id) DO NOTHING;