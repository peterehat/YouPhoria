# Monorepo Architecture Setup Guide

## Overview
Create a new monorepo application with a comprehensive full-stack architecture. This setup includes a React website, Node.js/Express backend, React admin dashboard, React Native mobile app (optional), comprehensive testing infrastructure, and deployment configuration.

## Project Requirements

### 1. Monorepo Structure Setup
**Task**: Create a monorepo with npm workspaces following modern best practices.

**Requirements**:
- Root `package.json` with workspaces configuration for: `website`, `backend`, `admin`, `reactapp` (if mobile needed)
- Development scripts: `dev:website`, `dev:backend`, `dev:admin`, `dev:app`
- Build scripts: `build:website`, `build:backend`, `build:admin`, `build:app`
- Test scripts: `test`, `test:frontend`, `test:backend`, `test:all`, `test:coverage`
- Install script: `install:all` that installs dependencies for all workspaces
- Shared dev dependencies at root level for testing infrastructure

**Acceptance Criteria**:
- [ ] Root package.json exists with correct workspaces array
- [ ] All development scripts work from root directory
- [ ] `npm run install:all` successfully installs all dependencies
- [ ] Each workspace has its own package.json with appropriate dependencies
- [ ] TypeScript version consistency across all workspaces (use overrides/resolutions)

**Verification**:
```bash
npm run install:all
npm run dev:backend & npm run dev:website & npm run dev:admin
# All services should start without errors
```

### 2. Backend API Setup
**Task**: Create a Node.js/Express backend with TypeScript, MySQL, and comprehensive configuration.

**Requirements**:
- Express server with TypeScript compilation
- MySQL database connection with pooling and SSL support
- Environment configuration with Zod validation schema
- Database migration system with SQL files
- JWT authentication middleware
- RESTful API structure (controllers/routes/services pattern)
- CORS configuration for multiple frontend origins
- Error handling middleware
- Logging infrastructure

**File Structure**:
```
backend/
├── package.json
├── tsconfig.json
├── index.js (entry point)
├── config/
│   ├── env.ts (Zod schema validation)
│   └── secure/ (for service account files)
├── src/
│   ├── index.ts (main server file)
│   ├── controllers/ (API controllers)
│   ├── routes/ (Express routes)
│   ├── services/ (business logic)
│   ├── models/ (database models and migrations)
│   └── utils/ (database connection, helpers)
└── tests/ (backend-specific tests)
```

**Acceptance Criteria**:
- [ ] TypeScript compiles without errors
- [ ] Server starts on configured port (default 3000)
- [ ] Database connection successful with SSL support
- [ ] Environment variables validated with Zod schema
- [ ] Migration system can create and run migrations
- [ ] JWT authentication middleware functional
- [ ] CORS properly configured for frontend domains
- [ ] API endpoints return proper JSON responses
- [ ] Error handling returns appropriate HTTP status codes

**Verification**:
```bash
cd backend
npm run dev
# Server should start and connect to database
curl http://localhost:3000/api/health
# Should return 200 status with health check response
```

### 3. Website Frontend Setup
**Task**: Create a React website with Vite, TypeScript, and modern development setup.

**Requirements**:
- React 18+ with TypeScript
- Vite for development and building
- Proxy configuration for backend API calls
- Modern CSS with custom properties and responsive design
- Component-based architecture
- State management with Context API or Zustand
- React Router for navigation
- Environment variable support
- ESLint configuration

**File Structure**:
```
website/
├── package.json
├── vite.config.js (with proxy configuration)
├── eslint.config.js
├── tsconfig.json
├── index.html
├── src/
│   ├── main.jsx (entry point)
│   ├── App.jsx
│   ├── App.css (main styles)
│   ├── components/ (reusable components)
│   ├── pages/ (page components)
│   └── utils/ (helper functions)
└── public/ (static assets)
```

**Acceptance Criteria**:
- [ ] Vite development server starts on port 5173
- [ ] TypeScript compilation successful
- [ ] Hot module replacement working
- [ ] API proxy routes `/api/*` to backend
- [ ] ESLint runs without errors
- [ ] Production build creates optimized bundle
- [ ] Responsive design works on mobile and desktop
- [ ] Environment variables accessible via `import.meta.env`

**Verification**:
```bash
cd website
npm run dev
# Should start on http://localhost:5173
npm run build
npm run preview
# Production build should work correctly
```

