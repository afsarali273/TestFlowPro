import fs from 'fs';
import path from 'path';
import minimist from 'minimist';
import * as dotenv from 'dotenv';
import pLimit from 'p-limit';
import { TestSuite } from './types';
import { executeSuite } from './executor';
import { Reporter } from './reporter';

dotenv.config();

const suitesDir = path.join(__dirname, '../testData');
const maxParallel = Number(process.env.MAX_PARALLEL_SUITES) || 2;

function suiteHasTags(suite: TestSuite, filters: Record<string, string>): boolean {
    if (!suite.tags) return false;
    for (const [key, value] of Object.entries(filters)) {
        const found = suite.tags.some(tag => tag[key] === value);
        if (!found) return false;
    }
    return true;
}

async function runAllSuitesParallel() {
    const argv = minimist(process.argv.slice(2));
    const { _, ...filters } = argv;
    const files = fs.readdirSync(suitesDir).filter(f => f.endsWith('.json'));
    const limit = pLimit(maxParallel);

    const tasks = files.map((file) =>
        limit(async () => {
            const fullPath = path.join(suitesDir, file);
            const suite: TestSuite = JSON.parse(fs.readFileSync(fullPath, 'utf-8'));

            if (Object.keys(filters).length > 0 && !suiteHasTags(suite, filters)) {
                console.log(`Skipping suite ${suite.suiteName || file} (tags filter mismatch)`);
                return;
            }

            console.log(`\n▶️ Starting Suite: ${suite.suiteName || file}`);

            const reporter = new Reporter();
            reporter.start(suite.suiteName || file, suite.tags);

            await executeSuite(suite, reporter);

            reporter.writeReportToFile();
        })
    );

    await Promise.all(tasks);
    console.log(`\n✅ All suites completed with max parallelism = ${maxParallel}`);
}

runAllSuitesParallel().catch((e) => {
    console.error('Error running suites:', e);
});
