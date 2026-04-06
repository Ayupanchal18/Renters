/**
 * Authentication debugging utilities for mobile app
 */

import { getAccessToken, getRefreshToken } from '../features/auth/services/tokenStorage';
import { isTokenExpired, getTokenTimeRemaining } from './tokenUtils';

/**
 * Debug current authentication state
 */
export async function debugAuthState(): Promise<void> {
  try {
    const accessToken = await getAccessToken();
    const refreshToken = await getRefreshToken();
    
    console.log('=== AUTH DEBUG STATE ===');
    console.log('Access Token:', accessToken ? 'Present' : 'Missing');
    console.log('Refresh Token:', refreshToken ? 'Present' : 'Missing');
    
    if (accessToken) {
      const isExpired = isTokenExpired(accessToken);
      const timeRemaining = getTokenTimeRemaining(accessToken);
      
      console.log('Access Token Expired:', isExpired);
      console.log('Time Remaining (minutes):', timeRemaining);
      
      if (isExpired) {
        console.log('⚠️ Access token is expired!');
      } else if (timeRemaining && timeRemaining < 5) {
        console.log('⚠️ Access token expires soon!');
      } else {
        console.log('✅ Access token is valid');
      }
    }
    
    if (refreshToken) {
      const isRefreshExpired = isTokenExpired(refreshToken);
      const refreshTimeRemaining = getTokenTimeRemaining(refreshToken);
      
      console.log('Refresh Token Expired:', isRefreshExpired);
      console.log('Refresh Time Remaining (minutes):', refreshTimeRemaining);
      
      if (isRefreshExpired) {
        console.log('❌ Refresh token is expired - user needs to login again');
      } else {
        console.log('✅ Refresh token is valid');
      }
    }
    
    console.log('========================');
  } catch (error) {
    console.error('Auth debug failed:', error);
  }
}

/**
 * Log authentication events for debugging
 */
export function logAuthEvent(event: string, details?: any): void {
  const timestamp = new Date().toISOString();
  console.log(`[AUTH ${timestamp}] ${event}`, details || '');
}