import request from 'supertest';
import app from '../../server';
import { User } from '../../models/User';
import '@jest/globals';

// Set NODE_ENV to test
process.env.NODE_ENV = 'test';

describe('Auth Routes', () => {
  beforeEach(async () => {
    // Clear the database before each test
    await User.deleteMany({});
  });
  // Test data
  const testUser = {
    username: 'testuser',
    email: 'test@example.com',
    password: 'Password123!'
  };

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user).toHaveProperty('id');
      expect(res.body.user).toHaveProperty('username', testUser.username);

      expect(res.body.user).toHaveProperty('email', testUser.email);
      expect(res.body.user).not.toHaveProperty('password');
    });

    it('should not register a user with existing email', async () => {
      // Register a user first
      await request(app)
        .post('/api/auth/register')
        .send(testUser);

      // Try to register with same email but different username
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          ...testUser,
          username: 'anothertestuser'
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toContain('already exists');
    });

    it('should not register a user with existing username', async () => {
      // Register a user first
      await request(app)
        .post('/api/auth/register')
        .send(testUser);

      // Try to register with same username but different email
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          ...testUser,
          email: 'another@example.com'
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toContain('already exists');
    });

    it('should not register a user with invalid data', async () => {
      // Missing username
      const res1 = await request(app)
        .post('/api/auth/register')
        .send({
          email: testUser.email,
          password: testUser.password
        });

      expect(res1.status).toBe(400);

      // Invalid email
      const res2 = await request(app)
        .post('/api/auth/register')
        .send({
          username: testUser.username,
          email: 'invalid-email',
          password: testUser.password
        });

      expect(res2.status).toBe(400);

      // Short password
      const res3 = await request(app)
        .post('/api/auth/register')
        .send({
          username: testUser.username,
          email: testUser.email,
          password: 'weak'
        });

      expect(res3.status).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create a user for login tests
      await request(app)
        .post('/api/auth/register')
        .send(testUser);
    });

    it('should login with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user).toHaveProperty('id');
      expect(res.body.user).toHaveProperty('username', testUser.username);
      expect(res.body.user).toHaveProperty('email', testUser.email);
      expect(res.body.user).not.toHaveProperty('password');
    });

    it('should not login with incorrect password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword'
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message', 'Invalid credentials');
    });

    it('should not login with non-existent email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: testUser.password
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message', 'Invalid credentials');
    });
  });

  describe('GET /api/auth/user', () => {
    let token: string;

    beforeEach(async () => {
      // Create a user and get token for protected route tests
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser);
      
      token = res.body.token;
    });

    it('should get user data with valid token', async () => {
      const res = await request(app)
        .get('/api/auth/user')
        .set('x-auth-token', token);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('_id');
      expect(res.body).toHaveProperty('username', testUser.username);
      expect(res.body).toHaveProperty('email', testUser.email);
      expect(res.body).not.toHaveProperty('password');
    });

    it('should not get user data without token', async () => {
      const res = await request(app)
        .get('/api/auth/user');

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('message', 'No token, authorization denied');
    });

    it('should not get user data with invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/user')
        .set('x-auth-token', 'invalidtoken');

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('message', 'Token is not valid');
    });
  });
});