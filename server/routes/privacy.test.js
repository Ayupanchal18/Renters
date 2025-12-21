import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import createServer from '../index.js';
import { User } from '../models/User.js';
import { connectDB } from '../src/config/db.js';

describe('Privacy API Routes', () => {
    let app;
    let testUser;
    let authToken;

    beforeEach(async () => {
        // Set NODE_ENV to development for x-user-id header support
        process.env.NODE_ENV = 'development';
        app = await createServer(true);
        await connectDB();

        // Create test user
        testUser = new User({
            name: 'Privacy Test User',
            email: 'privacy@test.com',
            passwordHash: 'hashedpassword',
            userType: 'buyer',
            role: 'user'
        });
        await testUser.save();

        // Mock authentication token
        authToken = 'mock-jwt-token';
    });

    afterEach(async () => {
        // Clean up test data
        try {
            await User.deleteMany({ email: 'privacy@test.com' });
        } catch (error) {
            console.log('Cleanup error:', error);
        }
    });

    describe('GET /api/privacy/settings', () => {
        it('should return privacy settings for authenticated user', async () => {
            const response = await request(app)
                .get('/api/privacy/settings')
                .set('x-user-id', testUser._id.toString());

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('userId');
            expect(response.body.data).toHaveProperty('privacy');
        });

        it('should return 401 without authentication', async () => {
            const response = await request(app)
                .get('/api/privacy/settings');

            expect(response.status).toBe(401);
        });
    });

    describe('PATCH /api/privacy/settings', () => {
        it('should update privacy settings', async () => {
            const updateData = {
                dataProcessing: {
                    analytics: false,
                    marketing: true
                },
                visibility: {
                    profilePublic: true
                }
            };

            const response = await request(app)
                .patch('/api/privacy/settings')
                .set('x-user-id', testUser._id.toString())
                .send(updateData);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('privacy');
        });

        it('should validate privacy settings input', async () => {
            const invalidData = {
                dataProcessing: {
                    analytics: 'invalid-boolean'
                }
            };

            const response = await request(app)
                .patch('/api/privacy/settings')
                .set('x-user-id', testUser._id.toString())
                .send(invalidData);

            expect(response.status).toBe(400);
        });
    });

    describe('GET /api/privacy/compliance', () => {
        it('should return GDPR compliance status', async () => {
            const response = await request(app)
                .get('/api/privacy/compliance')
                .set('x-user-id', testUser._id.toString());

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('gdprCompliant');
            expect(response.body.data).toHaveProperty('consentGiven');
            expect(response.body.data).toHaveProperty('rightToBeInformed');
        });
    });

    describe('PATCH /api/privacy/consent', () => {
        it('should update data processing consent', async () => {
            const consentData = {
                analytics: true,
                marketing: false,
                personalization: true
            };

            const response = await request(app)
                .patch('/api/privacy/consent')
                .set('x-user-id', testUser._id.toString())
                .send(consentData);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('consent');
        });
    });

    describe('POST /api/privacy/accept-privacy-policy', () => {
        it('should record privacy policy acceptance', async () => {
            const response = await request(app)
                .post('/api/privacy/accept-privacy-policy')
                .set('x-user-id', testUser._id.toString())
                .send({ version: '1.0' });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('privacyPolicyAcceptedAt');
        });
    });

    describe('GET /api/privacy/export/summary', () => {
        it('should return data export summary', async () => {
            const response = await request(app)
                .get('/api/privacy/export/summary')
                .set('x-user-id', testUser._id.toString());

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('sections');
            expect(response.body.data).toHaveProperty('totalRecords');
        });
    });

    describe('POST /api/privacy/export', () => {
        it('should export user data in JSON format', async () => {
            const exportRequest = {
                format: 'json',
                sections: ['profile', 'properties'],
                includeDeleted: false,
                includeSensitive: false
            };

            const response = await request(app)
                .post('/api/privacy/export')
                .set('x-user-id', testUser._id.toString())
                .send(exportRequest);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('profile');
            expect(response.body.metadata).toHaveProperty('sections');
            expect(response.body.metadata.sections).toContain('profile');
        });

        it('should validate export request parameters', async () => {
            const invalidRequest = {
                format: 'invalid-format',
                sections: ['invalid-section']
            };

            const response = await request(app)
                .post('/api/privacy/export')
                .set('x-user-id', testUser._id.toString())
                .send(invalidRequest);

            expect(response.status).toBe(400);
        });
    });

    describe('GET /api/privacy/cleanup/stats', () => {
        it('should return data cleanup statistics', async () => {
            const response = await request(app)
                .get('/api/privacy/cleanup/stats')
                .set('x-user-id', testUser._id.toString());

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('userProperties');
            expect(response.body.data).toHaveProperty('userConversations');
        });
    });
});