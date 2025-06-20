import fs from 'fs';
import path from 'path';

export interface ReportEntry {
    testCase: string;
    dataSet: string;
    status: 'PASS' | 'FAIL';
    error?: string;
    assertionsPassed?: number;
    assertionsFailed?: number;
    responseTimeMs?: number;
    responseBody?: any;
}

export interface Tag {
    [key: string]: string;
}

export class Reporter {
    private report: ReportEntry[] = [];
    private startTime: number = 0;
    private suiteName: string = '';
    private tagsMap: { [key: string]: string } = {};

    start(suiteName: string, tags?: Tag[]) {
        this.suiteName = suiteName;
        this.report = [];
        this.startTime = Date.now();
        this.tagsMap = {};
        if (tags) {
            for (const tag of tags) {
                Object.entries(tag).forEach(([k, v]) => {
                    this.tagsMap[k] = v;
                });
            }
        }
        console.log(`Started reporting for suite: ${suiteName}`);
    }

    add(entry: ReportEntry) {
        this.report.push(entry);
    }

    writeReportToFile() {
        const totalTestCases = new Set(this.report.map((r) => r.testCase)).size;
        const totalDataSets = this.report.length;
        const passed = this.report.filter((r) => r.status === 'PASS').length;
        const failed = this.report.filter((r) => r.status === 'FAIL').length;
        const totalAssertionsPassed = this.report.reduce(
            (sum, r) => sum + (r.assertionsPassed || 0),
            0
        );
        const totalAssertionsFailed = this.report.reduce(
            (sum, r) => sum + (r.assertionsFailed || 0),
            0
        );
        const executionTimeMs = Date.now() - this.startTime;

        const output = {
            summary: {
                suiteName: this.suiteName,
                tags: this.tagsMap,
                totalTestCases,
                totalDataSets,
                passed,
                failed,
                totalAssertionsPassed,
                totalAssertionsFailed,
                executionTimeMs,
            },
            results: this.report,
        };

        const fileName = `result-${this.suiteName.replace(/\s+/g, '_')}-${new Date()
            .toISOString()
            .replace(/[:.]/g, '-')}.json`;
        const fullPath = path.join(__dirname, '../reports', fileName);
        fs.mkdirSync(path.dirname(fullPath), { recursive: true });
        fs.writeFileSync(fullPath, JSON.stringify(output, null, 2), 'utf-8');
        console.log(`\n📄 Report written to: ${fullPath}`);
    }
}
