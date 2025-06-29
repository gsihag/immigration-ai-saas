# Environment Setup Guide

## Overview

This guide explains how to set up environment variables for the Immigration AI SaaS platform across different environments (development, staging, production).

## Environment Variables

### Required Variables

The following environment variables are required for the application to function:

#### Supabase Configuration
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

#### Application Configuration
```env
VITE_APP_NAME=Immigration AI SaaS
VITE_APP_VERSION=1.0.0
NODE_ENV=development
```

### Optional Variables

#### API Configuration
```env
VITE_API_BASE_URL=http://localhost:8000
```

#### Feature Flags
```env
VITE_ENABLE_AI_FEATURES=false
VITE_ENABLE_DOCUMENT_ANALYSIS=false
VITE_ENABLE_CHAT_WIDGET=false
```

#### Third-party Services
```env
# OpenAI
VITE_OPENAI_API_KEY=your-openai-api-key

# SendGrid
VITE_SENDGRID_API_KEY=your-sendgrid-api-key

# Twilio
VITE_TWILIO_ACCOUNT_SID=your-twilio-account-sid
VITE_TWILIO_AUTH_TOKEN=your-twilio-auth-token

# Stripe
VITE_STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key
```

#### Monitoring
```env
VITE_SENTRY_DSN=your-sentry-dsn
VITE_ANALYTICS_ID=your-analytics-id
```

## Setup Instructions

### Development Environment

1. **Copy the example file:**
   ```bash
   cp .env.example .env
   ```

2. **Get your Supabase credentials:**
   - Go to your [Supabase Dashboard](https://supabase.com/dashboard)
   - Select your project
   - Navigate to Settings > API
   - Copy the Project URL and anon/public key

3. **Update the .env file:**
   ```env
   VITE_SUPABASE_URL=https://your-actual-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-actual-anon-key
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

### Production Environment

For production deployments, set environment variables in your hosting platform:

#### Netlify
1. Go to Site Settings > Environment Variables
2. Add each variable individually

#### Vercel
1. Go to Project Settings > Environment Variables
2. Add each variable for Production environment

#### Other Platforms
Refer to your hosting platform's documentation for setting environment variables.

## Security Best Practices

### Environment Variable Security

1. **Never commit `.env` files to version control**
   - The `.env` file is already in `.gitignore`
   - Only commit `.env.example` with placeholder values

2. **Use different keys for different environments**
   - Development: Use development/test Supabase project
   - Production: Use production Supabase project

3. **Rotate keys regularly**
   - Update Supabase keys periodically
   - Update third-party service keys as needed

4. **Limit key permissions**
   - Use anon keys for client-side operations
   - Use service role keys only for server-side operations

### Supabase Security

1. **Row Level Security (RLS)**
   - All tables have RLS enabled
   - Policies enforce data isolation between agencies

2. **API Key Management**
   - Anon key: Safe for client-side use
   - Service role key: Server-side only, never expose to client

## Troubleshooting

### Common Issues

#### Missing Environment Variables
```
Error: Missing VITE_SUPABASE_URL environment variable
```
**Solution:** Ensure `.env` file exists and contains the required variables.

#### Invalid Supabase URL
```
Error: Invalid URL
```
**Solution:** Check that your Supabase URL is correctly formatted and includes `https://`.

#### Authentication Errors
```
Error: Invalid API key
```
**Solution:** Verify your Supabase anon key is correct and hasn't expired.

### Validation

To verify your environment setup:

1. **Check environment variables are loaded:**
   ```javascript
   console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
   ```

2. **Test Supabase connection:**
   - Try logging in to the application
   - Check browser network tab for successful API calls

3. **Verify RLS policies:**
   - Ensure users can only access their own data
   - Test with different user accounts

## Environment-Specific Configurations

### Development
```env
NODE_ENV=development
VITE_API_BASE_URL=http://localhost:8000
VITE_ENABLE_AI_FEATURES=true
```

### Staging
```env
NODE_ENV=staging
VITE_API_BASE_URL=https://staging-api.immigrationai.com
VITE_ENABLE_AI_FEATURES=true
```

### Production
```env
NODE_ENV=production
VITE_API_BASE_URL=https://api.immigrationai.com
VITE_ENABLE_AI_FEATURES=true
```

## Support

If you encounter issues with environment setup:

1. Check this documentation
2. Verify your Supabase project is active
3. Ensure all required environment variables are set
4. Contact support with specific error messages