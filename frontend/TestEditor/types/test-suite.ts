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

// Locator options for basic locator refinement
export interface LocatorOptions {
    name?: string | RegExp
    exact?: boolean
    checked?: boolean
    expanded?: boolean
    pressed?: boolean
    selected?: boolean
    level?: number
    hasText?: string | RegExp
    hasNotText?: string | RegExp
}

// Filter types for advanced locator filtering
export type FilterType = "hasText" | "has" | "hasNot"

// Filter definition matching Playwright's .filter() structure
export interface FilterDefinition {
    type: FilterType
    value?: string // For hasText type
    locator?: LocatorDefinition // For has/hasNot types
}

// Locator definition
export interface LocatorDefinition {
    strategy:
        | "role"
        | "label"
        | "text"
        | "placeholder"
        | "altText"
        | "title"
        | "testId"
        | "css"
        | "xpath"
    value: string
    options?: LocatorOptions
    filter?: FilterDefinition
}

// Custom step function interface
export interface CustomStepFunction {
    function: string
    args?: any[]
    mapTo?: { [variableName: string]: string }
}

// Supported UI actions
export type TestStepKeyword =
    | "openBrowser"
    | "closeBrowser"
    | "closePage"
    | "goto"
    | "waitForNavigation"
    | "reload"
    | "click"
    | "dblClick"
    | "rightClick"
    | "type"
    | "fill"
    | "press"
    | "clear"
    | "select"
    | "check"
    | "uncheck"
    | "setChecked"
    | "hover"
    | "focus"
    | "scrollIntoViewIfNeeded"
    | "scrollTo"
    | "scrollUp"
    | "scrollDown"
    | "dragAndDrop"
    | "uploadFile"
    | "downloadFile"
    | "getText"
    | "getAttribute"
    | "getTitle"
    | "getUrl"
    | "getValue"
    | "getCount"
    | "assertText"
    | "assertVisible"
    | "assertHidden"
    | "assertEnabled"
    | "assertDisabled"
    | "assertCount"
    | "assertValue"
    | "assertAttribute"
    | "assertHaveText"
    | "assertHaveCount"
    | "assertChecked"
    | "assertUnchecked"
    | "assertContainsText"
    | "assertUrl"
    | "assertTitle"
    | "screenshot"
    | "maximize"
    | "minimize"
    | "setViewportSize"
    | "goBack"
    | "goForward"
    | "refresh"
    | "switchToFrame"
    | "switchToMainFrame"
    | "acceptAlert"
    | "dismissAlert"
    | "getAlertText"
    | "waitForSelector"
    | "waitForTimeout"
    | "waitForFunction"
    | "waitForElement"
    | "waitForText"
    | "customStep"
    | "customCode"

export interface TestStep {
    id: string
    keyword: TestStepKeyword
    target?: string // fallback CSS/XPath selector
    locator?: LocatorDefinition
    value?: string // input text, URL, expected text, etc.
    options?: any // extra options per keyword
    assertions?: Assertion[]
    customFunction?: CustomStepFunction // for customStep keyword
    customCode?: string // raw Playwright code for customCode keyword
    store?: StoreMap // store variables from UI elements
    skipOnFailure?: boolean // skip this step if any previous step failed
}

export interface TestCase {
    id?: string
    name: string
    status?: string
    type: "SOAP" | "REST" | "UI"
    priority?: number
    dependsOn?: string[]
    testData: TestData[]
    testSteps: TestStep[]
}

export interface Tag {
    [key: string]: string
}

export interface TestSuite {
    id: string
    suiteName: string
    applicationName: string
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
        applicationName: suite.applicationName || "",
        type: suite.type === "UI" ? "UI" : "API",
        baseUrl: suite.baseUrl || "",
        tags: Array.isArray(suite.tags) ? suite.tags : [],
        testCases: Array.isArray(suite.testCases) ? suite.testCases.map(validateTestCase) : [],
    }

    return validated
}

export function validateTestCase(testCase: any): TestCase {
    const validated: TestCase = {
        id: testCase.id,
        name: testCase.name || "",
        status: testCase.status || "Not Started",
        type: testCase.type === "SOAP" ? "SOAP" : testCase.type === "UI" ? "UI" : "REST",
        priority: testCase.priority,
        dependsOn: Array.isArray(testCase.dependsOn) ? testCase.dependsOn : undefined,
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
                options: testStep.locator.options,
                filter: testStep.locator.filter,
            }
            : undefined,
        value: testStep.value,
        options: testStep.options,
        assertions: Array.isArray(testStep.assertions) ? testStep.assertions : [],
        customFunction: testStep.customFunction,
        customCode: testStep.customCode,
        store: testStep.store || {},
        skipOnFailure: testStep.skipOnFailure || false,
    }

    return validated
}