### 4. Admin Dashboard Setup
**Task**: Create a React admin dashboard with authentication and management interfaces.

**Requirements**:
- React 18+ with TypeScript
- Vite for development and building
- React Router v6 for navigation
- Authentication system with JWT
- State management with Zustand and React Query
- Protected routes with role-based access
- Responsive sidebar layout
- Data visualization components (charts/tables)
- CRUD interfaces for data management

**File Structure**:
```
admin/
├── package.json
├── vite.config.js
├── tsconfig.json
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── components/
│   │   ├── Layout.jsx (sidebar layout)
│   │   └── ProtectedRoute.jsx
│   ├── pages/ (admin pages)
│   ├── hooks/ (custom React hooks)
│   └── store/ (state management)
└── public/
```

**Acceptance Criteria**:
- [ ] Admin dashboard starts on port 5174
- [ ] Authentication system functional with JWT
- [ ] Protected routes redirect to login when unauthorized
- [ ] Sidebar navigation works correctly
- [ ] CRUD operations connect to backend API
- [ ] Responsive design works on all screen sizes
- [ ] State management persists across page refreshes
- [ ] Production build optimized and functional

**Verification**:
```bash
cd admin
npm run dev
# Should start on http://localhost:5174
# Login functionality should work with backend
```

### 5. React Native Mobile App Setup (Optional)
**Task**: Create a React Native/Expo mobile application with native features.

**Requirements**:
- Expo SDK with React Native
- TypeScript configuration
- Expo Router for navigation
- Native features integration (camera, location, etc.)
- State management with Zustand
- API integration with backend
- Platform-specific styling
- Build configuration for iOS/Android

**Acceptance Criteria**:
- [ ] Expo development server starts successfully
- [ ] App runs on iOS simulator/device
- [ ] App runs on Android emulator/device
- [ ] Navigation between screens functional
- [ ] API calls to backend successful
- [ ] Native features work correctly
- [ ] TypeScript compilation successful
- [ ] Build process creates deployable apps

**Verification**:
```bash
cd reactapp
npm start
# Expo development server should start
# App should load in Expo Go or simulator
```

### 6. Testing Infrastructure Setup
**Task**: Implement comprehensive testing with Jest, covering unit, integration, and e2e tests.

**Requirements**:
- Jest multi-project configuration
- Frontend tests with jsdom environment
- Backend tests with node environment
- Testing Library for React components
- Mock strategies for external services
- Test categories: unit, integration, e2e
- Coverage reporting
- Test utilities and helpers

**File Structure**:
```
root/
├── jest.config.js (multi-project setup)
├── jest.setup.js
├── babel.config.test.js
├── __tests__/
│   ├── integration/ (API + database tests)
│   ├── e2e/ (end-to-end workflow tests)
│   ├── mocks/ (shared mocks)
│   └── README.md
└── scripts/
    └── test-categories.js
```

**Acceptance Criteria**:
- [ ] All test suites run without errors
- [ ] Frontend tests use jsdom environment
- [ ] Backend tests use node environment
- [ ] Integration tests connect to test database
- [ ] Coverage reports generate correctly
- [ ] Test categories script works (unit/integration/e2e)
- [ ] Mocking strategies functional for external APIs
- [ ] Watch mode works for development

**Verification**:
```bash
npm test
# All tests should pass
npm run test:coverage
# Coverage report should generate
node scripts/test-categories.js unit
# Should run only unit tests
```

### 7. Database Setup and Migrations
**Task**: Implement MySQL database with migration system and proper connection handling.

**Requirements**:
- MySQL connection with SSL support
- Connection pooling for performance
- Migration system with SQL files
- Environment-specific database configurations
- Database initialization scripts
- Proper error handling and reconnection logic

**File Structure**:
```
backend/src/models/
├── migrations/
│   ├── 001_initial_schema.sql
│   ├── 002_add_users_table.sql
│   └── run-migrations.ts
└── database.ts (connection and utilities)
```

**Acceptance Criteria**:
- [ ] Database connection successful with SSL
- [ ] Migration system creates tables correctly
- [ ] Connection pooling configured properly
- [ ] Environment variables control database selection
- [ ] Graceful handling of connection failures
- [ ] Migration rollback functionality available
- [ ] Database initialization scripts work

**Verification**:
```bash
cd backend
npm run migrate
# Should create/update database schema
node -e "require('./src/utils/database').testConnection()"
# Should confirm successful database connection
```

