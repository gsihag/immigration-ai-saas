
# Authentication & Authorization

## Overview

The Immigration AI SaaS application uses Supabase Auth for authentication with custom Row-Level Security (RLS) policies for multi-tenant authorization.

## Authentication Flow

### 1. User Registration
- Users sign up through Supabase Auth
- User metadata includes: first_name, last_name, role
- Trigger automatically creates profile in `users` table
- Email verification required (configurable)

### 2. User Login
- Email/password authentication via Supabase
- JWT tokens managed automatically
- User profile data fetched on successful login

### 3. Session Management
- Automatic token refresh
- Persistent sessions across browser sessions
- Logout clears all session data

## User Roles

### agency_admin
- **Permissions**: Full agency management
- **Access**: All agency data, user management, settings
- **Scope**: Single agency (their own)

### agency_staff
- **Permissions**: Case and client management
- **Access**: Agency clients, assigned cases, documents
- **Scope**: Single agency (their own)

### client
- **Permissions**: View own data only
- **Access**: Personal cases, documents, profile
- **Scope**: Own data only

## Row-Level Security (RLS)

### Security Model
All tables use RLS to enforce multi-tenant isolation:

1. **Agency Isolation**: Users can only access data from their agency
2. **Role-Based Access**: Different permissions based on user role
3. **Client Privacy**: Clients can only access their own data

### RLS Policies

#### agencies table
```sql
-- View own agency
CREATE POLICY "Agency admins can view their own agency" ON public.agencies
    FOR SELECT USING (id = public.get_user_agency_id(auth.uid()));

-- Update own agency (admin only)
CREATE POLICY "Agency admins can update their own agency" ON public.agencies
    FOR UPDATE USING (id = public.get_user_agency_id(auth.uid()) 
                      AND public.get_user_role(auth.uid()) = 'agency_admin');
```

#### users table
```sql
-- View agency users
CREATE POLICY "Users can view users in their agency" ON public.users
    FOR SELECT USING (agency_id = public.get_user_agency_id(auth.uid()));

-- View own profile
CREATE POLICY "Users can view their own profile" ON public.users
    FOR SELECT USING (id = auth.uid());

-- Update own profile
CREATE POLICY "Users can update their own profile" ON public.users
    FOR UPDATE USING (id = auth.uid());

-- Admin management
CREATE POLICY "Agency admins can manage users in their agency" ON public.users
    FOR ALL USING (agency_id = public.get_user_agency_id(auth.uid()) 
                   AND public.get_user_role(auth.uid()) = 'agency_admin');
```

#### clients table
```sql
-- Agency users view agency clients
CREATE POLICY "Agency users can view clients in their agency" ON public.clients
    FOR SELECT USING (agency_id = public.get_user_agency_id(auth.uid()));

-- Clients view own profile
CREATE POLICY "Clients can view their own profile" ON public.clients
    FOR SELECT USING (user_id = auth.uid());

-- Agency staff manage clients
CREATE POLICY "Agency users can manage clients in their agency" ON public.clients
    FOR ALL USING (agency_id = public.get_user_agency_id(auth.uid()) 
                   AND public.get_user_role(auth.uid()) IN ('agency_admin', 'agency_staff'));
```

#### cases table
```sql
-- Agency users view agency cases
CREATE POLICY "Agency users can view cases in their agency" ON public.cases
    FOR SELECT USING (agency_id = public.get_user_agency_id(auth.uid()));

-- Clients view own cases
CREATE POLICY "Clients can view their own cases" ON public.cases
    FOR SELECT USING (client_id IN (
        SELECT id FROM public.clients WHERE user_id = auth.uid()
    ));

-- Agency staff manage cases
CREATE POLICY "Agency users can manage cases in their agency" ON public.cases
    FOR ALL USING (agency_id = public.get_user_agency_id(auth.uid()) 
                   AND public.get_user_role(auth.uid()) IN ('agency_admin', 'agency_staff'));
```

#### documents table
```sql
-- Similar pattern for documents table
-- Agency isolation + role-based access + client privacy
```

## Security Functions

### get_user_agency_id(user_id uuid)
- **Purpose**: Avoid RLS recursion when checking user's agency
- **Security**: SECURITY DEFINER prevents policy loops
- **Usage**: Used in all RLS policies for agency isolation

### get_user_role(user_id uuid)
- **Purpose**: Avoid RLS recursion when checking user's role
- **Security**: SECURITY DEFINER prevents policy loops
- **Usage**: Used in RLS policies for role-based access

## Frontend Integration

### AuthProvider Component
- React Context for authentication state
- Handles login, logout, and session management
- Fetches user profile data including role and agency_id
- Provides loading states and error handling

### Protected Routes
- Authentication required for all dashboard routes
- Role-based component rendering
- Automatic redirect to login if not authenticated

### API Integration
- Supabase client automatically includes auth tokens
- RLS policies enforce data access at database level
- No additional authorization checks needed in frontend

## Configuration

### Supabase Auth Settings
- Site URL: Set to your application domain
- Redirect URLs: Configure for your deployment
- Email templates: Customize as needed
- Password requirements: Configure minimum complexity

### Environment Variables
```env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## Security Best Practices

1. **JWT Validation**: Handled by Supabase automatically
2. **RLS Enforcement**: All data access goes through RLS policies
3. **Multi-tenancy**: Strict agency isolation at database level
4. **Role Verification**: User roles verified at database level
5. **Session Security**: Secure token storage and refresh
6. **CSRF Protection**: Supabase handles CSRF protection

## Testing Security

### RLS Policy Testing
1. Create test users with different roles
2. Verify agency isolation works correctly
3. Test that clients can't access other clients' data
4. Confirm role-based permissions work as expected

### Authentication Testing
1. Test signup/login flows
2. Verify email verification (if enabled)
3. Test session persistence
4. Test logout functionality

## Troubleshooting

### Common Issues
1. **RLS Recursion**: Use security definer functions
2. **Permission Denied**: Check RLS policies and user roles
3. **Agency Assignment**: Ensure users are assigned to agencies
4. **Token Expiry**: Supabase handles refresh automatically
