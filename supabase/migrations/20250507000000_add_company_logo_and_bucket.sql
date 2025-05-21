/*
  Add logo_url to companies table and create logos bucket
  
  This migration adds:
  1. A logo_url column to the companies table to store URLs to company logos
  2. Creates a storage bucket for logos if it doesn't exist
*/

-- Add logo_url column to companies table
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Add comment to describe the column
COMMENT ON COLUMN companies.logo_url IS 'URL pointing to the company logo image';

-- Run this SQL to create the 'logos' bucket if it doesn't exist
DO $$
BEGIN
  -- Check if the bucket already exists
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE name = 'logos') THEN
    -- Create the logos bucket with public read access
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('logos', 'logos', true);
    
    -- Add a policy to allow authenticated users to upload files
    INSERT INTO storage.policies (name, definition, bucket_id)
    VALUES (
      'Company Logos Upload Policy',
      '(storage.role() = ''authenticated'')',
      'logos'
    );
    
    -- Create a default path structure for company logos
    INSERT INTO storage.objects (bucket_id, name, owner, metadata)
    VALUES (
      'logos', 
      'company-logos/', 
      auth.uid(), 
      jsonb_build_object('mimetype', 'application/x-directory')
    );
  END IF;
END $$;