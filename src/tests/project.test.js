const request = require('supertest');
const app = require('../server');

describe('Project Management', () => {
  let authToken;
  let userId;
  let projectId;

  beforeEach(async () => {
    // Register and login a user for testing
    const registerResponse = await request(app)
      .post('/api/users/register')
      .send({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      });

    authToken = registerResponse.body.token;
    userId = registerResponse.body.user.id;
  });

  describe('POST /api/projects', () => {
    it('should create a new project', async () => {
      const projectData = {
        name: 'Test Project',
        description: 'Test project description'
      };

      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send(projectData)
        .expect(201);

      expect(response.body.message).toBe('Project created successfully');
      expect(response.body.project.name).toBe(projectData.name);
      expect(response.body.project.description).toBe(projectData.description);
      expect(response.body.project.ownerId).toBe(userId);
      projectId = response.body.project.id;
    });

    it('should not create project without authentication', async () => {
      const projectData = {
        name: 'Test Project',
        description: 'Test project description'
      };

      await request(app)
        .post('/api/projects')
        .send(projectData)
        .expect(401);
    });

    it('should not create project without name', async () => {
      const projectData = {
        description: 'Test project description'
      };

      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send(projectData)
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });
  });

  describe('GET /api/projects', () => {
    beforeEach(async () => {
      // Create a test project
      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Project',
          description: 'Test project description'
        });
      projectId = response.body.project.id;
    });

    it('should get all projects for authenticated user', async () => {
      const response = await request(app)
        .get('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.projects).toBeDefined();
      expect(Array.isArray(response.body.projects)).toBe(true);
      expect(response.body.projects.length).toBeGreaterThan(0);
    });

    it('should not get projects without authentication', async () => {
      await request(app)
        .get('/api/projects')
        .expect(401);
    });
  });

  describe('GET /api/projects/:id', () => {
    beforeEach(async () => {
      // Create a test project
      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Project',
          description: 'Test project description'
        });
      projectId = response.body.project.id;
    });

    it('should get project by ID', async () => {
      const response = await request(app)
        .get(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.project).toBeDefined();
      expect(response.body.project.id).toBe(projectId);
      expect(response.body.project.name).toBe('Test Project');
    });

    it('should return 404 for non-existent project', async () => {
      await request(app)
        .get('/api/projects/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('PUT /api/projects/:id', () => {
    beforeEach(async () => {
      // Create a test project
      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Project',
          description: 'Test project description'
        });
      projectId = response.body.project.id;
    });

    it('should update project', async () => {
      const updateData = {
        name: 'Updated Project Name',
        description: 'Updated description'
      };

      const response = await request(app)
        .put(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.message).toBe('Project updated successfully');
      expect(response.body.project.name).toBe(updateData.name);
      expect(response.body.project.description).toBe(updateData.description);
    });

    it('should return 404 for non-existent project', async () => {
      await request(app)
        .put('/api/projects/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated Name',
          description: 'Updated description'
        })
        .expect(404);
    });
  });

  describe('DELETE /api/projects/:id', () => {
    beforeEach(async () => {
      // Create a test project
      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Project',
          description: 'Test project description'
        });
      projectId = response.body.project.id;
    });

    it('should delete project', async () => {
      const response = await request(app)
        .delete(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.message).toBe('Project deleted successfully');

      // Verify project is deleted
      await request(app)
        .get(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should return 404 for non-existent project', async () => {
      await request(app)
        .delete('/api/projects/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });
});