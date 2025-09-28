import { chromium, Browser, Page, Locator, expect } from "@playwright/test";
import { TestStep, TestCase, LocatorDefinition, FilterDefinition } from "./types";
import { Reporter } from "./reporter";
import { setVariable, setLocalVariable, injectVariables } from "./utils/variableStore";

export class UIRunner {
    private browser!: Browser;
    private page!: Page;

    constructor(private reporter: Reporter) {}

    async init(launchOptions: any = { headless: false }) {
        this.browser = await chromium.launch(launchOptions);
        this.page = await this.browser.newPage();
        this.page.setDefaultTimeout(3000);
    }

    async runTestCase(testCase: TestCase) {
        if (testCase.type !== "UI" || !testCase.testSteps) {
            throw new Error(`Invalid UI test case: ${testCase.name}`);
        }

        console.log(`🚀 Running UI TestCase: ${testCase.name}`);
        let passed = 0;
        let failed = 0;
        let hasFailure = false;
        const allErrors: string[] = [];
        const stepResults: any[] = [];
        const start = Date.now();

        for (const step of testCase.testSteps) {
            // Skip step if previous step failed and this step has skipOnFailure enabled
            if (hasFailure && step.skipOnFailure) {
                console.log(`⏭️ Skipping Step ${step.id}: ${step.keyword} (previous step failed)`);
                stepResults.push({
                    stepId: step.id,
                    keyword: step.keyword,
                    locator: step.locator,
                    value: step.value,
                    status: 'SKIPPED',
                    error: 'Skipped due to previous step failure',
                    executionTimeMs: 0,
                    timestamp: new Date().toISOString()
                });
                continue;
            }
            const stepStart = Date.now();
            let stepStatus = 'PASS';
            let stepError: string | undefined;
            let screenshotPath: string | undefined;
            
            try {
                console.log(`➡️ Executing Step ${step.id}: ${step.keyword}`);
                await this.runTestStepWithRetry(step);
                passed++;
                console.log(`✅ Step ${step.id} passed`);
            } catch (err: any) {
                failed++;
                hasFailure = true;
                stepStatus = 'FAIL';
                stepError = err.message || err.toString();
                allErrors.push(`Step ${step.id} (${step.keyword}): ${stepError}`);
                console.error(`❌ Step ${step.id} failed:`, stepError);
                
                // Capture screenshot on failure
                try {
                    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                    screenshotPath = `screenshots/failed-${testCase.name.replace(/\s+/g, '_')}-${step.id}-${timestamp}.png`;
                    await this.page.screenshot({ 
                        path: screenshotPath,
                        fullPage: true 
                    });
                    console.log(`📷 Screenshot saved: ${screenshotPath}`);
                } catch (screenshotErr) {
                    console.warn(`Failed to capture screenshot: ${screenshotErr}`);
                }
            }
            
            const stepEnd = Date.now();
            stepResults.push({
                stepId: step.id,
                keyword: step.keyword,
                locator: step.locator,
                value: step.value,
                status: stepStatus,
                error: stepError,
                screenshotPath: screenshotPath,
                executionTimeMs: stepEnd - stepStart,
                timestamp: new Date().toISOString()
            });
        }

        const end = Date.now();
        this.reporter.add({
            testCase: testCase.name,
            dataSet: "UI Steps",
            status: failed > 0 ? "FAIL" : "PASS",
            error: allErrors.length ? allErrors.join(" | ") : undefined,
            assertionsPassed: passed,
            assertionsFailed: failed,
            responseTimeMs: end - start,
            stepResults: stepResults // Add detailed step results
        });
    }

