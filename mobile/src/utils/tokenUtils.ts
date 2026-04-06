/**
 * Token utility functions for mobile authentication
 */

/**
 * Check if a JWT token is expired or will expire soon
 */
export function isTokenExpired(token: string, bufferMinutes: number = 2): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expirationTime = payload.exp * 1000; // Convert to milliseconds
    const currentTime = Date.now();
    const bufferTime = bufferMinutes * 60 * 1000; // Convert buffer to milliseconds
    
    return currentTime >= (expirationTime - bufferTime);
  } catch {
    return true; // If we can't parse the token, consider it expired
  }
}

/**
 * Get token expiration time in milliseconds
 */
export function getTokenExpiration(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000; // Convert to milliseconds
  } catch {
    return null;
  }
}

/**
 * Get time remaining until token expires (in minutes)
 */
export function getTokenTimeRemaining(token: string): number | null {
  const expiration = getTokenExpiration(token);
  if (!expiration) return null;
  
  const remaining = expiration - Date.now();
  return Math.max(0, Math.floor(remaining / (60 * 1000))); // Convert to minutes
}

/**
 * Check if token needs refresh (expires within buffer time)
 */
export function shouldRefreshToken(token: string, bufferMinutes: number = 5): boolean {
  return isTokenExpired(token, bufferMinutes);
}