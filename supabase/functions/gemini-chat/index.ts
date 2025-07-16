
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, conversation_id, user_id } = await req.json();
    
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    console.log('Checking Gemini API key availability:', !!geminiApiKey);
    if (!geminiApiKey) {
      console.error('Gemini API key not found in environment variables');
      throw new Error('Gemini API key not configured');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get conversation history for context
    const { data: messages } = await supabase
      .from('chat_messages')
      .select('message_text, sender_type')
      .eq('conversation_id', conversation_id)
      .order('created_at', { ascending: true })
      .limit(10);

    // Build conversation context
    let contextMessages = '';
    if (messages && messages.length > 0) {
      contextMessages = messages.map(msg => 
        `${msg.sender_type === 'client' ? 'User' : 'Assistant'}: ${msg.message_text}`
      ).join('\n');
    }

    // Prepare the prompt for Australian immigration context
    const systemPrompt = `You are an expert Australian immigration assistant. You help people with:
    - Australian visa information (subclass 189, 190, 491, 482, 485, etc.)
    - Points system calculations
    - Document requirements
    - Application processes
    - Eligibility criteria
    - English language requirements
    - Occupation lists and skills assessments

    Provide accurate, helpful information about Australian immigration. If asked about other countries, politely redirect to Australian immigration topics. If you don't know something specific, suggest they book a consultation with a qualified immigration agent.

    Previous conversation:
    ${contextMessages}

    Current question: ${message}

    Respond in a friendly, professional manner. Keep responses concise but informative.`;

    // Call Gemini API
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: systemPrompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!aiResponse) {
      throw new Error('No response from Gemini AI');
    }

    // Save AI response to database
    await supabase
      .from('chat_messages')
      .insert({
        conversation_id,
        sender_id: null,
        sender_type: 'ai_bot',
        message_text: aiResponse,
        message_type: 'text',
        is_ai_response: true
      });

    console.log(`Gemini response generated for conversation ${conversation_id}`);

    return new Response(JSON.stringify({ 
      response: aiResponse,
      conversation_id 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in gemini-chat function:', error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
