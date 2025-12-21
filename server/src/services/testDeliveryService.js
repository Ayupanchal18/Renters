import phoneEmailService from './phoneEmailService.js';
import smsService from './smsService.js';
import emailService from './emailService.js';
import configurationValidator from './configurationValidator.js';
import { DeliveryAttempt } from '../../models/DeliveryAttempt.js';
import { logVerificationEvent } from '../utils/auditUtils.js';

/**
 * Test Delivery Service
 * Handles test OTP deliveries with separate rate limiting, logging, and isolation
 */
class TestDeliveryService {
    constructor() {
        this.services = {
            'phone-email': phoneEmailService,
            'twilio': smsService,
            'smtp': emailService
        };

        // Test-specific rate limiting (more permissive than production)
        this.testRateLimits = new Map();
        this.TEST_RATE_LIMIT_WINDOW = 5 * 60 * 1000; // 5 minutes
        this.MAX_TEST_REQUESTS_PER_WINDOW = 15; // More permissive for testing
        this.MAX_TEST_REQUESTS_PER_SERVICE = 5; // Per service limit

        this.initializeService();
    }
}