    async runTestStepWithRetry(step: TestStep, maxRetries: number = 2, retryDelay: number = 2000) {
        let lastError: Error | undefined;
        
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                if (attempt > 0) {
                    console.log(`🔄 Retry attempt ${attempt}/${maxRetries} for step ${step.id}`);
                    await this.page.waitForTimeout(retryDelay);
                }
                await this.runTestStep(step);
                return; // Success, exit retry loop
            } catch (error: any) {
                lastError = error;
                if (attempt === maxRetries) {
                    throw error; // Final attempt failed
                }
                console.log(`⚠️ Step ${step.id} failed (attempt ${attempt + 1}), retrying...`);
            }
        }
    }

    async runTestStep(step: TestStep) {
        const locator = step.locator ? await this.resolveLocator(step) : step.target ? this.page.locator(step.target) : undefined;
        await this.executeKeyword(step, locator);
    }



    private async executeKeyword(step: TestStep, locator?: Locator) {
        switch (step.keyword) {
            case "openBrowser":
                break; // already handled in init
            case "closeBrowser":
                await this.browser.close();
                break;
            case "closePage":
                await this.page.close();
                break;
            case "goto":
                if (!step.value) throw new Error("goto requires URL");
                const url = injectVariables(step.value);
                await this.page.goto(url);
                break;
            case "waitForNavigation":
                await this.page.waitForNavigation(step.options);
                break;
            case "reload":
                await this.page.reload(step.options);
                break;
            case "waitForTimeout":
                if (!step.value) throw new Error("waitForTimeout requires milliseconds");
                await this.page.waitForTimeout(Number(step.value));
                break;
            case "waitForSelector":
                if (!step.value) throw new Error("waitForSelector requires selector");
                await this.page.waitForSelector(step.value, step.options);
                break;
            case "waitForFunction":
                if (!step.value) throw new Error("waitForFunction requires function");
                await this.page.waitForFunction(step.value, step.options);
                break;
            case "click":
                if (!locator) throw new Error("click requires a locator");
                await locator.click(step.options);
                break;
            case "dblClick":
                if (!locator) throw new Error("dblClick requires a locator");
                await locator.dblclick(step.options);
                break;
            case "fill":
            case "type":
                if (!locator) throw new Error(`${step.keyword} requires a locator`);
                if (!step.value) throw new Error(`${step.keyword} requires a value`);
                const fillValue = injectVariables(step.value);
                await locator.fill(fillValue);
                break;
            case "press":
                if (!locator) throw new Error("press requires a locator");
                if (!step.value) throw new Error("press requires key value");
                await locator.press(step.value);
                break;
            case "clear":
                if (!locator) throw new Error("clear requires a locator");
                await locator.fill('');
                break;
            case "select":
            case "selectOption":
                if (!locator) throw new Error("select requires a locator");
                if (!step.value) throw new Error("select requires option value");
                await locator.selectOption(step.value);
                break;
            case "check":
                if (!locator) throw new Error("check requires a locator");
                await locator.check();
                break;
            case "uncheck":
                if (!locator) throw new Error("uncheck requires a locator");
                await locator.uncheck();
                break;
            case "setChecked":
                if (!locator) throw new Error("setChecked requires a locator");
                await locator.setChecked(Boolean(step.value));
                break;
            case "hover":
                if (!locator) throw new Error("hover requires a locator");
                await locator.hover();
                break;
            case "focus":
                if (!locator) throw new Error("focus requires a locator");
                await locator.focus();
                break;
            case "screenshot":
                const stepScreenshotPath = step.value || `screenshots/step-${step.id}-${Date.now()}.png`;
                await this.page.screenshot({ path: stepScreenshotPath, fullPage: true });
                console.log(`📷 Screenshot saved: ${stepScreenshotPath}`);
                break;
            case "assertVisible":
                if (!locator) throw new Error("assertVisible requires a locator");
                await expect(locator).toBeVisible();
                break;
            case "assertHidden":
                if (!locator) throw new Error("assertHidden requires a locator");
                await expect(locator).toBeHidden();
                break;

            case "assertCount":
                if (!locator) throw new Error("assertCount requires a locator");
                if (!step.value) throw new Error("assertCount requires expected count");
                await expect(locator).toHaveCount(Number(step.value));
                break;
            case "assertChecked":
                if (!locator) throw new Error("assertChecked requires a locator");
                await expect(locator).toBeChecked();
                break;
            case "waitForElement":
                if (!locator) throw new Error("waitForElement requires a locator");
                await locator.waitFor({ state: 'visible' });
                break;
            case "scrollIntoViewIfNeeded":
                if (!locator) throw new Error("scrollIntoViewIfNeeded requires a locator");
                await locator.scrollIntoViewIfNeeded();
                break;
            case "dragAndDrop":
                if (!locator) throw new Error("dragAndDrop requires a locator");
                if (!step.options?.target) throw new Error("dragAndDrop requires options.target");
                await locator.dragTo(step.options.target);
                break;
            case "rightClick":
                if (!locator) throw new Error("rightClick requires a locator");
                await locator.click({ button: 'right' });
                break;
            case "scrollTo":
                if (!locator) throw new Error("scrollTo requires a locator");
                await locator.scrollIntoViewIfNeeded();
                break;
            case "scrollUp":
                await this.page.keyboard.press('PageUp');
                break;
            case "scrollDown":
                await this.page.keyboard.press('PageDown');
                break;
            case "uploadFile":
                if (!locator) throw new Error("uploadFile requires a locator");
                if (!step.value) throw new Error("uploadFile requires file path in value");
                await locator.setInputFiles(step.value);
                break;
            case "downloadFile":
                // Start waiting for download before clicking
                const downloadPromise = this.page.waitForEvent('download');
                if (locator) {
                    await locator.click();
                }
                const download = await downloadPromise;
                if (step.value) {
                    await download.saveAs(step.value);
                }
                break;
            case "clickAndWaitForPopup":
                if (!locator) throw new Error("clickAndWaitForPopup requires a locator");
                const popupPromise = this.page.waitForEvent('popup');
                await locator.click();
                const newPage = await popupPromise;
                this.page = newPage; // Switch to new tab
                console.log(`📝 Clicked and switched to new tab/popup`);
                break;
            case "switchToTab":
                if (!step.value) throw new Error("switchToTab requires tab index (0 for first tab)");
                const pages = this.browser.contexts()[0].pages();
                const tabIndex = parseInt(step.value);
                if (tabIndex >= 0 && tabIndex < pages.length) {
                    this.page = pages[tabIndex];
                    console.log(`📝 Switched to tab ${tabIndex}`);
                } else {
                    throw new Error(`Tab index ${tabIndex} not found`);
                }
                break;
            case "getText":
                if (!locator) throw new Error("getText requires a locator");
                const text = await locator.textContent();
                if (step.store) {
                    for (const [varName, path] of Object.entries(step.store)) {
                        if (path === "$text") {
                            setVariable(varName, text);
                            console.log(`📝 Stored global variable '${varName}' = '${text}'`);
                        }
                    }
                }
                if (step.localStore) {
                    for (const [varName, path] of Object.entries(step.localStore)) {
                        if (path === "$text") {
                            setLocalVariable(varName, text);
                            console.log(`📝 Stored local variable '${varName}' = '${text}'`);
                        }
                    }
                }
                break;
            case "getAttribute":
                if (!locator) throw new Error("getAttribute requires a locator");
                if (!step.value) throw new Error("getAttribute requires attribute name in value field");
                const attrValue = await locator.getAttribute(step.value);
                if (step.store) {
                    for (const [varName, path] of Object.entries(step.store)) {
                        if (path === "$attribute") {
                            setVariable(varName, attrValue);
                            console.log(`📝 Stored global variable '${varName}' = '${attrValue}'`);
                        }
                    }
                }
                if (step.localStore) {
                    for (const [varName, path] of Object.entries(step.localStore)) {
                        if (path === "$attribute") {
                            setLocalVariable(varName, attrValue);
                            console.log(`📝 Stored local variable '${varName}' = '${attrValue}'`);
                        }
                    }
                }
                break;
            case "getTitle":
                const title = await this.page.title();
                if (step.store) {
                    for (const [varName, path] of Object.entries(step.store)) {
                        if (path === "$title") {
                            setVariable(varName, title);
                            console.log(`📝 Stored global variable '${varName}' = '${title}'`);
                        }
                    }
                }
                if (step.localStore) {
                    for (const [varName, path] of Object.entries(step.localStore)) {
                        if (path === "$title") {
                            setLocalVariable(varName, title);
                            console.log(`📝 Stored local variable '${varName}' = '${title}'`);
                        }
                    }
                }
                break;
            case "getUrl":
                const currentUrl = this.page.url();
                if (step.store) {
                    for (const [varName, path] of Object.entries(step.store)) {
                        if (path === "$url") {
                            setVariable(varName, currentUrl);
                            console.log(`📝 Stored global variable '${varName}' = '${currentUrl}'`);
                        }
                    }
                }
                if (step.localStore) {
                    for (const [varName, path] of Object.entries(step.localStore)) {
                        if (path === "$url") {
                            setLocalVariable(varName, currentUrl);
                            console.log(`📝 Stored local variable '${varName}' = '${currentUrl}'`);
                        }
                    }
                }
                break;
            case "getValue":
                if (!locator) throw new Error("getValue requires a locator");
                const inputValue = await locator.inputValue();
                if (step.store) {
                    for (const [varName, path] of Object.entries(step.store)) {
                        if (path === "$value") {
                            setVariable(varName, inputValue);
                            console.log(`📝 Stored global variable '${varName}' = '${inputValue}'`);
                        }
                    }
                }
                if (step.localStore) {
                    for (const [varName, path] of Object.entries(step.localStore)) {
                        if (path === "$value") {
                            setLocalVariable(varName, inputValue);
                            console.log(`📝 Stored local variable '${varName}' = '${inputValue}'`);
                        }
                    }
                }
                break;
            case "getCount":
                if (!locator) throw new Error("getCount requires a locator");
                const count = await locator.count();
                if (step.store) {
                    for (const [varName, path] of Object.entries(step.store)) {
                        if (path === "$count") {
                            setVariable(varName, count.toString());
                            console.log(`📝 Stored global variable '${varName}' = '${count}'`);
                        }
                    }
                }
                if (step.localStore) {
                    for (const [varName, path] of Object.entries(step.localStore)) {
                        if (path === "$count") {
                            setLocalVariable(varName, count.toString());
                            console.log(`📝 Stored local variable '${varName}' = '${count}'`);
                        }
                    }
                }
                break;
            case "assertText":
                if (!locator) throw new Error("assertText requires a locator");
                if (!step.value) throw new Error("assertText requires expected text");
                const expectedText = injectVariables(step.value);
                await expect(locator).toHaveText(expectedText);
                break;

            case "assertEnabled":
                if (!locator) throw new Error("assertEnabled requires a locator");
                await expect(locator).toBeEnabled();
                break;
            case "assertDisabled":
                if (!locator) throw new Error("assertDisabled requires a locator");
                await expect(locator).toBeDisabled();
                break;
            case "assertValue":
                if (!locator) throw new Error("assertValue requires a locator");
                if (!step.value) throw new Error("assertValue requires expected value");
                const expectedValue = injectVariables(step.value);
                await expect(locator).toHaveValue(expectedValue);
                break;
            case "assertAttribute":
                if (!locator) throw new Error("assertAttribute requires a locator");
                if (!step.value) throw new Error("assertAttribute requires attribute:value format");
                const [attrName, expectedAttrValue] = step.value.split(':');
                await expect(locator).toHaveAttribute(attrName, expectedAttrValue);
                break;
            case "assertHaveText":
                if (!locator) throw new Error("assertHaveText requires a locator");
                if (!step.value) throw new Error("assertHaveText requires expected text");
                const expectedHaveText = injectVariables(step.value);
                await expect(locator).toHaveText(expectedHaveText);
                break;
            case "assertHaveCount":
                if (!locator) throw new Error("assertHaveCount requires a locator");
                if (!step.value) throw new Error("assertHaveCount requires expected count");
                await expect(locator).toHaveCount(Number(step.value));
                break;

            case "assertUnchecked":
                if (!locator) throw new Error("assertUnchecked requires a locator");
                await expect(locator).not.toBeChecked();
                break;
            case "assertContainsText":
                if (!locator) throw new Error("assertContainsText requires a locator");
                if (!step.value) throw new Error("assertContainsText requires expected text");
                const expectedContainsText = injectVariables(step.value);
                await expect(locator).toContainText(expectedContainsText);
                break;
            case "assertUrl":
                if (!step.value) throw new Error("assertUrl requires expected URL");
                const expectedUrl = injectVariables(step.value);
                await expect(this.page).toHaveURL(expectedUrl);
                break;
            case "assertTitle":
                if (!step.value) throw new Error("assertTitle requires expected title");
                const expectedTitle = injectVariables(step.value);
                await expect(this.page).toHaveTitle(expectedTitle);
                break;

            case "maximize":
                await this.page.setViewportSize({ width: 1920, height: 1080 });
                break;
            case "minimize":
                await this.page.setViewportSize({ width: 800, height: 600 });
                break;
            case "setViewportSize":
                if (!step.options?.width || !step.options?.height) {
                    throw new Error("setViewportSize requires options.width and options.height");
                }
                await this.page.setViewportSize({ 
                    width: step.options.width, 
                    height: step.options.height 
                });
                break;
            case "goBack":
                await this.page.goBack();
                break;
            case "goForward":
                await this.page.goForward();
                break;
            case "refresh":
                await this.page.reload();
                break;
            case "switchToFrame":
                if (!step.value) throw new Error("switchToFrame requires frame selector");
                const frame = this.page.frame(step.value);
                if (!frame) throw new Error(`Frame not found: ${step.value}`);
                // Note: Playwright handles frames differently, this is for reference
                break;
            case "switchToMainFrame":
                // In Playwright, you work with the main page by default
                break;
            case "acceptAlert":
                this.page.on('dialog', dialog => dialog.accept());
                break;
            case "dismissAlert":
                this.page.on('dialog', dialog => dialog.dismiss());
                break;
            case "getAlertText":
                // This would need to be handled with page.on('dialog') event listener
                console.log("getAlertText: Use page.on('dialog') event listener for alert text");
                break;
            case "waitForText":
                if (!step.value) throw new Error("waitForText requires text to wait for");
                await this.page.waitForFunction(
                    text => document.body.textContent?.includes(text),
                    step.value
                );
                break;
            case "waitForEvent":
                if (!step.value) throw new Error("waitForEvent requires event type");
                if (step.value === "popup") {
                    const popupPromise = this.page.waitForEvent('popup');
                    if (step.store) {
                        const popup = await popupPromise;
                        for (const [varName, path] of Object.entries(step.store)) {
                            if (path === "$popup") {
                                // Store popup page reference for later use
                                this.page = popup; // Switch context to new tab
                                console.log(`📝 Switched to new tab/popup`);
                            }
                        }
                    }
                }
                break;
            case "customCode":
                if (!step.customCode) throw new Error("customCode requires code");
                await this.executeCustomCode(step.customCode);
                break;
            default:
                throw new Error(`Unknown keyword: ${step.keyword}`);
        }
    }

    private async executeCustomCode(code: string) {
        try {
            // Create context with available variables
            const context = {
                page: this.page,
                browser: this.browser,
                expect,
                console
            };
            
            // Wrap code in async function and execute
            const asyncFunction = new Function('page', 'browser', 'expect', 'console', `
                return (async () => {
                    ${code}
                })();
            `);
            
            await asyncFunction(context.page, context.browser, context.expect, context.console);
        } catch (error: any) {
            // Enhanced error message with context
            const errorMessage = error.message || error.toString();
            const customCodeError = `Custom code execution failed: ${errorMessage}`;
            
            // If it's a Playwright error, extract key information
            if (errorMessage.includes('locator.') || errorMessage.includes('expect(')) {
                throw new Error(`${customCodeError}\n\nCode:\n${code.trim()}`);
            }
            
            // For other JavaScript errors
            throw new Error(`${customCodeError}\n\nCode:\n${code.trim()}`);
        }
    }

    private async resolveLocator(step: TestStep): Promise<Locator> {
        if (!step.locator) throw new Error(`Step requires locator or target: ${step.keyword}`);

        const createLocator = (loc: LocatorDefinition): Locator => {
            let base: Locator;

            switch (loc.strategy) {
                case "role":
                    base = this.page.getByRole(loc.value as any, loc.options);
                    break;
                case "label":
                    base = this.page.getByLabel(loc.value, loc.options);
                    break;
                case "text":
                    base = this.page.getByText(loc.value, loc.options);
                    break;
                case "placeholder":
                    base = this.page.getByPlaceholder(loc.value, loc.options);
                    break;
                case "altText":
                    base = this.page.getByAltText(loc.value, loc.options);
                    break;
                case "title":
                    base = this.page.getByTitle(loc.value, loc.options);
                    break;
                case "testId":
                    base = this.page.getByTestId(loc.value);
                    break;
                case "css":
                    base = this.page.locator(loc.value);
                    // Handle .first() for CSS selectors that had :first-child removed
                    if (loc.value && !loc.value.includes(':') && !loc.value.includes('[')) {
                        base = base.first();
                    }
                    break;
                case "xpath":
                    base = this.page.locator(`xpath=${loc.value}`);
                    break;
                default:
                    throw new Error(`Unknown locator strategy: ${loc.strategy}`);
            }

            if (loc.filter) {
                base = this.applyFilter(base, loc.filter, createLocator);
            }

            return base;
        };

        return createLocator(step.locator);
    }

    private applyFilter(baseLocator: Locator, filter: FilterDefinition, createLocator: (loc: LocatorDefinition) => Locator): Locator {
        switch (filter.type) {
            case "hasText":
                if (!filter.value) throw new Error("hasText filter requires value");
                return baseLocator.filter({ hasText: filter.value });
            case "has":
                if (!filter.locator) throw new Error("has filter requires locator");
                return baseLocator.filter({ has: createLocator(filter.locator) });
            case "hasNot":
                if (!filter.locator) throw new Error("hasNot filter requires locator");
                return baseLocator.filter({ hasNot: createLocator(filter.locator) });
            default:
                throw new Error(`Unknown filter type: ${filter.type}`);
        }
    }

    async close() {
        await this.browser.close();
    }
}
