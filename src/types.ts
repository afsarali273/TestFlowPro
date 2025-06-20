export interface Assertion {
    type: 'equals' | 'notEquals' | 'contains' | 'size' | 'statusCode' | 'type' | 'exists' | 'regex';
    jsonPath?: string;
    expected?: any;
}


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
    testData: TestData[];
}

export interface Tag {
    [key: string]: string;
}

export interface TestSuite {
    suiteName: string;
    tags?: Tag[];
    baseUrl?: string;
    testCases: TestCase[];
}

