
# Testing Guide - Immigration AI SaaS

## Overview

This guide covers the comprehensive testing strategy for the Immigration AI SaaS platform, including unit tests, integration tests, end-to-end tests, and manual testing procedures.

## Testing Strategy

### Testing Pyramid

1. **Unit Tests (70%)**: Test individual components and functions
2. **Integration Tests (20%)**: Test component interactions and API endpoints
3. **End-to-End Tests (10%)**: Test complete user workflows

### Testing Tools

- **Unit Testing**: Jest + React Testing Library
- **Integration Testing**: Jest + Supertest + Mock Service Worker
- **E2E Testing**: Playwright
- **Test Data**: Fixtures and factories
- **Coverage**: Jest coverage reports

## Test Environment Setup

### Prerequisites

```bash
# Install testing dependencies
npm install --save-dev jest @testing-library/react @testing-library/jest-dom
npm install --save-dev @testing-library/user-event playwright
npm install --save-dev msw
```

### Configuration

#### Jest Configuration (`jest.config.js`)

```javascript
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/main.tsx',
    '!src/vite-env.d.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  testMatch: [
    '<rootDir>/tests/**/*.test.{js,jsx,ts,tsx}',
  ],
};
```

#### Test Setup (`tests/setup.js`)

```javascript
import '@testing-library/jest-dom';
import { server } from './mocks/server';

// Mock Supabase client
jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
    })),
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn(),
        download: jest.fn(),
      })),
    },
  },
}));

// Setup API mocking
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});
```

## Unit Testing

### Component Testing

#### Example: Button Component Test

```javascript
// tests/unit/components/ui/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '@/components/ui/button';

describe('Button Component', () => {
  it('renders button with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });

  it('handles click events', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('applies variant styles correctly', () => {
    render(<Button variant="destructive">Delete</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-destructive');
  });

  it('renders as disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
```

#### Example: Authentication Hook Test

```javascript
// tests/unit/hooks/useAuth.test.tsx
import { renderHook, act } from '@testing-library/react';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';

jest.mock('@/integrations/supabase/client');

describe('useAuth Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('initializes with null user', () => {
    const { result } = renderHook(() => useAuth());
    expect(result.current.user).toBeNull();
    expect(result.current.loading).toBe(true);
  });

  it('handles successful login', async () => {
    const mockUser = { id: '123', email: 'test@example.com' };
    (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signIn('test@example.com', 'password');
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.loading).toBe(false);
  });

  it('handles login error', async () => {
    const mockError = { message: 'Invalid credentials' };
    (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
      data: { user: null },
      error: mockError,
    });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signIn('test@example.com', 'wrongpassword');
    });

    expect(result.current.user).toBeNull();
    expect(result.current.error).toEqual(mockError);
  });
});
```

### Utility Function Testing

```javascript
// tests/unit/utils/validation.test.ts
import { validateEmail, validatePassword, validatePhoneNumber } from '@/lib/validation';

describe('Validation Utils', () => {
  describe('validateEmail', () => {
    it('validates correct email formats', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'firstname+lastname@example.org',
      ];

      validEmails.forEach(email => {
        expect(validateEmail(email)).toBe(true);
      });
    });

    it('rejects invalid email formats', () => {
      const invalidEmails = [
        'invalid-email',
        '@domain.com',
        'user@',
        'user@domain',
        '',
      ];

      invalidEmails.forEach(email => {
        expect(validateEmail(email)).toBe(false);
      });
    });
  });

  describe('validatePassword', () => {
    it('validates strong passwords', () => {
      const strongPasswords = [
        'StrongP@ss123',
        'MySecure123!',
        'Complex#Pass1',
      ];

      strongPasswords.forEach(password => {
        expect(validatePassword(password).isValid).toBe(true);
      });
    });

    it('rejects weak passwords', () => {
      const weakPasswords = [
        '123',
        'password',
        '12345678',
        'PASSWORD123',
        'password123',
      ];

      weakPasswords.forEach(password => {
        expect(validatePassword(password).isValid).toBe(false);
      });
    });
  });
});
```

## Integration Testing

### API Integration Tests

