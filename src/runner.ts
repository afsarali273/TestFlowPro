import fs from 'fs';
import path from 'path';
import minimist from 'minimist';
import * as dotenv from 'dotenv';
import pLimit from 'p-limit';
import { TestSuite, TestCase } from './types';
import { executeSuite } from './executor';
import { Reporter } from './reporter';
import { UIRunner } from "./ui-test";

dotenv.config({
    path: path.resolve(__dirname, '../../.env')
});

const suitesDir = path.join(__dirname, '../testSuites');
const maxParallel = Number(process.env.MAX_PARALLEL_SUITES) || 2;

// Execution target types
type ExecutionTarget = {
    type: 'suite' | 'testcase' | 'testdata';
    suiteId: string;
    suiteName: string;
    testCaseId?: string;
    testCaseName?: string;
    testDataIndex?: number;
    testDataName?: string;
};

// Parse execution target from string format: "suiteId:suiteName > testCaseId:testCaseName > testDataIndex:testDataName"
function parseExecutionTarget(targetStr: string): ExecutionTarget {
    console.log(`Parsing target: "${targetStr}"`);
    const parts = targetStr.split(' > ').map(p => p.trim());
    console.log(`Target parts:`, parts);
    
    if (parts.length === 1) {
        // Suite level: "suiteId:suiteName"
        const [suiteId, suiteName] = parts[0].split(':');
        const result = { type: 'suite' as const, suiteId, suiteName };
        console.log(`Parsed as suite:`, result);
        return result;
    } else if (parts.length === 2) {
        // TestCase level: "suiteId:suiteName > testCaseId:testCaseName"
        const [suiteId, suiteName] = parts[0].split(':');
        const [testCaseId, testCaseName] = parts[1].split(':');
        const result = { type: 'testcase' as const, suiteId, suiteName, testCaseId, testCaseName };
        console.log(`Parsed as testcase:`, result);
        return result;
    } else if (parts.length === 3) {
        // TestData level: "suiteId:suiteName > testCaseId:testCaseName > testDataIndex:testDataName"
        const [suiteId, suiteName] = parts[0].split(':');
        const [testCaseId, testCaseName] = parts[1].split(':');
        const [testDataIndex, testDataName] = parts[2].split(':');
        const result = { 
            type: 'testdata' as const, 
            suiteId, 
            suiteName, 
            testCaseId, 
            testCaseName, 
            testDataIndex: parseInt(testDataIndex), 
            testDataName 
        };
        console.log(`Parsed as testdata:`, result);
        return result;
    }
    
    throw new Error(`Invalid target format: ${targetStr}. Use "suiteId:suiteName" or "suiteId:suiteName > testCaseId:testCaseName" or "suiteId:suiteName > testCaseId:testCaseName > testDataIndex:testDataName"`);
}

function suiteHasTags(suite: TestSuite, filters: Record<string, string>): boolean {
    if (!suite.tags) return false;
    for (const [key, value] of Object.entries(filters)) {
        const found = suite.tags.some(tag => tag[key] === value);
        if (!found) return false;
    }
    return true;
}

// Modular execution functions
class TestRunner {
    private reporter: Reporter;
    
    constructor(reporter: Reporter) {
        this.reporter = reporter;
    }
    
    async executeSuite(suite: TestSuite) {
        console.log(`\n▶️ Starting Suite: ${suite.suiteName} (${suite.id})`);
        await executeSuite(suite, this.reporter);
    }
    
    async executeTestCase(suite: TestSuite, target: ExecutionTarget) {
        console.log(`Looking for test case: ID='${target.testCaseId}', Name='${target.testCaseName}'`);
        console.log(`Available test cases:`, suite.testCases.map(tc => ({ id: tc.id, name: tc.name })));
        
        const testCase = suite.testCases.find(tc => 
            tc.name === target.testCaseName || (target.testCaseId && tc.id === target.testCaseId)
        );
        
        if (!testCase) {
            throw new Error(`TestCase not found: ${target.testCaseId}:${target.testCaseName}`);
        }
        
        console.log(`Found test case: ${testCase.name} (ID: ${testCase.id})`);
        
        console.log(`\n▶️ Starting TestCase: ${testCase.name} from Suite: ${suite.suiteName}`);
        
        if (suite.type === 'UI') {
            // UI test case execution
            const uiRunner = new UIRunner(this.reporter);
            await uiRunner.init({ headless: false });
            await uiRunner.runTestCase(testCase);
            await uiRunner.close();
        } else {
            // API test case execution
            const tempSuite: TestSuite = {
                ...suite,
                testCases: [testCase]
            };
            await executeSuite(tempSuite, this.reporter);
        }
    }
    
    async executeTestData(suite: TestSuite, target: ExecutionTarget) {
        if (suite.type !== 'API') {
            throw new Error('TestData execution only supported for API suites');
        }
        
        const testCase = suite.testCases.find(tc => 
            tc.name === target.testCaseName || tc.id === target.testCaseId
        );
        
        if (!testCase || testCase.type !== 'REST' && testCase.type !== 'SOAP') {
            throw new Error(`API TestCase not found: ${target.testCaseId}:${target.testCaseName}`);
        }
        
        const testData = testCase.testData[target.testDataIndex!];
        if (!testData) {
            throw new Error(`TestData not found at index ${target.testDataIndex} in ${target.testCaseName}`);
        }
        
        console.log(`\n▶️ Starting TestData: ${testData.name} from TestCase: ${testCase.name}`);
        
        // Create a temporary suite with only the target test data
        const tempTestCase = {
            ...testCase,
            testData: [testData]
        };
        
        const tempSuite: TestSuite = {
            ...suite,
            testCases: [tempTestCase]
        };
        
        await executeSuite(tempSuite, this.reporter);
    }
}

