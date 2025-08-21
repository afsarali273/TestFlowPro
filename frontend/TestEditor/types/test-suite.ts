export type Assertion = {
    type:
        | "equals"
        | "notEquals"
        | "contains"
        | "startsWith"
        | "endsWith"
        | "greaterThan"
        | "lessThan"
        | "in"
        | "notIn"
        | "includesAll"
        | "length"
        | "size"
        | "statusCode"
        | "type"
        | "exists"
        | "regex"
        | "arrayObjectMatch"
    jsonPath: string
    xpathExpression?: string
    expected?: any
    matchField?: string
    matchValue?: string
    assertField?: string
}

export interface StoreMap {
    [variable: string]: string
}

export interface TestData {
    name: string
    method: string
    endpoint: string
    headers?: Record<string, string>
    preProcess: any
    body?: any
    bodyFile?: string
    assertions?: Assertion[]
    responseSchema?: any
    responseSchemaFile?: string
    store?: StoreMap
}

export interface TestCase {
    name: string
    status?: string
    type: "SOAP" | "REST"
    testData: TestData[]
}

export interface Tag {
    [key: string]: string
}

export interface TestSuite {
    suiteName: string
    id?: string
    tags?: Tag[]
    baseUrl: string
    status?: string
    fileName?: string
    filePath?: string
    testCases: TestCase[]
}

export function validateTestSuite(suite: any): TestSuite {
    const validated: TestSuite = {
        suiteName: suite.suiteName || "",
        baseUrl: suite.baseUrl || "",
        tags: Array.isArray(suite.tags) ? suite.tags : [],
        testCases: Array.isArray(suite.testCases) ? suite.testCases.map(validateTestCase) : [],
    }

    return validated
}

export function validateTestCase(testCase: any): TestCase {
    const validated: TestCase = {
        name: testCase.name || "",
        status: testCase.status || "Not Started",
        type: testCase.type === "SOAP" ? "SOAP" : "REST",
        testData: Array.isArray(testCase.testData) ? testCase.testData.map(validateTestData) : [],
    }

    return validated
}

export function validateTestData(testData: any): TestData {
    const validated: TestData = {
        name: testData.name || "",
        method: testData.method || "GET",
        endpoint: testData.endpoint || "/",
        headers: testData.headers || {},
        preProcess: testData.preProcess || null,
        body: testData.body,
        bodyFile: testData.bodyFile,
        assertions: Array.isArray(testData.assertions) ? testData.assertions : [],
        responseSchema: testData.responseSchema,
        responseSchemaFile: testData.responseSchemaFile,
        store: testData.store || {},
    }

    return validated
}
