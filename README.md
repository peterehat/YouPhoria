# Monorepo Application

A comprehensive full-stack monorepo application built with React, Node.js, TypeScript, and modern development tools.

## 🏗️ Architecture

This monorepo contains:

- **Backend**: Node.js/Express API with TypeScript, MySQL, JWT authentication
- **Website**: React frontend with Vite, TypeScript, and modern UI
- **Admin**: React admin dashboard with authentication and management interfaces
- **React Native App**: Mobile application (optional)
- **Testing**: Comprehensive Jest testing infrastructure
- **Deployment**: DigitalOcean App Platform configuration

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm 9+
- MySQL 8.0+
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd monorepo-app
   ```

2. **Install all dependencies**
   ```bash
   npm run install:all
   ```

3. **Set up environment variables**
   ```bash
   # Backend
   cp backend/env-template.txt backend/.env
   # Edit backend/.env with your database credentials and secrets
   
   # Website
   cp website/env-local-template.txt website/.env.local
   # Edit website/.env.local if needed
   
   # Admin
   cp admin/env-template.txt admin/.env.local
   # Edit admin/.env.local if needed
   ```

4. **Set up the database**
   ```bash
   # Create your MySQL database
   mysql -u root -p -e "CREATE DATABASE monorepo_app;"
   
   # Run migrations
   npm run migrate
   ```

5. **Start development servers**
   ```bash
   npm run dev:all
   ```

   This will start:
   - Backend API: http://localhost:3000
   - Website: http://localhost:5173
   - Admin Dashboard: http://localhost:5174

## 📁 Project Structure

```
monorepo-app/
├── backend/                 # Node.js/Express API
│   ├── src/
│   │   ├── controllers/     # API controllers
│   │   ├── routes/          # Express routes
│   │   ├── services/        # Business logic
│   │   ├── models/          # Database models & migrations
│   │   ├── middleware/      # Custom middleware
│   │   └── utils/           # Utility functions
│   ├── config/              # Configuration files
│   └── tests/               # Backend tests
├── website/                 # React website
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   ├── pages/           # Page components
│   │   ├── store/           # State management
│   │   ├── hooks/           # Custom hooks
│   │   └── utils/           # Utility functions
│   └── public/              # Static assets
├── admin/                   # React admin dashboard
│   ├── src/
│   │   ├── components/      # Admin components
│   │   ├── pages/           # Admin pages
│   │   ├── store/           # State management
│   │   └── hooks/           # Custom hooks
│   └── public/              # Static assets
├── reactapp/                # React Native app (optional)
├── __tests__/               # Shared tests
├── scripts/                 # Build and utility scripts
├── jest.config.js           # Jest configuration
├── app-spec.yaml            # DigitalOcean deployment config
└── package.json             # Root package.json
```

## 🛠️ Development

### Available Scripts

```bash
# Development
npm run dev:backend          # Start backend in development mode
npm run dev:website          # Start website in development mode
npm run dev:admin            # Start admin dashboard in development mode
npm run dev:all              # Start all services concurrently

# Building
npm run build:backend        # Build backend for production
npm run build:website        # Build website for production
npm run build:admin          # Build admin dashboard for production
npm run build:all            # Build all services

# Testing
npm test                     # Run all tests
npm run test:frontend        # Run frontend tests only
npm run test:backend         # Run backend tests only
npm run test:coverage        # Run tests with coverage report

# Database
npm run migrate              # Run database migrations
npm run migrate:rollback     # Rollback last migration
npm run migrate:status       # Check migration status

# Linting
npm run lint                 # Lint all workspaces
npm run lint:fix             # Fix linting issues

# Utilities
npm run clean                # Clean all build artifacts
npm run install:all          # Install dependencies for all workspaces
```

### Environment Variables

#### Backend (.env)
```bash
NODE_ENV=development
PORT=3000
DB_HOST=localhost
DB_NAME=monorepo_app
DB_USER=your_user
DB_PASSWORD=your_password
JWT_SECRET=your_jwt_secret_32_chars_minimum
# ... see backend/env-template.txt for full list
```

#### Frontend (.env.local)
```bash
VITE_API_BASE_URL=http://localhost:3000/api/v1
VITE_APP_NAME=Monorepo App
# ... see website/env-local-template.txt for full list
```

## 🧪 Testing

The project uses Jest with different configurations for different environments:

- **Backend tests**: Node environment with database mocking
- **Frontend tests**: jsdom environment with React Testing Library
- **Integration tests**: Full API + database testing
- **E2E tests**: End-to-end workflow testing

```bash
# Run specific test categories
npm test -- --testNamePattern="unit"
npm test -- --testNamePattern="integration"
npm test -- --testNamePattern="e2e"

