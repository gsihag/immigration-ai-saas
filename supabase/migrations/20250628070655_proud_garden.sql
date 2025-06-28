/*
  # Chat System Implementation

  1. New Tables
    - `chat_conversations`
      - `id` (uuid, primary key)
      - `client_id` (uuid, foreign key to clients)
      - `agency_id` (uuid, foreign key to agencies)
      - `title` (text, conversation title)
      - `status` (enum: active, closed, archived)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `chat_messages`
      - `id` (uuid, primary key)
      - `conversation_id` (uuid, foreign key to chat_conversations)
      - `sender_id` (uuid, foreign key to users)
      - `sender_type` (enum: client, agency_staff, agency_admin, ai_bot)
      - `message_text` (text, message content)
      - `message_type` (enum: text, file, system)
      - `is_ai_response` (boolean, indicates AI-generated response)
      - `metadata` (jsonb, additional message data)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `chat_faq_responses`
      - `id` (uuid, primary key)
      - `question_pattern` (text, regex pattern for matching questions)
      - `response_text` (text, automated response)
      - `category` (text, FAQ category)
      - `is_active` (boolean, whether this response is active)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all chat tables
    - Add policies for data isolation by agency and user
    - Ensure clients can only access their own conversations
    - Agency staff can access conversations within their agency

  3. Real-time
    - Enable real-time subscriptions for chat_messages table
    - Configure proper security for real-time access
*/

-- Create enum for conversation status
CREATE TYPE public.conversation_status AS ENUM ('active', 'closed', 'archived');

-- Create enum for sender type
CREATE TYPE public.sender_type AS ENUM ('client', 'agency_staff', 'agency_admin', 'ai_bot');

-- Create enum for message type
CREATE TYPE public.message_type AS ENUM ('text', 'file', 'system');

