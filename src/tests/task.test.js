const request = require('supertest');
const app = require('../server');

describe('Task Management', () => {
  let authToken;
  let userId;
  let projectId;
  let taskId;
  let assigneeToken;
  let assigneeId;

  beforeEach(async () => {
    // Register and login primary user
    const registerResponse = await request(app)
      .post('/api/users/register')
      .send({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      });

    authToken = registerResponse.body.token;
    userId = registerResponse.body.user.id;

    // Register assignee user
    const assigneeResponse = await request(app)
      .post('/api/users/register')
      .send({
        name: 'Assignee User',
        email: 'assignee@example.com',
        password: 'password123'
      });

    assigneeToken = assigneeResponse.body.token;
    assigneeId = assigneeResponse.body.user.id;

    // Create a test project
    const projectResponse = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Test Project',
        description: 'Test project description'
      });

    projectId = projectResponse.body.project.id;
  });

  describe('POST /api/tasks', () => {
    it('should create a new task', async () => {
      const taskData = {
        title: 'Test Task',
        description: 'Test task description',
        priority: 'high',
        dueDate: '2024-12-31T23:59:59Z',
        projectId: projectId
      };

      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(taskData)
        .expect(201);

      expect(response.body.message).toBe('Task created successfully');
      expect(response.body.task.title).toBe(taskData.title);
      expect(response.body.task.description).toBe(taskData.description);
      expect(response.body.task.priority).toBe(taskData.priority);
      expect(response.body.task.projectId).toBe(projectId);
      expect(response.body.task.status).toBe('pending');
      taskId = response.body.task.id;
    });

    it('should create task with default priority', async () => {
      const taskData = {
        title: 'Test Task',
        description: 'Test task description',
        projectId: projectId
      };

      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(taskData)
        .expect(201);

      expect(response.body.task.priority).toBe('medium');
    });

    it('should not create task without authentication', async () => {
      const taskData = {
        title: 'Test Task',
        description: 'Test task description',
        projectId: projectId
      };

      await request(app)
        .post('/api/tasks')
        .send(taskData)
        .expect(401);
    });

    it('should not create task without title', async () => {
      const taskData = {
        description: 'Test task description',
        projectId: projectId
      };

      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(taskData)
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });

    it('should not create task for non-existent project', async () => {
      const taskData = {
        title: 'Test Task',
        description: 'Test task description',
        projectId: 99999
      };

      await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(taskData)
        .expect(404);
    });
  });

  describe('GET /api/tasks', () => {
    beforeEach(async () => {
      // Create test tasks
      await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Task 1',
          description: 'First task',
          priority: 'high',
          projectId: projectId
        });

      await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Task 2',
          description: 'Second task',
          priority: 'low',
          status: 'in_progress',
          projectId: projectId
        });
    });

    it('should get all tasks for authenticated user', async () => {
      const response = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.tasks).toBeDefined();
      expect(Array.isArray(response.body.tasks)).toBe(true);
      expect(response.body.tasks.length).toBeGreaterThanOrEqual(2);
    });

    it('should filter tasks by project', async () => {
      const response = await request(app)
        .get(`/api/tasks?projectId=${projectId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.tasks).toBeDefined();
      response.body.tasks.forEach(task => {
        expect(task.projectId).toBe(projectId);
      });
    });

    it('should filter tasks by status', async () => {
      const response = await request(app)
        .get('/api/tasks?status=pending')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.tasks).toBeDefined();
      response.body.tasks.forEach(task => {
        expect(task.status).toBe('pending');
      });
    });

    it('should not get tasks without authentication', async () => {
      await request(app)
        .get('/api/tasks')
        .expect(401);
    });
  });

  describe('GET /api/tasks/:id', () => {
    beforeEach(async () => {
      // Create a test task
      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test Task',
          description: 'Test task description',
          projectId: projectId
        });
      taskId = response.body.task.id;
    });

    it('should get task by ID', async () => {
      const response = await request(app)
        .get(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.task).toBeDefined();
      expect(response.body.task.id).toBe(taskId);
      expect(response.body.task.title).toBe('Test Task');
      expect(response.body.task.activityLogs).toBeDefined();
    });

    it('should return 404 for non-existent task', async () => {
      await request(app)
        .get('/api/tasks/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('PUT /api/tasks/:id', () => {
    beforeEach(async () => {
      // Create a test task
      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test Task',
          description: 'Test task description',
          projectId: projectId
        });
      taskId = response.body.task.id;
    });

    it('should update task', async () => {
      const updateData = {
        title: 'Updated Task Title',
        description: 'Updated description',
        status: 'in_progress',
        priority: 'high'
      };

      const response = await request(app)
        .put(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.message).toBe('Task updated successfully');
      expect(response.body.task.title).toBe(updateData.title);
      expect(response.body.task.description).toBe(updateData.description);
      expect(response.body.task.status).toBe(updateData.status);
      expect(response.body.task.priority).toBe(updateData.priority);
    });

    it('should return 404 for non-existent task', async () => {
      await request(app)
        .put('/api/tasks/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Updated Title'
        })
        .expect(404);
    });
  });

  describe('PATCH /api/tasks/:id/assign', () => {
    beforeEach(async () => {
      // Create a test task
      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test Task',
          description: 'Test task description',
          projectId: projectId
        });
      taskId = response.body.task.id;
    });

    it('should assign task to user', async () => {
      const response = await request(app)
        .patch(`/api/tasks/${taskId}/assign`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          assigneeId: assigneeId
        })
        .expect(200);

      expect(response.body.message).toBe('Task assignment updated successfully');
      expect(response.body.task.assigneeId).toBe(assigneeId);
      expect(response.body.task.assignee).toBeDefined();
      expect(response.body.task.assignee.id).toBe(assigneeId);
    });

    it('should unassign task', async () => {
      // First assign the task
      await request(app)
        .patch(`/api/tasks/${taskId}/assign`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          assigneeId: assigneeId
        });

      // Then unassign
      const response = await request(app)
        .patch(`/api/tasks/${taskId}/assign`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          assigneeId: null
        })
        .expect(200);

      expect(response.body.task.assigneeId).toBeNull();
    });

    it('should return 404 for non-existent assignee', async () => {
      await request(app)
        .patch(`/api/tasks/${taskId}/assign`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          assigneeId: 99999
        })
        .expect(404);
    });
  });

  describe('PATCH /api/tasks/:id/complete', () => {
    beforeEach(async () => {
      // Create a test task
      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test Task',
          description: 'Test task description',
          projectId: projectId
        });
      taskId = response.body.task.id;
    });

    it('should mark task as completed', async () => {
      const response = await request(app)
        .patch(`/api/tasks/${taskId}/complete`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.message).toBe('Task marked as completed');
      expect(response.body.task.status).toBe('completed');
    });

    it('should return 404 for non-existent task', async () => {
      await request(app)
        .patch('/api/tasks/99999/complete')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('DELETE /api/tasks/:id', () => {
    beforeEach(async () => {
      // Create a test task
      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test Task',
          description: 'Test task description',
          projectId: projectId
        });
      taskId = response.body.task.id;
    });

    it('should delete task', async () => {
      const response = await request(app)
        .delete(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.message).toBe('Task deleted successfully');

      // Verify task is deleted
      await request(app)
        .get(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should return 404 for non-existent task', async () => {
      await request(app)
        .delete('/api/tasks/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });
});