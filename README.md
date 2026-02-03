# Identity Service (User Management System)

> **Enterprise-Grade Node.js Microservice** demonstrating strict separation of concerns, specialized database optimization patterns, and production-ready resilience mechanisms.

## Engineering Overview

This service is an architectural reference for building scalable, maintainable, and resilient Node.js backends. It addresses common distributed system challenges—such as data consistency, request idempotency, and database connection stalling—through robust engineering practices.

### Core Philosophy

1.  **Resilience First**: The system is designed to "fail fast" and handle network partitions gracefully using strict timeouts.
2.  **Performance by Default**: Every database query is optimized with index-aware strategies and lean execution.
3.  **Strict Layering**: Business logic (Service) is completely decoupled from HTTP transport (Controller) and Data Access (Repository).

---

## Technical Implementation

This codebase implements several advanced patterns to solve real-world production scale issues:

### 1. Hybrid Pagination Strategy (Cursor + Offset)

**Problem**: Traditional "Offset" pagination (`skip(10000).limit(10)`) becomes exponentially slower as data grows because the database must scan and discard thousands of documents.

**Solution**: Implemented a dual-mode strategy.
-   **Cursor-Based Navigation (O(1))**: Uses unique identifiers (`_id`) as a pointer for "Next/Previous" navigation. This delivers constant-time performance regardless of dataset size.
-   **Offset-Based Fallback**: Retains support for random page access when necessary.

### 2. Database Resilience and Circuit Breaking

**Problem**: In high-load scenarios, a hanging database connection can exhaust the connection pool, causing the entire application to become unresponsive (the "thundering herd" problem).

**Solution**: Strict timeouts imposed at multiple levels.
-   **Connection Timeout (`serverSelectionTimeoutMS: 5000`)**: If the database is unreachable, the operation fails immediately rather than waiting for the default timeout.
-   **Socket Timeout (`socketTimeoutMS: 45000`)**: Terminates idle connections to free up resources.
-   **Query-Level Timeout (`maxTimeMS(10000)`)**: Every repository call has a strict 10-second execution limit.

### 3. Duplicate Request Prevention (Idempotency)

**Problem**: Users double-clicking submit buttons or network retries can cause duplicate resource creation or inconsistent states.

**Solution**: Custom Rate Limiting middleware designed specifically for write operations.
-   **Mechanism**: A strict time-window lock prevents the same IP from triggering sensitive endpoints more than once every 2 seconds.

### 4. ESR Pattern Indexing

**Problem**: Incorrect index order renders database indexes ineffective for sorting operations.

**Solution**: Applied the **Equality - Sort - Range (ESR)** rule to Mongoose schemas.
-   Indexes are structured to first filter exact matches (e.g., `role`), then apply sorting (e.g., `createdAt`), ensuring the sort operation is performed in the index rather than in memory.

### 5. Advanced Authentication (Token Rotation Strategy)

**Problem**: Static refresh tokens handling is insecure. If a refresh token is stolen, the attacker has permanent access until the token expires.

**Solution**: Implemented **RTR (Refresh Token Rotation)** with **Token Families** and **Reuse Detection**.
-   **Token Families**: Every login creates a "Family" of tokens.
-   **Rotation**: Every time a token is used to refresh, it is invalidated and replaced by a new one in the same family.
-   **Grace Period**: A short window (60s) where the old token is still accepted to handle concurrent requests (race conditions).
-   **Theft Detection**: If an old token (outside grace period) is used, the system assumes theft and **revokes the entire family**, logging out both the attacker and the legitimate user.
-   **Secure Logout**: Manually revokes the token family, strictly invalidating all refresh tokens for that session.

### 6. Role-Based Access Control (RBAC)

**Problem**: Unrestricted access allows any authenticated user to perform administrative actions (e.g., deleting other users).

**Solution**: Implemented a dual-layer permission system.
-   **Authentication Layer**: Verifies identity via JWT.
-   **Authorization Layer**: Enforces granular permissions based on user roles (`user`, `admin`).
    -   **Admin**: Full access to all resources.
    -   **User**: Restricted access (can only view/edit their own profile).

