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
import {UIRunner} from "./ui-test";

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

    console.log(`Running Suite: ${suite.suiteName}`);

    if(suite?.type === 'UI'){
        await runUITests(suite, reporter);
    }else {
        await runAPITests(suite, reporter);
    }
}

export async function runUITests(suite: TestSuite, reporter: Reporter) {
    const runner = new UIRunner(reporter);
    const orderedTestCases = resolveDependencies(suite.testCases);
    const executedTestCases = new Set<string>();
    const failedTestCases = new Set<string>();
    
    for (const testCase of orderedTestCases) {
        console.log(`  TestCase: ${testCase.name}`);
        
        // Check if dependencies are satisfied
        if (testCase.dependsOn) {
            const unsatisfiedDeps = testCase.dependsOn.filter((dep: string) => !executedTestCases.has(dep));
            const failedDeps = testCase.dependsOn.filter((dep: string) => failedTestCases.has(dep));
            
            if (unsatisfiedDeps.length > 0 || failedDeps.length > 0) {
                const errorMsg = unsatisfiedDeps.length > 0 ? 
                    `Unsatisfied dependencies: ${unsatisfiedDeps.join(', ')}` :
                    `Dependent test cases failed: ${failedDeps.join(', ')}`;
                    
                console.log(`❌ Skipping ${testCase.name} - ${errorMsg}`);
                reporter.add({
                    testCase: testCase.name,
                    dataSet: 'UI Steps',
                    status: 'FAIL',
                    error: errorMsg,
                    responseTimeMs: 0,
                    assertionsPassed: 0,
                    assertionsFailed: 1,
                });
                failedTestCases.add(testCase.name);
                continue;
            }
            
            console.log(`✅ Dependencies satisfied for ${testCase.name}: ${testCase.dependsOn.join(', ')}`);
        }
        
        try {
            await runner.init();
            await runner.runTestCase(testCase);
            await runner.close();
            executedTestCases.add(testCase.name);
            console.log(`✅ UI test case ${testCase.name} completed successfully`);
        } catch (error) {
            failedTestCases.add(testCase.name);
            console.log(`❌ UI test case ${testCase.name} failed - dependent tests will be skipped`);
            await runner.close();
        }
    }
}