-- Create chat_conversations table
CREATE TABLE public.chat_conversations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
    agency_id uuid REFERENCES public.agencies(id) ON DELETE CASCADE NOT NULL,
    title text DEFAULT 'New Conversation',
    status public.conversation_status DEFAULT 'active',
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create chat_messages table
CREATE TABLE public.chat_messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id uuid REFERENCES public.chat_conversations(id) ON DELETE CASCADE NOT NULL,
    sender_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
    sender_type public.sender_type NOT NULL,
    message_text text NOT NULL,
    message_type public.message_type DEFAULT 'text',
    is_ai_response boolean DEFAULT false,
    metadata jsonb DEFAULT '{}',
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create chat_faq_responses table
CREATE TABLE public.chat_faq_responses (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    question_pattern text NOT NULL,
    response_text text NOT NULL,
    category text DEFAULT 'general',
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_chat_conversations_client_id ON public.chat_conversations(client_id);
CREATE INDEX idx_chat_conversations_agency_id ON public.chat_conversations(agency_id);
CREATE INDEX idx_chat_conversations_status ON public.chat_conversations(status);
CREATE INDEX idx_chat_messages_conversation_id ON public.chat_messages(conversation_id);
CREATE INDEX idx_chat_messages_created_at ON public.chat_messages(created_at);
CREATE INDEX idx_chat_messages_sender_type ON public.chat_messages(sender_type);
CREATE INDEX idx_chat_faq_responses_category ON public.chat_faq_responses(category);
CREATE INDEX idx_chat_faq_responses_is_active ON public.chat_faq_responses(is_active);

-- Enable Row Level Security
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_faq_responses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chat_conversations
CREATE POLICY "Clients can view their own conversations" ON public.chat_conversations
    FOR SELECT USING (
        client_id IN (
            SELECT id FROM public.clients WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Agency users can view conversations in their agency" ON public.chat_conversations
    FOR SELECT USING (agency_id = public.get_user_agency_id(auth.uid()));

CREATE POLICY "Clients can create conversations" ON public.chat_conversations
    FOR INSERT WITH CHECK (
        client_id IN (
            SELECT id FROM public.clients WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Agency users can manage conversations in their agency" ON public.chat_conversations
    FOR ALL USING (
        agency_id = public.get_user_agency_id(auth.uid()) 
        AND public.get_user_role(auth.uid()) IN ('agency_admin', 'agency_staff')
    );

-- RLS Policies for chat_messages
CREATE POLICY "Users can view messages in their conversations" ON public.chat_messages
    FOR SELECT USING (
        conversation_id IN (
            SELECT id FROM public.chat_conversations 
            WHERE (
                client_id IN (
                    SELECT id FROM public.clients WHERE user_id = auth.uid()
                )
                OR agency_id = public.get_user_agency_id(auth.uid())
            )
        )
    );

CREATE POLICY "Users can create messages in their conversations" ON public.chat_messages
    FOR INSERT WITH CHECK (
        conversation_id IN (
            SELECT id FROM public.chat_conversations 
            WHERE (
                client_id IN (
                    SELECT id FROM public.clients WHERE user_id = auth.uid()
                )
                OR agency_id = public.get_user_agency_id(auth.uid())
            )
        )
    );

-- RLS Policies for chat_faq_responses (read-only for most users)
CREATE POLICY "Users can view active FAQ responses" ON public.chat_faq_responses
    FOR SELECT USING (is_active = true);

CREATE POLICY "Agency admins can manage FAQ responses" ON public.chat_faq_responses
    FOR ALL USING (public.get_user_role(auth.uid()) = 'agency_admin');

-- Insert sample FAQ responses
INSERT INTO public.chat_faq_responses (question_pattern, response_text, category) VALUES
('(hello|hi|hey)', 'Hello! I''m here to help you with your immigration questions. How can I assist you today?', 'greeting'),
('(visa|application|apply)', 'For visa applications, you''ll need to gather the required documents and submit them through the proper channels. Your immigration consultant can guide you through the specific requirements for your case type.', 'visa'),
('(document|documents|paperwork)', 'Required documents typically include passport, birth certificate, educational credentials, and proof of funds. The exact requirements depend on your specific immigration program. Please consult with your assigned consultant for a complete list.', 'documents'),
('(timeline|time|how long)', 'Processing times vary depending on the type of application and current government processing volumes. Your consultant can provide more specific timelines based on your particular case and program.', 'timeline'),
('(fee|cost|price|payment)', 'Immigration fees vary by program and include both government fees and professional service fees. Your consultant will provide a detailed breakdown of all costs associated with your application.', 'fees'),
('(status|progress|update)', 'You can check your case status in your client portal under the "My Cases" section. If you need more detailed updates, please contact your assigned consultant directly.', 'status'),
('(thank|thanks)', 'You''re welcome! If you have any other questions, feel free to ask. I''m here to help with your immigration journey.', 'gratitude'),
('(help|support|assistance)', 'I''m here to provide general information about immigration processes. For specific advice about your case, please consult with your assigned immigration consultant who can provide personalized guidance.', 'help');

-- Function to automatically update conversation timestamp when messages are added
CREATE OR REPLACE FUNCTION public.update_conversation_timestamp()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE public.chat_conversations 
    SET updated_at = now() 
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$;

-- Trigger to update conversation timestamp
CREATE TRIGGER update_conversation_timestamp_trigger
    AFTER INSERT ON public.chat_messages
    FOR EACH ROW EXECUTE FUNCTION public.update_conversation_timestamp();

-- Function to get or create conversation for a client
CREATE OR REPLACE FUNCTION public.get_or_create_conversation(client_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    conversation_id uuid;
    client_record record;
BEGIN
    -- Get client information
    SELECT c.id, c.agency_id INTO client_record
    FROM public.clients c
    WHERE c.user_id = client_user_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Client not found for user %', client_user_id;
    END IF;
    
    -- Try to find existing active conversation
    SELECT id INTO conversation_id
    FROM public.chat_conversations
    WHERE client_id = client_record.id 
    AND status = 'active'
    ORDER BY updated_at DESC
    LIMIT 1;
    
    -- Create new conversation if none exists
    IF conversation_id IS NULL THEN
        INSERT INTO public.chat_conversations (client_id, agency_id, title)
        VALUES (client_record.id, client_record.agency_id, 'New Conversation')
        RETURNING id INTO conversation_id;
    END IF;
    
    RETURN conversation_id;
END;
$$;

-- Function to match FAQ responses
CREATE OR REPLACE FUNCTION public.match_faq_response(question_text text)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
    faq_response text;
BEGIN
    SELECT response_text INTO faq_response
    FROM public.chat_faq_responses
    WHERE is_active = true
    AND question_text ~* question_pattern
    ORDER BY created_at DESC
    LIMIT 1;
    
    RETURN faq_response;
END;
$$;