async function runTarget(filePath: string, target: ExecutionTarget, filters: Record<string, string>, runId?: string) {
    if (!fs.existsSync(filePath)) {
        console.error(`❌ File not found: ${filePath}`);
        return;
    }

    const suite: TestSuite = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    
    // Validate suite matches target
    if (suite.id !== target.suiteId && suite.suiteName !== target.suiteName) {
        console.error(`❌ Suite mismatch: Expected ${target.suiteId}:${target.suiteName}, found ${suite.id}:${suite.suiteName}`);
        return;
    }

    if (Object.keys(filters).length > 0 && !suiteHasTags(suite, filters)) {
        console.log(`Skipping suite ${suite.suiteName} (tags filter mismatch)`);
        return;
    }

    const reporter = new Reporter();
    const targetDesc = target.type === 'suite' ? suite.suiteName : 
                      target.type === 'testcase' ? `${target.testCaseName} (${suite.suiteName})` :
                      `${target.testDataName} (${target.testCaseName} > ${suite.suiteName})`;
    
    reporter.start(targetDesc, suite.tags, runId);
    
    const runner = new TestRunner(reporter);
    
    try {
        switch (target.type) {
            case 'suite':
                await runner.executeSuite(suite);
                break;
            case 'testcase':
                await runner.executeTestCase(suite, target);
                break;
            case 'testdata':
                await runner.executeTestData(suite, target);
                break;
        }
    } catch (error) {
        console.error(`❌ Execution failed:`, error);
    }

    reporter.writeReportToFile();
    
    // Print summary for API parsing
    const summary = reporter.getSummary();
    console.log(`\n📊 Test Results Summary:`);
    console.log(`Total: ${summary.totalDataSets}`);
    console.log(`${summary.passed} passed`);
    console.log(`${summary.failed} failed`);
    console.log(`Execution time: ${summary.executionTimeMs}ms`);
}

// Legacy function for backward compatibility
async function runSuiteFromFile(filePath: string, filters: Record<string, string>, runId?: string) {
    if (!fs.existsSync(filePath)) {
        console.error(`❌ File not found: ${filePath}`);
        return;
    }

    const suite: TestSuite = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const target: ExecutionTarget = {
        type: 'suite',
        suiteId: suite.id,
        suiteName: suite.suiteName
    };
    
    await runTarget(filePath, target, filters, runId);
}

// Generate user-friendly run name: "Run #123 - Today 4:41 PM"
function generateRunName(): string {
    const now = new Date();
    const runNumber = Math.floor(Math.random() * 999) + 1; // Simple counter, could be improved
    
    const today = new Date();
    const isToday = now.toDateString() === today.toDateString();
    
    const timeStr = now.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
    });
    
    const dateStr = isToday ? 'Today' : now.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
    });
    
    return `Run #${runNumber} - ${dateStr} ${timeStr}`;
}

async function runAllSuitesParallel(filters: Record<string, string>) {
    const files = fs.readdirSync(suitesDir).filter(f => f.endsWith('.json'));
    const limit = pLimit(maxParallel);
    const runId = generateRunName();

    console.log(`\n🚀 Starting ${runId}`);

    const tasks = files.map((file) =>
        limit(() => {
            const fullPath = path.join(suitesDir, file);
            return runSuiteFromFile(fullPath, filters, runId);
        })
    );

    await Promise.all(tasks);
    console.log(`\n✅ ${runId} completed with max parallelism = ${maxParallel}`);
}

async function findSuiteFile(suiteId: string, suiteName: string): Promise<string | null> {
    const files = fs.readdirSync(suitesDir).filter(f => f.endsWith('.json'));
    
    for (const file of files) {
        try {
            const fullPath = path.join(suitesDir, file);
            const suite: TestSuite = JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
            if (suite.id === suiteId || suite.suiteName === suiteName) {
                return fullPath;
            }
        } catch (error) {
            // Skip invalid JSON files
            continue;
        }
    }
    
    return null;
}

async function main() {
    const argv = minimist(process.argv.slice(2));
    const { file, target, _, ...filters } = argv;
    const runId = generateRunName();

    if (target) {
        // Target execution with or without file
        const executionTarget = parseExecutionTarget(target);
        let fullPath: string;
        
        if (file) {
            // File provided
            fullPath = path.isAbsolute(file) ? file : path.join(suitesDir, file);
        } else {
            // Find file by suite ID/name
            const foundPath = await findSuiteFile(executionTarget.suiteId, executionTarget.suiteName);
            if (!foundPath) {
                console.error(`❌ Suite file not found for: ${executionTarget.suiteId}:${executionTarget.suiteName}`);
                return;
            }
            fullPath = foundPath;
        }
        
        await runTarget(fullPath, executionTarget, filters, runId);
    } else if (file) {
        // Full suite execution (backward compatibility)
        const fullPath = path.isAbsolute(file) ? file : path.join(suitesDir, file);
        await runSuiteFromFile(fullPath, filters, runId);
    } else {
        // All suites execution
        await runAllSuitesParallel(filters);
    }
    
    console.log(`\n📊 Execution completed. Run ID: ${runId}`);
}

main().catch((e) => {
    console.error('❌ Error running suites:', e);
    process.exit(1);
});

// Export for programmatic usage
export { TestRunner, parseExecutionTarget, ExecutionTarget  };
