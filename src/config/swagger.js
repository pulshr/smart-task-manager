const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Smart Task Manager API',
      version: '1.0.0',
      description: 'A comprehensive task management API built with Node.js, Express, and Prisma',
      contact: {
        name: 'API Support',
        email: 'support@smarttaskmanager.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    tags: [
      {
        name: 'Users',
        description: 'User authentication and profile management'
      },
      {
        name: 'Projects',
        description: 'Project management operations'
      },
      {
        name: 'Tasks',
        description: 'Task management and assignment operations'
      },
      {
        name: 'Dashboard',
        description: 'Dashboard statistics and summary data'
      }
    ]
  },
  apis: ['./src/routes/*.js']
};

const specs = swaggerJsdoc(options);

module.exports = specs;