### 8. Environment Configuration
**Task**: Set up comprehensive environment variable management with validation.

**Requirements**:
- Environment templates for each service
- Zod schema validation for type safety
- Secure secret management
- Development/staging/production configurations
- Environment variable documentation

**Files Required**:
- `backend/env-template.txt`
- `website/env-local-template.txt`
- `admin/env-template.txt`
- `reactapp/env-react-native-template.txt`
- `backend/config/env.ts` (Zod validation)

**Acceptance Criteria**:
- [ ] All environment templates exist and documented
- [ ] Zod schema validates all required variables
- [ ] Development environments work with defaults
- [ ] Production environment variables properly secured
- [ ] Type safety enforced for environment access
- [ ] Clear error messages for missing variables

**Verification**:
```bash
# Copy templates and verify each service starts
cp backend/env-template.txt backend/.env
cp website/env-local-template.txt website/.env.local
# All services should start with template configurations
```

### 9. Deployment Configuration
**Task**: Set up DigitalOcean App Platform deployment with proper environment management.

**Requirements**:
- App specification YAML file
- Database configuration (managed MySQL)
- Environment variable management
- Multi-service deployment setup
- Domain and ingress configuration
- SSL certificate handling

**Files Required**:
- `app-spec.yaml` (DigitalOcean configuration)
- `documentation/DEPLOYMENT.md`
- Environment variable documentation

**Acceptance Criteria**:
- [ ] App spec YAML validates with DigitalOcean
- [ ] Database connection configured correctly
- [ ] Environment variables properly encrypted
- [ ] Ingress rules route traffic correctly
- [ ] SSL certificates auto-renew
- [ ] Deployment pipeline functional
- [ ] Health checks configured for all services

**Verification**:
```bash
# Validate app spec (requires doctl)
doctl apps spec validate app-spec.yaml
# Should validate successfully
```

### 10. Development Workflow Setup
**Task**: Configure development tools and workflows for optimal developer experience.

**Requirements**:
- Hot reloading for all frontend services
- TypeScript watch mode for backend
- Concurrent development script
- Linting and formatting configuration
- Git hooks for code quality
- Documentation structure

**Acceptance Criteria**:
- [ ] All services start concurrently with one command
- [ ] Hot reloading works for frontend changes
- [ ] Backend restarts on TypeScript changes
- [ ] Linting runs on save/commit
- [ ] Code formatting consistent across project
- [ ] Documentation up to date and comprehensive

**Verification**:
```bash
npm run dev:all  # If implemented, or manually start all services
# All services should start and hot reload on changes
```

## Final Verification Checklist

### Complete System Test
- [ ] All services start without errors
- [ ] Frontend can communicate with backend API
- [ ] Admin dashboard authenticates and loads data
- [ ] Database connections stable under load
- [ ] All tests pass (unit/integration/e2e)
- [ ] Production builds create optimized bundles
- [ ] Deployment configuration validates
- [ ] Environment variables properly configured
- [ ] Documentation complete and accurate

### Performance and Security
- [ ] API response times under 200ms for basic endpoints
- [ ] Database queries optimized with proper indexing
- [ ] Authentication system secure (JWT, password hashing)
- [ ] CORS configured to prevent unauthorized access
- [ ] Environment variables properly secured
- [ ] SSL/TLS configured for all connections
- [ ] Error handling doesn't expose sensitive information

### Developer Experience
- [ ] Setup process documented and tested
- [ ] Development environment starts quickly
- [ ] Hot reloading responsive (under 1 second)
- [ ] Error messages clear and actionable
- [ ] Code completion works in IDE
- [ ] Debugging tools configured and functional

## Success Criteria
The architecture replication is complete when:
1. A new developer can run `npm run install:all` and `npm run dev:all` to get a fully functional development environment
2. All tests pass without modification
3. The application can be deployed to DigitalOcean App Platform using the provided configuration
4. All services communicate correctly and handle errors gracefully
5. The codebase follows TypeScript best practices with proper type safety
6. Performance meets the specified benchmarks
7. Security measures are properly implemented and tested

## Notes
- This prompt assumes familiarity with the technologies involved
- External service API keys will need to be obtained separately
- Database should be set up before running migrations
- Some configurations may need adjustment based on specific project requirements
- Consider implementing CI/CD pipeline for automated testing and deployment
