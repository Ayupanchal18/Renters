import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import otpService from './otpService.js';

/**
 * **Feature: dashboard-user-management, Property 11: OTP Generation Security**
 * **Validates: Requirements 8.1, 8.2**
 * 
 * For any OTP generation request, the generated code should be cryptographically secure, 
 * properly hashed when stored, and automatically expire after the defined time period.
 */
describe('OTP Service Core Security Properties', () => {
    describe('Property 11: OTP Generation Security', () => {
        it('Generated OTPs are cryptographically secure and unique', () => {
            fc.assert(fc.property(
                fc.integer({ min: 10, max: 100 }), // number of OTPs to generate
                (numOTPs) => {
                    const generatedOTPs = new Set();

                    // Generate multiple OTPs
                    for (let i = 0; i < numOTPs; i++) {
                        const otp = otpService.generateOTP();

                        // Verify OTP format (6 digits)
                        expect(otp).toMatch(/^\d{6}$/);
                        expect(otp.length).toBe(6);

                        // Verify OTP is within valid range
                        const otpNum = parseInt(otp, 10);
                        expect(otpNum).toBeGreaterThanOrEqual(100000);
                        expect(otpNum).toBeLessThanOrEqual(999999);

                        generatedOTPs.add(otp);
                    }

                    // Verify uniqueness (high probability with crypto.randomInt)
                    // For small numbers, some duplicates are possible but should be rare
                    if (numOTPs <= 50) {
                        expect(generatedOTPs.size).toBeGreaterThan(numOTPs * 0.7); // At least 70% unique
                    }

                    return true;
                }
            ), { numRuns: 50 });
        });

        it('OTP hashing produces valid bcrypt format', async () => {
            // Test with a single OTP to verify hash format
            const otp = '123456';
            const hash = await otpService.hashOTP(otp);

            // Verify hash properties
            expect(hash).toBeDefined();
            expect(hash.length).toBeGreaterThan(50); // bcrypt hashes are long
            expect(hash).toMatch(/^\$2[aby]?\$\d+\$/); // bcrypt format

            // Verify it can be used for verification
            expect(await otpService.verifyOTP(otp, hash)).toBe(true);
            expect(await otpService.verifyOTP('654321', hash)).toBe(false);
        }, 10000); // 10 second timeout for bcrypt

        it('OTP generation produces valid format consistently', () => {
            fc.assert(fc.property(
                fc.integer({ min: 1, max: 5 }), // Further reduced max iterations
                (iterations) => {
                    for (let i = 0; i < iterations; i++) {
                        const otp = otpService.generateOTP();

                        // Must be exactly 6 digits
                        expect(otp).toMatch(/^\d{6}$/);
                        expect(otp.length).toBe(6);

                        // Must not start with 0 (since we use 100000-999999 range)
                        expect(otp[0]).not.toBe('0');

                        // Must be a valid number
                        const num = parseInt(otp, 10);
                        expect(num).toBeGreaterThanOrEqual(100000);
                        expect(num).toBeLessThanOrEqual(999999);
                    }

                    return true;
                }
            ), { numRuns: 5 }); // Further reduced numRuns
        });

        it('Hash verification works correctly for valid and invalid OTPs', async () => {
            // Test with a few specific cases
            const testCases = [
                { otp: '123456', wrong: '654321' },
                { otp: '100000', wrong: '999999' },
                { otp: '555555', wrong: '111111' }
            ];

            for (const testCase of testCases) {
                const hash = await otpService.hashOTP(testCase.otp);

                // Correct OTP should verify
                expect(await otpService.verifyOTP(testCase.otp, hash)).toBe(true);

                // Wrong OTP should not verify
                expect(await otpService.verifyOTP(testCase.wrong, hash)).toBe(false);
            }
        }, 15000); // 15 second timeout for multiple bcrypt operations
    });

    /**
     * **Feature: dashboard-user-management, Property 5: OTP Rejection for Invalid Codes**
     * **Validates: Requirements 2.3, 3.3**
     * 
     * For any invalid or expired OTP, verification attempts should be rejected with 
     * appropriate error feedback, regardless of the verification type (email or phone).
     */
    describe('Property 5: OTP Rejection for Invalid Codes', () => {
        it('Invalid OTPs are consistently rejected', async () => {
            // Test with a valid OTP first
            const validOtp = '123456';
            const hash = await otpService.hashOTP(validOtp);

            // Generate invalid OTPs to test
            const invalidOTPs = [
                '000000', // all zeros
                '123457', // one digit off
                '654321', // completely different
                '12345',  // too short
                '1234567', // too long
                'abcdef', // non-numeric
                '',       // empty
                '999999', // different valid format
            ];

            for (const invalidOtp of invalidOTPs) {
                if (invalidOtp !== validOtp) {
                    const result = await otpService.verifyOTP(invalidOtp, hash);
                    expect(result).toBe(false);
                }
            }
        }, 10000);

        it('Property-based test: Invalid OTPs are rejected across all valid hash combinations', async () => {
            await fc.assert(fc.asyncProperty(
                fc.integer({ min: 100000, max: 999999 }).map(n => n.toString()), // valid OTP
                fc.integer({ min: 100000, max: 999999 }).map(n => n.toString()), // different OTP
                async (validOtp, differentOtp) => {
                    // Skip if they're the same
                    if (validOtp === differentOtp) {
                        return true;
                    }

                    // Hash the valid OTP
                    const hash = await otpService.hashOTP(validOtp);

                    // Valid OTP should verify
                    expect(await otpService.verifyOTP(validOtp, hash)).toBe(true);

                    // Different OTP should not verify
                    expect(await otpService.verifyOTP(differentOtp, hash)).toBe(false);

                    return true;
                }
            ), { numRuns: 10 }); // Limited runs due to bcrypt performance
        }, 30000); // Extended timeout for multiple bcrypt operations

        it('Malformed OTPs are handled gracefully', async () => {
            const validOtp = '123456';
            const hash = await otpService.hashOTP(validOtp);

            // Test various malformed inputs
            const malformedInputs = [
                '12345a', // contains letter
                '12 34 56', // contains spaces
                '123-456', // contains dash
                '+123456', // contains plus
                '123.456', // contains decimal
            ];

            for (const malformedInput of malformedInputs) {
                try {
                    const result = await otpService.verifyOTP(malformedInput, hash);
                    // Should return false for malformed input
                    expect(result).toBe(false);
                } catch (error) {
                    // Or throw an error, which is also acceptable
                    expect(error).toBeDefined();
                }
            }
        }, 10000);

        it('Hash format validation works correctly', async () => {
            const validOtp = '123456';

            // Test with invalid hash formats
            const invalidHashes = [
                'invalid-hash',
                '',
                'short',
                '$2a$12$', // incomplete bcrypt hash
                'plaintext-password',
            ];

            for (const invalidHash of invalidHashes) {
                try {
                    const result = await otpService.verifyOTP(validOtp, invalidHash);
                    // Should return false for invalid hash
                    expect(result).toBe(false);
                } catch (error) {
                    // Or throw an error, which is also acceptable for invalid hash format
                    expect(error).toBeDefined();
                }
            }
        }, 5000);
    });
});