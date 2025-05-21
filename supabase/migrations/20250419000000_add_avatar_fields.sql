-- Add avatar fields to users table
ALTER TABLE "public"."users" ADD COLUMN IF NOT EXISTS "avatar_url" TEXT;
ALTER TABLE "public"."users" ADD COLUMN IF NOT EXISTS "avatar_seed" TEXT;
ALTER TABLE "public"."users" ADD COLUMN IF NOT EXISTS "username" TEXT;

-- Update existing users to have a default avatar seed (their user ID)
UPDATE "public"."users" SET "avatar_seed" = "id" WHERE "avatar_seed" IS NULL;

-- Add a default username derived from email for users without a username
UPDATE "public"."users" 
SET "username" = LOWER(SPLIT_PART("email", '@', 1)) 
WHERE "username" IS NULL;

-- Track updates to these columns
CREATE OR REPLACE FUNCTION public.handle_user_update()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'user_update_timestamp'
  ) THEN
    CREATE TRIGGER user_update_timestamp
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_user_update();
  END IF;
END
$$;