import axios from 'axios';
import { Ajv } from 'ajv';
import { Reporter } from "./reporter";
import { assertJson, assertXPath } from "./utils/assertUtils";
import { loadRequestBody } from "./utils/loadRequestBody";
import { TestSuite } from "./types";
import { loadEnvironment } from "./utils/envManager";
import { injectVariables, storeResponseVariables } from "./utils/variableStore";
import { runPreProcessors } from "./preProcessor";
import { loadSchema } from "./utils/loadSchema";

const ajv = new Ajv();

function isSoapRequest(headers?: Record<string, string>): boolean {
    const ct = headers?.['Content-Type']?.toLowerCase();
    return (
        ct?.includes('text/xml') ||
        ct?.includes('application/soap+xml') ||
        !!headers?.['SOAPAction']
    );
}

export async function executeSuite(suite: TestSuite, reporter: Reporter) {
    const env = loadEnvironment();
    const resolvedBaseUrl = env[suite.baseUrl] || suite.baseUrl || env.BASE_URL || '';

    console.log(`Running Suite: ${suite.suiteName}`);

    for (const testCase of suite.testCases) {
        console.log(`  TestCase: ${testCase.name}`);

        for (const data of testCase.testData) {
            const start = Date.now();
            let responseData: any = null;
            const fullUrl = injectVariables(resolvedBaseUrl + data.endpoint);
            let headers = data.headers;
            const soap = isSoapRequest(headers);

            if (data.preProcess) await runPreProcessors(data.preProcess);

            console.log("================================");
            console.log(`Request URL: ${fullUrl}`);
            console.log(`Request Type: ${data.method}`);
            console.log("Request Body:");
            console.log(JSON.stringify(data?.body, null, 2));

            let body: any;
            try {
                body = loadRequestBody(data.bodyFile, data.body, soap);
            } catch (err: any) {
                reporter.add({
                    testCase: testCase.name,
                    dataSet: data.name,
                    status: 'FAIL',
                    error: `Failed to load body: ${err.message}`,
                    responseTimeMs: 0,
                    assertionsPassed: 0,
                    assertionsFailed: 0,
                });
                continue;
            }

            let schema: object | undefined;
            if (!soap && data.responseSchemaFile) {
                try {
                    schema = loadSchema(data.responseSchemaFile);
                } catch (err: any) {
                    reporter.add({
                        testCase: testCase.name,
                        dataSet: data.name,
                        status: 'FAIL',
                        error: `Failed to load schema: ${err.message}`,
                        responseTimeMs: 0,
                        assertionsPassed: 0,
                        assertionsFailed: 0,
                    });
                    continue;
                }
            } else if (data.responseSchema) {
                schema = data.responseSchema;
            }

            let passed = 0, failed = 0;
            let status: 'PASS' | 'FAIL' = 'PASS';
            const allErrors: string[] = [];

            try {
                headers = injectVariableInHeaders(headers || {});
                console.log("Headers:", headers);
                const res = await axios({
                    url: fullUrl,
                    method: data.method.toLowerCase(),
                    headers,
                    data: body,
                });

                responseData = res.data;
                console.log("Response from server:", responseData);

                if (!soap && schema) {
                    const validate = ajv.compile(schema);
                    if (!validate(res.data)) {
                        failed++;
                        allErrors.push(`Schema validation failed: ${validate.errors?.map(e => `${e.instancePath} ${e.message}`).join('; ')}`);
                    }
                }

                // Run assertions
                for (const assertion of data.assertions || []) {
                    try {
                        if (soap) {
                            assertXPath(res.data, assertion);
                        } else {
                            assertJson(res.data, res.status, [assertion]);
                        }
                        passed++;
                    } catch (e: any) {
                        failed++;
                        allErrors.push(e.message);
                    }
                }

                // Variable storage
                if (data.store) {
                    try {
                        storeResponseVariables(res.data, data.store);
                    } catch (err: any) {
                        failed++;
                        allErrors.push(`Variable store failed: ${err.message}`);
                    }
                }

                if (failed > 0) status = 'FAIL';

            } catch (err: any) {
                if (axios.isAxiosError(err) && err.response) {
                    const res = err.response;
                    responseData = res.data;
                    console.log("Response from server",responseData)

                    for (const assertion of data.assertions || []) {
                        try {
                            if (soap) {
                                assertXPath(res.data, assertion);
                            } else {
                                assertJson(res.data, res.status, [assertion]);
                            }
                            passed++;
                        } catch (e: any) {
                            failed++;
                            allErrors.push(e.message);
                        }
                    }

                    if (data.store) {
                        try {
                            storeResponseVariables(res.data, data.store);
                        } catch (err: any) {
                            failed++;
                            allErrors.push(`Variable store failed: ${err.message}`);
                        }
                    }

                    if (failed > 0) status = 'FAIL';

                } else {
                    status = 'FAIL';
                    allErrors.push(`Request error: ${err.message}`);
                }
            } finally {
                const end = Date.now();
                reporter.add({
                    testCase: testCase.name,
                    dataSet: data.name,
                    status,
                    error: allErrors.length ? allErrors.join(' | ') : undefined,
                    assertionsPassed: passed,
                    assertionsFailed: failed,
                    responseTimeMs: end - start,
                    responseBody: status === 'FAIL' ? responseData : undefined,
                });
            }
        }
    }
}

export function injectVariableInHeaders(headers: Record<string, string>): Record<string, string> {
    const result: Record<string, string> = {};
    for (const [key, value] of Object.entries(headers)) {
        result[key] = injectVariables(value);
    }

    return result;
}
