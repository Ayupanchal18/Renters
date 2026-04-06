/**
 * Authentication system test utilities
 * Use these functions to test the token refresh functionality
 */

import { refreshAccessToken } from '../features/auth/services/authService';
import { getAccessToken, getRefreshToken } from '../features/auth/services/tokenStorage';
import { isTokenExpired, getTokenTimeRemaining } from './tokenUtils';
import { debugAuthState, logAuthEvent } from './authDebug';

/**
 * Test the complete token refresh flow
 */
export async function testTokenRefresh(): Promise<boolean> {
  try {
    logAuthEvent('Starting token refresh test');
    
    // Check current state
    await debugAuthState();
    
    // Attempt token refresh
    const newToken = await refreshAccessToken();
    
    if (newToken) {
      logAuthEvent('Token refresh successful', { tokenLength: newToken.length });
      await debugAuthState();
      return true;
    } else {
      logAuthEvent('Token refresh failed - no new token returned');
      return false;
    }
  } catch (error) {
    logAuthEvent('Token refresh test failed', error);
    return false;
  }
}

/**
 * Simulate token expiration scenario
 */
export async function simulateTokenExpiration(): Promise<void> {
  const token = await getAccessToken();
  if (!token) {
    console.log('No token to test with');
    return;
  }
  
  const timeRemaining = getTokenTimeRemaining(token);
  const isExpired = isTokenExpired(token);
  
  console.log('=== TOKEN EXPIRATION SIMULATION ===');
  console.log('Current token expires in:', timeRemaining, 'minutes');
  console.log('Is currently expired:', isExpired);
  
  if (timeRemaining && timeRemaining > 5) {
    console.log('Token is not close to expiration. Wait or use a shorter-lived token for testing.');
  } else {
    console.log('Token is close to expiration or expired - perfect for testing refresh!');
    await testTokenRefresh();
  }
}

/**
 * Monitor token status over time
 */
export function startTokenMonitoring(intervalMinutes: number = 1): () => void {
  logAuthEvent('Starting token monitoring', { intervalMinutes });
  
  const interval = setInterval(async () => {
    const token = await getAccessToken();
    if (token) {
      const timeRemaining = getTokenTimeRemaining(token);
      const isExpired = isTokenExpired(token);
      
      console.log(`[Monitor] Token remaining: ${timeRemaining}min, Expired: ${isExpired}`);
      
      if (isExpired) {
        console.log('[Monitor] Token expired! Testing refresh...');
        await testTokenRefresh();
      }
    } else {
      console.log('[Monitor] No token found');
    }
  }, intervalMinutes * 60 * 1000);
  
  // Return cleanup function
  return () => {
    clearInterval(interval);
    logAuthEvent('Token monitoring stopped');
  };
}