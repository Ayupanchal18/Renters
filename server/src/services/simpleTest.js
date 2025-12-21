/**
 * Simple test for Phone.email service and configuration validator
 */

import phoneEmailService from './phoneEmailService.js';

async function runSimpleTest() {
    console.log('🚀 Starting Simple OTP Service Test...\n');

    try {
        // Test 1: Phone.email Service Status
        console.log('📱 Testing Phone.email Service...');
        const phoneEmailStatus = phoneEmailService.getStatus();
        console.log('Phone.email Status:', JSON.stringify(phoneEmailStatus, null, 2));

        if (phoneEmailService.isReady()) {
            console.log('✅ Phone.email service is ready');
        } else {
            console.log('⚠️ Phone.email service is in test mode (no API key configured)');
        }

        // Test 2: Service Capabilities
        console.log('\n🔧 Testing Service Capabilities...');
        const capabilities = phoneEmailService.getCapabilities();
        console.log('Phone.email Capabilities:', JSON.stringify(capabilities, null, 2));

        // Test 3: Test Delivery (test mode)
        console.log('\n📤 Testing Delivery Functionality (Test Mode)...');

        const smsTestResult = await phoneEmailService.testDelivery('sms', '+1234567890');
        console.log('SMS Test Result:', JSON.stringify(smsTestResult, null, 2));

        const emailTestResult = await phoneEmailService.testDelivery('email', 'test@example.com');
        console.log('Email Test Result:', JSON.stringify(emailTestResult, null, 2));

        console.log('\n🎉 Simple Test Completed Successfully!');
        console.log('\n📝 Summary:');
        console.log(`- Phone.email Service: ${phoneEmailService.isReady() ? '✅ Ready' : '⚠️ Test Mode'}`);
        console.log(`- SMS Test: ${smsTestResult.success ? '✅ Success' : '❌ Failed'}`);
        console.log(`- Email Test: ${emailTestResult.success ? '✅ Success' : '❌ Failed'}`);

    } catch (error) {
        console.error('❌ Simple Test Failed:', error);
        console.error('Stack trace:', error.stack);
        throw error;
    }
}

// Run the test
runSimpleTest().then(() => {
    console.log('\n✅ Test completed successfully');
    process.exit(0);
}).catch((error) => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
});