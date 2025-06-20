import axios from 'axios';
import fs from 'fs';
import path from 'path';
import Ajv from 'ajv';
import { TestSuite, Assertion } from './types';
import { injectVariables, setVariable } from './utils/variableStore';
import { JSONPath } from 'jsonpath-plus';
import { loadEnvironment } from './utils/envManager';
import { Reporter } from './reporter';
import { assertJson } from './utils/assertUtils';
import { runPreProcessors } from './preProcessor';

const ajv = new Ajv();
const schemaCache = new Map<string, object>();

export async function executeSuite(suite: TestSuite, reporter: Reporter) {
    const { baseUrl } = loadEnvironment();
    console.log(`Running Suite: ${suite.suiteName}`);

    for (const testCase of suite.testCases) {
        console.log(`  TestCase: ${testCase.name}`);

        for (const data of testCase.testData) {
            let responseData: any = null;
            const start = Date.now();
            const fullUrl = injectVariables((baseUrl || suite.baseUrl || '') + data.endpoint);
            const headers = data.headers;
            const method = data.method.toLowerCase();

            // Run pre-processors if any
            if (data.preProcess) {
                await runPreProcessors(data.preProcess);
            }

            // Prepare request body from bodyFile or body inline, with variable injection
            let body: any = undefined;
            if (data.bodyFile) {
                try {
                    const bodyFilePath = path.resolve(__dirname, '../', data.bodyFile);
                    const raw = fs.readFileSync(bodyFilePath, 'utf-8');
                    body = JSON.parse(injectVariables(raw));
                } catch (err) {
                    const message = err instanceof Error ? err.message : String(err);
                    console.error(`❌ Failed to read or parse bodyFile: ${data.bodyFile}`, err);
                    reporter.add({
                        testCase: testCase.name,
                        dataSet: data.name,
                        status: 'FAIL',
                        error: `Failed to load bodyFile: ${message}`,
                        responseTimeMs: 0,
                        assertionsPassed: 0,
                        assertionsFailed: 0,
                    });
                    continue;
                }
            } else if (data.body) {
                body = JSON.parse(injectVariables(JSON.stringify(data.body)));
            }

            // Prepare JSON Schema for validation (external file or inline)
            let schema: object | undefined;
            if (data.responseSchemaFile) {
                try {
                    const schemaPath = path.resolve(__dirname, '../', data.responseSchemaFile);
                    if (schemaCache.has(schemaPath)) {
                        schema = schemaCache.get(schemaPath);
                    } else {
                        const rawSchema = fs.readFileSync(schemaPath, 'utf-8');
                        schema = JSON.parse(rawSchema);
                        schemaCache.set(schemaPath, schema as any);
                    }
                } catch (err) {
                    const message = err instanceof Error ? err.message : String(err);
                    console.error(`❌ Failed to read or parse responseSchemaFile: ${data.responseSchemaFile}`, err);
                    reporter.add({
                        testCase: testCase.name,
                        dataSet: data.name,
                        status: 'FAIL',
                        error: `Failed to load responseSchemaFile: ${message}`,
                        responseTimeMs: 0,
                        assertionsPassed: 0,
                        assertionsFailed: 0,
                    });
                    continue;
                }
            } else if (data.responseSchema) {
                schema = data.responseSchema;
            }

            let status: 'PASS' | 'FAIL' = 'PASS';
            let passed = 0,
                failed = 0;
            let allErrors: string[] = [];

            try {
                const res = await axios({ url: fullUrl, method, headers, data: body });
                responseData = res.data;

                // Validate response schema if available
                if (schema) {
                    const validate = ajv.compile(schema);
                    const valid = validate(res.data);
                    if (!valid) {
                        failed++;
                        const errors = validate.errors?.map(e => `${e.instancePath} ${e.message}`).join('; ');
                        allErrors.push(`Schema validation failed: ${errors}`);
                    }
                }

                // Run assertions
                if (data.assertions) {
                    for (const a of data.assertions as Assertion[]) {
                        try {
                            assertJson(res.data, res.status, [a]);
                            passed++;
                        } catch (err: any) {
                            failed++;
                            allErrors.push(err.message);
                        }
                    }
                }

                // Store variables from response
                if (data.store) {
                    for (const [varName, jsonPath] of Object.entries(data.store)) {
                        const value = JSONPath({ path: jsonPath, json: res.data })[0];
                        setVariable(varName, value);
                    }
                }

                if (allErrors.length > 0) {
                    status = 'FAIL';
                }
            } catch (e: any) {
                status = 'FAIL';
                allErrors.push(`Request error: ${e.message}`);
            } finally {
                const end = Date.now();
                reporter.add({
                    testCase: testCase.name,
                    dataSet: data.name,
                    status,
                    error: allErrors.length > 0 ? allErrors.join(' | ') : undefined,
                    assertionsPassed: passed,
                    assertionsFailed: failed,
                    responseTimeMs: end - start,
                    responseBody: status === 'FAIL' ? responseData : undefined,
                });
            }
        }
    }
}
