# Smart Task Manager API

A comprehensive task management backend API built with Node.js, Express, Prisma, and SQLite for the Scaler Neovarsity - Woolf Applied Project submission (Backend Specialization).

## Features

- **User Authentication**: JWT-based registration and login
- **Project Management**: Create, read, update, delete projects
- **Task Management**: Full CRUD operations with assignment and completion tracking
- **Dashboard Analytics**: Comprehensive statistics and activity logs
- **API Documentation**: Interactive Swagger UI
- **Testing**: Jest and Supertest integration
- **Database**: SQLite with Prisma ORM

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn

## Installation & Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/pulshr/smart-task-manager.git
   cd smart-task-manager
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```

4. **Generate Prisma client and run migrations**
   ```bash
   npx prisma generate
   npx prisma migrate dev --name init
   ```

5. **Seed the database (optional)**
   ```bash
   npm run db:seed
   ```

6. **Start the development server**
   ```bash
   npm run dev
   ```

The API will be available at `http://localhost:3000`

## API Documentation

Interactive API documentation is available at: `http://localhost:3000/api-docs`

## API Endpoints

### Authentication
- `POST /api/users/register` - Register new user
- `POST /api/users/login` - Login user
- `GET /api/users/me` - Get user profile

### Projects
- `POST /api/projects` - Create project
- `GET /api/projects` - Get all projects
- `GET /api/projects/:id` - Get project by ID
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Tasks
- `POST /api/tasks` - Create task
- `GET /api/tasks` - Get all tasks (with filters)
- `GET /api/tasks/:id` - Get task by ID
- `PUT /api/tasks/:id` - Update task
- `PATCH /api/tasks/:id/assign` - Assign task
- `PATCH /api/tasks/:id/complete` - Mark task complete
- `DELETE /api/tasks/:id` - Delete task

### Dashboard
- `GET /api/dashboard` - Get dashboard statistics

## Testing

Run tests with:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

## Database Schema

### Users
- `id` (Primary Key)
- `name`
- `email` (Unique)
- `password` (Hashed)
- `createdAt`
- `updatedAt`

### Projects
- `id` (Primary Key)
- `name`
- `description`
- `ownerId` (Foreign Key → Users)
- `createdAt`
- `updatedAt`

### Tasks
- `id` (Primary Key)
- `title`
- `description`
- `status` (pending, in_progress, completed)
- `priority` (low, medium, high)
- `dueDate`
- `projectId` (Foreign Key → Projects)
- `assigneeId` (Foreign Key → Users)
- `createdAt`
- `updatedAt`

### Activity Logs
- `id` (Primary Key)
- `userId` (Foreign Key → Users)
- `taskId` (Foreign Key → Tasks)
- `action`
- `createdAt`

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Sample Requests

### Register User
```bash
curl -X POST http://localhost:3000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123"
  }'
```

### Login
```bash
curl -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

### Create Project
```bash
curl -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-token>" \
  -d '{
    "name": "My Project",
    "description": "Project description"
  }'
```

### Create Task
```bash
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-token>" \
  -d '{
    "title": "Task Title",
    "description": "Task description",
    "priority": "high",
    "dueDate": "2024-02-15T10:00:00Z",
    "projectId": 1
  }'
```

## Deployment

The application is designed to run locally but can be deployed to any Node.js hosting platform:

1. Set environment variables on your hosting platform
2. Run database migrations: `npx prisma migrate deploy`
3. Start the application: `npm start`

## Project Structure

```
smart-task-manager/
├── prisma/
│   └── schema.prisma
├── src/
│   ├── config/
│   │   ├── seed.js
│   │   └── swagger.js
│   ├── controllers/
│   │   ├── dashboardController.js
│   │   ├── projectController.js
│   │   ├── taskController.js
│   │   └── userController.js
│   ├── middlewares/
│   │   └── auth.js
│   ├── routes/
│   │   ├── dashboardRoutes.js
│   │   ├── projectRoutes.js
│   │   ├── taskRoutes.js
│   │   └── userRoutes.js
│   ├── tests/
│   │   ├── auth.test.js
│   │   └── setup.js
│   └── server.js
├── .env.example
├── .gitignore
├── jest.config.js
├── package.json
└── README.md
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Run tests to ensure they pass
6. Submit a pull request

## License

This project is licensed under the MIT License.

## Author

**pulshr** - Backend Specialization Project for Scaler Neovarsity - Woolf Applied Project

## Acknowledgments

- Scaler Neovarsity for the project requirements
- Prisma team for the excellent ORM
- Express.js community for the robust framework