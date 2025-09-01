export type Assertion = {
    type:
        | 'equals'
        | 'notEquals'
        | 'contains'
        | 'startsWith'
        | 'endsWith'
        | 'greaterThan'
        | 'lessThan'
        | 'in'
        | 'notIn'
        | 'includesAll'
        | 'length'
        | 'size'
        | 'statusCode'
        | 'type'
        | 'exists'
        | 'regex'
        | 'arrayObjectMatch';
    jsonPath: string;
    xpathExpression?: string;
    expected?: any;
    matchField?: string;
    matchValue?: string;
    assertField?: string;
};



export interface StoreMap {
    [variable: string]: string;
}

export interface TestData {
    name: string;
    method: string;
    endpoint: string;
    headers?: Record<string, string>;
    preProcess: any;
    body?: any;
    bodyFile?: string;
    assertions?: Assertion[];
    responseSchema?: any;
    responseSchemaFile?: string;
    store?: StoreMap;
}

export interface TestCase {
    name: string;
    status?: string;
    "type": "SOAP" | "REST" | "UI";
    testData: TestData[];
    testSteps: TestStep[];
}

export interface Tag {
    [key: string]: string;
}

// Locator options for basic locator refinement
export interface LocatorOptions {
    name?: string | RegExp;
    exact?: boolean;
    checked?: boolean;
    expanded?: boolean;
    pressed?: boolean;
    selected?: boolean;
    level?: number;
    hasText?: string | RegExp;
    hasNotText?: string | RegExp;
}

// Filter types for advanced locator filtering
export type FilterType = "hasText" | "has" | "hasNot";

// Filter definition matching Playwright's .filter() structure
export interface FilterDefinition {
    type: FilterType;
    value?: string; // For hasText type
    locator?: LocatorDefinition; // For has/hasNot types
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
        | "xpath";
    value: string;
    options?: LocatorOptions;
    filter?: FilterDefinition;
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
    | "dragAndDrop"
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
    | "screenshot"
    | "waitForSelector"
    | "waitForTimeout"
    | "waitForFunction";

// --- UI: TestStep ---
export interface TestStep {
    id: string;
    keyword: TestStepKeyword;
    target?: string; // fallback CSS/XPath selector
    locator?: LocatorDefinition;
    value?: string; // input text, URL, expected text, etc.
    options?: any; // extra options per keyword
    assertions?: Assertion[];
}


export interface TestSuite {
    suiteName: string;
    type: "UI"| "API";
    tags?: Tag[];
    baseUrl: string;
    testCases: TestCase[];
}

