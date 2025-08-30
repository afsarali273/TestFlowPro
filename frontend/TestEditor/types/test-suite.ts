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

export interface TestStep {
    id: string
    keyword:
        | "openBrowser"
        | "goto"
        | "click"
        | "type"
        | "select"
        | "waitFor"
        | "assertText"
        | "assertVisible"
        | "screenshot"
    target?: string // for CSS/XPath
    locator?: {
        strategy: "role" | "label" | "text" | "placeholder" | "altText" | "testId" | "css"
        value: string
    }
    value?: string // input text, url, expected text, etc.
    assertions?: Assertion[]
}

export interface TestCase {
    name: string
    status?: string
    type: "SOAP" | "REST" | "UI"
    testData: TestData[]
    testSteps: TestStep[]
}

export interface Tag {
    [key: string]: string
}

export interface TestSuite {
    id: string
    suiteName: string
    type?: "UI" | "API"
    tags?: Tag[]
    baseUrl: string
    testCases: TestCase[]
    status?: string
    fileName?: string
    filePath?: string
}

export function validateTestSuite(suite: any): TestSuite {
    const validated: TestSuite = {
        id: suite.id || "",
        suiteName: suite.suiteName || "",
        type: suite.type === "UI" ? "UI" : "API",
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
        type: testCase.type === "SOAP" ? "SOAP" : testCase.type === "UI" ? "UI" : "REST",
        testData: Array.isArray(testCase.testData) ? testCase.testData.map(validateTestData) : [],
        testSteps: Array.isArray(testCase.testSteps) ? testCase.testSteps.map(validateTestStep) : [],
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

export function validateTestStep(testStep: any): TestStep {
    const validated: TestStep = {
        id: testStep.id || "",
        keyword: testStep.keyword || "click",
        target: testStep.target,
        locator: testStep.locator
            ? {
                strategy: testStep.locator.strategy || "css",
                value: testStep.locator.value || "",
            }
            : undefined,
        value: testStep.value,
        assertions: Array.isArray(testStep.assertions) ? testStep.assertions : [],
    }

    return validated
}
