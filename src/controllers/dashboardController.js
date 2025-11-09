const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const getDashboard = async (req, res) => {
  try {
    // Get user's projects
    const projects = await prisma.project.findMany({
      where: { ownerId: req.user.id },
      select: { id: true, name: true }
    });

    const projectIds = projects.map(p => p.id);

    // Get task statistics
    const totalTasks = await prisma.task.count({
      where: { projectId: { in: projectIds } }
    });

    const pendingTasks = await prisma.task.count({
      where: {
        projectId: { in: projectIds },
        status: 'pending'
      }
    });

    const inProgressTasks = await prisma.task.count({
      where: {
        projectId: { in: projectIds },
        status: 'in_progress'
      }
    });

    const completedTasks = await prisma.task.count({
      where: {
        projectId: { in: projectIds },
        status: 'completed'
      }
    });

    // Get assigned tasks (tasks assigned to the user)
    const assignedToMe = await prisma.task.count({
      where: { assigneeId: req.user.id }
    });

    // Get overdue tasks
    const overdueTasks = await prisma.task.count({
      where: {
        projectId: { in: projectIds },
        dueDate: { lt: new Date() },
        status: { not: 'completed' }
      }
    });

    // Get recent activity
    const recentActivity = await prisma.activityLog.findMany({
      where: {
        task: { projectId: { in: projectIds } }
      },
      include: {
        user: { select: { id: true, name: true } },
        task: { select: { id: true, title: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    // Get tasks by priority
    const tasksByPriority = await prisma.task.groupBy({
      by: ['priority'],
      where: { projectId: { in: projectIds } },
      _count: { priority: true }
    });

    const priorityStats = {
      high: tasksByPriority.find(t => t.priority === 'high')?._count.priority || 0,
      medium: tasksByPriority.find(t => t.priority === 'medium')?._count.priority || 0,
      low: tasksByPriority.find(t => t.priority === 'low')?._count.priority || 0
    };

    res.json({
      summary: {
        totalProjects: projects.length,
        totalTasks,
        pendingTasks,
        inProgressTasks,
        completedTasks,
        assignedToMe,
        overdueTasks
      },
      priorityStats,
      recentActivity,
      projects
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
};

module.exports = { getDashboard };