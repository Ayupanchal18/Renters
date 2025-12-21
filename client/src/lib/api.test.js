import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the auth module
vi.mock('../utils/auth.js', () => ({
    getToken: vi.fn(),
    clearAuth: vi.fn(),
    isTokenExpired: vi.fn()
}));

import { getHeaders, handleAuthError, authenticatedFetch } from './api.js';
import { getToken, clearAuth, isTokenExpired } from '../utils/auth.js';

describe('API Header Construction', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Mock localStorage
        Object.defineProperty(window, 'localStorage', {
            value: {
                getItem: vi.fn(),
                setItem: vi.fn(),
                removeItem: vi.fn(),
            },
            writable: true,
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should include Bearer token with correct spacing when token is provided', () => {
        const testToken = 'test-jwt-token-123';

        // We need to access the getHeaders function directly since it's not exported
        // Let's test by importing the entire module and accessing the function
        const headers = getHeaders(testToken);

        expect(headers['Authorization']).toBe(`Bearer ${testToken}`);
        expect(headers['Content-Type']).toBe('application/json');
    });

    it('should automatically retrieve token from localStorage when no token provided', () => {
        const storedToken = 'stored-jwt-token-456';
        getToken.mockReturnValue(storedToken);

        const headers = getHeaders();

        expect(getToken).toHaveBeenCalled();
        expect(headers['Authorization']).toBe(`Bearer ${storedToken}`);
    });

    it('should include x-user-id header for development mode', () => {
        const userId = 'dev-user-123';
        window.localStorage.getItem.mockImplementation((key) => {
            if (key === 'userId') return userId;
            return null;
        });

        const headers = getHeaders();

        expect(headers['x-user-id']).toBe(userId);
    });

    it('should not include Authorization header when no token is available', () => {
        getToken.mockReturnValue(null);

        const headers = getHeaders();

        expect(headers['Authorization']).toBeUndefined();
        expect(headers['Content-Type']).toBe('application/json');
    });

    it('should prefer provided token over stored token', () => {
        const providedToken = 'provided-token';
        const storedToken = 'stored-token';

        getToken.mockReturnValue(storedToken);

        const headers = getHeaders(providedToken);

        expect(headers['Authorization']).toBe(`Bearer ${providedToken}`);
        // getToken should not be called when token is provided
        expect(getToken).not.toHaveBeenCalled();
    });
});

describe('Authentication Error Handling', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Mock window.location
        Object.defineProperty(window, 'location', {
            value: { href: '' },
            writable: true,
        });
    });

    it('should handle 401 errors by clearing auth and redirecting', () => {
        const mockNavigate = vi.fn();
        const mockResponse = { status: 401 };

        const result = handleAuthError(mockResponse, mockNavigate);

        expect(result).toBe(true);
        expect(clearAuth).toHaveBeenCalled();
        expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true });
    });

    it('should handle 403 errors by clearing auth and redirecting', () => {
        const mockNavigate = vi.fn();
        const mockResponse = { status: 403 };

        const result = handleAuthError(mockResponse, mockNavigate);

        expect(result).toBe(true);
        expect(clearAuth).toHaveBeenCalled();
        expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true });
    });

    it('should not handle non-auth errors', () => {
        const mockNavigate = vi.fn();
        const mockResponse = { status: 500 };

        const result = handleAuthError(mockResponse, mockNavigate);

        expect(result).toBe(false);
        expect(clearAuth).not.toHaveBeenCalled();
        expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('should fallback to window.location when navigate is not provided', () => {
        const mockResponse = { status: 401 };

        const result = handleAuthError(mockResponse);

        expect(result).toBe(true);
        expect(clearAuth).toHaveBeenCalled();
        expect(window.location.href).toBe('/login');
    });
});

describe('Authenticated Fetch', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        global.fetch = vi.fn();
        Object.defineProperty(window, 'location', {
            value: { href: '' },
            writable: true,
        });
    });

    it('should throw error when token is expired', async () => {
        const expiredToken = 'expired-token';
        getToken.mockReturnValue(expiredToken);
        isTokenExpired.mockReturnValue(true);
        const mockNavigate = vi.fn();

        await expect(authenticatedFetch('/api/test', {}, mockNavigate))
            .rejects.toThrow('Authentication token has expired');

        expect(clearAuth).toHaveBeenCalled();
        expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true });
    });

    it('should make request when token is valid', async () => {
        const validToken = 'valid-token';
        getToken.mockReturnValue(validToken);
        isTokenExpired.mockReturnValue(false);

        const mockResponse = { status: 200, json: () => Promise.resolve({ success: true }) };
        global.fetch.mockResolvedValue(mockResponse);

        const result = await authenticatedFetch('/api/test');

        expect(global.fetch).toHaveBeenCalledWith('/api/test', {});
        expect(result).toBe(mockResponse);
    });

    it('should handle auth errors in response', async () => {
        getToken.mockReturnValue(null);
        isTokenExpired.mockReturnValue(false);

        const mockResponse = { status: 401 };
        global.fetch.mockResolvedValue(mockResponse);
        const mockNavigate = vi.fn();

        await expect(authenticatedFetch('/api/test', {}, mockNavigate))
            .rejects.toThrow('Authentication failed (401)');

        expect(clearAuth).toHaveBeenCalled();
        expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true });
    });
});