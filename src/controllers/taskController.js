const { PrismaClient } = require('@prisma/client');
const { validationResult } = require('express-validator');

const prisma = new PrismaClient();

const createTask = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, priority, dueDate, projectId } = req.body;

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: { id: parseInt(projectId), ownerId: req.user.id }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const task = await prisma.task.create({
      data: {
        title,
        description,
        priority: priority || 'medium',
        dueDate: dueDate ? new Date(dueDate) : null,
        projectId: parseInt(projectId)
      },
      include: {
        project: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true, email: true } }
      }
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        taskId: task.id,
        action: 'created'
      }
    });

    res.status(201).json({
      message: 'Task created successfully',
      task
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create task' });
  }
};

const getTasks = async (req, res) => {
  try {
    const { projectId, status, assigneeId } = req.query;
    
    let whereClause = {
      project: { ownerId: req.user.id }
    };

    if (projectId) whereClause.projectId = parseInt(projectId);
    if (status) whereClause.status = status;
    if (assigneeId) whereClause.assigneeId = parseInt(assigneeId);

    const tasks = await prisma.task.findMany({
      where: whereClause,
      include: {
        project: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true, email: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ tasks });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
};

const getTask = async (req, res) => {
  try {
    const { id } = req.params;

    const task = await prisma.task.findFirst({
      where: {
        id: parseInt(id),
        project: { ownerId: req.user.id }
      },
      include: {
        project: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true, email: true } },
        activityLogs: {
          include: {
            user: { select: { id: true, name: true } }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json({ task });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch task' });
  }
};

const updateTask = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { title, description, status, priority, dueDate } = req.body;

    const task = await prisma.task.findFirst({
      where: {
        id: parseInt(id),
        project: { ownerId: req.user.id }
      }
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const updatedTask = await prisma.task.update({
      where: { id: parseInt(id) },
      data: {
        title,
        description,
        status,
        priority,
        dueDate: dueDate ? new Date(dueDate) : null
      },
      include: {
        project: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true, email: true } }
      }
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        taskId: updatedTask.id,
        action: 'updated'
      }
    });

    res.json({
      message: 'Task updated successfully',
      task: updatedTask
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update task' });
  }
};

const assignTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { assigneeId } = req.body;

    const task = await prisma.task.findFirst({
      where: {
        id: parseInt(id),
        project: { ownerId: req.user.id }
      }
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Verify assignee exists
    if (assigneeId) {
      const assignee = await prisma.user.findUnique({
        where: { id: parseInt(assigneeId) }
      });
      if (!assignee) {
        return res.status(404).json({ error: 'Assignee not found' });
      }
    }

    const updatedTask = await prisma.task.update({
      where: { id: parseInt(id) },
      data: { assigneeId: assigneeId ? parseInt(assigneeId) : null },
      include: {
        project: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true, email: true } }
      }
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        taskId: updatedTask.id,
        action: assigneeId ? 'assigned' : 'unassigned'
      }
    });

    res.json({
      message: 'Task assignment updated successfully',
      task: updatedTask
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to assign task' });
  }
};

const completeTask = async (req, res) => {
  try {
    const { id } = req.params;

    const task = await prisma.task.findFirst({
      where: {
        id: parseInt(id),
        project: { ownerId: req.user.id }
      }
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const updatedTask = await prisma.task.update({
      where: { id: parseInt(id) },
      data: { status: 'completed' },
      include: {
        project: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true, email: true } }
      }
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        taskId: updatedTask.id,
        action: 'completed'
      }
    });

    res.json({
      message: 'Task marked as completed',
      task: updatedTask
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to complete task' });
  }
};

const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;

    const task = await prisma.task.findFirst({
      where: {
        id: parseInt(id),
        project: { ownerId: req.user.id }
      }
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    await prisma.task.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete task' });
  }
};

module.exports = {
  createTask,
  getTasks,
  getTask,
  updateTask,
  assignTask,
  completeTask,
  deleteTask
};