```javascript
// tests/integration/api/auth.test.ts
import { supabase } from '@/integrations/supabase/client';

describe('Authentication API Integration', () => {
  it('should handle user registration flow', async () => {
    const userData = {
      email: 'newuser@example.com',
      password: 'SecurePass123!',
    };

    // Mock successful registration
    const mockResponse = {
      data: {
        user: { id: 'new-user-123', email: userData.email },
        session: { access_token: 'mock-token' },
      },
      error: null,
    };

    jest.spyOn(supabase.auth, 'signUp').mockResolvedValue(mockResponse);

    const result = await supabase.auth.signUp(userData);

    expect(result.data.user).toBeDefined();
    expect(result.data.user.email).toBe(userData.email);
    expect(result.error).toBeNull();
  });

  it('should handle profile creation after registration', async () => {
    const profileData = {
      user_id: 'user-123',
      first_name: 'John',
      last_name: 'Doe',
      role: 'client',
    };

    const mockInsertResponse = {
      data: [profileData],
      error: null,
    };

    const mockFrom = jest.fn().mockReturnValue({
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(mockInsertResponse),
      }),
    });

    jest.spyOn(supabase, 'from').mockImplementation(mockFrom);

    const result = await supabase
      .from('users')
      .insert(profileData)
      .select();

    expect(result.data).toEqual([profileData]);
    expect(result.error).toBeNull();
  });
});
```

### Component Integration Tests

```javascript
// tests/integration/components/ClientProfile.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ClientProfile } from '@/components/client/ClientProfile';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {component}
      </AuthProvider>
    </QueryClientProvider>
  );
};

describe('ClientProfile Integration', () => {
  it('loads and displays client profile data', async () => {
    const mockClientData = {
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
      date_of_birth: '1990-01-01',
      nationality: 'Canadian',
    };

    // Mock the API response
    jest.spyOn(supabase, 'from').mockImplementation(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: mockClientData,
        error: null,
      }),
    }));

    renderWithProviders(<ClientProfile />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('John')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Doe')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Canadian')).toBeInTheDocument();
    });
  });

  it('handles profile update successfully', async () => {
    renderWithProviders(<ClientProfile />);

    // Wait for form to load
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /edit profile/i })).toBeInTheDocument();
    });

    // Click edit button
    fireEvent.click(screen.getByRole('button', { name: /edit profile/i }));

    // Update form field
    const firstNameInput = screen.getByLabelText(/first name/i);
    fireEvent.change(firstNameInput, { target: { value: 'Jane' } });

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

    // Verify update was called
    await waitFor(() => {
      expect(screen.getByText(/profile updated successfully/i)).toBeInTheDocument();
    });
  });
});
```

## End-to-End Testing

### Playwright Configuration

```javascript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
```

### E2E Test Examples

```javascript
// tests/e2e/client-registration.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Client Registration Flow', () => {
  test('should complete full registration process', async ({ page }) => {
    // Navigate to registration page
    await page.goto('/register');

    // Fill registration form
    await page.fill('[data-testid="email-input"]', 'newclient@example.com');
    await page.fill('[data-testid="password-input"]', 'SecurePass123!');
    await page.fill('[data-testid="first-name-input"]', 'John');
    await page.fill('[data-testid="last-name-input"]', 'Doe');

    // Submit registration
    await page.click('[data-testid="register-button"]');

    // Verify successful registration
    await expect(page).toHaveURL(/\/profile/);
    await expect(page.locator('text=Welcome, John')).toBeVisible();
  });

  test('should handle registration errors', async ({ page }) => {
    await page.goto('/register');

    // Try to register with existing email
    await page.fill('[data-testid="email-input"]', 'existing@example.com');
    await page.fill('[data-testid="password-input"]', 'SecurePass123!');
    await page.click('[data-testid="register-button"]');

    // Verify error message
    await expect(page.locator('text=Email already exists')).toBeVisible();
  });
});

// tests/e2e/document-upload.spec.ts
test.describe('Document Upload Flow', () => {
  test('should upload document successfully', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'client@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');

    // Navigate to documents
    await page.click('text=Documents');
    await page.click('text=Upload Document');

    // Upload file
    await page.setInputFiles('[data-testid="file-input"]', 'tests/fixtures/sample.pdf');
    await page.selectOption('[data-testid="document-type"]', 'passport');
    await page.click('[data-testid="upload-button"]');

    // Verify upload success
    await expect(page.locator('text=Document uploaded successfully')).toBeVisible();
    await expect(page.locator('text=sample.pdf')).toBeVisible();
  });
});

// tests/e2e/chat-system.spec.ts
test.describe('Chat System', () => {
  test('should send and receive messages', async ({ page }) => {
    // Login as client
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'client@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');

    // Open chat widget
    await page.click('[data-testid="chat-widget-button"]');

    // Send message
    await page.fill('[data-testid="message-input"]', 'Hello, I need help');
    await page.click('[data-testid="send-button"]');

    // Verify message appears
    await expect(page.locator('text=Hello, I need help')).toBeVisible();

    // Wait for AI response
    await expect(page.locator('[data-testid="ai-message"]')).toBeVisible();
  });
});
```

