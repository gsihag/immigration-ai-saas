# Phase 3 Testing Guide - Client Portal

## Overview

This document provides comprehensive testing procedures for Phase 3 of the Immigration AI SaaS application, focusing on the client portal functionality including signup, profile management, and data entry.

## Testing Environment Setup

### Prerequisites
1. Supabase project configured with Phase 1-2 schema
2. Frontend application running with client portal components
3. Test client accounts with different data states

### Test Data Setup
Use the sample data from `data/fixtures/clients.yaml` for comprehensive testing:

#### Test Clients
1. **Alice Johnson** (alice.johnson@example.com) - Complete profile with all data
2. **Priya Patel** (priya.patel@example.com) - Partial profile data
3. **New Client** - For testing signup flow

## Client Portal Testing

### 1. Client Registration/Signup

#### Test Cases:
- [ ] **Valid Registration**
  - Navigate to client signup page
  - Fill in all required fields with valid data
  - Submit form and verify account creation
  - Confirm automatic login after registration
  - Verify client role assignment

- [ ] **Form Validation**
  - Test empty required fields
  - Test invalid email formats
  - Test password mismatch
  - Test password length requirements
  - Verify error messages are clear and helpful

- [ ] **Duplicate Email Prevention**
  - Attempt to register with existing email
  - Verify appropriate error message
  - Confirm no duplicate accounts created

**Expected Results:**
- Valid registrations create new client accounts
- Form validation prevents invalid submissions
- Error messages guide users to correct issues
- Duplicate emails are properly handled

### 2. Client Login

#### Test Cases:
- [ ] **Valid Login**
  - Login with correct email/password
  - Verify successful authentication
  - Confirm redirect to client portal
  - Check user session persistence

- [ ] **Invalid Login**
  - Test incorrect email
  - Test incorrect password
  - Test non-existent account
  - Verify appropriate error messages

- [ ] **Session Management**
  - Test session persistence across browser refresh
  - Test automatic logout after inactivity
  - Verify secure logout functionality

**Expected Results:**
- Valid credentials allow access to client portal
- Invalid credentials show clear error messages
- Sessions are managed securely

### 3. Profile Management

#### Test Cases:
- [ ] **View Profile Information**
  - Login as existing client
  - Navigate to profile section
  - Verify all profile sections are displayed
  - Check data loads correctly from database

- [ ] **Edit Personal Information**
  - Click "Edit Profile" button
  - Modify personal details (name, phone, etc.)
  - Save changes and verify updates
  - Test cancel functionality

- [ ] **Edit Immigration Details**
  - Update immigration-specific information
  - Test date field validation
  - Verify passport number formatting
  - Check nationality and country fields

- [ ] **Address Management**
  - Update address information
  - Test all address fields
  - Verify proper formatting and validation

- [ ] **Emergency Contact**
  - Update emergency contact information
  - Test relationship field options
  - Verify phone number validation

**Expected Results:**
- Profile information displays correctly
- Edits are saved and persisted
- Validation prevents invalid data entry
- Cancel functionality works properly

### 4. Immigration Data Entry

#### Test Cases:
- [ ] **Education History**
  - Add new education entries
  - Fill in all education fields
  - Test date validation (start/end dates)
  - Remove education entries
  - Save and verify data persistence

- [ ] **Work History**
  - Add new work entries
  - Test job description text area
  - Verify date range validation
  - Test multiple work entries
  - Remove work entries

- [ ] **Travel History**
  - Add travel entries
  - Test purpose dropdown options
  - Verify date validation
  - Test notes field
  - Remove travel entries

- [ ] **Additional Information**
  - Update languages field
  - Test comma-separated language input
  - Add additional notes
  - Save all information together

- [ ] **Data Persistence**
  - Add data across all sections
  - Save information
  - Logout and login again
  - Verify all data is preserved

**Expected Results:**
- All data entry forms work correctly
- Validation prevents invalid entries
- Data is saved and persisted properly
- Multiple entries can be managed effectively

### 5. Document Management

#### Test Cases:
- [ ] **Document Upload**
  - Upload various file types (PDF, DOC, JPG, PNG)
  - Test file size limits
  - Select different document types
  - Add notes to documents
  - Verify successful upload

- [ ] **Document Library**
  - View uploaded documents in table
  - Check document metadata (size, type, date)
  - Verify document status (pending/verified)
  - Test document sorting and display

- [ ] **Document Download**
  - Download uploaded documents
  - Verify file integrity
  - Test download for different file types

- [ ] **File Validation**
  - Test unsupported file types
  - Test oversized files
  - Verify appropriate error messages

**Expected Results:**
- Documents upload successfully
- File validation works correctly
- Document library displays properly
- Downloads work for all file types

### 6. Security and Data Isolation

#### Test Cases:
- [ ] **Data Isolation**
  - Login as Client A
  - Attempt to access Client B's data via URL manipulation
  - Verify access is denied
  - Check that only own data is visible

- [ ] **Authentication Requirements**
  - Attempt to access client portal without login
  - Verify redirect to login page
  - Test session timeout behavior

