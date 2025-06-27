# Agency Dashboard Documentation

## Overview

The Agency Dashboard is a comprehensive management interface that allows immigration agencies to manage their profile, users, and clients through a secure, role-based web application.

## Features

### 1. Agency Profile Management

**Location**: Agency Dashboard → Agency Profile Tab

**Functionality**:
- View and edit agency basic information (name, email, phone, website)
- Manage agency address information
- Role-based access control (only agency admins can edit)

**Key Components**:
- **Basic Information Card**: Agency name, contact details, website
- **Address Information Card**: Complete address management
- **Edit Mode**: In-place editing with save/cancel functionality

**Permissions**:
- **Agency Admin**: Full read/write access
- **Agency Staff**: Read-only access
- **Client**: No access

### 2. User Management

**Location**: Agency Dashboard → User Management Tab

**Functionality**:
- View all agency users in a table format
- Add new agency users (admin/staff roles)
- Edit existing user information
- Deactivate users
- Role-based access control

**Key Features**:
- **Add User Dialog**: Complete user creation with email/password
- **Edit User Dialog**: Update user profile information
- **User Table**: Display name, email, role, phone, status
- **Role Badges**: Visual role identification
- **Status Management**: Activate/deactivate users

**Permissions**:
- **Agency Admin**: Full CRUD access to all agency users
- **Agency Staff**: No access
- **Client**: No access

### 3. Client Management

**Location**: Agency Dashboard → Client Management Tab

**Functionality**:
- View all agency clients in a comprehensive table
- Add new clients with complete profile information
- Edit existing client profiles
- Deactivate clients
- Manage personal details, address, and emergency contacts

**Key Features**:
- **Add Client Dialog**: Multi-section form for complete client onboarding
- **Edit Client Dialog**: Update all client information
- **Client Table**: Display name, email, phone, nationality, status
- **Comprehensive Forms**: Personal details, address, emergency contact
- **Status Management**: Activate/deactivate clients

**Permissions**:
- **Agency Admin**: Full CRUD access to all agency clients
- **Agency Staff**: Full CRUD access to all agency clients
- **Client**: No access

## User Interface

### Navigation

The Agency Dashboard uses a tabbed interface with three main sections:

1. **Agency Profile** (🏢): Agency information management
2. **User Management** (👥): Agency user administration
3. **Client Management** (👤): Client profile management

### Role-Based UI

The interface adapts based on user roles:

- **Disabled Tabs**: Users without permissions see disabled tabs
- **Action Buttons**: Edit/delete buttons only appear for authorized users
- **Form Fields**: Read-only vs editable based on permissions

### Responsive Design

- **Mobile-First**: Optimized for mobile devices
- **Responsive Tables**: Horizontal scrolling on smaller screens
- **Adaptive Dialogs**: Proper sizing across devices
- **Touch-Friendly**: Large touch targets for mobile users

## Data Management

### Supabase Integration

All data operations use the Supabase client SDK:

- **Real-time Updates**: Automatic data refresh
- **Row-Level Security**: Enforced at database level
- **Type Safety**: Full TypeScript integration
- **Error Handling**: Comprehensive error management

### Data Validation

- **Client-Side**: Form validation with user feedback
- **Server-Side**: Database constraints and RLS policies
- **Type Safety**: TypeScript ensures data integrity

### Security

- **RLS Enforcement**: All queries respect Row-Level Security
- **Agency Isolation**: Users can only access their agency's data
- **Role Verification**: Permissions checked at multiple levels
- **Secure Authentication**: Supabase Auth integration

## Error Handling

### User Feedback

- **Success Messages**: Toast notifications for successful operations
- **Error Messages**: Clear error descriptions for failures
- **Loading States**: Visual feedback during operations
- **Validation Errors**: Inline form validation

### Error Recovery

- **Retry Mechanisms**: Automatic retry for transient failures
- **Graceful Degradation**: Partial functionality when possible
- **Error Boundaries**: Prevent complete application crashes

## Performance Considerations

### Optimization Strategies

- **Lazy Loading**: Components loaded on demand
- **Efficient Queries**: Minimal data fetching
- **Caching**: React Query for data caching
- **Debounced Inputs**: Reduced API calls during typing

### Scalability

- **Pagination**: Large datasets handled efficiently
- **Virtual Scrolling**: For very large tables (future enhancement)
- **Optimistic Updates**: Immediate UI feedback

## Testing

### Test Coverage

- **Unit Tests**: Component functionality testing
- **Integration Tests**: API interaction testing
- **E2E Tests**: Complete user workflow testing
- **Security Tests**: Permission and RLS validation

### Test Scenarios

- **Role-Based Access**: Verify permissions work correctly
- **Data Isolation**: Ensure agency data separation
- **CRUD Operations**: Test all create/read/update/delete flows
- **Error Handling**: Validate error scenarios

## Future Enhancements

### Planned Features

- **Bulk Operations**: Mass user/client management
- **Advanced Filtering**: Complex search and filter options
- **Export Functionality**: Data export capabilities
- **Audit Logging**: Track all user actions
- **Advanced Permissions**: Granular permission system

### Performance Improvements

- **Virtual Tables**: For large datasets
- **Advanced Caching**: More sophisticated caching strategies
- **Real-time Notifications**: Live updates for collaborative work
- **Offline Support**: Basic offline functionality

## Troubleshooting

### Common Issues

1. **Permission Denied**: Check user role and agency association
2. **Data Not Loading**: Verify Supabase connection and RLS policies
3. **Form Validation**: Ensure all required fields are completed
4. **Email Conflicts**: Check for existing users with same email

### Debug Information

- **Browser Console**: Check for JavaScript errors
- **Network Tab**: Monitor API requests and responses
- **Supabase Dashboard**: Verify database operations
- **Authentication State**: Confirm user session validity

## API Reference

### Key Supabase Operations

```typescript
// Fetch agency data
const { data, error } = await supabase
  .from('agencies')
  .select('*')
  .eq('id', agencyId)
  .single();

// Create new user
const { data, error } = await supabase.auth.signUp({
  email,
  password,
  options: { data: userData }
});

// Update client information
const { error } = await supabase
  .from('clients')
  .update(clientData)
  .eq('id', clientId);
```

### Error Codes

- **PGRST116**: Row-Level Security policy violation
- **23505**: Unique constraint violation
- **23503**: Foreign key constraint violation
- **42501**: Insufficient privileges

## Support

For technical support or questions about the Agency Dashboard:

1. Check this documentation first
2. Review the troubleshooting section
3. Check browser console for errors
4. Contact the development team with specific error messages