## Test Data Management

### Fixtures

```javascript
// tests/fixtures/users.js
export const testUsers = {
  client: {
    id: 'client-123',
    email: 'client@example.com',
    first_name: 'John',
    last_name: 'Doe',
    role: 'client',
    agency_id: 'agency-123',
  },
  agencyStaff: {
    id: 'staff-123',
    email: 'staff@agency.com',
    first_name: 'Jane',
    last_name: 'Smith',
    role: 'agency_staff',
    agency_id: 'agency-123',
  },
  agencyAdmin: {
    id: 'admin-123',
    email: 'admin@agency.com',
    first_name: 'Admin',
    last_name: 'User',
    role: 'agency_admin',
    agency_id: 'agency-123',
  },
};

// tests/fixtures/documents.js
export const testDocuments = {
  passport: {
    id: 'doc-123',
    filename: 'passport.pdf',
    document_type: 'passport',
    verification_status: 'pending',
    file_size: 1024000,
    created_at: '2024-01-01T10:00:00Z',
  },
  birthCertificate: {
    id: 'doc-456',
    filename: 'birth_cert.pdf',
    document_type: 'birth_certificate',
    verification_status: 'verified',
    file_size: 512000,
    created_at: '2024-01-02T10:00:00Z',
  },
};
```

### Factory Functions

```javascript
// tests/factories/userFactory.js
import { faker } from '@faker-js/faker';

export const createUser = (overrides = {}) => ({
  id: faker.string.uuid(),
  email: faker.internet.email(),
  first_name: faker.person.firstName(),
  last_name: faker.person.lastName(),
  role: 'client',
  agency_id: faker.string.uuid(),
  created_at: faker.date.past().toISOString(),
  ...overrides,
});

export const createAgency = (overrides = {}) => ({
  id: faker.string.uuid(),
  name: faker.company.name(),
  email: faker.internet.email(),
  phone: faker.phone.number(),
  website: faker.internet.url(),
  created_at: faker.date.past().toISOString(),
  ...overrides,
});
```

## Running Tests

### npm Scripts

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:unit": "jest tests/unit",
    "test:integration": "jest tests/integration",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:all": "npm run test && npm run test:e2e"
  }
}
```

### Running Specific Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- Button.test.tsx

# Run tests with coverage
npm run test:coverage

# Run only unit tests
npm run test:unit

# Run integration tests
npm run test:integration

# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui
```

## Test Coverage

### Coverage Configuration

```javascript
// jest.config.js
module.exports = {
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/main.tsx',
    '!src/vite-env.d.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  coverageReporters: ['text', 'lcov', 'html'],
};
```

### Coverage Reports

```bash
# Generate coverage report
npm run test:coverage

# View HTML coverage report
open coverage/lcov-report/index.html
```

## Best Practices

### Testing Guidelines

1. **Test Behavior, Not Implementation**
   - Focus on what the component does, not how it does it
   - Test user interactions and expected outcomes

2. **Keep Tests Simple and Focused**
   - One test should verify one behavior
   - Use descriptive test names
   - Keep setup minimal

3. **Use Data-Testid for E2E Tests**
   - Don't rely on text content or CSS classes
   - Use stable identifiers for test elements

4. **Mock External Dependencies**
   - Mock API calls and external services
   - Use consistent mock data
   - Reset mocks between tests

5. **Test Error Cases**
   - Test both success and failure scenarios
   - Verify error handling and user feedback

### Performance Testing

```javascript
// tests/performance/load.test.js
describe('Performance Tests', () => {
  it('should render large document list efficiently', async () => {
    const start = performance.now();
    
    const largeDocumentList = Array.from({ length: 1000 }, (_, i) => 
      createDocument({ id: `doc-${i}` })
    );
    
    render(<DocumentList documents={largeDocumentList} />);
    
    const end = performance.now();
    const renderTime = end - start;
    
    expect(renderTime).toBeLessThan(1000); // Should render in under 1 second
  });
});
```

## Continuous Integration

### GitHub Actions Testing

```yaml
# .github/workflows/test.yml
name: Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run unit tests
        run: npm run test:coverage
      
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info
      
      - name: Run E2E tests
        run: npm run test:e2e
      
      - name: Upload E2E results
        uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

## Conclusion

This testing guide provides a comprehensive framework for ensuring the Immigration AI SaaS platform is thoroughly tested at all levels. Regular testing and continuous improvement of test coverage are essential for maintaining a high-quality, reliable application.

Remember to:
- Keep tests up to date with code changes
- Review and refactor tests regularly
- Monitor test performance and coverage
- Document test scenarios and edge cases
- Train team members on testing practices
