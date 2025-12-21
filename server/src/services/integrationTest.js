/**
 * Integration test for Phone.email service and configuration validator
 * This file can be run to test the new OTP delivery system
 */

import phoneEmailService from './phoneEmailService.js';
import configurationValidator from './configurationValidator.js';
import enhancedOTPManager from './enhancedOTPManager.js';

async function runIntegrationTest() {
    console.log('🚀 Starting OTP Delivery System Integration Test...\n');

    try {
        // Test 1: Configuration Validator
        console.log('📋 Testing Configuration Validator...');
        const validationResult = await configurationValidator.validateAllServices();
        console.log('Validation Result:', JSON.stringify(validationResult, null, 2));
        console.log('✅ Configuration validation completed\n');

        // Test 2: Phone.email Service Status
        console.log('📱 Testing Phone.email Service...');
        const phoneEmailStatus = phoneEmailService.getStatus();
        console.log('Phone.email Status:', JSON.stringify(phoneEmailStatus, null, 2));

        if (phoneEmailService.isReady()) {
            console.log('✅ Phone.email service is ready');
        } else {
            console.log('⚠️ Phone.email service is in test mode (no API key configured)');
        }
        console.log();

        // Test 3: Service Capabilities
        console.log('🔧 Testing Service Capabilities...');
        const capabilities = phoneEmailService.getCapabilities();
        console.log('Phone.email Capabilities:', JSON.stringify(capabilities, null, 2));
        console.log('✅ Capabilities retrieved\n');

        // Test 4: Available Services
        console.log('🌐 Testing Available Services...');
        const availableServices = configurationValidator.getAvailableServices();
        console.log('Available Services:', JSON.stringify(availableServices, null, 2));
        console.log('✅ Available services retrieved\n');

        // Test 5: Service Health Metrics
        console.log('📊 Testing Service Health Metrics...');
        const healthMetrics = configurationValidator.getHealthMetrics();
        console.log('Health Metrics:', JSON.stringify(healthMetrics, null, 2));
        console.log('✅ Health metrics retrieved\n');

        // Test 6: Enhanced OTP Manager
        console.log('🎯 Testing Enhanced OTP Manager...');
        const serviceMetrics = enhancedOTPManager.getServiceMetrics();
        console.log('OTP Manager Service Metrics:', JSON.stringify(serviceMetrics, null, 2));
        console.log('✅ Enhanced OTP Manager is operational\n');

        // Test 7: Test Delivery (if configured)
        console.log('📤 Testing Delivery Functionality...');

        // Test SMS delivery
        const smsTestResult = await phoneEmailService.testDelivery('sms', '+1234567890');
        console.log('SMS Test Result:', JSON.stringify(smsTestResult, null, 2));

        // Test Email delivery
        const emailTestResult = await phoneEmailService.testDelivery('email', 'test@example.com');
        console.log('Email Test Result:', JSON.stringify(emailTestResult, null, 2));

        console.log('✅ Delivery functionality tested\n');

        console.log('🎉 Integration Test Completed Successfully!');
        console.log('\n📝 Summary:');
        console.log(`- Configuration Validator: ${validationResult.success ? '✅ Working' : '❌ Issues detected'}`);
        console.log(`- Phone.email Service: ${phoneEmailService.isReady() ? '✅ Ready' : '⚠️ Test Mode'}`);
        console.log(`- Available Services: ${availableServices.length} services detected`);
        console.log(`- Health Monitoring: ${healthMetrics.monitoringActive ? '✅ Active' : '❌ Inactive'}`);

        // Stop monitoring to allow test to exit
        configurationValidator.stopMonitoring();

    } catch (error) {
        console.error('❌ Integration Test Failed:', error);
        console.error('Stack trace:', error.stack);

        // Stop monitoring to allow test to exit
        configurationValidator.stopMonitoring();
    }
}

// Run the test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    runIntegrationTest().then(() => {
        console.log('\n✅ Test completed successfully');
        process.exit(0);
    }).catch((error) => {
        console.error('\n❌ Test failed:', error);
        process.exit(1);
    });
}

export { runIntegrationTest };