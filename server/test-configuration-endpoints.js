/**
 * Simple integration test for configuration testing endpoints
 * This can be run to verify the endpoints are working correctly
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:8080';
const ADMIN_KEY = process.env.ADMIN_API_KEY || 'test-admin-key';
const USER_ID = 'test-admin-user';

async function testEndpoint(endpoint, method = 'GET', body = null) {
    const url = `${BASE_URL}/api/configuration-testing${endpoint}`;

    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
            'x-user-id': USER_ID,
            'x-admin-key': ADMIN_KEY
        }
    };

    if (body && (method === 'POST' || method === 'PUT')) {
        options.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(url, options);
        const data = await response.json();

        console.log(`\n${method} ${endpoint}`);
        console.log(`Status: ${response.status}`);
        console.log(`Success: ${data.success}`);

        if (data.success) {
            console.log(`✅ ${data.message || 'Success'}`);
        } else {
            console.log(`❌ ${data.error}: ${data.message}`);
        }

        return { success: response.ok, data };
    } catch (error) {
        console.log(`\n${method} ${endpoint}`);
        console.log(`❌ Network Error: ${error.message}`);
        return { success: false, error: error.message };
    }
}

async function runTests() {
    console.log('🧪 Testing Configuration Testing API Endpoints');
    console.log('='.repeat(50));

    // Test 1: Validate all services
    await testEndpoint('/validate-all');

    // Test 2: Validate specific service
    await testEndpoint('/validate-service', 'POST', { serviceName: 'phone-email' });

    // Test 3: Test connectivity
    await testEndpoint('/test-connectivity', 'POST', { serviceName: 'phone-email' });

    // Test 4: Get service status
    await testEndpoint('/service-status');

    // Test 5: Get diagnostics
    await testEndpoint('/diagnostics');

    // Test 6: Get diagnostics for specific service
    await testEndpoint('/diagnostics?service=phone-email');

    // Test 7: Test delivery (with test email)
    await testEndpoint('/test-delivery', 'POST', {
        method: 'email',
        contact: 'test@example.com',
        serviceName: 'phone-email'
    });

    console.log('\n🏁 Configuration testing endpoint verification complete');
    console.log('\nNote: These tests use test mode since no real service credentials are configured.');
    console.log('In production, configure the following environment variables:');
    console.log('- PHONE_EMAIL_API_KEY');
    console.log('- TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER');
    console.log('- SMTP_HOST, SMTP_USER, SMTP_PASS, etc.');
}

// Only run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    runTests().catch(console.error);
}

export { testEndpoint, runTests };