export async function runAPITests(suite: TestSuite, reporter: Reporter){
    const env = loadEnvironment();
    const resolvedBaseUrl = env[suite.baseUrl] || suite.baseUrl || env.BASE_URL || '';
    
    // Sort test cases by dependencies and priority
    const orderedTestCases = resolveDependencies(suite.testCases);
    const executedTestCases = new Set<string>();
    const failedTestCases = new Set<string>();
    
    for (const testCase of orderedTestCases) {
        console.log(`  TestCase: ${testCase.name}`);
        
        // Check if dependencies are satisfied
        if (testCase.dependsOn) {
            const unsatisfiedDeps = testCase.dependsOn.filter((dep: string) => !executedTestCases.has(dep));
            const failedDeps = testCase.dependsOn.filter((dep: string) => failedTestCases.has(dep));
            
            if (unsatisfiedDeps.length > 0) {
                console.log(`⏸️ Skipping ${testCase.name} - waiting for dependencies: ${unsatisfiedDeps.join(', ')}`);
                reporter.add({
                    testCase: testCase.name,
                    dataSet: 'Dependency Check',
                    status: 'FAIL',
                    error: `Unsatisfied dependencies: ${unsatisfiedDeps.join(', ')}`,
                    responseTimeMs: 0,
                    assertionsPassed: 0,
                    assertionsFailed: 1,
                });
                failedTestCases.add(testCase.name);
                continue;
            }
            
            if (failedDeps.length > 0) {
                console.log(`❌ Skipping ${testCase.name} - dependent test cases failed: ${failedDeps.join(', ')}`);
                reporter.add({
                    testCase: testCase.name,
                    dataSet: 'Dependency Check',
                    status: 'FAIL',
                    error: `Dependent test cases failed: ${failedDeps.join(', ')}`,
                    responseTimeMs: 0,
                    assertionsPassed: 0,
                    assertionsFailed: 1,
                });
                failedTestCases.add(testCase.name);
                continue;
            }
            
            console.log(`✅ Dependencies satisfied for ${testCase.name}: ${testCase.dependsOn.join(', ')}`);
        }

        let testCaseFailed = false;
        
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
            const apiDetails: any = {
                method: data.method,
                endpoint: data.endpoint,
                fullUrl: fullUrl,
                requestHeaders: headers,
                requestBody: body,
                responseStatus: null,
                responseHeaders: null,
                responseBody: null,
                executionTimeMs: 0,
                assertions: [],
                variableStorage: null
            };

            try {
                headers = injectVariableInHeaders(headers || {});
                apiDetails.requestHeaders = headers;
                console.log("Headers:", headers);
                
                console.log(`➡️ Executing HTTP ${data.method} request to ${fullUrl}`);
                
                const res = await axios({
                    url: fullUrl,
                    method: data.method.toLowerCase(),
                    headers,
                    data: body,
                });

                responseData = res.data;
                apiDetails.responseStatus = res.status;
                apiDetails.responseHeaders = res.headers;
                apiDetails.responseBody = responseData;
                
                console.log(`✅ Request completed with status ${res.status}`);
                console.log("Response from server:");
                console.log(JSON.stringify(responseData, null, 2));

                if (!soap && schema) {
                    console.log(`➡️ Validating response schema...`);
                    const validate = ajv.compile(schema);
                    
                    if (!validate(res.data)) {
                        failed++;
                        const schemaError = `Schema validation failed: ${validate.errors?.map(e => `${e.instancePath} ${e.message}`).join('; ')}`;
                        allErrors.push(schemaError);
                        console.log(`❌ Schema validation failed`);
                        apiDetails.schemaValidation = { status: 'FAIL', error: schemaError };
                    } else {
                        console.log(`✅ Schema validation passed`);
                        apiDetails.schemaValidation = { status: 'PASS' };
                    }
                }

                // Run assertions
                for (const assertion of data.assertions || []) {
                    const assertionDesc = `${assertion.type} assertion (${assertion.jsonPath || assertion.xpathExpression || 'N/A'})`;
                    console.log(`➡️ Running ${assertionDesc}`);
                    
                    try {
                        if (soap) {
                            assertXPath(res.data, assertion);
                        } else {
                            assertJson(res.data, res.status, [assertion]);
                        }
                        passed++;
                        console.log(`✅ ${assertionDesc} passed`);
                        
                        apiDetails.assertions.push({
                            type: assertion.type,
                            jsonPath: assertion.jsonPath || assertion.xpathExpression,
                            expected: assertion.expected,
                            status: 'PASS'
                        });
                    } catch (e: any) {
                        failed++;
                        allErrors.push(e.message);
                        console.log(`❌ ${assertionDesc} failed: ${e.message}`);
                        
                        apiDetails.assertions.push({
                            type: assertion.type,
                            jsonPath: assertion.jsonPath || assertion.xpathExpression,
                            expected: assertion.expected,
                            status: 'FAIL',
                            error: e.message
                        });
                    }
                }

                // Variable storage
                if (data.store) {
                    console.log(`➡️ Storing response variables...`);
                    
                    try {
                        storeResponseVariables(res.data, data.store);
                        console.log(`✅ Variables stored successfully`);
                        
                        apiDetails.variableStorage = {
                            variables: Object.keys(data.store),
                            status: 'PASS'
                        };
                    } catch (err: any) {
                        failed++;
                        const storeError = `Variable store failed: ${err.message}`;
                        allErrors.push(storeError);
                        console.log(`❌ Variable storage failed: ${err.message}`);
                        
                        apiDetails.variableStorage = {
                            variables: Object.keys(data.store),
                            status: 'FAIL',
                            error: storeError
                        };
                    }
                }

                if (failed > 0) status = 'FAIL';

            } catch (err: any) {
                if (axios.isAxiosError(err) && err.response) {
                    const res = err.response;
                    responseData = res.data;
                    apiDetails.responseStatus = res.status;
                    apiDetails.responseHeaders = res.headers;
                    apiDetails.responseBody = responseData;
                    
                    console.log(`⚠️ Request failed with status ${res.status}`);
                    console.log("Response from server:");
                    console.log(JSON.stringify(responseData, null, 2));

                    // Still run assertions on error response
                    for (const assertion of data.assertions || []) {
                        const assertionDesc = `${assertion.type} assertion (${assertion.jsonPath || assertion.xpathExpression || 'N/A'})`;
                        console.log(`➡️ Running ${assertionDesc} on error response`);
                        
                        try {
                            if (soap) {
                                assertXPath(res.data, assertion);
                            } else {
                                assertJson(res.data, res.status, [assertion]);
                            }
                            passed++;
                            console.log(`✅ ${assertionDesc} passed`);
                            
                            apiDetails.assertions.push({
                                type: assertion.type,
                                jsonPath: assertion.jsonPath || assertion.xpathExpression,
                                expected: assertion.expected,
                                status: 'PASS'
                            });
                        } catch (e: any) {
                            failed++;
                            allErrors.push(e.message);
                            console.log(`❌ ${assertionDesc} failed: ${e.message}`);
                            
                            apiDetails.assertions.push({
                                type: assertion.type,
                                jsonPath: assertion.jsonPath || assertion.xpathExpression,
                                expected: assertion.expected,
                                status: 'FAIL',
                                error: e.message
                            });
                        }
                    }

                    if (data.store) {
                        console.log(`➡️ Storing variables from error response...`);
                        
                        try {
                            storeResponseVariables(res.data, data.store);
                            console.log(`✅ Variables stored from error response`);
                            
                            apiDetails.variableStorage = {
                                variables: Object.keys(data.store),
                                status: 'PASS'
                            };
                        } catch (err: any) {
                            failed++;
                            const storeError = `Variable store failed: ${err.message}`;
                            allErrors.push(storeError);
                            console.log(`❌ Variable storage failed: ${err.message}`);
                            
                            apiDetails.variableStorage = {
                                variables: Object.keys(data.store),
                                status: 'FAIL',
                                error: storeError
                            };
                        }
                    }

                    if (failed > 0) status = 'FAIL';

                } else {
                    status = 'FAIL';
                    const requestError = `Request error: ${err.message}`;
                    allErrors.push(requestError);
                    console.log(`❌ Request completely failed: ${err.message}`);
                    apiDetails.requestError = requestError;
                }
            } finally {
                const end = Date.now();
                apiDetails.executionTimeMs = end - start;
                
                reporter.add({
                    testCase: testCase.name,
                    dataSet: data.name,
                    status,
                    error: allErrors.length ? allErrors.join(' | ') : undefined,
                    assertionsPassed: passed,
                    assertionsFailed: failed,
                    responseTimeMs: end - start,
                    responseBody: status === 'FAIL' ? responseData : undefined,
                    apiDetails: apiDetails // Add API-specific details
                });
                
                if (status === 'FAIL') {
                    testCaseFailed = true;
                }
            }
        }
        
        // Mark test case as executed or failed
        if (testCaseFailed) {
            failedTestCases.add(testCase.name);
            console.log(`❌ Test case ${testCase.name} failed - dependent tests will be skipped`);
        } else {
            executedTestCases.add(testCase.name);
            console.log(`✅ Test case ${testCase.name} completed successfully`);
        }
    }
}

