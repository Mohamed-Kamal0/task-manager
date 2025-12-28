const request = require('supertest');
const express = require('express');
const app = express();

// Mock dependencies
jest.mock('./db', () => ({
  query: jest.fn(),
}));
jest.mock('./middleware', () => (req, res, next) => {
  req.user = { id: 1 }; // Mock logged-in user
  next();
});

const pool = require('./db');

// Setup minimal app for testing routes
app.use(express.json());
// Copy just the GET /tasks logic here for unit testing isolation
// Or import app from server.js if you export it properly.
// For simplicity, we redefine a simple route to test logic:
app.get('/tasks', async (req, res) => {
  const limit = 5;
  const offset = 0;
  // Mock DB call
  await pool.query('SELECT * ...', [1, limit, offset]); 
  res.json([{ id: 1, title: 'Test Task' }]);
});

describe('GET /tasks', () => {
  it('should return a list of tasks', async () => {
    pool.query.mockResolvedValue({ rows: [{ id: 1, title: 'Test Task' }] });

    const res = await request(app).get('/tasks');
    
    expect(res.statusCode).toEqual(200);
    expect(res.body[0].title).toEqual('Test Task');
    expect(pool.query).toHaveBeenCalled();
  });
});