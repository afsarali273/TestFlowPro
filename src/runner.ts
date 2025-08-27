import fs from 'fs';
import path from 'path';
import minimist from 'minimist';
import * as dotenv from 'dotenv';
import pLimit from 'p-limit';
import { TestSuite } from './types';
import { executeSuite } from './executor';
import { Reporter } from './reporter';
import {UIRunner} from "./ui-test";

dotenv.config({
    path: path.resolve(__dirname, '../../.env')
});


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

async function runSuiteFromFile(filePath: string, filters: Record<string, string>) {
    if (!fs.existsSync(filePath)) {
        console.error(`❌ File not found: ${filePath}`);
        return;
    }

    const suite: TestSuite = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    if (Object.keys(filters).length > 0 && !suiteHasTags(suite, filters)) {
        console.log(`Skipping suite ${suite.suiteName || path.basename(filePath)} (tags filter mismatch)`);
        return;
    }

    const reporter = new Reporter();
    reporter.start(suite.suiteName || path.basename(filePath), suite.tags);

    console.log(`\n▶️ Starting Suite: ${suite.suiteName || path.basename(filePath)}`);

    await executeSuite(suite, reporter);

    reporter.writeReportToFile();
}

async function runAllSuitesParallel(filters: Record<string, string>) {
    const files = fs.readdirSync(suitesDir).filter(f => f.endsWith('.json'));
    const limit = pLimit(maxParallel);

    const tasks = files.map((file) =>
        limit(() => {
            const fullPath = path.join(suitesDir, file);
            return runSuiteFromFile(fullPath, filters);
        })
    );

    await Promise.all(tasks);
    console.log(`\n✅ All suites completed with max parallelism = ${maxParallel}`);
}

async function main() {
    const argv = minimist(process.argv.slice(2));
    const { file, _, ...filters } = argv;

    if (file) {
        const fullPath = path.isAbsolute(file)
            ? file
            : path.join(suitesDir, file);
        await runSuiteFromFile(fullPath, filters);
    } else {
        await runAllSuitesParallel(filters);
    }
}

main().catch((e) => {
    console.error('❌ Error running suites:', e);
});