// Dependency resolution function
function resolveDependencies(testCases: any[]): any[] {
    const testCaseMap = new Map(testCases.map(tc => [tc.name, tc]));
    const visited = new Set<string>();
    const visiting = new Set<string>();
    const result: any[] = [];
    
    function visit(testCaseName: string) {
        if (visiting.has(testCaseName)) {
            throw new Error(`Circular dependency detected involving: ${testCaseName}`);
        }
        
        if (visited.has(testCaseName)) {
            return;
        }
        
        const testCase = testCaseMap.get(testCaseName);
        if (!testCase) {
            throw new Error(`Test case not found: ${testCaseName}`);
        }
        
        visiting.add(testCaseName);
        
        // Visit dependencies first
        if (testCase.dependsOn) {
            for (const dep of testCase.dependsOn) {
                visit(dep);
            }
        }
        
        visiting.delete(testCaseName);
        visited.add(testCaseName);
        result.push(testCase);
    }
    
    // Sort by priority first (lower number = higher priority)
    const sortedByPriority = [...testCases].sort((a, b) => (a.priority || 999) - (b.priority || 999));
    
    // Visit all test cases to resolve dependencies
    for (const testCase of sortedByPriority) {
        if (!visited.has(testCase.name)) {
            visit(testCase.name);
        }
    }
    
    console.log(`🔄 Test execution order: ${result.map(tc => tc.name).join(' → ')}`);
    return result;
}

export function injectVariableInHeaders(headers: Record<string, string>): Record<string, string> {
    const result: Record<string, string> = {};
    for (const [key, value] of Object.entries(headers)) {
        result[key] = injectVariables(value);
    }

    return result;
}
