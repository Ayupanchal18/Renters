import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
    test: {
        environment: 'jsdom',
        setupFiles: ['./vitest.setup.js'],
        globals: true,
    },
    resolve: {
        alias: {
            '@': resolve(__dirname, './client/src'),
            '@shared': resolve(__dirname, './shared'),
        },
    },
})