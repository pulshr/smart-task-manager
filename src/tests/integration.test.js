const request = require('supertest');
const app = require('../server');

describe('Integration Tests', () => {
  let user1Token, user2Token;
  let user1Id, user2Id;
  let projectId, taskId;

  beforeEach(async () => {
    // Register two users for integration testing
    const user1Response = await request(app)
      .post('/api/users/register')
      .send({
        name: 'User One',
        email: `user1-${Date.now()}@example.com`,
        password: 'password123'
      });

    const user2Response = await request(app)
      .post('/api/users/register')
      .send({
        name: 'User Two',
        email: `user2-${Date.now()}@example.com`,
        password: 'password123'
      });

    user1Token = user1Response.body.token;
    user1Id = user1Response.body.user.id;
    user2Token = user2Response.body.token;
    user2Id = user2Response.body.user.id;
  });

  describe('Complete Workflow Integration', () => {
    it('should complete full project and task lifecycle', async () => {
      // 1. User1 creates a project
      const projectResponse = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          name: 'Integration Test Project',
          description: 'Project for integration testing'
        })
        .expect(201);

      projectId = projectResponse.body.project.id;
      expect(projectResponse.body.project.ownerId).toBe(user1Id);

      // 2. User1 creates multiple tasks
      const task1Response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          title: 'Setup Database',
          description: 'Initialize database schema',
          priority: 'high',
          projectId: projectId
        })
        .expect(201);

      const task2Response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          title: 'Create API Endpoints',
          description: 'Develop REST API endpoints',
          priority: 'medium',
          projectId: projectId
        })
        .expect(201);

      taskId = task1Response.body.task.id;

      // 3. User1 assigns task to User2
      await request(app)
        .patch(`/api/tasks/${taskId}/assign`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          assigneeId: user2Id
        })
        .expect(200);

      // 4. User1 updates task status
      await request(app)
        .put(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          title: 'Setup Database - Updated',
          status: 'in_progress'
        })
        .expect(200);

      // 5. User1 marks task as completed
      await request(app)
        .patch(`/api/tasks/${taskId}/complete`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      // 6. Verify dashboard reflects all changes
      const dashboardResponse = await request(app)
        .get('/api/dashboard')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      const summary = dashboardResponse.body.summary;
      expect(summary.totalProjects).toBe(1);
      expect(summary.totalTasks).toBe(2);
      expect(summary.completedTasks).toBeGreaterThanOrEqual(1);

      // 7. Verify activity logs are created
      expect(dashboardResponse.body.recentActivity.length).toBeGreaterThan(0);
      const activities = dashboardResponse.body.recentActivity;
      const actions = activities.map(a => a.action);
      expect(actions).toContain('created');
      expect(actions).toContain('completed');

      // 8. User2 checks their assigned tasks
      const user2TasksResponse = await request(app)
        .get(`/api/tasks?assigneeId=${user2Id}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(user2TasksResponse.body.tasks.length).toBeGreaterThanOrEqual(1);
      expect(user2TasksResponse.body.tasks[0].assigneeId).toBe(user2Id);
    });

    it('should handle project deletion with cascading', async () => {
      // Create project with tasks
      const projectResponse = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          name: 'Project to Delete',
          description: 'This project will be deleted'
        });

      const deleteProjectId = projectResponse.body.project.id;

      // Create tasks in the project
      const taskResponse = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          title: 'Task in project to delete',
          projectId: deleteProjectId
        });

      const deleteTaskId = taskResponse.body.task.id;

      // Delete the project
      await request(app)
        .delete(`/api/projects/${deleteProjectId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      // Verify project is deleted
      await request(app)
        .get(`/api/projects/${deleteProjectId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(404);

      // Verify tasks are also deleted (cascade)
      await request(app)
        .get(`/api/tasks/${deleteTaskId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(404);
    });
  });

  describe('Security and Access Control', () => {
    it('should prevent users from accessing other users projects', async () => {
      // User1 creates a project
      const projectResponse = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          name: 'Private Project',
          description: 'Only User1 should access this'
        });

      const privateProjectId = projectResponse.body.project.id;

      // User2 tries to access User1's project
      await request(app)
        .get(`/api/projects/${privateProjectId}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(404);

      // User2 tries to update User1's project
      await request(app)
        .put(`/api/projects/${privateProjectId}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({
          name: 'Hacked Project'
        })
        .expect(404);

      // User2 tries to delete User1's project
      await request(app)
        .delete(`/api/projects/${privateProjectId}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(404);
    });

    it('should prevent users from accessing other users tasks', async () => {
      // User1 creates project and task
      const projectResponse = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          name: 'User1 Project',
          description: 'User1 only project'
        });

      const taskResponse = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          title: 'Private Task',
          projectId: projectResponse.body.project.id
        });

      const privateTaskId = taskResponse.body.task.id;

      // User2 tries to access User1's task
      await request(app)
        .get(`/api/tasks/${privateTaskId}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(404);

      // User2 tries to update User1's task
      await request(app)
        .put(`/api/tasks/${privateTaskId}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({
          title: 'Hacked Task'
        })
        .expect(404);
    });

    it('should require authentication for all protected endpoints', async () => {
      const protectedEndpoints = [
        { method: 'get', path: '/api/users/me' },
        { method: 'get', path: '/api/projects' },
        { method: 'post', path: '/api/projects' },
        { method: 'get', path: '/api/tasks' },
        { method: 'post', path: '/api/tasks' },
        { method: 'get', path: '/api/dashboard' }
      ];

      for (const endpoint of protectedEndpoints) {
        await request(app)[endpoint.method](endpoint.path)
          .expect(401);
      }
    });
  });

  describe('Data Validation and Error Handling', () => {
    it('should validate email format in registration', async () => {
      const response = await request(app)
        .post('/api/users/register')
        .send({
          name: 'Test User',
          email: 'invalid-email',
          password: 'password123'
        })
        .expect(400);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors.some(err => err.msg.includes('email'))).toBe(true);
    });

    it('should validate password length', async () => {
      const response = await request(app)
        .post('/api/users/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: '123'
        })
        .expect(400);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors.some(err => err.msg.includes('6 characters'))).toBe(true);
    });

    it('should validate task priority values', async () => {
      // First create a project
      const projectResponse = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          name: 'Test Project',
          description: 'Test'
        });

      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          title: 'Test Task',
          priority: 'invalid-priority',
          projectId: projectResponse.body.project.id
        })
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });

    it('should handle duplicate email registration', async () => {
      // Register first user
      await request(app)
        .post('/api/users/register')
        .send({
          name: 'First User',
          email: 'duplicate@example.com',
          password: 'password123'
        })
        .expect(201);

      // Try to register with same email
      const response = await request(app)
        .post('/api/users/register')
        .send({
          name: 'Second User',
          email: 'duplicate@example.com',
          password: 'password123'
        })
        .expect(400);

      expect(response.body.error).toBe('User already exists');
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should handle large number of tasks efficiently', async () => {
      // Create a project
      const projectResponse = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          name: 'Performance Test Project',
          description: 'Testing with many tasks'
        });

      const perfProjectId = projectResponse.body.project.id;

      // Create multiple tasks
      const taskPromises = [];
      for (let i = 0; i < 20; i++) {
        taskPromises.push(
          request(app)
            .post('/api/tasks')
            .set('Authorization', `Bearer ${user1Token}`)
            .send({
              title: `Performance Task ${i}`,
              description: `Task number ${i}`,
              priority: i % 3 === 0 ? 'high' : i % 3 === 1 ? 'medium' : 'low',
              projectId: perfProjectId
            })
        );
      }

      await Promise.all(taskPromises);

      // Verify all tasks are retrieved efficiently
      const startTime = Date.now();
      const response = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);
      const endTime = Date.now();

      expect(response.body.tasks.length).toBeGreaterThanOrEqual(20);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should handle empty results gracefully', async () => {
      // Get tasks for user with no projects
      const newUserResponse = await request(app)
        .post('/api/users/register')
        .send({
          name: 'Empty User',
          email: 'empty@example.com',
          password: 'password123'
        });

      const response = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${newUserResponse.body.token}`)
        .expect(200);

      expect(response.body.tasks).toEqual([]);
    });
  });
});