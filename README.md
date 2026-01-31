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

---

## System Architecture

The project adheres to a strict **Repository-Service-Controller** layered architecture.

-   **Controller Layer**: Handles HTTP transport, input parsing, and response formatting. Contains zero business logic.
-   **Service Layer**: Encapsulates business logic, including password hashing, complex validation rules, and algorithm selection.
-   **Repository Layer**: Manages direct database interactions. This abstraction allows the underlying database to be swapped with minimal impact on business logic.

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
The service is fully containerized.
```bash
docker-compose up -d --build
```

---

## API Documentation (Swagger)

Interactive API documentation is available at:
`http://localhost:5000/api-docs`

## API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/users` | List users with cursor/offset pagination strategies |
| `POST` | `/users` | Create user (Rate-limited & Validated) |
| `GET` | `/users/:id` | Retrieve user profile by ID |
| `DELETE` | `/users/:id` | Delete user record |
| `POST` | `/auth/register` | Register new user |
| `POST` | `/auth/login` | Login (Returns Access & Refresh Tokens) |
| `POST` | `/auth/refresh` | Rotate tokens using Token Families |

---

*Architected by Ravi*
