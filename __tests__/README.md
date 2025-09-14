# Testing Infrastructure

This directory contains shared testing utilities, integration tests, and end-to-end tests for the monorepo application.

## Structure

```
__tests__/
├── integration/     # API + database integration tests
├── e2e/            # End-to-end workflow tests
├── mocks/          # Shared mocks and test utilities
└── README.md       # This file
```

## Test Categories

### Unit Tests
- **Location**: Within each workspace (`backend/tests/`, `website/src/**/*.test.tsx`)
- **Purpose**: Test individual functions, components, and modules in isolation
- **Environment**: jsdom (frontend) or node (backend)
- **Run**: `npm test -- --testNamePattern="unit"`

### Integration Tests
- **Location**: `__tests__/integration/`
- **Purpose**: Test API endpoints with real database connections
- **Environment**: node with test database
- **Run**: `npm test -- --testPathPattern="integration/"`

### End-to-End Tests
- **Location**: `__tests__/e2e/`
- **Purpose**: Test complete user workflows across frontend and backend
- **Environment**: Full application stack
- **Run**: `npm test -- --testPathPattern="e2e/"`

## Running Tests

### All Tests
```bash
npm test                    # Run all tests
npm run test:coverage       # Run with coverage report
npm run test:watch          # Watch mode for development
```

### Specific Categories
```bash
# Using the test categories script
node scripts/test-categories.js unit
node scripts/test-categories.js integration
node scripts/test-categories.js e2e
node scripts/test-categories.js frontend
node scripts/test-categories.js backend

# With additional Jest options
node scripts/test-categories.js unit --watch
node scripts/test-categories.js integration --coverage
```

### Individual Projects
```bash
npm test -- --projects backend      # Backend tests only
npm test -- --projects website      # Website tests only
npm test -- --projects admin        # Admin tests only
```

## Test Database Setup

Integration tests require a separate test database:

```bash
# Create test database
mysql -u root -p -e "CREATE DATABASE monorepo_app_test;"

# Set test environment variables
export NODE_ENV=test
export DB_NAME=monorepo_app_test

# Run migrations for test database
npm run migrate
```

## Writing Tests

### Backend Tests (Unit)
```typescript
// backend/tests/services/authService.test.ts
import { authService } from '../../src/services/authService';

describe('AuthService Unit Tests', () => {
  test('should generate refresh token', async () => {
    const token = await authService.generateRefreshToken(1);
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(0);
  });
});
```

### Frontend Tests (Unit)
```typescript
// website/src/components/Button.test.tsx
import { render, screen } from '@testing-library/react';
import { Button } from './Button';

describe('Button Component', () => {
  test('renders button with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button')).toHaveTextContent('Click me');
  });
});
```

### Integration Tests
```typescript
// __tests__/integration/auth.test.ts
import request from 'supertest';
import app from '../../backend/src/index';

describe('Auth API Integration', () => {
  test('POST /api/v1/auth/login should authenticate user', async () => {
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('tokens');
  });
});
```

### End-to-End Tests
```typescript
// __tests__/e2e/user-registration.test.ts
import { chromium, Browser, Page } from 'playwright';

describe('User Registration E2E', () => {
  let browser: Browser;
  let page: Page;

  beforeAll(async () => {
    browser = await chromium.launch();
    page = await browser.newPage();
  });

  test('should register new user successfully', async () => {
    await page.goto('http://localhost:5173/register');
    
    await page.fill('[data-testid="email"]', 'newuser@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="submit"]');
    
    await expect(page).toHaveURL('http://localhost:5173/dashboard');
  });

  afterAll(async () => {
    await browser.close();
  });
});
```

## Test Utilities

### Database Helpers
```typescript
// __tests__/mocks/database.ts
export const setupTestDatabase = async () => {
  // Set up test database with sample data
};

export const cleanupTestDatabase = async () => {
  // Clean up test database after tests
};
```

### API Helpers
```typescript
// __tests__/mocks/api.ts
export const createAuthenticatedRequest = (token: string) => {
  return request(app).set('Authorization', `Bearer ${token}`);
};
```

### React Testing Utilities
```typescript
// __tests__/mocks/react-utils.tsx
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

export const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </QueryClientProvider>
  );
};
```

## Mocking Strategies

### External APIs
```typescript
// __tests__/mocks/external-apis.ts
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  })),
}));
```

### Database
```typescript
// __tests__/mocks/database.ts
jest.mock('../../backend/src/utils/database', () => ({
  query: jest.fn(),
  queryOne: jest.fn(),
  transaction: jest.fn(),
}));
```

## Coverage Requirements

- **Unit Tests**: Minimum 80% coverage
- **Integration Tests**: All API endpoints covered
- **E2E Tests**: Critical user workflows covered

## Continuous Integration

Tests run automatically on:
- Pull requests
- Commits to main branch
- Scheduled nightly runs

## Troubleshooting

### Common Issues

1. **Database connection fails**
   - Ensure test database exists
   - Check test environment variables
   - Verify database permissions

2. **Frontend tests timeout**
   - Increase Jest timeout
   - Check for async operations
   - Verify mock implementations

3. **E2E tests flaky**
   - Add proper waits for elements
   - Use data-testid attributes
   - Check for race conditions

### Debug Mode

```bash
# Run tests with debug output
npm test -- --verbose --detectOpenHandles

# Run specific test file
npm test -- path/to/test.file.ts

# Debug with Node.js debugger
node --inspect-brk node_modules/.bin/jest --runInBand
```