### 7. Structured Logging & Observability

**Problem**: Standard `console.log` is synchronous, unstructured, and blocking, making production debugging and log analysis difficult.

**Solution**: Integrated **Winston** for robust, multi-transport logging.
-   **Structured JSON Output**: Logs are formatted as JSON for easy integration with observability stacks (ELK, Datadog).
-   **Smart Transports**:
    -   **Console**: Color-coded, human-readable logs for local development.
    -   **File**: Persistent rotation-ready log files (`error.log`, `all.log`) for production auditing.
-   **Request Profiling**: Automated middleware tracks every HTTP request's duration, status code, and method.

### 8. Redis Caching Strategy

**Problem**: Frequent database reads for static user profiles create unnecessary load and latency.

**Solution**: implemented a **Write-Through Caching** strategy using Redis.
-   **Read Optimization**: `GET` requests check Redis first. Cache hits return in <5ms, bypassing MongoDB entirely.
-   **Consistency**: `UPDATE` and `DELETE` operations immediately invalidate the cache, ensuring users never see stale data.

### 9. Token Blocklist (Instant Revocation)

**Problem**: JWTs are stateless and cannot be invalidated until they expire (15m). If an access token is compromised, the attacker has a 15-minute window of opportunity.

**Solution**: Implemented a **Redis Blocklist**.
-   **Logout Action**: On logout, the Access Token is added to Redis with a TTL equal to its remaining validity.
-   **Security Check**: Authentication middleware checks this blocklist on every request, instantly rejecting revoked tokens even if their signature is valid.

### 10. Horizontal Scaling & Process Management

**Problem**: Node.js is single-threaded by default, utilizing only one CPU core even on multi-core servers. This limits throughput and fault tolerance. Also, abrupt terminations can result in lost requests and database connection issues.

**Solution**: Implemented **PM2 Cluster Mode** and **Graceful Shutdown**.
-   **Multi-Core Utilization**: PM2 scales the application across all available CPU cores, maximizing hardware efficiency.
-   **Zero-Downtime Reloads**: Allows code deployment without dropping active connections.
-   **Graceful Shutdown**: Intercepts system signals (`SIGINT`, `SIGTERM`) to stop accepting new requests, close database/redis connections, and finish active requests before exiting, ensuring no user data is lost during scaling or deployment.

### 11. Secure Email Verification

**Problem**: Allowing users to register with fake or invalid emails compromises system integrity and password recovery flows.

**Solution**: Implemented a **Token-Based Verification System**.
-   **Security**: Verification tokens are cryptographically generated and stored as **hashes** in the database. Even if the DB is leaked, active verification links cannot be reverse-engineered.
-   **Infrastructure**:
    -   **Development**: Uses Ethereal Email (fake SMTP) and logs preview URLs directly to the console for easy testing without spamming real inboxes.
    -   **Production**: Automatically switches to real SMTP services (e.g., SendGrid/AWS SES) via environment configuration.
-   **Flow**: Users receive a time-sensitive link. Clicking it hits a secure endpoint that validates the token hash and activates the account.

---

## System Architecture

The project adheres to a strict **Repository-Service-Controller** layered architecture.

-   **Controller Layer**: Handles HTTP transport, input parsing, and response formatting. Contains zero business logic.
-   **Service Layer**: Encapsulates business logic, including password hashing, complex validation rules, and algorithm selection.
-   **Repository Layer**: Manages direct database interactions. This abstraction allows the underlying database to be swapped with minimal impact on business logic.

---

## Testing & Quality Assurance

Comprehensive testing strategy ensuring code reliability and preventing regression.

### Testing Stack
-   **Jest**: Feature-rich testing framework.
-   **Supertest**: HTTP assertions for integration testing.
-   **MongoDB Memory Server**: In-memory database for fast, isolated integration tests.

### Running Tests

1.  **Execute All Tests**
    ```bash
    npm test
    ```

2.  **Run Specific Suites**
    ```bash
    # Unit Tests Only
    npx jest src/tests/unit

    # Integration Tests Only
    npx jest src/tests/integration
    ```

3.  **Watch Mode** (for development)
    ```bash
    npm test -- --watch
    ```

