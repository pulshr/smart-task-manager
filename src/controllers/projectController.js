const { PrismaClient } = require('@prisma/client');
const { validationResult } = require('express-validator');

const prisma = new PrismaClient();

const createProject = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description } = req.body;

    const project = await prisma.project.create({
      data: {
        name,
        description,
        ownerId: req.user.id
      },
      include: {
        owner: { select: { id: true, name: true, email: true } }
      }
    });

    res.status(201).json({
      message: 'Project created successfully',
      project
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create project' });
  }
};

const getProjects = async (req, res) => {
  try {
    const projects = await prisma.project.findMany({
      where: { ownerId: req.user.id },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        tasks: { select: { id: true, title: true, status: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ projects });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
};

const getProject = async (req, res) => {
  try {
    const { id } = req.params;

    const project = await prisma.project.findFirst({
      where: { id: parseInt(id), ownerId: req.user.id },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        tasks: {
          include: {
            assignee: { select: { id: true, name: true, email: true } }
          }
        }
      }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json({ project });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch project' });
  }
};

const updateProject = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { name, description } = req.body;

    const project = await prisma.project.findFirst({
      where: { id: parseInt(id), ownerId: req.user.id }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const updatedProject = await prisma.project.update({
      where: { id: parseInt(id) },
      data: { name, description },
      include: {
        owner: { select: { id: true, name: true, email: true } }
      }
    });

    res.json({
      message: 'Project updated successfully',
      project: updatedProject
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update project' });
  }
};

const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;

    const project = await prisma.project.findFirst({
      where: { id: parseInt(id), ownerId: req.user.id }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    await prisma.project.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete project' });
  }
};

module.exports = {
  createProject,
  getProjects,
  getProject,
  updateProject,
  deleteProject
};