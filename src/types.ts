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

// --- UI: TestStep ---
export interface TestStep {
    id: string;
    keyword:
        | "openBrowser"
        | "goto"
        | "click"
        | "type"
        | "select"
        | "waitFor"
        | "assertText"
        | "assertVisible"
        | "screenshot";
    target?: string;  // for CSS/XPath
    locator?: {
        strategy: "role" | "label" | "text" | "placeholder" | "altText" | "testId" | "css";
        value: string;
    };
    value?: string;  // input text, url, expected text, etc.
    assertions?: Assertion[];
}


export interface TestSuite {
    suiteName: string;
    type: "UI"| "API";
    tags?: Tag[];
    baseUrl: string;
    testCases: TestCase[];
}

