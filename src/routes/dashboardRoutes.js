const express = require('express');
const { getDashboard } = require('../controllers/dashboardController');
const { authenticateToken } = require('../middlewares/auth');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

/**
 * @swagger
 * /api/dashboard:
 *   get:
 *     summary: Get dashboard statistics and summary
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 summary:
 *                   type: object
 *                   properties:
 *                     totalProjects:
 *                       type: integer
 *                     totalTasks:
 *                       type: integer
 *                     pendingTasks:
 *                       type: integer
 *                     inProgressTasks:
 *                       type: integer
 *                     completedTasks:
 *                       type: integer
 *                     assignedToMe:
 *                       type: integer
 *                     overdueTasks:
 *                       type: integer
 *                 priorityStats:
 *                   type: object
 *                   properties:
 *                     high:
 *                       type: integer
 *                     medium:
 *                       type: integer
 *                     low:
 *                       type: integer
 *                 recentActivity:
 *                   type: array
 *                   items:
 *                     type: object
 *                 projects:
 *                   type: array
 *                   items:
 *                     type: object
 */
router.get('/', getDashboard);

module.exports = router;