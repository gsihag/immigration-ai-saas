/*
  # Essential Document Upload System

  1. Storage Setup
    - Create documents storage bucket
    - Set up storage policies for secure access
    
  2. Enhanced Documents Table
    - Add verification workflow fields
    - Add document metadata fields
    
  3. Security
    - Row-level security for document access
    - Storage policies for file access
*/

-- Create storage bucket for documents (if not exists)
DO $$
BEGIN
    INSERT INTO storage.buckets (id, name, public) 
    VALUES ('documents', 'documents', false)
    ON CONFLICT (id) DO NOTHING;
END $$;

-- Storage policies for documents bucket
DO $$
BEGIN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Users can upload their own documents" ON storage.objects;
    DROP POLICY IF EXISTS "Users can view their own documents" ON storage.objects;
    DROP POLICY IF EXISTS "Users can update their own documents" ON storage.objects;
    DROP POLICY IF EXISTS "Users can delete their own documents" ON storage.objects;
    DROP POLICY IF EXISTS "Agency staff can view agency documents" ON storage.objects;
END $$;

-- Create storage policies
CREATE POLICY "Users can upload their own documents" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can view their own documents" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update their own documents" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete their own documents" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Agency staff can access documents in their agency
CREATE POLICY "Agency staff can view agency documents" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'documents' AND
    EXISTS (
      SELECT 1 FROM public.documents d
      JOIN public.clients c ON d.client_id = c.id
      WHERE d.file_path = name
      AND c.agency_id = public.get_user_agency_id(auth.uid())
      AND public.get_user_role(auth.uid()) IN ('agency_admin', 'agency_staff')
    )
  );

-- Add additional fields to documents table for enhanced functionality
DO $$
BEGIN
    -- Add verification workflow fields
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'documents' AND column_name = 'verification_status'
    ) THEN
        ALTER TABLE public.documents ADD COLUMN verification_status text DEFAULT 'pending';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'documents' AND column_name = 'verified_by'
    ) THEN
        ALTER TABLE public.documents ADD COLUMN verified_by uuid REFERENCES public.users(id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'documents' AND column_name = 'verified_at'
    ) THEN
        ALTER TABLE public.documents ADD COLUMN verified_at timestamp with time zone;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'documents' AND column_name = 'rejection_reason'
    ) THEN
        ALTER TABLE public.documents ADD COLUMN rejection_reason text;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'documents' AND column_name = 'expiry_date'
    ) THEN
        ALTER TABLE public.documents ADD COLUMN expiry_date date;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'documents' AND column_name = 'tags'
    ) THEN
        ALTER TABLE public.documents ADD COLUMN tags text[];
    END IF;
END $$;

-- Function to validate file type and size
CREATE OR REPLACE FUNCTION public.validate_document_upload(
    file_name text,
    file_size bigint,
    mime_type text
)
RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
    allowed_types text[] := ARRAY[
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg',
        'image/png',
        'image/gif',
        'text/plain'
    ];
    max_size bigint := 10485760; -- 10MB in bytes
BEGIN
    -- Check file size
    IF file_size > max_size THEN
        RAISE EXCEPTION 'File size exceeds maximum allowed size of 10MB';
    END IF;
    
    -- Check file type
    IF NOT (mime_type = ANY(allowed_types)) THEN
        RAISE EXCEPTION 'File type not allowed. Supported types: PDF, DOC, DOCX, JPG, PNG, GIF, TXT';
    END IF;
    
    RETURN true;
END;
$$;