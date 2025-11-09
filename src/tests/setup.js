const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Clean up database before each test
beforeEach(async () => {
  await prisma.activityLog.deleteMany();
  await prisma.task.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();
});

// Close database connection after all tests
afterAll(async () => {
  await prisma.$disconnect();
});