# 🏗️ TermiStack Architecture

## System Overview

TermiStack is a decoupled full-stack application designed for high performance and developer productivity. It uses Redis as the primary user store, PostgreSQL for relational audit history, and a unique terminal-themed interface for API interaction.

## Core Components

### 1. Frontend (Next.js)
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Features**:
  - Custom Terminal Emulator component.
  - Client-side command history.
  - Interactive API request builder.

### 2. Backend (Spring Boot)
- **Framework**: Spring Boot 3.2.5
- **Data Layer**: Spring Data Redis
- **Persistence**: Redis (Jedis/Lettuce)
- **Features**:
  - RESTful User CRUD.
  - Global Exception Handling.
  - CORS configuration for cross-origin frontend access.

### 3. Primary Database (Redis)
- **Role**: Primary data store for user profiles.
- **Persistence**: Configured to persist data to disk in containerized environments.

### 4. Relational Database (PostgreSQL)
- **Role**: Stores audit history for user create, update, and delete events.
- **Access Layer**: Spring Data JPA.

---

## Data Flow

1. **User Input**: User types a command in the Terminal UI (e.g., `get /users`).
2. **Command Parsing**: The frontend parses the command and maps it to a REST request.
3. **API Request**: Frontend sends an asynchronous `fetch` request to the Spring Boot backend.
4. **Business Logic**: Backend processes the request, interacts with Redis via `UserRepository`, and records write events in PostgreSQL via `UserAuditRepository`.
5. **Response**: Backend returns a JSON response (or 204 for deletions).
6. **UI Rendering**: Terminal UI captures the response, calculates round-trip time, and prints the result to the screen.

---

## Deployment Architecture

The system is designed to run in two primary modes:

### Docker Compose
All four services (Frontend, Backend, Redis, PostgreSQL) are orchestrated within a private network. The frontend is exposed on port `3000`, the backend on `8080`, Redis on `6379`, and PostgreSQL on `5432`.

### Kubernetes
- **Deployments**: Separate deployments for each service.
- **Services**: `ClusterIP` for internal communication, `NodePort` or `LoadBalancer` for external access.
- **Config**: Environment variables inject Redis host/port into the backend.
