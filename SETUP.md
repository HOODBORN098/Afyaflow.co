# AfyaFlow - Developer Setup Guide

This guide provides step-by-step instructions for setting up the AfyaFlow hospital management system on your local machine.

## Prerequisites

Before you begin, ensure you have the following installed:
- **Java JDK 17** (or later)
- **Node.js** (v18 or later)
- **MySQL Server** (v8.0 or later)
- **Maven** (optional, wrapper included)

---

## 1. Database Configuration

1. Open your MySQL client (Workbench, CLI, etc.).
2. Create a new database named `afyaflow`:
   ```sql
   CREATE DATABASE afyaflow;
   ```
3. Update the backend configuration with your MySQL credentials:
   - Navigate to `AfyaFlow-Backend/src/main/resources/application.properties`.
   - Update `spring.datasource.username` and `spring.datasource.password`.

---

## 2. Backend Setup (Spring Boot)

1. Open a terminal and navigate to the backend directory:
   ```bash
   cd AfyaFlow-Backend
   ```
2. Build and run the application:
   ```bash
   ./mvnw.cmd spring-boot:run
   ```
   *(On Linux/macOS use `./mvnw spring-boot:run`)*
3. The server will start at `http://localhost:8080`.

---

## 3. Frontend Setup (React + Vite)

1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd afyaflow-react
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `afyaflow-react` directory:
   ```env
   VITE_API_URL=http://localhost:8080
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
5. Open your browser to `http://localhost:5173`.

---

## 4. Default Credentials

Once the system is running, you can log in using these default accounts (if pre-loaded):
- **Admin**: `admin@afyaflow.co` / `password123`
- **Doctor**: `doctor@afyaflow.co` / `password123`
- **Receptionist**: `receptionist@afyaflow.co` / `password123`

---

## Troubleshooting

- **CORS Issues**: Ensure the backend `WebConfig` allows `http://localhost:5173`.
- **JWT Errors**: If you get a 403 Forbidden, clear your browser's `sessionStorage` and log in again.
- **Port Conflicts**: If port 8080 or 5173 is in use, you can change them in `application.properties` or `vite.config.ts` respectively.
