import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
    test: {
        environment: 'jsdom',
        setupFiles: ['./vitest.setup.js'],
        globals: true,
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html', 'lcov'],
            reportsDirectory: './coverage',
            include: [
                'client/src/utils/**/*.{js,jsx}',
                'client/src/components/**/*.{js,jsx}',
                'server/src/**/*.js',
            ],
            exclude: [
                'node_modules/**',
                '**/*.test.{js,jsx}',
                '**/*.spec.{js,jsx}',
                '**/tests/**',
                'client/src/components/ui/*.js', // Exclude auto-generated UI components
            ],
            // Target coverage thresholds (per design doc):
            // - Auth utilities: 80%
            // - Data validation: 70%
            // - Error handling: 70%
            // - Logger service: 60%
            // - Migration runner: 60%
            // Note: Thresholds are not enforced in CI to allow incremental improvement
        },
    },
    resolve: {
        alias: {
            '@': resolve(__dirname, './client/src'),
            '@shared': resolve(__dirname, './shared'),
        },
    },
})