# Watch mode for development
npm run test:watch
```

## 🚀 Deployment

### DigitalOcean App Platform

1. **Prepare the app specification**
   ```bash
   # Update app-spec.yaml with your repository and domain information
   # Set production environment variables as secrets
   ```

2. **Deploy using doctl**
   ```bash
   # Install doctl and authenticate
   doctl auth init
   
   # Validate the spec
   doctl apps spec validate app-spec.yaml
   
   # Create the app
   doctl apps create --spec app-spec.yaml
   ```

3. **Set up database**
   - The managed MySQL database will be created automatically
   - Migrations will run during the first deployment

### Manual Deployment

For other platforms, build the applications and deploy:

```bash
# Build all services
npm run build:all

# Backend: Deploy dist/ folder to your Node.js hosting
# Frontend: Deploy website/dist/ to static hosting
# Admin: Deploy admin/dist/ to static hosting
```

## 🔧 Configuration

### Database Migrations

Create new migrations in `backend/src/models/migrations/`:

```bash
# Create a new migration file
touch backend/src/models/migrations/002_add_new_table.sql
```

Migration files should follow the naming convention: `XXX_description.sql`

### Adding New Routes

1. **Backend**: Add routes in `backend/src/routes/`
2. **Controllers**: Add controllers in `backend/src/controllers/`
3. **Services**: Add business logic in `backend/src/services/`

### Adding New Pages

1. **Website**: Add pages in `website/src/pages/`
2. **Admin**: Add pages in `admin/src/pages/`
3. **Update routing** in respective `App.tsx` files

## 🔒 Security

- JWT-based authentication with refresh tokens
- Password hashing with bcrypt
- Rate limiting on API endpoints
- CORS configuration for multiple origins
- Input validation with Zod schemas
- SQL injection prevention with parameterized queries
- XSS protection with helmet middleware

## 📊 Monitoring

### Health Checks

- **Backend**: `/health` endpoint with database connectivity check
- **Detailed health**: `/api/v1/health/detailed` for comprehensive status

### Logging

- Structured logging with Winston
- Different log levels for development/production
- Request/response logging middleware
- Error tracking and reporting

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes** and add tests
4. **Run tests**: `npm test`
5. **Run linting**: `npm run lint:fix`
6. **Commit changes**: `git commit -m 'Add amazing feature'`
7. **Push to branch**: `git push origin feature/amazing-feature`
8. **Open a Pull Request**

### Code Style

- TypeScript for all new code
- ESLint configuration enforced
- Prettier for code formatting
- Conventional commit messages

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Troubleshooting

### Common Issues

1. **Database connection fails**
   - Check MySQL is running
   - Verify credentials in `.env`
   - Ensure database exists

2. **Frontend can't connect to backend**
   - Check backend is running on port 3000
   - Verify CORS_ORIGINS in backend `.env`
   - Check proxy configuration in `vite.config.ts`

3. **Build fails**
   - Run `npm run clean` and reinstall dependencies
   - Check TypeScript errors: `npm run build`
   - Verify all environment variables are set

4. **Tests fail**
   - Ensure test database is set up
   - Check test environment variables
   - Run tests individually to isolate issues

### Getting Help

- Check the [Issues](https://github.com/your-username/your-repo/issues) page
- Review the [Documentation](docs/)
- Contact the development team

## 🎯 Roadmap

- [ ] Add React Native mobile app
- [ ] Implement real-time features with WebSockets
- [ ] Add email service integration
- [ ] Implement file upload/storage
- [ ] Add comprehensive analytics
- [ ] Set up CI/CD pipeline
- [ ] Add Docker containerization
- [ ] Implement caching layer (Redis)
- [ ] Add API documentation (Swagger)
- [ ] Performance monitoring and optimization
