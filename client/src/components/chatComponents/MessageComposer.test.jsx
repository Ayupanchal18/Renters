/**
 * MessageComposer Component Tests - File Upload Integration
 * Task 3: Test and verify file upload functionality
 * Requirements: 1.1, 1.5
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MessageComposer } from './MessageComposer';

// Mock file input behavior
const mockFileInput = () => {
    const input = document.createElement('input');
    input.type = 'file';
    return input;
};

describe('MessageComposer File Upload Integration', () => {
    let mockOnSendMessage;

    beforeEach(() => {
        mockOnSendMessage = vi.fn();
        vi.clearAllMocks();
    });

    describe('File selection and preview', () => {
        it('should display file preview for image files', async () => {
            render(<MessageComposer onSendMessage={mockOnSendMessage} />);

            const fileInput = screen.getByRole('button', { name: /attach/i }).nextElementSibling;
            const testFile = new File(['test content'], 'test-image.jpg', { type: 'image/jpeg' });

            // Mock FileReader for image preview
            const mockFileReader = {
                readAsDataURL: vi.fn(),
                result: 'data:image/jpeg;base64,fake-image-data',
                onload: null
            };

            vi.spyOn(window, 'FileReader').mockImplementation(() => mockFileReader);

            fireEvent.change(fileInput, { target: { files: [testFile] } });

            // Simulate FileReader onload
            if (mockFileReader.onload) {
                mockFileReader.onload({ target: { result: mockFileReader.result } });
            }

            await waitFor(() => {
                expect(screen.getByAltText('Preview')).toBeInTheDocument();
            });

            expect(screen.getByText('test-image.jpg')).toBeInTheDocument();
        });

        it('should display file icon for non-image files', async () => {
            render(<MessageComposer onSendMessage={mockOnSendMessage} />);

            const fileInput = screen.getByRole('button', { name: /attach/i }).nextElementSibling;
            const testFile = new File(['test content'], 'document.pdf', { type: 'application/pdf' });

            fireEvent.change(fileInput, { target: { files: [testFile] } });

            await waitFor(() => {
                expect(screen.getByText('document.pdf')).toBeInTheDocument();
            });

            // Should show file icon instead of image preview
            expect(screen.queryByAltText('Preview')).not.toBeInTheDocument();
        });

        it('should show file size information', async () => {
            render(<MessageComposer onSendMessage={mockOnSendMessage} />);

            const fileInput = screen.getByRole('button', { name: /attach/i }).nextElementSibling;
            const testFile = new File(['test content'], 'test.jpg', { type: 'image/jpeg' });
            
            // Mock file size
            Object.defineProperty(testFile, 'size', { value: 1024000 }); // 1MB

            fireEvent.change(fileInput, { target: { files: [testFile] } });

            await waitFor(() => {
                expect(screen.getByText('1 MB')).toBeInTheDocument();
            });
        });
    });

    describe('File validation', () => {
        it('should reject files that are too large', async () => {
            render(<MessageComposer onSendMessage={mockOnSendMessage} />);

            const fileInput = screen.getByRole('button', { name: /attach/i }).nextElementSibling;
            const largeFile = new File(['test content'], 'large-file.jpg', { type: 'image/jpeg' });
            
            // Mock file size to exceed 10MB limit
            Object.defineProperty(largeFile, 'size', { value: 11 * 1024 * 1024 }); // 11MB

            fireEvent.change(fileInput, { target: { files: [largeFile] } });

            await waitFor(() => {
                expect(screen.getByText(/File size must be less than 10MB/)).toBeInTheDocument();
            });

            // File should not be selected
            expect(screen.queryByText('large-file.jpg')).not.toBeInTheDocument();
        });

        it('should reject unsupported file types', async () => {
            render(<MessageComposer onSendMessage={mockOnSendMessage} />);

            const fileInput = screen.getByRole('button', { name: /attach/i }).nextElementSibling;
            const unsupportedFile = new File(['test content'], 'virus.exe', { type: 'application/x-msdownload' });

            fireEvent.change(fileInput, { target: { files: [unsupportedFile] } });

            await waitFor(() => {
                expect(screen.getByText(/File type not supported/)).toBeInTheDocument();
            });

            // File should not be selected
            expect(screen.queryByText('virus.exe')).not.toBeInTheDocument();
        });

        it('should accept supported image types', async () => {
            const supportedTypes = [
                { name: 'test.jpg', type: 'image/jpeg' },
                { name: 'test.png', type: 'image/png' },
                { name: 'test.gif', type: 'image/gif' },
                { name: 'test.webp', type: 'image/webp' }
            ];

            for (const fileType of supportedTypes) {
                const { unmount } = render(<MessageComposer onSendMessage={mockOnSendMessage} />);

                const fileInput = screen.getByRole('button', { name: /attach/i }).nextElementSibling;
                const testFile = new File(['test content'], fileType.name, { type: fileType.type });

                fireEvent.change(fileInput, { target: { files: [testFile] } });

                await waitFor(() => {
                    expect(screen.getByText(fileType.name)).toBeInTheDocument();
                });

                // Should not show error
                expect(screen.queryByText(/File type not supported/)).not.toBeInTheDocument();

                unmount();
            }
        });
    });

    describe('Message sending with files', () => {
        it('should send file-only messages', async () => {
            render(<MessageComposer onSendMessage={mockOnSendMessage} />);

            const fileInput = screen.getByRole('button', { name: /attach/i }).nextElementSibling;
            const testFile = new File(['test content'], 'test.jpg', { type: 'image/jpeg' });

            fireEvent.change(fileInput, { target: { files: [testFile] } });

            await waitFor(() => {
                expect(screen.getByText('test.jpg')).toBeInTheDocument();
            });

            const sendButton = screen.getByRole('button', { name: /send/i });
            fireEvent.click(sendButton);

            expect(mockOnSendMessage).toHaveBeenCalledWith('', testFile);
        });

        it('should send file + text messages', async () => {
            render(<MessageComposer onSendMessage={mockOnSendMessage} />);

            const fileInput = screen.getByRole('button', { name: /attach/i }).nextElementSibling;
            const testFile = new File(['test content'], 'test.jpg', { type: 'image/jpeg' });

            fireEvent.change(fileInput, { target: { files: [testFile] } });

            await waitFor(() => {
                expect(screen.getByText('test.jpg')).toBeInTheDocument();
            });

            const textInput = screen.getByPlaceholderText(/Add a caption/);
            fireEvent.change(textInput, { target: { value: 'Check this out!' } });

            const sendButton = screen.getByRole('button', { name: /send/i });
            fireEvent.click(sendButton);

            expect(mockOnSendMessage).toHaveBeenCalledWith('Check this out!', testFile);
        });

        it('should clear form after successful send', async () => {
            mockOnSendMessage.mockResolvedValue({ success: true });

            render(<MessageComposer onSendMessage={mockOnSendMessage} />);

            const fileInput = screen.getByRole('button', { name: /attach/i }).nextElementSibling;
            const testFile = new File(['test content'], 'test.jpg', { type: 'image/jpeg' });

            fireEvent.change(fileInput, { target: { files: [testFile] } });

            await waitFor(() => {
                expect(screen.getByText('test.jpg')).toBeInTheDocument();
            });

            const textInput = screen.getByPlaceholderText(/Add a caption/);
            fireEvent.change(textInput, { target: { value: 'Test message' } });

            const sendButton = screen.getByRole('button', { name: /send/i });
            fireEvent.click(sendButton);

            await waitFor(() => {
                expect(screen.queryByText('test.jpg')).not.toBeInTheDocument();
                expect(textInput.value).toBe('');
            });
        });

        it('should handle send errors gracefully', async () => {
            mockOnSendMessage.mockRejectedValue(new Error('Upload failed'));

            render(<MessageComposer onSendMessage={mockOnSendMessage} />);

            const fileInput = screen.getByRole('button', { name: /attach/i }).nextElementSibling;
            const testFile = new File(['test content'], 'test.jpg', { type: 'image/jpeg' });

            fireEvent.change(fileInput, { target: { files: [testFile] } });

            await waitFor(() => {
                expect(screen.getByText('test.jpg')).toBeInTheDocument();
            });

            const sendButton = screen.getByRole('button', { name: /send/i });
            fireEvent.click(sendButton);

            await waitFor(() => {
                expect(screen.getByText(/Upload failed/)).toBeInTheDocument();
            });

            // File should still be selected for retry
            expect(screen.getByText('test.jpg')).toBeInTheDocument();
        });
    });

    describe('File removal', () => {
        it('should allow removing selected files', async () => {
            render(<MessageComposer onSendMessage={mockOnSendMessage} />);

            const fileInput = screen.getByRole('button', { name: /attach/i }).nextElementSibling;
            const testFile = new File(['test content'], 'test.jpg', { type: 'image/jpeg' });

            fireEvent.change(fileInput, { target: { files: [testFile] } });

            await waitFor(() => {
                expect(screen.getByText('test.jpg')).toBeInTheDocument();
            });

            const removeButton = screen.getByRole('button', { name: /remove/i });
            fireEvent.click(removeButton);

            expect(screen.queryByText('test.jpg')).not.toBeInTheDocument();
        });
    });

    describe('UI state management', () => {
        it('should disable send button when no content', () => {
            render(<MessageComposer onSendMessage={mockOnSendMessage} />);

            const sendButton = screen.getByRole('button', { name: /send/i });
            expect(sendButton).toBeDisabled();
        });

        it('should enable send button with file only', async () => {
            render(<MessageComposer onSendMessage={mockOnSendMessage} />);

            const fileInput = screen.getByRole('button', { name: /attach/i }).nextElementSibling;
            const testFile = new File(['test content'], 'test.jpg', { type: 'image/jpeg' });

            fireEvent.change(fileInput, { target: { files: [testFile] } });

            await waitFor(() => {
                const sendButton = screen.getByRole('button', { name: /send/i });
                expect(sendButton).not.toBeDisabled();
            });
        });

        it('should change placeholder text when file is selected', async () => {
            render(<MessageComposer onSendMessage={mockOnSendMessage} />);

            const textInput = screen.getByPlaceholderText(/Type your message/);
            
            const fileInput = screen.getByRole('button', { name: /attach/i }).nextElementSibling;
            const testFile = new File(['test content'], 'test.jpg', { type: 'image/jpeg' });

            fireEvent.change(fileInput, { target: { files: [testFile] } });

            await waitFor(() => {
                expect(screen.getByPlaceholderText(/Add a caption/)).toBeInTheDocument();
            });
        });
    });
});