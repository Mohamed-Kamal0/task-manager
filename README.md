# Task Management Application

A simple task manager built with Node.js, Express, PostgreSQL, and React.

## Features
- User Authentication (Register/Login via JWT)
- Create, Read, Update, Delete tasks
- Status updates (Pending, In Progress, Done)
- Secure password hashing

## Setup

### 1. Database
- Ensure PostgreSQL is running.
- Create database `taskapp`.
- Run the SQL commands provided to create `users` and `tasks` tables.

### 2. Backend
1. `cd backend`
2. `npm install`
3. Configure `.env` with your DB ![alt text](image.png)credentials.
4. `npm start` (Runs on port 5000)

### 3. Frontend
1. `cd frontend`
2. `npm install`
3. `npm run dev` (Runs on port 5173)

### API Endpoints
- `POST /register`: Create account
- `POST /login`: Get JWT
- `GET /tasks`: List tasks
- `POST /tasks`: Create task
- `PUT /tasks/:id`: Update task![alt text](image.png)
- `DELETE /tasks/:id`: Remove task