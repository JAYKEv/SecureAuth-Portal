# SecureAuth Portal - Production-Grade Authentication Service

**Author:** Jaykumar Kevdiya  
**Email:** kevadiyj@uwindsor.ca

[![GitHub](https://img.shields.io/github/license/JAYKEv/SecureAuth-Portal)](https://github.com/JAYKEv/SecureAuth-Portal)

A production-ready, full-stack authentication service featuring **JWT refresh token rotation**, **role-based access control (RBAC)**, **audit logging**, **rate limiting**, and a modern, responsive frontend UI. Built with TypeScript, Express, PostgreSQL, Redis, and Docker.

## 🚀 Key Features

### Backend Features

- ✅ **JWT Authentication** with access tokens (15min expiry) and refresh tokens (7 days)
- ✅ **Refresh Token Rotation** - Old tokens are automatically invalidated when new ones are issued
- ✅ **Role-Based Access Control (RBAC)** - Admin, Manager, Editor, Viewer, User, Guest roles
- ✅ **Audit Logging** - Comprehensive event tracking (login, logout, refresh, failed attempts)
- ✅ **Rate Limiting** - Protection against brute force attacks (5 requests/minute for auth endpoints)
- ✅ **Token Revocation** - Redis-based token blacklisting
- ✅ **Docker Support** - Complete Docker Compose setup with PostgreSQL, Redis, Elasticsearch
- ✅ **Swagger API Documentation** - Interactive API docs at `/api-docs`
- ✅ **TypeScript** - Fully typed codebase
- ✅ **Security Best Practices** - Helmet.js, CORS, input validation, password hashing

### Frontend Features

- ✅ **Modern UI/UX** - Custom branded "SecureAuth Portal" interface
- ✅ **Card Layout Design** - Beautiful split-screen layout with illustrations
- ✅ **Password Strength Meter** - Real-time password strength indicator
- ✅ **Password Toggle Visibility** - Show/hide password functionality
- ✅ **Inline Form Validation** - Real-time error messages
- ✅ **Responsive Design** - Mobile and desktop optimized
- ✅ **Post-Login Dashboard** - User profile, roles, permissions, and audit log preview
- ✅ **Custom Branding** - Professional color scheme (#6C63FF primary, #FF6584 accent)

## 📋 Tech Stack

- **Backend:**
  - Node.js, Express, TypeScript
  - PostgreSQL (TypeORM)
  - Redis (token blacklisting)
  - JWT (jsonwebtoken)
  - Express Rate Limit
  - Swagger/OpenAPI

- **Frontend:**
  - Vanilla JavaScript (ES6+)
  - HTML5, CSS3
  - Font Awesome Icons
  - Poppins Font

- **DevOps:**
  - Docker & Docker Compose
  - PostgreSQL Admin
  - Elasticsearch & Kibana

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Public)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   Login UI   │  │  Signup UI   │  │  Dashboard   │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│              Express API Server (TypeScript)            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │ Auth Routes  │  │ Rate Limiter │  │ RBAC Middle  │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │Refresh Token │  │ Audit Logger │  │ JWT Utils    │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────┘
         │                    │                    │
         ▼                    ▼                    ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  PostgreSQL  │    │    Redis     │    │Elasticsearch │
│  (Users,     │    │  (Token      │    │  (Activity  │
│   Roles,     │    │  Blacklist)  │    │   Logs)     │
│   Tokens,    │    │              │    │              │
│   Audit)     │    │              │    │              │
└──────────────┘    └──────────────┘    └──────────────┘
```

## 🛠️ Installation & Setup

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- npm or yarn

### Quick Start

1. **Clone the repository:**
```bash
git clone https://github.com/JAYKEv/SecureAuth-Portal.git
cd SecureAuth-Portal
```

2. **Install dependencies:**
```bash
npm install
```

3. **Set up environment variables:**
```bash
# Copy example env file
cp .env.example .env

# Or run the setup script (creates test configs)
./setenv.test.sh
```

4. **Start Docker services:**
```bash
docker-compose up -d
```

5. **Set up Elasticsearch mappings (optional):**
```bash
./setup_es.sh
```

6. **Run database migrations:**
The database tables will be created automatically on first run (TypeORM synchronize).

7. **Start the development server:**
```bash
npm run dev
```

8. **Access the application:**
- **Frontend:** http://localhost:3000
- **API Documentation:** http://localhost:3000/api-docs
- **PostgreSQL Admin:** http://localhost:8080
- **Kibana:** http://localhost:5601

## 📚 API Endpoints

### Authentication

- `POST /login` - Sign in securely (rate limited: 5/min)
  - Returns: `{ user, token, refreshToken }`
  
- `POST /register` - Create my account (rate limited: 5/min)
  - Body: `{ firstName, lastName, email, password }`
  
- `POST /refresh` - Refresh access token (implements token rotation)
  - Body: `{ refreshToken }`
  - Returns: `{ accessToken, refreshToken }` (old refresh token invalidated)
  
- `POST /logout` - Sign out and revoke tokens
  - Body: `{ refreshToken }` (optional)
  
- `GET /verify/:token` - Verify email and activate account

### User Management

- `GET /` - Get current user profile (requires auth)
- `GET /users` - List all users (role-based filtering)
- `GET /users/:id` - Get user by ID
- `PATCH /users/:id` - Update user
- `DELETE /users/:id` - Delete user

### Roles & Permissions

- `GET /roles` - List all roles
- `POST /roles` - Create role (admin only)
- `GET /roles/:id` - Get role details
- `PATCH /roles/:id` - Update role
- `DELETE /roles/:id` - Delete role
- `GET /roles/:id/permissions` - Get role permissions

## 🔐 Security Features

### Refresh Token Rotation

When a refresh token is used, the system:
1. Validates the refresh token
2. Generates new access and refresh tokens
3. **Invalidates the old refresh token** (token rotation)
4. Stores the new refresh token in the database

This prevents token reuse attacks and enhances security.

### Rate Limiting

- **Authentication endpoints:** 5 requests per minute per IP
- **General endpoints:** 100 requests per 15 minutes per IP

### Audit Logging

All authentication events are logged:
- `login` - Successful login
- `logout` - User logout
- `refresh_token` - Token refresh
- `failed_login` - Failed login attempt
- `register` - User registration

Logs include: user ID, IP address, user agent, timestamp, and metadata.

### RBAC Roles

- **Admin** - Full system access
- **Manager** - Elevated permissions for management
- **Editor** - Content editing permissions
- **Viewer** - Read-only access
- **User** - Standard user permissions
- **Guest** - Limited guest access

## 🎨 Frontend Features

### Custom Branding

- **App Name:** SecureAuth Portal
- **Color Scheme:**
  - Primary: #6C63FF (Purple)
  - Secondary: #F2F2F2 (Light Gray)
  - Accent: #FF6584 (Pink)

### UX Enhancements

- **Password Strength Meter:** Visual indicator (Weak/Medium/Strong)
- **Password Toggle:** Show/hide password button
- **Inline Validation:** Real-time error messages
- **Remember Me:** Checkbox for persistent sessions
- **Responsive Design:** Mobile-first approach

### Dashboard

Post-login dashboard includes:
- User profile information
- Assigned roles and permissions
- Audit log preview
- Logout functionality

## 🐳 Docker Setup

The project includes a complete Docker Compose configuration:

```yaml
services:
  postgres:    # PostgreSQL database
  redis:       # Redis cache
  pgadmin:    # PostgreSQL admin UI
  elasticsearch: # Search and logging
  kibana:     # Elasticsearch UI
```

To start all services:
```bash
docker-compose up -d
```

To stop and remove volumes:
```bash
docker-compose down -v
```

## 📊 Database Schema

### Core Tables

- **users** - User accounts (firstName, lastName, email, password, roles)
- **roles** - System roles (id, description, permissions)
- **permissions** - Granular permissions (resource, action)
- **refresh_tokens** - Active refresh tokens (token, userId, expiresAt, revoked)
- **audit_logs** - Security event logs (userId, event, ipAddress, userAgent, timestamp)

## 🧪 Testing

Run the test suite:
```bash
npm test
```

Run with coverage:
```bash
npm run coverage
```

**Note:** Docker services must be running for tests to pass.

## 📝 Environment Variables

Key environment variables:

```env
# Server
PORT=3000
NODE_ENV=development

# Database
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=admin
POSTGRES_PASSWORD=admin
POSTGRES_DB=auth_example

# JWT
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Redis
REDIS_URL=localhost
```

## 🎯 Portfolio Highlights

### Backend Achievements

- ✅ Built a production-grade authentication service using **JWT with refresh token rotation** and **role-based access control (RBAC)**
- ✅ Implemented **token revocation, Redis-based blacklisting, rate limiting, and audit logging**, ensuring secure and scalable API access
- ✅ Configured **Dockerized environment** with PostgreSQL and added **Swagger API documentation** for onboarding and deployment

### Frontend Achievements

- ✅ Redesigned authentication UI with **custom branding, modern card layout, and responsive design**
- ✅ Implemented **password strength indicators, toggle visibility, and inline validation**
- ✅ Added **post-login dashboard with user roles, permissions, and audit log preview**

## 📖 Documentation

- **API Documentation:** http://localhost:3000/api-docs (Swagger UI)
- **OpenAPI Spec:** `/src/config/openapi.json`

## 🤝 Contributing

This is a portfolio project demonstrating production-ready authentication patterns. Contributions and suggestions are welcome!

## 📄 License

ISC

## 👤 Author

**Jaykumar Kevdiya**  
Email: kevadiyj@uwindsor.ca

---

**Built with ❤️ using TypeScript, Express, PostgreSQL, and modern web technologies**
