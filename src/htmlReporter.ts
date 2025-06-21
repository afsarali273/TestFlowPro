import fs from 'fs';
import path from 'path';

interface SuiteReport {
    summary: {
        suiteName: string;
        tags: { serviceName: string; suiteType: string };
        totalTestCases: number;
        totalDataSets: number;
        passed: number;
        failed: number;
        totalAssertionsPassed: number;
        totalAssertionsFailed: number;
        executionTimeMs: number;
    };
    results: {
        testCase: string;
        dataSet: string;
        status: 'PASS' | 'FAIL';
        error?: string;
        assertionsPassed: number;
        assertionsFailed: number;
        responseTimeMs: number;
    }[];
}

export function generateHtmlReport(suites: SuiteReport[]): string {
    const summaryRows = suites.map(suite => {
        const { suiteName, tags, totalTestCases, passed, failed, totalAssertionsPassed, totalAssertionsFailed, executionTimeMs } = suite.summary;
        return `
      <tr>
        <td>${suiteName}</td>
        <td>${tags.serviceName || ''}</td>
        <td>${tags.suiteType || ''}</td>
        <td>${totalTestCases}</td>
        <td style="color:green">${passed}</td>
        <td style="color:red">${failed}</td>
        <td>${totalAssertionsPassed} / ${totalAssertionsFailed}</td>
        <td>${executionTimeMs} ms</td>
      </tr>`;
    }).join('');

    const failedDetails = suites.flatMap(suite =>
        suite.results
            .filter(r => r.status === 'FAIL')
            .map(result => `
        <tr>
          <td>${suite.summary.suiteName}</td>
          <td>${result.testCase}</td>
          <td>${result.dataSet}</td>
          <td style="color:red">FAIL</td>
          <td>${result.assertionsPassed}/${result.assertionsFailed}</td>
          <td>${result.responseTimeMs} ms</td>
          <td>${result.error || ''}</td>
        </tr>`)
    ).join('');

    return `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; }
          table { border-collapse: collapse; width: 100%; margin: 20px 0; }
          th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
          th { background-color: #f4f4f4; }
        </style>
      </head>
      <body>
        <h2>API Test Summary Report</h2>
        <h3>Suite Summary</h3>
        <table>
          <tr>
            <th>Suite Name</th>
            <th>Service</th>
            <th>Type</th>
            <th>Total</th>
            <th>Passed</th>
            <th>Failed</th>
            <th>Assertions (P/F)</th>
            <th>Exec Time</th>
          </tr>
          ${summaryRows}
        </table>

        <h3>Failed Tests</h3>
        <table>
          <tr>
            <th>Suite</th>
            <th>Test Case</th>
            <th>Data Set</th>
            <th>Status</th>
            <th>Assertions</th>
            <th>Resp Time</th>
            <th>Error</th>
          </tr>
          ${failedDetails || `<tr><td colspan="7" style="text-align:center;">✅ All tests passed</td></tr>`}
        </table>
      </body>
    </html>
  `;
}
