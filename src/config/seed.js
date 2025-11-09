const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create sample users
  const hashedPassword = await bcrypt.hash('password123', 12);

  const user1 = await prisma.user.create({
    data: {
      name: 'John Doe',
      email: 'john@example.com',
      password: hashedPassword
    }
  });

  const user2 = await prisma.user.create({
    data: {
      name: 'Jane Smith',
      email: 'jane@example.com',
      password: hashedPassword
    }
  });

  console.log('✅ Created sample users');

  // Create sample projects
  const project1 = await prisma.project.create({
    data: {
      name: 'Website Redesign',
      description: 'Complete redesign of company website',
      ownerId: user1.id
    }
  });

  const project2 = await prisma.project.create({
    data: {
      name: 'Mobile App Development',
      description: 'Develop mobile app for iOS and Android',
      ownerId: user1.id
    }
  });

  console.log('✅ Created sample projects');

  // Create sample tasks
  const tasks = [
    {
      title: 'Design Homepage',
      description: 'Create wireframes and mockups for homepage',
      status: 'pending',
      priority: 'high',
      projectId: project1.id,
      assigneeId: user2.id,
      dueDate: new Date('2024-02-15')
    },
    {
      title: 'Implement User Authentication',
      description: 'Set up login and registration functionality',
      status: 'in_progress',
      priority: 'high',
      projectId: project1.id,
      assigneeId: user1.id,
      dueDate: new Date('2024-02-10')
    },
    {
      title: 'Create Database Schema',
      description: 'Design and implement database structure',
      status: 'completed',
      priority: 'medium',
      projectId: project2.id,
      assigneeId: user1.id,
      dueDate: new Date('2024-01-30')
    },
    {
      title: 'Setup CI/CD Pipeline',
      description: 'Configure automated deployment pipeline',
      status: 'pending',
      priority: 'low',
      projectId: project2.id,
      dueDate: new Date('2024-02-20')
    }
  ];

  for (const taskData of tasks) {
    const task = await prisma.task.create({
      data: taskData
    });

    // Create activity log for each task
    await prisma.activityLog.create({
      data: {
        userId: user1.id,
        taskId: task.id,
        action: 'created'
      }
    });

    if (task.status === 'completed') {
      await prisma.activityLog.create({
        data: {
          userId: user1.id,
          taskId: task.id,
          action: 'completed'
        }
      });
    }
  }

  console.log('✅ Created sample tasks and activity logs');
  console.log('🎉 Database seeding completed successfully!');
  console.log('\n📋 Sample credentials:');
  console.log('Email: john@example.com');
  console.log('Password: password123');
  console.log('\nEmail: jane@example.com');
  console.log('Password: password123');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });