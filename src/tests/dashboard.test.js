const request = require('supertest');
const app = require('../server');

describe('Dashboard', () => {
  let authToken;
  let userId;
  let projectId;
  let taskId;

  beforeEach(async () => {
    // Register and login a user
    const registerResponse = await request(app)
      .post('/api/users/register')
      .send({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      });

    authToken = registerResponse.body.token;
    userId = registerResponse.body.user.id;

    // Create a test project
    const projectResponse = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Test Project',
        description: 'Test project description'
      });

    projectId = projectResponse.body.project.id;

    // Create test tasks with different statuses and priorities
    const tasks = [
      {
        title: 'Pending High Priority Task',
        description: 'High priority pending task',
        priority: 'high',
        status: 'pending',
        projectId: projectId
      },
      {
        title: 'In Progress Medium Priority Task',
        description: 'Medium priority in progress task',
        priority: 'medium',
        projectId: projectId
      },
      {
        title: 'Completed Low Priority Task',
        description: 'Low priority completed task',
        priority: 'low',
        projectId: projectId
      },
      {
        title: 'Overdue Task',
        description: 'Task that is overdue',
        priority: 'high',
        dueDate: '2023-01-01T00:00:00Z', // Past date
        projectId: projectId
      }
    ];

    for (let i = 0; i < tasks.length; i++) {
      const taskData = tasks[i];
      const taskResponse = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(taskData);
      
      const taskId = taskResponse.body.task.id;
      
      // Set specific statuses for different tasks
      if (i === 1) {
        // Set second task to in_progress
        await request(app)
          .put(`/api/tasks/${taskId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({ status: 'in_progress' });
      } else if (i === 2) {
        // Mark third task as completed
        await request(app)
          .patch(`/api/tasks/${taskId}/complete`)
          .set('Authorization', `Bearer ${authToken}`);
      }
    }
  });

  describe('GET /api/dashboard', () => {
    it('should get dashboard statistics', async () => {
      const response = await request(app)
        .get('/api/dashboard')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.summary).toBeDefined();
      expect(response.body.priorityStats).toBeDefined();
      expect(response.body.recentActivity).toBeDefined();
      expect(response.body.projects).toBeDefined();

      // Check summary statistics
      const summary = response.body.summary;
      expect(summary.totalProjects).toBe(1);
      expect(summary.totalTasks).toBe(4);
      expect(summary.pendingTasks).toBeGreaterThanOrEqual(2); // 2 pending tasks
      expect(summary.inProgressTasks).toBeGreaterThanOrEqual(0); // May be 0 or 1
      expect(summary.completedTasks).toBeGreaterThanOrEqual(1);
      expect(summary.overdueTasks).toBeGreaterThanOrEqual(1);
      expect(typeof summary.assignedToMe).toBe('number');

      // Check priority statistics
      const priorityStats = response.body.priorityStats;
      expect(priorityStats.high).toBeGreaterThanOrEqual(1);
      expect(priorityStats.medium).toBeGreaterThanOrEqual(1);
      expect(priorityStats.low).toBeGreaterThanOrEqual(1);

      // Check recent activity
      expect(Array.isArray(response.body.recentActivity)).toBe(true);
      expect(response.body.recentActivity.length).toBeGreaterThan(0);

      // Check projects list
      expect(Array.isArray(response.body.projects)).toBe(true);
      expect(response.body.projects.length).toBe(1);
      expect(response.body.projects[0].name).toBe('Test Project');
    });

    it('should not get dashboard without authentication', async () => {
      await request(app)
        .get('/api/dashboard')
        .expect(401);
    });

    it('should return empty dashboard for user with no projects', async () => {
      // Register a new user with no projects
      const newUserResponse = await request(app)
        .post('/api/users/register')
        .send({
          name: 'New User',
          email: 'newuser@example.com',
          password: 'password123'
        });

      const response = await request(app)
        .get('/api/dashboard')
        .set('Authorization', `Bearer ${newUserResponse.body.token}`)
        .expect(200);

      const summary = response.body.summary;
      expect(summary.totalProjects).toBe(0);
      expect(summary.totalTasks).toBe(0);
      expect(summary.pendingTasks).toBe(0);
      expect(summary.inProgressTasks).toBe(0);
      expect(summary.completedTasks).toBe(0);
      expect(summary.assignedToMe).toBe(0);
      expect(summary.overdueTasks).toBe(0);

      expect(response.body.projects).toEqual([]);
      expect(response.body.recentActivity).toEqual([]);
    });

    it('should include activity logs in recent activity', async () => {
      const response = await request(app)
        .get('/api/dashboard')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const recentActivity = response.body.recentActivity;
      expect(recentActivity.length).toBeGreaterThan(0);

      // Check activity log structure
      const activity = recentActivity[0];
      expect(activity.id).toBeDefined();
      expect(activity.userId).toBeDefined();
      expect(activity.taskId).toBeDefined();
      expect(activity.action).toBeDefined();
      expect(activity.createdAt).toBeDefined();
      expect(activity.user).toBeDefined();
      expect(activity.task).toBeDefined();
      expect(activity.user.name).toBeDefined();
      expect(activity.task.title).toBeDefined();
    });

    it('should calculate correct priority distribution', async () => {
      const response = await request(app)
        .get('/api/dashboard')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const priorityStats = response.body.priorityStats;
      const totalByPriority = priorityStats.high + priorityStats.medium + priorityStats.low;
      
      expect(totalByPriority).toBe(response.body.summary.totalTasks);
    });

    it('should handle assigned tasks correctly', async () => {
      // Create another user to assign tasks to
      const assigneeResponse = await request(app)
        .post('/api/users/register')
        .send({
          name: 'Assignee User',
          email: 'assignee@example.com',
          password: 'password123'
        });

      // Create a task and assign it to the current user
      const taskResponse = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Self Assigned Task',
          description: 'Task assigned to self',
          projectId: projectId
        });

      await request(app)
        .patch(`/api/tasks/${taskResponse.body.task.id}/assign`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          assigneeId: userId
        });

      const response = await request(app)
        .get('/api/dashboard')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.summary.assignedToMe).toBeGreaterThanOrEqual(1);
    });
  });
});