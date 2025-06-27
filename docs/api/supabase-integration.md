
# Supabase Integration Guide

## Overview

This document describes how the frontend integrates with Supabase for data management, authentication, and real-time features.

## Client Configuration

### Supabase Client Setup
```typescript
// src/integrations/supabase/client.ts
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "your-supabase-url";
const SUPABASE_PUBLISHABLE_KEY = "your-supabase-anon-key";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
```

### TypeScript Types
- Auto-generated types from database schema
- Located in `src/integrations/supabase/types.ts`
- Provides full type safety for database operations

## Authentication Integration

### Auth Provider
```typescript
// Example usage
const { user, session, loading, signUp, signIn, signOut } = useAuth();

// Sign up new user
await signUp(email, password, {
  first_name: "John",
  last_name: "Doe",
  role: "client"
});

// Sign in existing user
await signIn(email, password);

// Sign out
await signOut();
```

### User Profile Management
- User profiles automatically created on signup
- Profile data includes role and agency association
- RLS policies enforce data access based on user context

## Data Operations

### Basic CRUD Operations

#### Select Data
```typescript
// Get agency clients (RLS enforced)
const { data: clients, error } = await supabase
  .from('clients')
  .select('*');

// Get specific case with related data
const { data: case, error } = await supabase
  .from('cases')
  .select(`
    *,
    client:clients(*),
    assigned_user:users(*)
  `)
  .eq('id', caseId)
  .single();
```

#### Insert Data
```typescript
// Create new case
const { data, error } = await supabase
  .from('cases')
  .insert({
    client_id: clientId,
    agency_id: userAgencyId,
    case_type: 'family_based',
    title: 'Family Reunion Case',
    description: 'Case description...'
  });
```

#### Update Data
```typescript
// Update case status
const { data, error } = await supabase
  .from('cases')
  .update({ status: 'in_progress' })
  .eq('id', caseId);
```

#### Delete Data
```typescript
// Delete document
const { error } = await supabase
  .from('documents')
  .delete()
  .eq('id', documentId);
```

### Advanced Queries

#### Filtering and Sorting
```typescript
// Get cases by status with sorting
const { data: cases, error } = await supabase
  .from('cases')
  .select('*')
  .in('status', ['new', 'in_progress'])
  .order('created_at', { ascending: false })
  .limit(10);
```

#### Full-text Search
```typescript
// Search cases by title or description
const { data: cases, error } = await supabase
  .from('cases')
  .select('*')
  .textSearch('title', searchQuery);
```

## Real-time Features

### Listening to Changes
```typescript
// Listen to case updates
useEffect(() => {
  const channel = supabase
    .channel('case-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'cases'
      },
      (payload) => {
        console.log('Case updated:', payload);
        // Update local state
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, []);
```

## File Storage

### Document Upload
```typescript
// Upload file to storage
const uploadFile = async (file: File, path: string) => {
  const { data, error } = await supabase.storage
    .from('documents')
    .upload(path, file);
  
  if (!error) {
    // Create document record
    await supabase
      .from('documents')
      .insert({
        file_name: file.name,
        file_path: data.path,
        file_size: file.size,
        mime_type: file.type,
        document_type: 'other',
        client_id: clientId,
        agency_id: agencyId
      });
  }
  
  return { data, error };
};
```

### File Download
```typescript
// Get file URL
const { data: fileUrl } = supabase.storage
  .from('documents')
  .getPublicUrl(filePath);

// Download file
const { data: fileData, error } = await supabase.storage
  .from('documents')
  .download(filePath);
```

## Error Handling

### Common Error Patterns
```typescript
// Handle authentication errors
if (error?.message?.includes('Invalid login credentials')) {
  setError('Invalid email or password');
}

// Handle RLS policy violations
if (error?.code === 'PGRST116') {
  setError('You do not have permission to access this data');
}

// Handle unique constraint violations
if (error?.code === '23505') {
  setError('This record already exists');
}
```

## Performance Optimization

### Query Optimization
- Use `select()` to specify only needed columns
- Use `single()` for single row queries
- Use `maybeSingle()` when row might not exist
- Implement pagination with `range()`

### Caching with React Query
```typescript
// Cache user profile data
const { data: userProfile } = useQuery({
  queryKey: ['user-profile', user?.id],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user?.id)
      .single();
    
    if (error) throw error;
    return data;
  },
  enabled: !!user?.id
});
```

## Security Considerations

### RLS Policy Enforcement
- All data access is automatically filtered by RLS policies
- No additional authorization checks needed in frontend
- Users can only access data within their agency scope

### Data Validation
- Client-side validation for UX
- Database constraints enforce data integrity
- Use Zod schemas for form validation

## Environment Configuration

### Development
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Production
- Use environment-specific Supabase projects
- Configure proper CORS settings
- Set up monitoring and logging

## Monitoring and Debugging

### Supabase Dashboard
- Monitor API usage and performance
- View real-time logs
- Manage database and storage

### Frontend Debugging
- Use browser dev tools for network requests
- Console.log Supabase responses for debugging
- Implement error boundaries for error handling

## Migration and Schema Updates

### Schema Changes
- Use Supabase CLI for migrations
- Test migrations in staging environment
- Update TypeScript types after schema changes

### Data Migration
- Plan data migrations carefully
- Use transactions for complex migrations
- Have rollback procedures ready
