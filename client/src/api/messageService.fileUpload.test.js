/**
 * File Upload Functionality Tests for Photo Messaging Fix
 * Task 3: Test and verify file upload functionality
 * Requirements: 1.1, 1.5
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import messageService from './messageService.js';

// Mock the auth utilities
vi.mock('../utils/auth', () => ({
    getUser: vi.fn(() => ({ _id: 'test-user-id' })),
    getToken: vi.fn(() => 'test-token')
}));

// Mock fetch
global.fetch = vi.fn();

describe('File Upload Functionality Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        fetch.mockClear();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('Photo uploads in chat interface', () => {
        it('should successfully upload image-only messages', async () => {
            // Mock successful response with file URL
            const mockResponse = {
                success: true,
                data: {
                    message: {
                        id: 'msg-123',
                        text: '',
                        file: {
                            originalName: 'test-photo.jpg',
                            filename: '1234567890-test-user-id-test-photo.jpg',
                            mimetype: 'image/jpeg',
                            size: 1024000,
                            url: '/uploads/messages/1234567890-test-user-id-test-photo.jpg'
                        },
                        createdAt: new Date().toISOString()
                    }
                }
            };

            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockResponse
            });

            const testFile = new File(['test image content'], 'test-photo.jpg', { type: 'image/jpeg' });
            const result = await messageService.sendMessage('conv-123', '', testFile);

            expect(result.success).toBe(true);
            expect(result.data.message.file).toBeDefined();
            expect(result.data.message.file.url).toContain('/uploads/messages/');
            expect(result.data.message.file.originalName).toBe('test-photo.jpg');
            expect(result.data.message.file.mimetype).toBe('image/jpeg');

            // Verify FormData was used
            const callArgs = fetch.mock.calls[0][1];
            expect(callArgs.body).toBeInstanceOf(FormData);
            expect(callArgs.headers).not.toHaveProperty('Content-Type');
        });

        it('should successfully upload image+text messages', async () => {
            const mockResponse = {
                success: true,
                data: {
                    message: {
                        id: 'msg-124',
                        text: 'Check out this photo!',
                        file: {
                            originalName: 'vacation.png',
                            filename: '1234567890-test-user-id-vacation.png',
                            mimetype: 'image/png',
                            size: 2048000,
                            url: '/uploads/messages/1234567890-test-user-id-vacation.png'
                        },
                        createdAt: new Date().toISOString()
                    }
                }
            };

            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockResponse
            });

            const testFile = new File(['test image content'], 'vacation.png', { type: 'image/png' });
            const result = await messageService.sendMessage('conv-123', 'Check out this photo!', testFile);

            expect(result.success).toBe(true);
            expect(result.data.message.text).toBe('Check out this photo!');
            expect(result.data.message.file).toBeDefined();
            expect(result.data.message.file.url).toContain('/uploads/messages/');
        });

        it('should handle different image formats', async () => {
            const imageFormats = [
                { name: 'test.jpg', type: 'image/jpeg' },
                { name: 'test.png', type: 'image/png' },
                { name: 'test.gif', type: 'image/gif' },
                { name: 'test.webp', type: 'image/webp' }
            ];

            for (const format of imageFormats) {
                const mockResponse = {
                    success: true,
                    data: {
                        message: {
                            id: `msg-${Date.now()}`,
                            text: '',
                            file: {
                                originalName: format.name,
                                mimetype: format.type,
                                url: `/uploads/messages/test-${format.name}`
                            }
                        }
                    }
                };

                fetch.mockResolvedValueOnce({
                    ok: true,
                    json: async () => mockResponse
                });

                const testFile = new File(['test content'], format.name, { type: format.type });
                const result = await messageService.sendMessage('conv-123', '', testFile);

                expect(result.success).toBe(true);
                expect(result.data.message.file.mimetype).toBe(format.type);
            }
        });
    });

    describe('File storage and URL generation', () => {
        it('should generate valid file URLs for uploaded files', async () => {
            const mockResponse = {
                success: true,
                data: {
                    message: {
                        id: 'msg-125',
                        text: '',
                        file: {
                            originalName: 'document.pdf',
                            filename: '1640995200000-test-user-id-document.pdf',
                            mimetype: 'application/pdf',
                            size: 512000,
                            url: '/uploads/messages/1640995200000-test-user-id-document.pdf'
                        }
                    }
                }
            };

            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockResponse
            });

            const testFile = new File(['test pdf content'], 'document.pdf', { type: 'application/pdf' });
            const result = await messageService.sendMessage('conv-123', '', testFile);

            expect(result.success).toBe(true);

            const fileUrl = result.data.message.file.url;
            expect(fileUrl).toMatch(/^\/uploads\/messages\/\d+-test-user-id-document\.pdf$/);
            expect(fileUrl).toContain('test-user-id'); // Contains user ID
            expect(fileUrl).toContain('document'); // Contains original filename
        });

        it('should preserve file metadata correctly', async () => {
            const mockResponse = {
                success: true,
                data: {
                    message: {
                        id: 'msg-126',
                        file: {
                            originalName: 'my-important-file.docx',
                            filename: '1640995200000-test-user-id-my-important-file.docx',
                            mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                            size: 1536000,
                            url: '/uploads/messages/1640995200000-test-user-id-my-important-file.docx'
                        }
                    }
                }
            };

            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockResponse
            });

            const testFile = new File(['test docx content'], 'my-important-file.docx', {
                type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            });

            // Set file size property (simulating real file)
            Object.defineProperty(testFile, 'size', { value: 1536000 });

            const result = await messageService.sendMessage('conv-123', 'Here is the document', testFile);

            expect(result.success).toBe(true);

            const file = result.data.message.file;
            expect(file.originalName).toBe('my-important-file.docx');
            expect(file.mimetype).toBe('application/vnd.openxmlformats-officedocument.wordprocessingml.document');
            expect(file.size).toBe(1536000);
            expect(file.url).toBeDefined();
        });
    });

    describe('Error handling for file uploads', () => {
        it('should handle file upload errors gracefully', async () => {
            fetch.mockResolvedValueOnce({
                ok: false,
                status: 400,
                json: async () => ({
                    success: false,
                    error: 'FILE_TOO_LARGE',
                    message: 'File size exceeds 10MB limit'
                })
            });

            const testFile = new File(['test content'], 'large-file.jpg', { type: 'image/jpeg' });
            const result = await messageService.sendMessage('conv-123', '', testFile);

            expect(result.success).toBe(false);
            expect(result.error.code).toBe('FILE_TOO_LARGE');
            expect(result.error.message).toBe('File size exceeds 10MB limit');
        });

        it('should handle unsupported file types', async () => {
            fetch.mockResolvedValueOnce({
                ok: false,
                status: 400,
                json: async () => ({
                    success: false,
                    error: 'INVALID_FILE_TYPE',
                    message: 'File type not supported'
                })
            });

            const testFile = new File(['test content'], 'test.exe', { type: 'application/x-msdownload' });
            const result = await messageService.sendMessage('conv-123', '', testFile);

            expect(result.success).toBe(false);
            expect(result.error.code).toBe('INVALID_FILE_TYPE');
        });

        it('should handle network errors during upload', async () => {
            fetch.mockRejectedValueOnce(new Error('Network error'));

            const testFile = new File(['test content'], 'test.jpg', { type: 'image/jpeg' });
            const result = await messageService.sendMessage('conv-123', '', testFile);

            expect(result.success).toBe(false);
            expect(result.error.code).toBe('NETWORK_ERROR');
        });
    });

    describe('FormData handling validation', () => {
        it('should not set Content-Type header for file uploads', async () => {
            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ success: true, data: { message: { id: '1' } } })
            });

            const testFile = new File(['test content'], 'test.jpg', { type: 'image/jpeg' });
            await messageService.sendMessage('conv-123', 'test message', testFile);

            const callArgs = fetch.mock.calls[0][1];
            expect(callArgs.headers).not.toHaveProperty('Content-Type');
            expect(callArgs.body).toBeInstanceOf(FormData);
        });

        it('should include authentication headers with FormData', async () => {
            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ success: true, data: { message: { id: '1' } } })
            });

            const testFile = new File(['test content'], 'test.jpg', { type: 'image/jpeg' });
            await messageService.sendMessage('conv-123', '', testFile);

            const callArgs = fetch.mock.calls[0][1];
            expect(callArgs.headers['x-user-id']).toBe('test-user-id');
            expect(callArgs.headers['Authorization']).toBe('Bearer test-token');
        });

        it('should properly construct FormData with file and text', async () => {
            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ success: true, data: { message: { id: '1' } } })
            });

            const testFile = new File(['test content'], 'test.jpg', { type: 'image/jpeg' });
            await messageService.sendMessage('conv-123', 'Caption text', testFile);

            const callArgs = fetch.mock.calls[0][1];
            const formData = callArgs.body;

            expect(formData).toBeInstanceOf(FormData);
            // Note: We can't easily test FormData contents in jsdom, but we verify it's created
        });
    });

    describe('Integration with message display', () => {
        it('should return message data compatible with MessageBubble component', async () => {
            const mockResponse = {
                success: true,
                data: {
                    message: {
                        id: 'msg-127',
                        text: 'Look at this image!',
                        file: {
                            originalName: 'screenshot.png',
                            filename: '1640995200000-test-user-id-screenshot.png',
                            mimetype: 'image/png',
                            size: 1024000,
                            url: '/uploads/messages/1640995200000-test-user-id-screenshot.png'
                        },
                        senderId: 'test-user-id',
                        createdAt: new Date().toISOString()
                    }
                }
            };

            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockResponse
            });

            const testFile = new File(['test content'], 'screenshot.png', { type: 'image/png' });
            const result = await messageService.sendMessage('conv-123', 'Look at this image!', testFile);

            expect(result.success).toBe(true);

            const message = result.data.message;
            // Verify message structure is compatible with MessageBubble expectations
            expect(message.id).toBeDefined();
            expect(message.text).toBe('Look at this image!');
            expect(message.file).toBeDefined();
            expect(message.file.url).toBeDefined(); // For image display
            expect(message.file.originalName).toBeDefined(); // For file name display
            expect(message.file.size).toBeDefined(); // For file size display
            expect(message.createdAt).toBeDefined(); // For timestamp
        });
    });
});