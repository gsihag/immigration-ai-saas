
# Phase 1 Testing Guide

## Overview

This document provides comprehensive testing procedures for Phase 1 of the Immigration AI SaaS application, focusing on database schema, authentication, and Row-Level Security (RLS) validation.

## Testing Environment Setup

### Prerequisites
1. Supabase project configured with Phase 1 schema
2. Frontend application running with authentication
3. Test user accounts with different roles

### Test Data Setup
Create test agencies and users for comprehensive testing:

#### Test Agency
```sql
INSERT INTO public.agencies (name, email, phone) 
VALUES ('Test Immigration Law Firm', 'admin@testfirm.com', '+1-555-0123');
```

#### Test Users
1. **Agency Admin**: admin@testfirm.com
2. **Agency Staff**: staff@testfirm.com  
3. **Client User**: client@testfirm.com
4. **External Client**: external@otherfirm.com

## Authentication Testing

### 1. User Registration
**Test Cases:**
- [ ] Register as client (default role)
- [ ] Register as agency staff
- [ ] Register as agency admin
- [ ] Verify email confirmation process
- [ ] Test password strength requirements
- [ ] Verify user profile creation trigger

**Expected Results:**
- User account created in auth.users
- Profile created in public.users with correct role
- Email verification sent (if enabled)
- JWT token issued on successful verification

### 2. User Login
**Test Cases:**
- [ ] Login with valid credentials
- [ ] Login with invalid email
- [ ] Login with invalid password
- [ ] Login with unverified email
- [ ] Test session persistence
- [ ] Test automatic token refresh

**Expected Results:**
- Successful login returns JWT token
- User profile data loaded correctly
- Invalid credentials show appropriate errors
- Session persists across browser refresh

### 3. User Logout
**Test Cases:**
- [ ] Logout clears session data
- [ ] Logged out user redirected to auth page
- [ ] Logout invalidates tokens

## Row-Level Security Testing

### 1. Agency Isolation Testing

#### Agency Admin Tests
**Login as agency admin, verify:**
- [ ] Can view own agency data only
- [ ] Can view all users in own agency
- [ ] Can update own agency information
- [ ] Cannot view other agencies' data
- [ ] Cannot access users from other agencies

#### Agency Staff Tests
**Login as agency staff, verify:**
- [ ] Can view clients in own agency
- [ ] Can view cases in own agency
- [ ] Can view documents in own agency
- [ ] Cannot view other agencies' data
- [ ] Cannot manage agency settings

#### Client Tests
**Login as client, verify:**
- [ ] Can view own profile only
- [ ] Can view own cases only
- [ ] Can view own documents only
- [ ] Cannot view other clients' data
- [ ] Cannot view agency management data

### 2. Cross-Agency Access Prevention
**Test with users from different agencies:**
- [ ] Agency A admin cannot see Agency B data
- [ ] Agency A staff cannot see Agency B clients
- [ ] Agency A client cannot see Agency B cases
- [ ] Database queries return empty results (not errors)

### 3. Role-Based Access Control
**Test role-specific permissions:**

#### Agency Admin Permissions
- [ ] Full CRUD on agency data
- [ ] Full CRUD on agency users
- [ ] Full CRUD on agency clients
- [ ] Full CRUD on agency cases
- [ ] Full CRUD on agency documents

#### Agency Staff Permissions
- [ ] Read access to agency data
- [ ] Limited CRUD on assigned cases
- [ ] Full CRUD on agency clients
- [ ] Full CRUD on case documents
- [ ] No access to user management

#### Client Permissions
- [ ] Read-only access to own profile
- [ ] Read-only access to own cases
- [ ] Read-only access to own documents
- [ ] No access to other clients
- [ ] No access to agency management

## Database Integrity Testing

### 1. Foreign Key Constraints
**Test data relationships:**
- [ ] Cannot create user without valid agency_id
- [ ] Cannot create client without valid user_id and agency_id
- [ ] Cannot create case without valid client_id and agency_id
- [ ] Cannot create document without valid agency_id
- [ ] Cascade deletes work correctly

### 2. Data Validation
**Test constraint enforcement:**
- [ ] Case priority must be 1-5
- [ ] Case numbers are unique
- [ ] Email formats validated
- [ ] Required fields enforced
- [ ] Enum values enforced

### 3. Triggers and Functions
**Test automated processes:**
- [ ] User profile created on signup
- [ ] Case numbers auto-generated
- [ ] Timestamps updated correctly
- [ ] Security functions return correct values

## API Integration Testing

### 1. Supabase Client Operations
**Test CRUD operations through client:**
- [ ] Select queries respect RLS
- [ ] Insert operations validate permissions
- [ ] Update operations enforce ownership
- [ ] Delete operations check authorization
- [ ] Real-time subscriptions work correctly

### 2. Error Handling
**Test error scenarios:**
- [ ] Permission denied errors handled gracefully
- [ ] Network errors handled properly
- [ ] Invalid data errors displayed to user
- [ ] Authentication errors trigger re-login

## Frontend Integration Testing

### 1. Authentication Flow
**Test user interface:**
- [ ] Login form validates input
- [ ] Registration form collects required data
- [ ] Loading states display correctly
- [ ] Error messages are user-friendly
- [ ] Success messages confirm actions

### 2. Role-Based UI
**Test interface adapts to user role:**
- [ ] Agency admin sees full dashboard
- [ ] Agency staff sees limited options
- [ ] Client sees personal data only
- [ ] Navigation reflects permissions
- [ ] Unauthorized sections hidden

### 3. Data Display
**Test data presentation:**
- [ ] User sees only authorized data
- [ ] Empty states handled gracefully
- [ ] Loading states during data fetch
- [ ] Real-time updates work correctly

## Performance Testing

### 1. Query Performance
**Test database performance:**
- [ ] Index usage optimized
- [ ] Complex queries execute quickly
- [ ] Large datasets load efficiently
- [ ] Pagination works correctly

### 2. RLS Policy Performance
**Test security overhead:**
- [ ] RLS policies don't cause timeouts
- [ ] Security functions execute quickly
- [ ] No infinite recursion in policies
- [ ] Concurrent users handled well

## Security Validation

### 1. SQL Injection Prevention
**Test input sanitization:**
- [ ] User input properly escaped
- [ ] Parameterized queries used
- [ ] No direct SQL construction
- [ ] ORM protections effective

### 2. Authorization Bypass Attempts
**Test security boundaries:**
- [ ] Direct API calls respect RLS
- [ ] URL manipulation doesn't expose data
- [ ] Client-side validation bypassed safely
- [ ] JWT token manipulation detected

## Test Results Documentation

### Success Criteria
All test cases must pass before Phase 1 approval:
- ✅ Authentication flows work correctly
- ✅ RLS policies enforce multi-tenancy
- ✅ Role-based access controls function
- ✅ Database integrity maintained
- ✅ Frontend integration complete
- ✅ Performance acceptable
- ✅ Security measures effective

### Issue Tracking
Document any issues found:
- Issue description
- Steps to reproduce
- Expected vs actual behavior
- Severity level
- Resolution status

### Test Evidence
Maintain test evidence:
- Screenshots of successful tests
- Database query results
- Error message captures
- Performance metrics
- Security test results

## Automated Testing (Future Enhancement)

### Unit Tests
- Component testing with Jest/React Testing Library
- Database function testing
- Utility function testing

### Integration Tests
- API endpoint testing
- Authentication flow testing
- Database integration testing

### End-to-End Tests
- User journey testing with Playwright
- Cross-browser compatibility
- Mobile responsiveness testing
