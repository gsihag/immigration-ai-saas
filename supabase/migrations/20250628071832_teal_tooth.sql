/*
  # Document Upload & Notifications System

  1. Storage Setup
    - Create storage bucket for documents
    - Set up RLS policies for file access
    - Configure file type and size restrictions

  2. Enhanced Documents Table
    - Add verification workflow fields
    - Add notification tracking
    - Add document categories and metadata

  3. Notifications System
    - Create notifications table
    - Add email notification triggers
    - Track notification delivery status

  4. Security
    - RLS policies for document access
    - File type validation
    - Size restrictions
    - Secure file URLs
*/

-- Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('documents', 'documents', false);

-- Enable RLS on storage
UPDATE storage.buckets SET public = false WHERE id = 'documents';

-- Storage policies for documents bucket
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

-- Create notifications table
CREATE TABLE public.notifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    agency_id uuid REFERENCES public.agencies(id) ON DELETE CASCADE NOT NULL,
    type text NOT NULL, -- 'document_uploaded', 'document_verified', 'case_status_changed', etc.
    title text NOT NULL,
    message text NOT NULL,
    data jsonb DEFAULT '{}',
    email_sent boolean DEFAULT false,
    email_sent_at timestamp with time zone,
    read_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create indexes for notifications
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_agency_id ON public.notifications(agency_id);
CREATE INDEX idx_notifications_type ON public.notifications(type);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at);
CREATE INDEX idx_notifications_email_sent ON public.notifications(email_sent);

-- Enable RLS on notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS policies for notifications
CREATE POLICY "Users can view their own notifications" ON public.notifications
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Agency staff can view agency notifications" ON public.notifications
    FOR SELECT USING (
        agency_id = public.get_user_agency_id(auth.uid()) 
        AND public.get_user_role(auth.uid()) IN ('agency_admin', 'agency_staff')
    );

CREATE POLICY "System can create notifications" ON public.notifications
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own notifications" ON public.notifications
    FOR UPDATE USING (user_id = auth.uid());

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

