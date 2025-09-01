import { chromium, Browser, Page, Locator, expect } from "@playwright/test";
import { TestStep, TestCase, LocatorDefinition, FilterDefinition } from "./types";
import { Reporter } from "./reporter";

export class UIRunner {
    private browser!: Browser;
    private page!: Page;

    constructor(private reporter: Reporter) {}

    async init(launchOptions: any = { headless: false }) {
        this.browser = await chromium.launch(launchOptions);
        this.page = await this.browser.newPage();
    }

    async runTestCase(testCase: TestCase) {
        if (testCase.type !== "UI" || !testCase.testSteps) {
            throw new Error(`Invalid UI test case: ${testCase.name}`);
        }

        console.log(`🚀 Running UI TestCase: ${testCase.name}`);
        let passed = 0;
        let failed = 0;
        const allErrors: string[] = [];
        const start = Date.now();

        for (const step of testCase.testSteps) {
            try {
                await this.runTestStep(step);
                passed++;
            } catch (err: any) {
                failed++;
                allErrors.push(`Step ${step.id} (${step.keyword}): ${err.message || err.toString()}`);
                console.error(`❌ Error in step ${step.id}:`, err);
            }
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
        });
    }

    async runTestStep(step: TestStep) {
        console.log(`➡️ Step: ${step.keyword}`, step);
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
                await this.page.goto(step.value);
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
                await locator.fill(step.value);
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
            case "scrollIntoViewIfNeeded":
                if (!locator) throw new Error("scrollIntoViewIfNeeded requires a locator");
                await locator.scrollIntoViewIfNeeded();
                break;
            case "dragAndDrop":
                if (!locator) throw new Error("dragAndDrop requires a locator");
                if (!step.options?.target) throw new Error("dragAndDrop requires options.target");
                await locator.dragTo(step.options.target);
                break;
            case "assertText":
                if (!locator) throw new Error("assertText requires a locator");
                if (!step.value) throw new Error("assertText requires expected text");
                await expect(locator).toHaveText(step.value);
                break;
            case "assertVisible":
                if (!locator) throw new Error("assertVisible requires a locator");
                await expect(locator).toBeVisible();
                break;
            case "assertHidden":
                if (!locator) throw new Error("assertHidden requires a locator");
                await expect(locator).toBeHidden();
                break;
            case "assertEnabled":
                if (!locator) throw new Error("assertEnabled requires a locator");
                await expect(locator).toBeEnabled();
                break;
            case "assertDisabled":
                if (!locator) throw new Error("assertDisabled requires a locator");
                await expect(locator).toBeDisabled();
                break;
            case "assertCount":
                if (!locator) throw new Error("assertCount requires a locator");
                if (!step.value) throw new Error("assertCount requires expected count");
                await expect(locator).toHaveCount(Number(step.value));
                break;
            case "assertValue":
                if (!locator) throw new Error("assertValue requires a locator");
                if (!step.value) throw new Error("assertValue requires expected value");
                await expect(locator).toHaveValue(step.value);
                break;
            case "assertAttribute":
                if (!locator) throw new Error("assertAttribute requires a locator");
                if (!step.options?.attribute || step.value === undefined) throw new Error("assertAttribute requires attribute and expected value");
                await expect(locator).toHaveAttribute(step.options.attribute, step.value);
                break;
            case "assertHaveText":
                if (!locator) throw new Error("assertHaveText requires a locator");
                if (!step.value) throw new Error("assertHaveText requires expected text");
                await expect(locator).toHaveText(step.value);
                break;
            case "assertHaveCount":
                if (!locator) throw new Error("assertHaveCount requires a locator");
                if (!step.value) throw new Error("assertHaveCount requires expected count");
                await expect(locator).toHaveCount(Number(step.value));
                break;
            case "screenshot":
                await this.page.screenshot({ path: step.value || 'screenshot.png' });
                break;
            default:
                throw new Error(`Unknown keyword: ${step.keyword}`);
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
