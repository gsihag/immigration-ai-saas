
-- Create agencies table
CREATE TABLE public.agencies (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    email text,
    phone text,
    address jsonb,
    website text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create enum for user roles
CREATE TYPE public.user_role AS ENUM ('agency_admin', 'agency_staff', 'client');

-- Create users table (extends Supabase auth.users)
CREATE TABLE public.users (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    agency_id uuid REFERENCES public.agencies(id) ON DELETE CASCADE,
    role public.user_role NOT NULL DEFAULT 'client',
    first_name text,
    last_name text,
    phone text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create clients table
CREATE TABLE public.clients (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
    agency_id uuid REFERENCES public.agencies(id) ON DELETE CASCADE NOT NULL,
    date_of_birth date,
    country_of_birth text,
    nationality text,
    passport_number text,
    address jsonb,
    emergency_contact jsonb,
    immigration_status text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT clients_user_agency_unique UNIQUE (user_id, agency_id)
);

-- Create enum for case status
CREATE TYPE public.case_status AS ENUM ('new', 'in_progress', 'under_review', 'approved', 'rejected', 'completed');

-- Create enum for case type
CREATE TYPE public.case_type AS ENUM ('family_based', 'employment_based', 'asylum', 'naturalization', 'other');

-- Create cases table
CREATE TABLE public.cases (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    case_number text UNIQUE NOT NULL,
    client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
    agency_id uuid REFERENCES public.agencies(id) ON DELETE CASCADE NOT NULL,
    case_type public.case_type NOT NULL,
    status public.case_status DEFAULT 'new',
    title text NOT NULL,
    description text,
    priority integer DEFAULT 1 CHECK (priority >= 1 AND priority <= 5),
    assigned_to uuid REFERENCES public.users(id),
    due_date date,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create enum for document type
CREATE TYPE public.document_type AS ENUM ('passport', 'birth_certificate', 'marriage_certificate', 'diploma', 'employment_letter', 'financial_statement', 'other');

-- Create documents table
CREATE TABLE public.documents (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE,
    case_id uuid REFERENCES public.cases(id) ON DELETE CASCADE,
    agency_id uuid REFERENCES public.agencies(id) ON DELETE CASCADE NOT NULL,
    document_type public.document_type NOT NULL,
    file_name text NOT NULL,
    file_path text NOT NULL,
    file_size integer,
    mime_type text,
    uploaded_by uuid REFERENCES public.users(id),
    is_verified boolean DEFAULT false,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_users_agency_id ON public.users(agency_id);
CREATE INDEX idx_clients_agency_id ON public.clients(agency_id);
CREATE INDEX idx_clients_user_id ON public.clients(user_id);
CREATE INDEX idx_cases_agency_id ON public.cases(agency_id);
CREATE INDEX idx_cases_client_id ON public.cases(client_id);
CREATE INDEX idx_cases_status ON public.cases(status);
CREATE INDEX idx_documents_agency_id ON public.documents(agency_id);
CREATE INDEX idx_documents_client_id ON public.documents(client_id);
CREATE INDEX idx_documents_case_id ON public.documents(case_id);

-- Enable Row Level Security on all tables
ALTER TABLE public.agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Create security definer functions to avoid RLS recursion
CREATE OR REPLACE FUNCTION public.get_user_agency_id(user_id uuid)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT agency_id FROM public.users WHERE id = user_id;
$$;

CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS public.user_role
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT role FROM public.users WHERE id = user_id;
$$;

-- RLS Policies for agencies table
CREATE POLICY "Agency admins can view their own agency" ON public.agencies
    FOR SELECT USING (id = public.get_user_agency_id(auth.uid()));

CREATE POLICY "Agency admins can update their own agency" ON public.agencies
    FOR UPDATE USING (id = public.get_user_agency_id(auth.uid()) AND public.get_user_role(auth.uid()) = 'agency_admin');

-- RLS Policies for users table
CREATE POLICY "Users can view users in their agency" ON public.users
    FOR SELECT USING (agency_id = public.get_user_agency_id(auth.uid()));

CREATE POLICY "Users can view their own profile" ON public.users
    FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can update their own profile" ON public.users
    FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Agency admins can manage users in their agency" ON public.users
    FOR ALL USING (
        agency_id = public.get_user_agency_id(auth.uid()) 
        AND public.get_user_role(auth.uid()) = 'agency_admin'
    );

-- RLS Policies for clients table
CREATE POLICY "Agency users can view clients in their agency" ON public.clients
    FOR SELECT USING (agency_id = public.get_user_agency_id(auth.uid()));

CREATE POLICY "Clients can view their own profile" ON public.clients
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Agency users can manage clients in their agency" ON public.clients
    FOR ALL USING (
        agency_id = public.get_user_agency_id(auth.uid()) 
        AND public.get_user_role(auth.uid()) IN ('agency_admin', 'agency_staff')
    );

-- RLS Policies for cases table
CREATE POLICY "Agency users can view cases in their agency" ON public.cases
    FOR SELECT USING (agency_id = public.get_user_agency_id(auth.uid()));

CREATE POLICY "Clients can view their own cases" ON public.cases
    FOR SELECT USING (
        client_id IN (
            SELECT id FROM public.clients WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Agency users can manage cases in their agency" ON public.cases
    FOR ALL USING (
        agency_id = public.get_user_agency_id(auth.uid()) 
        AND public.get_user_role(auth.uid()) IN ('agency_admin', 'agency_staff')
    );

-- RLS Policies for documents table
CREATE POLICY "Agency users can view documents in their agency" ON public.documents
    FOR SELECT USING (agency_id = public.get_user_agency_id(auth.uid()));

CREATE POLICY "Clients can view their own documents" ON public.documents
    FOR SELECT USING (
        client_id IN (
            SELECT id FROM public.clients WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Agency users can manage documents in their agency" ON public.documents
    FOR ALL USING (
        agency_id = public.get_user_agency_id(auth.uid()) 
        AND public.get_user_role(auth.uid()) IN ('agency_admin', 'agency_staff')
    );

-- Create function to automatically set user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.users (id, first_name, last_name, role)
    VALUES (
        NEW.id,
        NEW.raw_user_meta_data->>'first_name',
        NEW.raw_user_meta_data->>'last_name',
        COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'client')
    );
    RETURN NEW;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to generate case numbers
CREATE OR REPLACE FUNCTION public.generate_case_number()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
    case_num text;
    year_part text;
    sequence_part text;
BEGIN
    year_part := EXTRACT(YEAR FROM NOW())::text;
    
    SELECT LPAD((COUNT(*) + 1)::text, 4, '0') INTO sequence_part
    FROM public.cases 
    WHERE EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW());
    
    case_num := 'CASE-' || year_part || '-' || sequence_part;
    
    RETURN case_num;
END;
$$;

-- Create trigger to auto-generate case numbers
CREATE OR REPLACE FUNCTION public.set_case_number()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.case_number IS NULL OR NEW.case_number = '' THEN
        NEW.case_number := public.generate_case_number();
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER set_case_number_trigger
    BEFORE INSERT ON public.cases
    FOR EACH ROW EXECUTE FUNCTION public.set_case_number();
