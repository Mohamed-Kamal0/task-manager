const pool = require('./db');
const bcrypt = require('bcryptjs');

const seedDatabase = async () => {
  try {
    console.log('🌱 Starting seed process...');

    // 1. Clear existing data
    // "RESTART IDENTITY" resets ID counters to 1
    // "CASCADE" deletes tasks linked to users automatically
    await pool.query('TRUNCATE users, tasks RESTART IDENTITY CASCADE');
    console.log('🧹 Database cleared.');

    // 2. Create Users
    const password = await bcrypt.hash('password123', 10);

    const user1 = await pool.query(
      "INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id",
      ['Alice Admin', 'alice@example.com', password]
    );

    const user2 = await pool.query(
      "INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id",
      ['Bob Builder', 'bob@example.com', password]
    );

    const aliceId = user1.rows[0].id;
    const bobId = user2.rows[0].id;

    console.log(`👤 Created users: Alice (ID: ${aliceId}) and Bob (ID: ${bobId})`);

    // 3. Create Tasks for Alice (Enough to test pagination - 7 tasks)
    const aliceTasks = [
      [aliceId, 'Setup Database', 'Install PostgreSQL and create tables', 'done'],
      [aliceId, 'Build API', 'Create Express routes for CRUD operations', 'done'],
      [aliceId, 'Frontend Setup', 'Initialize Vite React project', 'in_progress'],
      [aliceId, 'Style Components', 'Add Tailwind CSS for styling', 'pending'],
      [aliceId, 'Write Tests', 'Add Jest unit tests for backend', 'pending'],
      [aliceId, 'Deploy App', 'Push to Render.com', 'pending'],
      [aliceId, 'Fix Bugs', 'Resolve issue with pagination', 'pending'],
    ];

    for (const task of aliceTasks) {
      await pool.query(
        "INSERT INTO tasks (user_id, title, description, status) VALUES ($1, $2, $3, $4)",
        task
      );
    }

    // 4. Create Tasks for Bob (To test data isolation)
    const bobTasks = [
      [bobId, 'Buy Groceries', 'Milk, Bread, Eggs', 'pending'],
      [bobId, 'Walk the Dog', 'Take Fido to the park', 'in_progress'],
    ];

    for (const task of bobTasks) {
      await pool.query(
        "INSERT INTO tasks (user_id, title, description, status) VALUES ($1, $2, $3, $4)",
        task
      );
    }

    console.log(`✅ Seeded ${aliceTasks.length} tasks for Alice and ${bobTasks.length} tasks for Bob.`);
    console.log('🎉 Database seeding complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err.message);
    process.exit(1);
  }
};

seedDatabase();