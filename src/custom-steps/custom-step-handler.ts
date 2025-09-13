import { Page } from 'playwright';
import { CustomStepFunction } from '../types';
import { setVariable, getVariable, injectVariables } from '../utils/variableStore';

export class CustomStepHandler {
    private customFunctions: Map<string, Function> = new Map();
    private pageObjects: Map<string, any> = new Map();

    constructor() {
        this.registerBuiltInFunctions();
    }

    /**
     * Register a custom function that can be called from test steps
     */
    registerFunction(name: string, func: Function): void {
        this.customFunctions.set(name, func);
    }

    /**
     * Register a page object class that contains multiple methods
     */
    registerPageObject(name: string, pageObjectClass: any): void {
        this.pageObjects.set(name, pageObjectClass);
    }

    /**
     * Execute a custom step function
     */
    async executeCustomStep(
        page: Page,
        customFunction: CustomStepFunction
    ): Promise<any> {
        const { function: functionName, args = [], mapTo } = customFunction;

        // Check if it's a page object method (format: "PageObject.method")
        if (functionName.includes('.')) {
            return await this.executePageObjectMethod(page, functionName, args, mapTo);
        }

        // Execute standalone custom function
        return await this.executeStandaloneFunction(page, functionName, args, mapTo);
    }

    /**
     * Execute a page object method
     */
    private async executePageObjectMethod(
        page: Page,
        functionName: string,
        args: any[],
        mapTo?: { [key: string]: string }
    ): Promise<any> {
        const [pageObjectName, methodName] = functionName.split('.');
        
        const PageObjectClass = this.pageObjects.get(pageObjectName);
        if (!PageObjectClass) {
            throw new Error(`Page object '${pageObjectName}' not found. Available: ${Array.from(this.pageObjects.keys()).join(', ')}`);
        }

        // Instantiate page object with page instance
        const pageObject = new PageObjectClass(page);
        
        if (typeof pageObject[methodName] !== 'function') {
            throw new Error(`Method '${methodName}' not found in page object '${pageObjectName}'`);
        }

        // Replace variables in arguments
        const processedArgs = this.processArguments(args);

        // Execute the method
        const result = await pageObject[methodName](...processedArgs);

        // Store results if mapTo is provided
        if (mapTo && result) {
            this.storeResults(result, mapTo);
        }

        return result;
    }

    /**
     * Execute a standalone custom function
     */
    private async executeStandaloneFunction(
        page: Page,
        functionName: string,
        args: any[],
        mapTo?: { [key: string]: string }
    ): Promise<any> {
        const func = this.customFunctions.get(functionName);
        if (!func) {
            throw new Error(`Custom function '${functionName}' not found. Available: ${Array.from(this.customFunctions.keys()).join(', ')}`);
        }

        // Replace variables in arguments
        const processedArgs = this.processArguments(args);

        // Execute function with page as first argument
        const result = await func(page, ...processedArgs);

        // Store results if mapTo is provided
        if (mapTo && result) {
            this.storeResults(result, mapTo);
        }

        return result;
    }

    /**
     * Process arguments by replacing variables with length validation
     */
    private processArguments(args: any[]): any[] {
        const MAX_ARG_LENGTH = 10000; // Prevent context overflow
        
        return args.map(arg => {
            if (typeof arg === 'string') {
                const injected = injectVariables(arg);
                // Truncate if too long
                if (injected.length > MAX_ARG_LENGTH) {
                    console.warn(`Argument truncated from ${injected.length} to ${MAX_ARG_LENGTH} characters`);
                    return injected.substring(0, MAX_ARG_LENGTH) + '...[truncated]';
                }
                return injected;
            }
            return arg;
        });
    }

    /**
     * Store function results in variable store with size limits
     */
    private storeResults(result: any, mapTo: { [key: string]: string }): void {
        const MAX_VARIABLE_SIZE = 5000; // Limit variable size
        
        if (typeof result === 'object' && result !== null) {
            // Map object properties to variables
            Object.entries(mapTo).forEach(([variableName, propertyPath]) => {
                let value = this.getNestedProperty(result, propertyPath);
                if (value !== undefined) {
                    // Truncate large values
                    if (typeof value === 'string' && value.length > MAX_VARIABLE_SIZE) {
                        value = value.substring(0, MAX_VARIABLE_SIZE) + '...[truncated]';
                        console.warn(`Variable '${variableName}' truncated to ${MAX_VARIABLE_SIZE} characters`);
                    }
                    setVariable(variableName, value);
                }
            });
        } else {
            // Single value result - use first mapTo entry
            const firstEntry = Object.entries(mapTo)[0];
            if (firstEntry) {
                let value = result;
                if (typeof value === 'string' && value.length > MAX_VARIABLE_SIZE) {
                    value = value.substring(0, MAX_VARIABLE_SIZE) + '...[truncated]';
                    console.warn(`Variable '${firstEntry[0]}' truncated to ${MAX_VARIABLE_SIZE} characters`);
                }
                setVariable(firstEntry[0], value);
            }
        }
    }

    /**
     * Get nested property from object using dot notation
     */
    private getNestedProperty(obj: any, path: string): any {
        return path.split('.').reduce((current, key) => current?.[key], obj);
    }

    /**
     * Register built-in custom functions
     */
    private registerBuiltInFunctions(): void {
        // Example: Login helper function
        this.registerFunction('loginUser', async (page: Page, username: string, password: string) => {
            await page.fill('[data-testid="username"]', username);
            await page.fill('[data-testid="password"]', password);
            await page.click('[data-testid="login-button"]');
            await page.waitForSelector('[data-testid="dashboard"]');
            return { success: true, timestamp: Date.now() };
        });

        // Example: Complex form filling
        this.registerFunction('fillUserForm', async (page: Page, userData: any) => {
            await page.fill('[name="firstName"]', userData.firstName);
            await page.fill('[name="lastName"]', userData.lastName);
            await page.fill('[name="email"]', userData.email);
            await page.selectOption('[name="country"]', userData.country);
            return { formId: await page.getAttribute('[data-form-id]', 'data-form-id') };
        });

        // Example: Wait for API response
        this.registerFunction('waitForApiResponse', async (page: Page, apiEndpoint: string, timeout: number = 5000) => {
            const response = await page.waitForResponse(
                response => response.url().includes(apiEndpoint) && response.status() === 200,
                { timeout }
            );
            const data = await response.json();
            return { responseData: data, status: response.status() };
        });

        // Example: Extract table data
        this.registerFunction('extractTableData', async (page: Page, tableSelector: string) => {
            const rows = await page.$$eval(`${tableSelector} tbody tr`, rows => 
                rows.map(row => {
                    const cells = row.querySelectorAll('td');
                    return Array.from(cells).map(cell => cell.textContent?.trim());
                })
            );
            return { tableData: rows, rowCount: rows.length };
        });
    }
}

// Export singleton instance
export const customStepHandler = new CustomStepHandler();