- [ ] **Role-Based Access**
  - Login with non-client account
  - Attempt to access client portal
  - Verify access denied message

- [ ] **Data Security**
  - Verify all API calls include authentication
  - Check that sensitive data is not exposed in URLs
  - Test that data modifications require proper authorization

**Expected Results:**
- Clients can only access their own data
- Unauthenticated access is prevented
- Role-based restrictions are enforced
- Data security measures are effective

## API Integration Testing

### 1. Supabase Client Operations

#### Test Cases:
- [ ] **Profile CRUD Operations**
  - Create new client profile
  - Read existing profile data
  - Update profile information
  - Test error handling for failed operations

- [ ] **Extended Data Operations**
  - Save education/work/travel history
  - Retrieve extended data
  - Update existing entries
  - Delete entries

- [ ] **Document Operations**
  - Upload files to Supabase Storage
  - Create document records
  - Retrieve document metadata
  - Download files from storage

**Expected Results:**
- All CRUD operations work correctly
- Error handling is robust
- Data consistency is maintained

### 2. Row-Level Security Validation

#### Test Cases:
- [ ] **Client Data Access**
  - Verify clients can only query their own data
  - Test cross-client data access prevention
  - Check that RLS policies are enforced

- [ ] **Document Access**
  - Verify clients can only access their own documents
  - Test document storage security
  - Check file access permissions

**Expected Results:**
- RLS policies prevent unauthorized data access
- Document security is properly enforced
- No data leakage between clients

## User Experience Testing

### 1. Interface Usability

#### Test Cases:
- [ ] **Navigation**
  - Test tab navigation in client portal
  - Verify breadcrumbs and page titles
  - Check responsive design on different screen sizes

- [ ] **Form Usability**
  - Test form field validation feedback
  - Verify loading states during operations
  - Check success/error message display

- [ ] **Accessibility**
  - Test keyboard navigation
  - Verify screen reader compatibility
  - Check color contrast and readability

**Expected Results:**
- Interface is intuitive and easy to use
- Forms provide clear feedback
- Accessibility standards are met

### 2. Performance Testing

#### Test Cases:
- [ ] **Page Load Times**
  - Measure initial portal load time
  - Test data loading performance
  - Check image/document upload speeds

- [ ] **Large Data Sets**
  - Test with clients having many education/work entries
  - Verify performance with multiple documents
  - Check pagination if implemented

**Expected Results:**
- Pages load within acceptable time limits
- Performance remains good with large data sets
- User experience is smooth

## Error Handling Testing

### 1. Network Error Scenarios

#### Test Cases:
- [ ] **Connection Issues**
  - Test behavior with poor internet connection
  - Simulate network timeouts
  - Verify offline behavior

- [ ] **Server Errors**
  - Test handling of 500 errors
  - Verify graceful degradation
  - Check error message display

**Expected Results:**
- Network errors are handled gracefully
- Users receive helpful error messages
- Application remains stable

### 2. Data Validation Errors

#### Test Cases:
- [ ] **Invalid Data Entry**
  - Test with invalid dates
  - Try to save incomplete required fields
  - Test with malformed data

- [ ] **File Upload Errors**
  - Upload corrupted files
  - Test with invalid file types
  - Try uploading oversized files

**Expected Results:**
- Validation errors are caught and displayed
- Invalid operations are prevented
- Error messages guide users to solutions

## Test Results Documentation

### Success Criteria
All test cases must pass before Phase 3 approval:
- ✅ Client registration and login flows work correctly
- ✅ Profile management is fully functional
- ✅ Immigration data entry works as expected
- ✅ Document upload and management functions properly
- ✅ Security and data isolation are enforced
- ✅ User experience meets quality standards
- ✅ Error handling is robust and user-friendly

### Issue Tracking
Document any issues found:
- Issue description and severity
- Steps to reproduce
- Expected vs actual behavior
- Resolution status and notes

### Test Evidence
Maintain test evidence:
- Screenshots of successful operations
- Database query results showing data isolation
- Performance metrics
- Security test results
- User feedback and usability notes

## Automated Testing

### Unit Tests
- Component rendering tests
- Form validation tests
- Data transformation tests
- Utility function tests

### Integration Tests
- API endpoint testing
- Database operation testing
- File upload/download testing
- Authentication flow testing

### End-to-End Tests
- Complete user journey testing
- Cross-browser compatibility
- Mobile responsiveness testing
- Performance regression testing

## Manual Testing Checklist

### Pre-Testing Setup
- [ ] Test environment is properly configured
- [ ] Sample data is loaded
- [ ] Test accounts are created
- [ ] Browser dev tools are ready

### During Testing
- [ ] Document all test steps
- [ ] Capture screenshots of issues
- [ ] Note performance observations
- [ ] Record user experience feedback

### Post-Testing
- [ ] Compile test results
- [ ] Document any bugs found
- [ ] Verify all critical paths work
- [ ] Confirm security measures are effective

## Conclusion

Phase 3 testing ensures that the client portal provides a secure, user-friendly experience for immigration clients to manage their information and documents. All security, functionality, and usability requirements must be validated before proceeding to the next phase.