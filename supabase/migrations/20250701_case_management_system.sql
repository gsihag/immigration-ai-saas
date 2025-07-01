
-- Create case management tables for Immigration AI SaaS

-- Case activities/timeline table
CREATE TABLE IF NOT EXISTS public.case_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id),
  activity_type VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS on case activities
ALTER TABLE public.case_activities ENABLE ROW LEVEL SECURITY;

-- RLS policies for case activities
CREATE POLICY "Agency users can manage case activities in their agency"
  ON public.case_activities
  FOR ALL
  USING (
    case_id IN (
      SELECT id FROM public.cases 
      WHERE agency_id = get_user_agency_id(auth.uid())
    )
    AND get_user_role(auth.uid()) = ANY(ARRAY['agency_admin'::user_role, 'agency_staff'::user_role])
  );

CREATE POLICY "Clients can view their case activities"
  ON public.case_activities
  FOR SELECT
  USING (
    case_id IN (
      SELECT id FROM public.cases 
      WHERE client_id IN (
        SELECT id FROM public.clients WHERE user_id = auth.uid()
      )
    )
  );

-- Case notes table
CREATE TABLE IF NOT EXISTS public.case_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE,
  author_id UUID REFERENCES public.users(id),
  content TEXT NOT NULL,
  is_private BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on case notes
ALTER TABLE public.case_notes ENABLE ROW LEVEL SECURITY;

-- RLS policies for case notes
CREATE POLICY "Agency users can manage case notes in their agency"
  ON public.case_notes
  FOR ALL
  USING (
    case_id IN (
      SELECT id FROM public.cases 
      WHERE agency_id = get_user_agency_id(auth.uid())
    )
    AND get_user_role(auth.uid()) = ANY(ARRAY['agency_admin'::user_role, 'agency_staff'::user_role])
  );

CREATE POLICY "Clients can view non-private case notes"
  ON public.case_notes
  FOR SELECT
  USING (
    is_private = false
    AND case_id IN (
      SELECT id FROM public.cases 
      WHERE client_id IN (
        SELECT id FROM public.clients WHERE user_id = auth.uid()
      )
    )
  );

-- Function to create case activity
CREATE OR REPLACE FUNCTION public.create_case_activity(
  p_case_id UUID,
  p_activity_type TEXT,
  p_description TEXT,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  activity_id UUID;
  case_agency_id UUID;
  user_name TEXT;
BEGIN
  -- Get case agency and user name
  SELECT c.agency_id, u.first_name || ' ' || u.last_name
  INTO case_agency_id, user_name
  FROM public.cases c, public.users u
  WHERE c.id = p_case_id AND u.id = auth.uid();
  
  -- Create activity
  INSERT INTO public.case_activities (
    case_id, user_id, activity_type, description, metadata
  ) VALUES (
    p_case_id, auth.uid(), p_activity_type, p_description, p_metadata
  ) RETURNING id INTO activity_id;
  
  -- Update case updated_at
  UPDATE public.cases 
  SET updated_at = NOW() 
  WHERE id = p_case_id;
  
  RETURN activity_id;
END;
$$;
