
# API Documentation

## Overview

The Immigration AI SaaS platform provides a comprehensive REST API built with Supabase for backend services. This documentation covers all available endpoints, authentication methods, and usage examples.

## Authentication

All API requests require authentication using Supabase JWT tokens.

### Getting Started

1. **Sign Up/Sign In**: Use Supabase Auth to create an account or log in
2. **JWT Token**: Include the JWT token in the Authorization header
3. **Role-Based Access**: Access is controlled by user roles (client, agency_staff, agency_admin)

```javascript
// Example authentication
import { supabase } from '@/integrations/supabase/client';

// Sign up
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'securePassword123'
});

// Sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'securePassword123'
});
```

## Core Entities

### Users

#### Get Current User
```javascript
const { data: user } = await supabase.auth.getUser();
```

#### Update User Profile
```javascript
const { data, error } = await supabase
  .from('users')
  .update({
    first_name: 'John',
    last_name: 'Doe',
    phone: '+1-555-0123'
  })
  .eq('id', userId);
```

### Agencies

#### Get Agency Information
```javascript
const { data, error } = await supabase
  .from('agencies')
  .select('*')
  .eq('id', agencyId)
  .single();
```

#### Update Agency Profile
```javascript
const { data, error } = await supabase
  .from('agencies')
  .update({
    name: 'Updated Agency Name',
    email: 'new@agency.com',
    phone: '+1-555-9999',
    website: 'https://newwebsite.com',
    address: {
      street: '123 Main St',
      city: 'Toronto',
      state: 'ON',
      zipCode: 'M5V 3A8',
      country: 'Canada'
    }
  })
  .eq('id', agencyId);
```

### Clients

#### Get Client Profile
```javascript
const { data, error } = await supabase
  .from('clients')
  .select('*')
  .eq('user_id', userId)
  .single();
```

#### Update Client Information
```javascript
const { data, error } = await supabase
  .from('clients')
  .update({
    date_of_birth: '1990-01-01',
    country_of_birth: 'Canada',
    nationality: 'Canadian',
    passport_number: 'CA123456789',
    immigration_status: 'Permanent Resident',
    address: {
      street: '456 Oak Ave',
      city: 'Vancouver',
      state: 'BC',
      zipCode: 'V6B 1A1',
      country: 'Canada'
    },
    emergency_contact: {
      name: 'Jane Doe',
      phone: '+1-604-555-0123',
      relationship: 'Sister'
    }
  })
  .eq('user_id', userId);
```

### Documents

#### Upload Document
```javascript
// Upload file to storage
const { data: uploadData, error: uploadError } = await supabase.storage
  .from('documents')
  .upload(`${userId}/${fileName}`, file);

// Create document record
const { data, error } = await supabase
  .from('documents')
  .insert({
    client_id: clientId,
    agency_id: agencyId,
    file_name: fileName,
    file_path: uploadData.path,
    file_size: file.size,
    document_type: 'passport',
    verification_status: 'pending'
  });
```

#### Get Documents
```javascript
const { data, error } = await supabase
  .from('documents')
  .select('*')
  .eq('client_id', clientId)
  .order('created_at', { ascending: false });
```

#### Download Document
```javascript
const { data, error } = await supabase.storage
  .from('documents')
  .download(filePath);
```

#### Update Document Status
```javascript
const { data, error } = await supabase
  .from('documents')
  .update({
    verification_status: 'verified',
    notes: 'Document verified successfully'
  })
  .eq('id', documentId);
```

### Chat System

#### Get or Create Conversation
```javascript
const { data, error } = await supabase
  .rpc('get_or_create_conversation', {
    p_client_id: clientId
  });
```

#### Send Message
```javascript
const { data, error } = await supabase
  .from('chat_messages')
  .insert({
    conversation_id: conversationId,
    sender_id: userId,
    message_text: 'Hello, I need help with my application',
    sender_type: 'client'
  });
```

#### Get Messages
```javascript
const { data, error } = await supabase
  .from('chat_messages')
  .select('*')
  .eq('conversation_id', conversationId)
  .order('created_at', { ascending: true });
```

#### Get FAQ Response
```javascript
const { data, error } = await supabase
  .rpc('match_faq_response', {
    question_text: 'What documents do I need?'
  });
```

### Notifications

#### Get User Notifications
```javascript
const { data, error } = await supabase
  .from('notifications')
  .select('*')
  .eq('user_id', userId)
  .order('created_at', { ascending: false });
```

#### Mark Notification as Read
```javascript
const { data, error } = await supabase
  .from('notifications')
  .update({ is_read: true })
  .eq('id', notificationId);
```

## Real-time Subscriptions

### Chat Messages
```javascript
const subscription = supabase
  .channel('chat_messages')
  .on('postgres_changes', 
    { 
      event: 'INSERT', 
      schema: 'public', 
      table: 'chat_messages',
      filter: `conversation_id=eq.${conversationId}`
    }, 
    (payload) => {
      console.log('New message:', payload.new);
    }
  )
  .subscribe();
```

### Notifications
```javascript
const subscription = supabase
  .channel('notifications')
  .on('postgres_changes', 
    { 
      event: 'INSERT', 
      schema: 'public', 
      table: 'notifications',
      filter: `user_id=eq.${userId}`
    }, 
    (payload) => {
      console.log('New notification:', payload.new);
    }
  )
  .subscribe();
```

## Error Handling

### Common Error Codes

- **400**: Bad Request - Invalid parameters or missing required fields
- **401**: Unauthorized - Invalid or missing authentication token
- **403**: Forbidden - Insufficient permissions for the requested operation
- **404**: Not Found - Requested resource does not exist
- **409**: Conflict - Resource already exists or constraint violation
- **500**: Internal Server Error - Server-side error

### Error Response Format
```json
{
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE",
    "details": "Additional error details"
  }
}
```

## Rate Limiting

API requests are rate-limited based on the user's subscription plan:
- **Free Plan**: 100 requests per minute
- **Pro Plan**: 1000 requests per minute
- **Enterprise Plan**: Custom limits

## Security Best Practices

1. **Always use HTTPS** for API requests
2. **Store JWT tokens securely** (not in localStorage for sensitive apps)
3. **Implement proper error handling** to avoid exposing sensitive information
4. **Use Row-Level Security** policies for data isolation
5. **Validate all input data** on both client and server sides
6. **Monitor API usage** for unusual patterns

## SDK and Libraries

### JavaScript/TypeScript
```bash
npm install @supabase/supabase-js
```

### Python (for backend integrations)
```bash
pip install supabase
```

## Support

For API support and questions:
- **Documentation**: This guide and inline code comments
- **Issue Tracking**: GitHub repository issues
- **Community**: Discord community channel
