const express = require('express');
const { body } = require('express-validator');
const {
  createTask,
  getTasks,
  getTask,
  updateTask,
  assignTask,
  completeTask,
  deleteTask
} = require('../controllers/taskController');
const { authenticateToken } = require('../middlewares/auth');

const router = express.Router();

// Validation rules
const taskValidation = [
  body('title').trim().isLength({ min: 1 }).withMessage('Task title required'),
  body('description').optional().trim(),
  body('priority').optional().isIn(['low', 'medium', 'high']).withMessage('Priority must be low, medium, or high'),
  body('dueDate').optional().isISO8601().withMessage('Valid due date required'),
  body('projectId').isInt().withMessage('Valid project ID required')
];

const taskUpdateValidation = [
  body('title').optional().trim().isLength({ min: 1 }).withMessage('Task title required'),
  body('description').optional().trim(),
  body('status').optional().isIn(['pending', 'in_progress', 'completed']).withMessage('Status must be pending, in_progress, or completed'),
  body('priority').optional().isIn(['low', 'medium', 'high']).withMessage('Priority must be low, medium, or high'),
  body('dueDate').optional().isISO8601().withMessage('Valid due date required')
];

// Apply authentication to all routes
router.use(authenticateToken);

/**
 * @swagger
 * /api/tasks:
 *   post:
 *     summary: Create a new task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high]
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *               projectId:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Task created successfully
 */
router.post('/', taskValidation, createTask);

/**
 * @swagger
 * /api/tasks:
 *   get:
 *     summary: Get all tasks with optional filters
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: projectId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: assigneeId
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Tasks retrieved successfully
 */
router.get('/', getTasks);

/**
 * @swagger
 * /api/tasks/{id}:
 *   get:
 *     summary: Get task by ID
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Task retrieved successfully
 */
router.get('/:id', getTask);

/**
 * @swagger
 * /api/tasks/{id}:
 *   put:
 *     summary: Update task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [pending, in_progress, completed]
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high]
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Task updated successfully
 */
router.put('/:id', taskUpdateValidation, updateTask);

/**
 * @swagger
 * /api/tasks/{id}/assign:
 *   patch:
 *     summary: Assign task to user
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               assigneeId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Task assigned successfully
 */
router.patch('/:id/assign', assignTask);

/**
 * @swagger
 * /api/tasks/{id}/complete:
 *   patch:
 *     summary: Mark task as completed
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Task marked as completed
 */
router.patch('/:id/complete', completeTask);

/**
 * @swagger
 * /api/tasks/{id}:
 *   delete:
 *     summary: Delete task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Task deleted successfully
 */
router.delete('/:id', deleteTask);

module.exports = router;