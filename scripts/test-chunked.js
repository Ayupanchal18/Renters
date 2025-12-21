import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import process from 'node:process';

// Configuration
const CHUNK_SIZE = 10;
const SEARCH_DIRS = ['client', 'server'];
const TEST_EXTENSIONS = ['.test.js', '.test.jsx', '.spec.js', '.spec.jsx'];

function findTestFiles(dir, fileList = []) {
    if (!fs.existsSync(dir)) return fileList;

    const files = fs.readdirSync(dir);

    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            if (file !== 'node_modules' && file !== '.git' && file !== 'dist') {
                findTestFiles(filePath, fileList);
            }
        } else {
            if (TEST_EXTENSIONS.some(ext => file.endsWith(ext))) {
                fileList.push(filePath);
            }
        }
    });

    return fileList;
}

function runTests() {
    console.log('🔍 Scanning for test files...');
    let allTestFiles = [];
    SEARCH_DIRS.forEach(dir => {
        allTestFiles = allTestFiles.concat(findTestFiles(path.join(process.cwd(), dir)));
    });

    console.log(`✅ Found ${allTestFiles.length} test files.`);

    if (allTestFiles.length === 0) {
        console.log('No tests found. Exiting.');
        return;
    }

    // Chunk the files
    const chunks = [];
    for (let i = 0; i < allTestFiles.length; i += CHUNK_SIZE) {
        chunks.push(allTestFiles.slice(i, i + CHUNK_SIZE));
    }

    console.log(`📦 Split into ${chunks.length} chunks of up to ${CHUNK_SIZE} files each.\n`);

    let totalFailed = 0;
    let passedChunks = 0;

    for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        console.log(`🚀 Running Chunk ${i + 1}/${chunks.length} (${chunk.length} files)...`);

        // Construct the command
        const args = ['vitest', 'run', ...chunk];

        const command = process.platform === 'win32' ? 'npx.cmd' : 'npx';

        const result = spawnSync(command, args, {
            stdio: 'inherit',
            encoding: 'utf-8',
            shell: true
        });

        if (result.status === 0) {
            console.log(`\n✅ Chunk ${i + 1} PASSED.\n`);
            passedChunks++;
        } else {
            console.error(`\n❌ Chunk ${i + 1} FAILED. (Exit code: ${result.status})\n`);
            totalFailed++;
        }
    }

    console.log('='.repeat(30));
    console.log('🏁 ALL CHUNKS COMPLETED');
    console.log(`Passed Chunks: ${passedChunks}/${chunks.length}`);
    console.log(`Failed Chunks: ${totalFailed}/${chunks.length}`);

    if (totalFailed > 0) {
        process.exit(1);
    } else {
        process.exit(0);
    }
}

runTests();
