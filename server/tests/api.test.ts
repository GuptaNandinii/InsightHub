import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/app';

describe('InsightHub API Endpoints', () => {
  describe('GET /api/health', () => {
    it('should return 200 and healthy status', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.service).toBe('InsightHub API');
    });
  });

  describe('Auth Guard & Protection', () => {
    it('should return 401 when accessing protected /api/datasets without token', async () => {
      const res = await request(app).get('/api/datasets');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should return 401 when accessing protected /api/dashboards without token', async () => {
      const res = await request(app).get('/api/dashboards');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject invalid route with 404', async () => {
      const res = await request(app).get('/api/non-existent-route-xyz');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });
});