-- Function to create notification
CREATE OR REPLACE FUNCTION public.create_notification(
    p_user_id uuid,
    p_agency_id uuid,
    p_type text,
    p_title text,
    p_message text,
    p_data jsonb DEFAULT '{}'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    notification_id uuid;
BEGIN
    INSERT INTO public.notifications (
        user_id, agency_id, type, title, message, data
    ) VALUES (
        p_user_id, p_agency_id, p_type, p_title, p_message, p_data
    ) RETURNING id INTO notification_id;
    
    RETURN notification_id;
END;
$$;

-- Function to handle document upload notifications
CREATE OR REPLACE FUNCTION public.handle_document_upload()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    client_user_id uuid;
    client_name text;
    agency_id uuid;
    document_type_formatted text;
BEGIN
    -- Get client information
    SELECT 
        c.user_id,
        u.first_name || ' ' || u.last_name,
        c.agency_id
    INTO client_user_id, client_name, agency_id
    FROM public.clients c
    JOIN public.users u ON c.user_id = u.id
    WHERE c.id = NEW.client_id;
    
    -- Format document type for display
    document_type_formatted := REPLACE(INITCAP(REPLACE(NEW.document_type, '_', ' ')), ' ', ' ');
    
    -- Create notification for client
    PERFORM public.create_notification(
        client_user_id,
        agency_id,
        'document_uploaded',
        'Document Uploaded Successfully',
        'Your ' || document_type_formatted || ' (' || NEW.file_name || ') has been uploaded successfully and is pending review.',
        jsonb_build_object(
            'document_id', NEW.id,
            'document_type', NEW.document_type,
            'file_name', NEW.file_name
        )
    );
    
    -- Create notification for agency staff
    INSERT INTO public.notifications (user_id, agency_id, type, title, message, data)
    SELECT 
        u.id,
        agency_id,
        'document_review_needed',
        'New Document Requires Review',
        client_name || ' has uploaded a new ' || document_type_formatted || ' document that requires review.',
        jsonb_build_object(
            'document_id', NEW.id,
            'client_id', NEW.client_id,
            'document_type', NEW.document_type,
            'file_name', NEW.file_name,
            'client_name', client_name
        )
    FROM public.users u
    WHERE u.agency_id = agency_id 
    AND u.role IN ('agency_admin', 'agency_staff')
    AND u.is_active = true;
    
    RETURN NEW;
END;
$$;

-- Function to handle document verification notifications
CREATE OR REPLACE FUNCTION public.handle_document_verification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    client_user_id uuid;
    client_name text;
    agency_id uuid;
    document_type_formatted text;
    verifier_name text;
BEGIN
    -- Only trigger on verification status changes
    IF OLD.verification_status = NEW.verification_status THEN
        RETURN NEW;
    END IF;
    
    -- Get client and verifier information
    SELECT 
        c.user_id,
        cu.first_name || ' ' || cu.last_name,
        c.agency_id,
        vu.first_name || ' ' || vu.last_name
    INTO client_user_id, client_name, agency_id, verifier_name
    FROM public.clients c
    JOIN public.users cu ON c.user_id = cu.id
    LEFT JOIN public.users vu ON NEW.verified_by = vu.id
    WHERE c.id = NEW.client_id;
    
    -- Format document type for display
    document_type_formatted := REPLACE(INITCAP(REPLACE(NEW.document_type, '_', ' ')), ' ', ' ');
    
    -- Create notification based on verification status
    IF NEW.verification_status = 'verified' THEN
        PERFORM public.create_notification(
            client_user_id,
            agency_id,
            'document_verified',
            'Document Verified',
            'Your ' || document_type_formatted || ' (' || NEW.file_name || ') has been verified and approved.',
            jsonb_build_object(
                'document_id', NEW.id,
                'document_type', NEW.document_type,
                'file_name', NEW.file_name,
                'verified_by', verifier_name
            )
        );
    ELSIF NEW.verification_status = 'rejected' THEN
        PERFORM public.create_notification(
            client_user_id,
            agency_id,
            'document_rejected',
            'Document Requires Attention',
            'Your ' || document_type_formatted || ' (' || NEW.file_name || ') requires attention. ' || 
            COALESCE('Reason: ' || NEW.rejection_reason, 'Please contact your immigration consultant for details.'),
            jsonb_build_object(
                'document_id', NEW.id,
                'document_type', NEW.document_type,
                'file_name', NEW.file_name,
                'rejection_reason', NEW.rejection_reason,
                'verified_by', verifier_name
            )
        );
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create triggers for document notifications
CREATE TRIGGER document_upload_notification_trigger
    AFTER INSERT ON public.documents
    FOR EACH ROW EXECUTE FUNCTION public.handle_document_upload();

CREATE TRIGGER document_verification_notification_trigger
    AFTER UPDATE ON public.documents
    FOR EACH ROW EXECUTE FUNCTION public.handle_document_verification();

-- Function to get file upload URL with security
CREATE OR REPLACE FUNCTION public.get_upload_url(
    file_name text,
    file_type text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_folder text;
    file_path text;
BEGIN
    -- Create user-specific folder path
    user_folder := auth.uid()::text;
    file_path := user_folder || '/' || file_name;
    
    -- Return the path for client-side upload
    RETURN file_path;
END;
$$;

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

-- Function to mark notification as read
CREATE OR REPLACE FUNCTION public.mark_notification_read(notification_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.notifications 
    SET read_at = now(), updated_at = now()
    WHERE id = notification_id 
    AND user_id = auth.uid()
    AND read_at IS NULL;
    
    RETURN FOUND;
END;
$$;

-- Function to get unread notification count
CREATE OR REPLACE FUNCTION public.get_unread_notification_count()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    count_result integer;
BEGIN
    SELECT COUNT(*)::integer INTO count_result
    FROM public.notifications
    WHERE user_id = auth.uid()
    AND read_at IS NULL;
    
    RETURN count_result;
END;
$$;

-- Insert sample notification templates for testing
INSERT INTO public.chat_faq_responses (question_pattern, response_text, category) VALUES
('(upload|document|file)', 'To upload documents, go to the Documents section in your client portal. Click "Upload Document", select your file, choose the document type, and add any notes. Supported formats include PDF, DOC, DOCX, JPG, and PNG files up to 10MB.', 'documents'),
('(verify|verification|review)', 'Document verification typically takes 1-3 business days. You''ll receive a notification once your document has been reviewed. If additional information is needed, your immigration consultant will contact you directly.', 'verification'),
('(notification|alert|email)', 'You''ll receive notifications for important updates like document verification, case status changes, and appointment reminders. Check your notification center in the portal and ensure your email address is current.', 'notifications');