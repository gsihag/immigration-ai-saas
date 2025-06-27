
# Database Schema Documentation

## Overview

This document describes the database schema for the Immigration AI SaaS application, implemented using Supabase PostgreSQL.

## Tables

### agencies
Stores agency information and configuration.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| name | text | Agency name (required) |
| email | text | Contact email |
| phone | text | Contact phone number |
| address | jsonb | Address information |
| website | text | Agency website URL |
| created_at | timestamptz | Record creation timestamp |
| updated_at | timestamptz | Last update timestamp |

### users
Extends Supabase auth.users with additional profile information.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key, references auth.users(id) |
| agency_id | uuid | Foreign key to agencies table |
| role | user_role | User role enum |
| first_name | text | User's first name |
| last_name | text | User's last name |
| phone | text | Contact phone number |
| is_active | boolean | Account status |
| created_at | timestamptz | Record creation timestamp |
| updated_at | timestamptz | Last update timestamp |

### clients
Stores client-specific information.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | Foreign key to users table |
| agency_id | uuid | Foreign key to agencies table |
| date_of_birth | date | Client's date of birth |
| country_of_birth | text | Birth country |
| nationality | text | Client's nationality |
| passport_number | text | Passport number |
| address | jsonb | Address information |
| emergency_contact | jsonb | Emergency contact details |
| immigration_status | text | Current immigration status |
| created_at | timestamptz | Record creation timestamp |
| updated_at | timestamptz | Last update timestamp |

### cases
Immigration case management.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| case_number | text | Unique case identifier |
| client_id | uuid | Foreign key to clients table |
| agency_id | uuid | Foreign key to agencies table |
| case_type | case_type | Type of immigration case |
| status | case_status | Current case status |
| title | text | Case title |
| description | text | Case description |
| priority | integer | Priority level (1-5) |
| assigned_to | uuid | Foreign key to users table |
| due_date | date | Case due date |
| created_at | timestamptz | Record creation timestamp |
| updated_at | timestamptz | Last update timestamp |

### documents
Document management for cases and clients.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| client_id | uuid | Foreign key to clients table |
| case_id | uuid | Foreign key to cases table |
| agency_id | uuid | Foreign key to agencies table |
| document_type | document_type | Type of document |
| file_name | text | Original file name |
| file_path | text | Storage path |
| file_size | integer | File size in bytes |
| mime_type | text | MIME type |
| uploaded_by | uuid | Foreign key to users table |
| is_verified | boolean | Verification status |
| notes | text | Additional notes |
| created_at | timestamptz | Record creation timestamp |
| updated_at | timestamptz | Last update timestamp |

## Enums

### user_role
- `agency_admin`: Full agency management access
- `agency_staff`: Case and client management access
- `client`: Limited access to own data

### case_status
- `new`: Newly created case
- `in_progress`: Case is being processed
- `under_review`: Case under review
- `approved`: Case approved
- `rejected`: Case rejected
- `completed`: Case completed

### case_type
- `family_based`: Family-based immigration
- `employment_based`: Employment-based immigration
- `asylum`: Asylum cases
- `naturalization`: Naturalization cases
- `other`: Other case types

### document_type
- `passport`: Passport documents
- `birth_certificate`: Birth certificates
- `marriage_certificate`: Marriage certificates
- `diploma`: Educational diplomas
- `employment_letter`: Employment letters
- `financial_statement`: Financial statements
- `other`: Other document types

## Relationships

- `users.agency_id` → `agencies.id`
- `clients.user_id` → `users.id`
- `clients.agency_id` → `agencies.id`
- `cases.client_id` → `clients.id`
- `cases.agency_id` → `agencies.id`
- `cases.assigned_to` → `users.id`
- `documents.client_id` → `clients.id`
- `documents.case_id` → `cases.id`
- `documents.agency_id` → `agencies.id`
- `documents.uploaded_by` → `users.id`

## Security Functions

### get_user_agency_id(uuid)
Returns the agency_id for a given user_id. Used in RLS policies to avoid recursion.

### get_user_role(uuid)
Returns the role for a given user_id. Used in RLS policies for role-based access.

## Triggers

### handle_new_user()
Automatically creates a user profile when a new user signs up through Supabase Auth.

### generate_case_number() / set_case_number()
Automatically generates unique case numbers in format: CASE-YYYY-NNNN
