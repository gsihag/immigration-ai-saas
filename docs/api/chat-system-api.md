# Chat System API Documentation

## Overview

The Chat System API provides real-time messaging capabilities for the Immigration AI SaaS platform, enabling communication between clients and agency staff with AI-powered FAQ responses.

## Database Schema

### Tables

#### chat_conversations
Stores conversation metadata and status.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| client_id | uuid | Foreign key to clients table |
| agency_id | uuid | Foreign key to agencies table |
| title | text | Conversation title |
| status | conversation_status | active, closed, archived |
| created_at | timestamptz | Creation timestamp |
| updated_at | timestamptz | Last update timestamp |

#### chat_messages
Stores individual messages within conversations.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| conversation_id | uuid | Foreign key to chat_conversations |
| sender_id | uuid | Foreign key to users table (null for AI) |
| sender_type | sender_type | client, agency_staff, agency_admin, ai_bot |
| message_text | text | Message content |
| message_type | message_type | text, file, system |
| is_ai_response | boolean | Whether message is AI-generated |
| metadata | jsonb | Additional message data |
| created_at | timestamptz | Creation timestamp |
| updated_at | timestamptz | Last update timestamp |

#### chat_faq_responses
Stores FAQ patterns and automated responses.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| question_pattern | text | Regex pattern for matching |
| response_text | text | Automated response |
| category | text | FAQ category |
| is_active | boolean | Whether response is active |
| created_at | timestamptz | Creation timestamp |
| updated_at | timestamptz | Last update timestamp |

## API Functions

### get_or_create_conversation(client_user_id uuid)

Creates or retrieves an active conversation for a client.

**Parameters:**
- `client_user_id`: UUID of the client user

**Returns:**
- UUID of the conversation

**Example:**
```sql
SELECT get_or_create_conversation('client-user-id');
```

### match_faq_response(question_text text)

Matches a question against FAQ patterns and returns an automated response.

**Parameters:**
- `question_text`: The question to match

**Returns:**
- Text response or null if no match

**Example:**
```sql
SELECT match_faq_response('What documents do I need?');
```

## Real-time Subscriptions

### Message Updates

Subscribe to new messages in a conversation:

```typescript
const channel = supabase
  .channel(`chat-${conversationId}`)
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'chat_messages',
      filter: `conversation_id=eq.${conversationId}`
    },
    (payload) => {
      // Handle new message
      const newMessage = payload.new;
    }
  )
  .subscribe();
```

## Row-Level Security

### Conversation Access

**Clients:**
- Can view and create conversations where they are the client
- Cannot access other clients' conversations

**Agency Staff:**
- Can view and manage conversations within their agency
- Cannot access conversations from other agencies

**Example Policy:**
```sql
CREATE POLICY "Clients can view their own conversations" 
ON chat_conversations FOR SELECT USING (
  client_id IN (
    SELECT id FROM clients WHERE user_id = auth.uid()
  )
);
```

### Message Access

**All Users:**
- Can view messages in conversations they have access to
- Can create messages in their accessible conversations

**Example Policy:**
```sql
CREATE POLICY "Users can view messages in their conversations" 
ON chat_messages FOR SELECT USING (
  conversation_id IN (
    SELECT id FROM chat_conversations 
    WHERE (
      client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
      OR agency_id = get_user_agency_id(auth.uid())
    )
  )
);
```

## Client SDK Usage

### Initialize Chat

```typescript
import { ChatWidget } from '@/components/chat/ChatWidget';

// For clients - embedded in client portal
<ChatWidget />

// For agency staff - embedded in agency dashboard
<ChatWidget />
```

### Send Message

```typescript
const sendMessage = async (messageText: string) => {
  const { error } = await supabase
    .from('chat_messages')
    .insert({
      conversation_id: conversationId,
      sender_id: user?.id,
      sender_type: user?.role === 'client' ? 'client' : 'agency_staff',
      message_text: messageText,
      message_type: 'text',
      is_ai_response: false
    });
};
```

### Load Messages

```typescript
const loadMessages = async (conversationId: string) => {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });
};
```

## AI/FAQ Integration

### FAQ Response Matching

The system automatically checks client messages against FAQ patterns:

1. Client sends message
2. System calls `match_faq_response()` function
3. If match found, AI response is automatically sent
4. Response includes `is_ai_response: true` flag

### FAQ Pattern Examples

```sql
-- Greeting patterns
'(hello|hi|hey)' -> 'Hello! How can I assist you today?'

-- Document questions
'(document|documents|paperwork)' -> 'Required documents typically include...'

-- Timeline questions
'(timeline|time|how long)' -> 'Processing times vary depending on...'
```

### Adding New FAQ Responses

```sql
INSERT INTO chat_faq_responses (question_pattern, response_text, category)
VALUES (
  '(status|progress|update)',
  'You can check your case status in your client portal.',
  'status'
);
```

## Error Handling

### Common Error Codes

- `PGRST116`: No rows found (conversation doesn't exist)
- `23503`: Foreign key violation (invalid conversation/user reference)
- `42501`: Insufficient privileges (RLS policy violation)

### Error Response Format

```typescript
interface ChatError {
  code: string;
  message: string;
  details?: string;
}
```

## Rate Limiting

### Message Limits

- Clients: 60 messages per hour
- Agency Staff: 200 messages per hour
- AI Responses: No limit (automated)

### Implementation

Rate limiting is handled at the application level using user session tracking.

## Security Considerations

### Data Isolation

- All conversations are isolated by agency
- Clients can only access their own conversations
- Agency staff can only access conversations within their agency

### Message Sanitization

- All message content is sanitized before storage
- HTML tags are stripped from user input
- URLs are validated and sanitized

### Authentication

- All API calls require valid Supabase authentication
- JWT tokens are validated on every request
- Session management handled by Supabase Auth

## Performance Optimization

### Indexing

Key indexes for optimal performance:

```sql
CREATE INDEX idx_chat_messages_conversation_id ON chat_messages(conversation_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at);
CREATE INDEX idx_chat_conversations_agency_id ON chat_conversations(agency_id);
```

### Pagination

For conversations with many messages:

```typescript
const loadMessages = async (conversationId: string, page: number = 0) => {
  const limit = 50;
  const offset = page * limit;
  
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
};
```

## Monitoring and Analytics

### Message Metrics

Track key metrics:
- Messages per conversation
- Response times
- FAQ match rates
- User engagement

### Query Examples

```sql
-- Average messages per conversation
SELECT AVG(message_count) FROM (
  SELECT conversation_id, COUNT(*) as message_count
  FROM chat_messages
  GROUP BY conversation_id
) subquery;

-- FAQ response effectiveness
SELECT 
  category,
  COUNT(*) as usage_count
FROM chat_faq_responses cfr
JOIN chat_messages cm ON cm.is_ai_response = true
WHERE cfr.is_active = true
GROUP BY category;
```

## Troubleshooting

### Common Issues

**Messages not appearing in real-time:**
- Check Supabase real-time subscription
- Verify conversation ID matches
- Confirm user has access to conversation

**FAQ responses not triggering:**
- Check question pattern regex syntax
- Verify FAQ response is active
- Test pattern matching manually

**Permission denied errors:**
- Verify user authentication
- Check RLS policies
- Confirm user has access to conversation

### Debug Queries

```sql
-- Check user's accessible conversations
SELECT * FROM chat_conversations 
WHERE client_id IN (
  SELECT id FROM clients WHERE user_id = 'user-id'
);

-- Test FAQ pattern matching
SELECT match_faq_response('test question');

-- Check message permissions
SELECT * FROM chat_messages 
WHERE conversation_id = 'conversation-id';
```