### Test Structure
-   `src/tests/unit`: Tests individual functions (Utils, Services, Middlewares) in isolation using mocks.
-   `src/tests/integration`: Tests full API endpoints (Routes -> Controller -> Service -> DB) using a real in-memory database.

---

## Technology Stack

This project utilizes a focused selection of production-proven libraries:

### Core Framework
-   **Express.js**: Web framework for handling HTTP requests and routing.
-   **Dotenv**: Manages environment variables for secure configuration.

### Database
-   **Mongoose**: Object Data Modeling (ODM) library for MongoDB, providing rigorous schema enforcement.

### Security and Validation
-   **Bcrypt**: Industry-standard library for hashing and salting user passwords.
-   **Zod**: TypeScript-first schema declaration and validation library, used for strict request body and parameter validation.
-   **Express-Rate-Limit**: Middleware to prevent brute-force attacks and handle request throttling.

### Development Utilities
-   **Nodemon**: Utility for automatic server restarts during development.

-   **PM2**: Advanced production process manager with built-in load balancer.
-   **Jest**: JavaScript Testing Framework with a focus on simplicity.

### Logging
-   **Winston**: Versatile logging library supporting multiple transports (File, Console) and varying log levels.

### Caching
-   **Redis**: In-memory data store used for high-performance caching and distributed connection handling.

---

## Project Structure

The directory structure is modular, scalable, and organized by feature domain.

```text
src/
├── config/             # Database & Environment Configuration
├── middlewares/        # Custom Middleware (Rate Limiters, Error Handling)
├── modules/            # Domain Modules
│   └── user/
│       ├── user.controller.js  # HTTP Transport Layer
│       ├── user.service.js     # Business Logic Layer
│       ├── user.repo.js        # Data Access Layer
│       ├── user.model.js       # Database Schema
│       └── user.routes.js      # Route Definitions
├── tests/              # Test Suites
│   ├── unit/           # Unit Tests
│   └── integration/    # Integration Tests (API Endpoints)
├── utils/              # Shared Utilities (AsyncHandler, ApiError)
└── server.js           # Application Entry Point
```

---

## Quick Start

### Prerequisites
-   Node.js v18 or higher
-   MongoDB (Local instance or Atlas cluster)
-   Docker (Optional, for containerized execution)

### Installation

1.  **Clone the repository**
    ```bash
    git clone <repo-url>
    npm install
    ```

2.  **Configure Environment**
    Create a `.env` file in the root directory:
    ```env
    PORT=5000
    MONGO_URI=mongodb://localhost:27017/identity-service
    ```

3.  **Run Application**
    ```bash
    # Development Mode (with hot-reload)
    npm run dev
    
    # Production Mode
    npm start
    ```

### Docker Deployment
The service is fully containerized with **PM2 runtime** for production-grade process management.
```bash
docker-compose up -d --build
```

**Monitoring & Management**:
Since PM2 runs inside the container, use the following commands:
```bash
# Monitor CPU/Memory per instance
docker exec -it user-api-app pm2 monit

# View Logs
docker exec user-api-app pm2 logs

# Zero-Downtime Reload
docker exec user-api-app pm2 reload ecosystem.config.js
```

---

## API Documentation (Swagger)

Interactive API documentation is available at:
`http://localhost:5000/api-docs`

## API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/users` | List users (Admin Only) |
| `POST` | `/api/v1/auth/register` | Create user (Rate-limited & Validated) |
| `GET` | `/api/v1/users/:id` | Retrieve user profile (Owner or Admin) |
| `DELETE` | `/api/v1/users/:id` | Delete user record (Admin Only) |
| `POST` | `/api/v1/auth/login` | Login (Returns Access & Refresh Tokens) |
| `POST` | `/api/v1/auth/refresh` | Rotate tokens using Token Families |
| `POST` | `/api/v1/auth/refresh` | Rotate tokens using Token Families |
| `POST` | `/api/v1/auth/logout` | Secure Logout (Revokes Token Family) |
| `GET` | `/api/v1/user/auth/verifyemail/:token` | Verify user email address |

---

*Architected by Ravi*
