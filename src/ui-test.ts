import { chromium, Browser, Page, Locator, expect } from "@playwright/test";
import { TestStep, TestCase } from "./types";
import { Reporter } from "./reporter";

export class UIRunner {
    private browser!: Browser;
    private page!: Page;

    constructor(private reporter: Reporter) {}

    async init() {
        this.browser = await chromium.launch({ headless: false });
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
                await this.runStep(step);
                passed++;
            } catch (err: any) {
                failed++;
                // ✅ capture full Playwright error stack if available
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

    private async runStep(step: TestStep) {
        console.log(`➡️ Step: ${step.keyword}`, step);

        switch (step.keyword) {
            case "openBrowser":
                // already handled in init
                break;

            case "goto":
                if (!step.value) throw new Error("goto requires a URL in value");
                await this.page.goto(step.value);
                break;

            case "click":
                await (await this.resolveLocator(step)).click();
                break;

            case "type":
                if (!step.value) throw new Error("type requires value");
                await (await this.resolveLocator(step)).fill(step.value);
                break;

            case "select":
                if (!step.value) throw new Error("select requires option value");
                await (await this.resolveLocator(step)).selectOption(step.value);
                break;

            case "waitFor":
                if (!step.value) throw new Error("waitFor requires selector or time");
                if (/^\d+$/.test(step.value)) {
                    await this.page.waitForTimeout(Number(step.value));
                } else {
                    await this.page.waitForSelector(step.value);
                }
                break;

            case "assertText": {
                if (!step.value) throw new Error("assertText requires expected text");
                const locator = await this.resolveLocator(step);
                // ✅ Use Playwright's expect
                await expect(locator).toHaveText(step.value, { timeout: 5000 });
                break;
            }

            case "assertVisible": {
                const locator = await this.resolveLocator(step);
                await expect(locator).toBeVisible({ timeout: 5000 });
                break;
            }

            case "screenshot":
                await this.page.screenshot({ path: step.value || "screenshot.png" });
                break;

            default:
                throw new Error(`Unknown keyword: ${step.keyword}`);
        }
    }

    private async resolveLocator(step: TestStep): Promise<Locator> {
        if (step.locator) {
            const { strategy, value } = step.locator;
            switch (strategy) {
                case "role": return this.page.getByRole(value as any);
                case "label": return this.page.getByLabel(value);
                case "text": return this.page.getByText(value);
                case "placeholder": return this.page.getByPlaceholder(value);
                case "altText": return this.page.getByAltText(value);
                case "testId": return this.page.getByTestId(value);
                case "css": return this.page.locator(value);
                default: throw new Error(`Unknown locator strategy: ${strategy}`);
            }
        } else if (step.target) {
            return this.page.locator(step.target);
        }
        throw new Error(`Step requires locator or target: ${step.keyword}`);
    }

    async close() {
        await this.browser.close();
    }
}
