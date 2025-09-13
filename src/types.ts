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
    jsonPath?: string;
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
    id?: string;
    name: string;
    status?: string;
    "type": "SOAP" | "REST" | "UI";
    testData: TestData[];
    testSteps: TestStep[];
    dependsOn?: string[]; // Array of test case names this test depends on
    priority?: number; // Lower number = higher priority (executes first)
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
  | "waitForEvent"
  | "clickAndWaitForPopup"
  | "switchToTab";

// Custom step function definition
export interface CustomStepFunction {
    function: string; // Function name to execute
    args?: any[]; // Arguments to pass to function
    mapTo?: { [key: string]: string }; // Map return values to variables
}

// --- UI: TestStep ---
export interface TestStep {
    id: string;
    keyword: TestStepKeyword;
    target?: string; // fallback CSS/XPath selector
    locator?: LocatorDefinition;
    value?: string; // input text, URL, expected text, etc.
    options?: any; // extra options per keyword
    assertions?: Assertion[];
    customFunction?: CustomStepFunction; // For customStep keyword
    customCode?: string; // Raw Playwright code for customCode keyword
    store?: StoreMap; // Store variables from UI elements
    skipOnFailure?: boolean; // Skip this step if any previous step failed
}


export interface TestSuite {
    id: string;
    suiteName: string;
    applicationName: string;
    type: "UI"| "API";
    tags?: Tag[];
    baseUrl: string;
    testCases: TestCase[];
}

