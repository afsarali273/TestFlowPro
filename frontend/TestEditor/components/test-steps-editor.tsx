"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Save, X, ArrowLeft } from "lucide-react"
import type { TestStep, TestStepKeyword, LocatorDefinition, LocatorOptions } from "@/types/test-suite"

interface TestStepsEditorProps {
    testStep: TestStep & { index?: number }
    onSave: (testStep: TestStep & { index?: number }) => void
    onCancel: () => void
}

export function TestStepsEditor({ testStep, onSave, onCancel }: TestStepsEditorProps) {
    const [editedTestStep, setEditedTestStep] = useState<TestStep & { index?: number }>(testStep)

    const handleTestStepChange = (field: keyof TestStep, value: any) => {
        setEditedTestStep((prev) => ({
            ...prev,
            [field]: value,
        }))
    }

    const handleLocatorChange = (field: keyof LocatorDefinition, value: any) => {
        setEditedTestStep((prev) => {
            let updatedLocator: LocatorDefinition = {
                ...(prev.locator || {}),
                [field]: value,
            } as LocatorDefinition

            // If strategy is being changed, ensure options object exists
            if (field === "strategy") {
                updatedLocator = {
                    ...updatedLocator,
                    value: prev.locator?.value || "",
                    options: prev.locator?.options || {},
                }
            }

            return {
                ...prev,
                locator: updatedLocator,
            }
        })
    }

    const handleLocatorOptionsChange = (field: keyof LocatorOptions, value: any) => {
        setEditedTestStep((prev) => ({
            ...prev,
            locator: {
                strategy: prev.locator?.strategy || "role",
                value: prev.locator?.value || "",
                ...prev.locator,
                options: {
                    ...(prev.locator?.options || {}),
                    [field]: value,
                },
            } as LocatorDefinition,
        }))
    }

    const handleOptionsChange = (field: string, value: any) => {
        setEditedTestStep((prev) => ({
            ...prev,
            options: {
                ...prev.options,
                [field]: value,
            },
        }))
    }

    const handleSave = () => {
        const cleanedStep = cleanStepForSerialization(editedTestStep)
        onSave({ ...cleanedStep, index: editedTestStep.index })
    }

    const keywordOptions = [
        // Browser Controls
        { value: "openBrowser", label: "Open Browser", requiresValue: false, requiresLocator: false, category: "Browser" },
        { value: "closeBrowser", label: "Close Browser", requiresValue: false, requiresLocator: false, category: "Browser" },
        { value: "closePage", label: "Close Page", requiresValue: false, requiresLocator: false, category: "Browser" },
        { value: "goto", label: "Go To URL", requiresValue: true, requiresLocator: false, category: "Navigation" },
        { value: "waitForNavigation", label: "Wait For Navigation", requiresValue: false, requiresLocator: false, category: "Navigation" },
        { value: "reload", label: "Reload Page", requiresValue: false, requiresLocator: false, category: "Navigation" },

        // Element Actions
        { value: "click", label: "Click", requiresValue: false, requiresLocator: true, category: "Actions" },
        { value: "dblClick", label: "Double Click", requiresValue: false, requiresLocator: true, category: "Actions" },
        { value: "type", label: "Type Text", requiresValue: true, requiresLocator: true, category: "Actions" },
        { value: "fill", label: "Fill Input", requiresValue: true, requiresLocator: true, category: "Actions" },
        { value: "press", label: "Press Key", requiresValue: true, requiresLocator: true, category: "Actions" },
        { value: "clear", label: "Clear Input", requiresValue: false, requiresLocator: true, category: "Actions" },
        { value: "select", label: "Select Option", requiresValue: true, requiresLocator: true, category: "Actions" },
        { value: "check", label: "Check Checkbox", requiresValue: false, requiresLocator: true, category: "Actions" },
        { value: "uncheck", label: "Uncheck Checkbox", requiresValue: false, requiresLocator: true, category: "Actions" },
        { value: "setChecked", label: "Set Checked State", requiresValue: true, requiresLocator: true, category: "Actions" },
        { value: "hover", label: "Hover", requiresValue: false, requiresLocator: true, category: "Actions" },
        { value: "focus", label: "Focus Element", requiresValue: false, requiresLocator: true, category: "Actions" },
        { value: "scrollIntoViewIfNeeded", label: "Scroll Into View", requiresValue: false, requiresLocator: true, category: "Actions" },
        { value: "dragAndDrop", label: "Drag and Drop", requiresValue: false, requiresLocator: true, category: "Actions" },

        // Wait Actions
        { value: "waitForSelector", label: "Wait For Selector", requiresValue: true, requiresLocator: false, category: "Wait" },
        { value: "waitForTimeout", label: "Wait For Timeout", requiresValue: true, requiresLocator: false, category: "Wait" },
        { value: "waitForFunction", label: "Wait For Function", requiresValue: true, requiresLocator: false, category: "Wait" },

        // Assertions
        { value: "assertText", label: "Assert Text", requiresValue: true, requiresLocator: true, category: "Assertions" },
        { value: "assertVisible", label: "Assert Visible", requiresValue: false, requiresLocator: true, category: "Assertions" },
        { value: "assertHidden", label: "Assert Hidden", requiresValue: false, requiresLocator: true, category: "Assertions" },
        { value: "assertEnabled", label: "Assert Enabled", requiresValue: false, requiresLocator: true, category: "Assertions" },
        { value: "assertDisabled", label: "Assert Disabled", requiresValue: false, requiresLocator: true, category: "Assertions" },
        { value: "assertCount", label: "Assert Count", requiresValue: true, requiresLocator: true, category: "Assertions" },
        { value: "assertValue", label: "Assert Value", requiresValue: true, requiresLocator: true, category: "Assertions" },
        { value: "assertAttribute", label: "Assert Attribute", requiresValue: true, requiresLocator: true, category: "Assertions" },

        // Utilities
        { value: "screenshot", label: "Take Screenshot", requiresValue: false, requiresLocator: false, category: "Utilities" },
        { value: "scrollTo", label: "Scroll To Position", requiresValue: true, requiresLocator: false, category: "Utilities" },
        { value: "scrollUp", label: "Scroll Up", requiresValue: false, requiresLocator: false, category: "Utilities" },
        { value: "scrollDown", label: "Scroll Down", requiresValue: false, requiresLocator: false, category: "Utilities" },
        { value: "maximize", label: "Maximize Window", requiresValue: false, requiresLocator: false, category: "Browser" },
        { value: "minimize", label: "Minimize Window", requiresValue: false, requiresLocator: false, category: "Browser" },
        { value: "setViewportSize", label: "Set Viewport Size", requiresValue: true, requiresLocator: false, category: "Browser" },
        { value: "goBack", label: "Go Back", requiresValue: false, requiresLocator: false, category: "Navigation" },
        { value: "goForward", label: "Go Forward", requiresValue: false, requiresLocator: false, category: "Navigation" },
        { value: "refresh", label: "Refresh Page", requiresValue: false, requiresLocator: false, category: "Navigation" },
        { value: "switchToFrame", label: "Switch To Frame", requiresValue: true, requiresLocator: false, category: "Browser" },
        { value: "switchToMainFrame", label: "Switch To Main Frame", requiresValue: false, requiresLocator: false, category: "Browser" },
        { value: "acceptAlert", label: "Accept Alert", requiresValue: false, requiresLocator: false, category: "Browser" },
        { value: "dismissAlert", label: "Dismiss Alert", requiresValue: false, requiresLocator: false, category: "Browser" },
        { value: "getAlertText", label: "Get Alert Text", requiresValue: false, requiresLocator: false, category: "Browser" },
        { value: "rightClick", label: "Right Click", requiresValue: false, requiresLocator: true, category: "Actions" },
        { value: "uploadFile", label: "Upload File", requiresValue: true, requiresLocator: true, category: "Actions" },
        { value: "downloadFile", label: "Download File", requiresValue: false, requiresLocator: true, category: "Actions" },
        { value: "getText", label: "Get Text", requiresValue: false, requiresLocator: true, category: "Utilities" },
        { value: "getAttribute", label: "Get Attribute", requiresValue: true, requiresLocator: true, category: "Utilities" },
        { value: "getTitle", label: "Get Page Title", requiresValue: false, requiresLocator: false, category: "Utilities" },
        { value: "getUrl", label: "Get Current URL", requiresValue: false, requiresLocator: false, category: "Utilities" },

        // Custom Functions
        { value: "customStep", label: "Custom Function", requiresValue: false, requiresLocator: false, category: "Custom" },
        { value: "customCode", label: "Raw Playwright Code", requiresValue: false, requiresLocator: false, category: "Custom" },
    ]

    const locatorStrategies = [
        { value: "role", label: "Role (button, link, textbox, etc.)" },
        { value: "label", label: "Label Text" },
        { value: "text", label: "Text Content" },
        { value: "placeholder", label: "Placeholder Text" },
        { value: "altText", label: "Alt Text" },
        { value: "title", label: "Title Attribute" },
        { value: "testId", label: "Test ID" },
        { value: "css", label: "CSS Selector" },
        { value: "xpath", label: "XPath" },
    ]

    // Helper function to clean step for JSON serialization
    const cleanStepForSerialization = (step: TestStep): TestStep => {
        const cleaned: any = {
            id: step.id,
            keyword: step.keyword,
        }

        // Only include fields that are needed for this keyword
        const keywordConfig = keywordOptions.find(k => k.value === step.keyword)

        if (keywordConfig?.requiresValue && step.value) {
            cleaned.value = step.value
        }

        if (keywordConfig?.requiresLocator && step.locator) {
            const cleanedLocator: any = {
                strategy: step.locator.strategy,
                value: step.locator.value,
            }

            // Only include options if they have values
            if (step.locator.options) {
                const cleanedOptions: any = {}
                Object.entries(step.locator.options).forEach(([key, value]) => {
                    if (value !== undefined && value !== null && value !== "") {
                        cleanedOptions[key] = value
                    }
                })
                if (Object.keys(cleanedOptions).length > 0) {
                    cleanedLocator.options = cleanedOptions
                }
            }

            // Include filter if present
            if (step.locator.filter) {
                cleanedLocator.filter = step.locator.filter
            }

            cleaned.locator = cleanedLocator
        }

        // Include customFunction for customStep keyword
        if (step.keyword === "customStep" && step.customFunction) {
            cleaned.customFunction = step.customFunction
        }

        // Include customCode for customCode keyword
        if (step.keyword === "customCode" && step.customCode) {
            cleaned.customCode = step.customCode
        }

        if (step.target) {
            cleaned.target = step.target
        }

        if (step.options && Object.keys(step.options).length > 0) {
            cleaned.options = step.options
        }

        // Include store for getText/getAttribute keywords
        if ((step.keyword === "getText" || step.keyword === "getAttribute") && step.store && Object.keys(step.store).length > 0) {
            cleaned.store = step.store
        }

        return cleaned
    }

    const selectedKeyword = keywordOptions.find((k) => k.value === editedTestStep.keyword)

    return (
        <div className="min-h-screen bg-gray-50 p-6 overflow-y-auto">
            <div className="max-w-6xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" onClick={onCancel}>
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back
                        </Button>
                        <h1 className="text-2xl font-bold">Edit Test Step</h1>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={onCancel}>
                            <X className="h-4 w-4 mr-2" />
                            Cancel
                        </Button>
                        <Button onClick={handleSave}>
                            <Save className="h-4 w-4 mr-2" />
                            Save Test Step
                        </Button>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Test Step Configuration</CardTitle>
                        <CardDescription>Configure the UI test step details</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 max-h-none overflow-visible">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="id">Step ID</Label>
                                <Input
                                    id="id"
                                    value={editedTestStep.id}
                                    onChange={(e) => handleTestStepChange("id", e.target.value)}
                                    placeholder="Enter step ID"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="keyword">Action</Label>
                                <Select
                                    value={editedTestStep.keyword}
                                    onValueChange={(value) => handleTestStepChange("keyword", value as TestStepKeyword)}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-80">
                                        {keywordOptions.map((option) => (
                                            <SelectItem key={option.value} value={option.value}>
                                                [{option.category}] {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {selectedKeyword?.requiresValue === true && (
                            <div className="space-y-2">
                                <Label htmlFor="value">Value</Label>
                                <Input
                                    id="value"
                                    value={editedTestStep.value || ""}
                                    onChange={(e) => handleTestStepChange("value", e.target.value)}
                                    placeholder={
                                        editedTestStep.keyword === "goto"
                                            ? "Enter URL"
                                            : editedTestStep.keyword === "type"
                                                ? "Enter text to type"
                                                : editedTestStep.keyword === "select"
                                                    ? "Enter option value to select"
                                                    : editedTestStep.keyword === "assertText"
                                                        ? "Enter expected text"
                                                        : editedTestStep.keyword === "waitForSelector"
                                                            ? "Enter selector"
                                                            : editedTestStep.keyword === "waitForTimeout"
                                                                ? "Enter time in ms"
                                                            : editedTestStep.keyword === "screenshot"
                                                                ? "Enter filename (optional)"
                                                                : "Enter value"
                                    }
                                />
                            </div>
                        )}

                        {selectedKeyword?.requiresLocator && (
                            <div className="space-y-4">
                                <Label>Element Locator</Label>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="locator-strategy">Strategy</Label>
                                        <Select
                                            value={editedTestStep.locator?.strategy || ""}
                                            onValueChange={(value) => handleLocatorChange("strategy", value)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select locator strategy" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {locatorStrategies.map((strategy) => (
                                                    <SelectItem key={strategy.value} value={strategy.value}>
                                                        {strategy.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="locator-value">Locator Value</Label>
                                        <Input
                                            id="locator-value"
                                            value={editedTestStep.locator?.value || ""}
                                            onChange={(e) => handleLocatorChange("value", e.target.value)}
                                            placeholder={
                                                editedTestStep.locator?.strategy === "role"
                                                    ? "button, link, textbox, heading, etc."
                                                    : editedTestStep.locator?.strategy === "label"
                                                        ? "Label text"
                                                        : editedTestStep.locator?.strategy === "text"
                                                            ? "Exact text content"
                                                            : editedTestStep.locator?.strategy === "placeholder"
                                                                ? "Placeholder text"
                                                                : editedTestStep.locator?.strategy === "altText"
                                                                    ? "Alt text value"
                                                                    : editedTestStep.locator?.strategy === "title"
                                                                        ? "Title attribute value"
                                                                        : editedTestStep.locator?.strategy === "testId"
                                                                            ? "Test ID value"
                                                                            : editedTestStep.locator?.strategy === "css"
                                                                                ? ".class, #id, element"
                                                                                : editedTestStep.locator?.strategy === "xpath"
                                                                                    ? "//div[@class='example']"
                                                                                    : "Enter locator value"
                                            }
                                        />
                                        {editedTestStep.locator?.strategy && (
                                            <div className="text-xs text-gray-500 mt-1">
                                                {editedTestStep.locator.strategy === "role" && "Examples: button, link, textbox, heading, listitem, option"}
                                                {editedTestStep.locator.strategy === "label" && "Example: 'Email address' or 'First name'"}
                                                {editedTestStep.locator.strategy === "text" && "Example: 'Sign up' or 'Welcome back'"}
                                                {editedTestStep.locator.strategy === "placeholder" && "Example: 'Enter your email'"}
                                                {editedTestStep.locator.strategy === "altText" && "Example: 'Company logo'"}
                                                {editedTestStep.locator.strategy === "title" && "Example: 'Close dialog'"}
                                                {editedTestStep.locator.strategy === "testId" && "Example: 'submit-button' or 'user-menu'"}
                                                {editedTestStep.locator.strategy === "css" && "Examples: '.btn-primary', '#submit', 'input[type=email]'"}
                                                {editedTestStep.locator.strategy === "xpath" && "Examples: '//button[text()=\"Submit\"]', '//div[@class=\"modal\"]'"}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Locator Options - Always show when locator is required */}
                                {selectedKeyword?.requiresLocator && (
                                    <div className="space-y-4 border-t pt-4 bg-gray-50 p-4 rounded-lg">
                                        <Label className="text-sm font-semibold text-gray-700">Locator Options (Optional)</Label>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="name" className="text-xs font-medium">Name</Label>
                                                <Input
                                                    id="name"
                                                    className="h-8 text-sm"
                                                    value={editedTestStep.locator?.options?.name?.toString() || ""}
                                                    onChange={(e) => handleLocatorOptionsChange("name", e.target.value)}
                                                    placeholder="Subscribe, /Welcome.*/, etc."
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="exact" className="text-xs font-medium">Exact Match</Label>
                                                <Select
                                                    value={editedTestStep.locator?.options?.exact?.toString() || ""}
                                                    onValueChange={(value) => handleLocatorOptionsChange("exact", value === "true" ? true : value === "false" ? false : undefined)}
                                                >
                                                    <SelectTrigger className="h-8 text-sm">
                                                        <SelectValue placeholder="Default" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="">Default</SelectItem>
                                                        <SelectItem value="true">True</SelectItem>
                                                        <SelectItem value="false">False</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                        
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                            <div className="space-y-2">
                                                <Label htmlFor="checked" className="text-xs font-medium">Checked</Label>
                                                <Select
                                                    value={editedTestStep.locator?.options?.checked?.toString() || ""}
                                                    onValueChange={(value) => handleLocatorOptionsChange("checked", value === "true" ? true : value === "false" ? false : undefined)}
                                                >
                                                    <SelectTrigger className="h-8 text-sm">
                                                        <SelectValue placeholder="Any" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="">Any</SelectItem>
                                                        <SelectItem value="true">Checked</SelectItem>
                                                        <SelectItem value="false">Unchecked</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="pressed" className="text-xs font-medium">Pressed</Label>
                                                <Select
                                                    value={editedTestStep.locator?.options?.pressed?.toString() || ""}
                                                    onValueChange={(value) => handleLocatorOptionsChange("pressed", value === "true" ? true : value === "false" ? false : undefined)}
                                                >
                                                    <SelectTrigger className="h-8 text-sm">
                                                        <SelectValue placeholder="Any" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="">Any</SelectItem>
                                                        <SelectItem value="true">Pressed</SelectItem>
                                                        <SelectItem value="false">Not Pressed</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="expanded" className="text-xs font-medium">Expanded</Label>
                                                <Select
                                                    value={editedTestStep.locator?.options?.expanded?.toString() || ""}
                                                    onValueChange={(value) => handleLocatorOptionsChange("expanded", value === "true" ? true : value === "false" ? false : undefined)}
                                                >
                                                    <SelectTrigger className="h-8 text-sm">
                                                        <SelectValue placeholder="Any" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="">Any</SelectItem>
                                                        <SelectItem value="true">Expanded</SelectItem>
                                                        <SelectItem value="false">Collapsed</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="selected" className="text-xs font-medium">Selected</Label>
                                                <Select
                                                    value={editedTestStep.locator?.options?.selected?.toString() || ""}
                                                    onValueChange={(value) => handleLocatorOptionsChange("selected", value === "true" ? true : value === "false" ? false : undefined)}
                                                >
                                                    <SelectTrigger className="h-8 text-sm">
                                                        <SelectValue placeholder="Any" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="">Any</SelectItem>
                                                        <SelectItem value="true">Selected</SelectItem>
                                                        <SelectItem value="false">Not Selected</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="level" className="text-xs font-medium">Level (for headings)</Label>
                                                <Select
                                                    value={editedTestStep.locator?.options?.level?.toString() || ""}
                                                    onValueChange={(value) => handleLocatorOptionsChange("level", value ? Number(value) : undefined)}
                                                >
                                                    <SelectTrigger className="h-8 text-sm">
                                                        <SelectValue placeholder="Any level" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="">Any level</SelectItem>
                                                        <SelectItem value="1">H1</SelectItem>
                                                        <SelectItem value="2">H2</SelectItem>
                                                        <SelectItem value="3">H3</SelectItem>
                                                        <SelectItem value="4">H4</SelectItem>
                                                        <SelectItem value="5">H5</SelectItem>
                                                        <SelectItem value="6">H6</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="hasText" className="text-xs font-medium">Has Text</Label>
                                                <Input
                                                    id="hasText"
                                                    className="h-8 text-sm"
                                                    value={editedTestStep.locator?.options?.hasText?.toString() || ""}
                                                    onChange={(e) => handleLocatorOptionsChange("hasText", e.target.value || undefined)}
                                                    placeholder="Text content or /regex/"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Custom Function Configuration */}
                        {editedTestStep.keyword === "customStep" && (
                            <div className="space-y-4 border-t pt-4 bg-gray-50 p-4 rounded-lg">
                                <Label className="text-sm font-semibold text-gray-700">Custom Function Configuration</Label>
                                
                                <div className="space-y-2">
                                    <Label htmlFor="custom-function">Function Name</Label>
                                    <Input
                                        id="custom-function"
                                        value={editedTestStep.customFunction?.function || ""}
                                        onChange={(e) => {
                                            setEditedTestStep(prev => ({
                                                ...prev,
                                                customFunction: {
                                                    ...prev.customFunction,
                                                    function: e.target.value
                                                }
                                            }))
                                        }}
                                        placeholder="loginUser, LoginPage.login, UserManagementPage.createUser"
                                    />
                                    <div className="text-xs text-gray-500">
                                        Examples: "loginUser", "LoginPage.login", "EcommercePage.addToCart"
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="custom-args">Arguments (JSON Array)</Label>
                                    <Input
                                        id="custom-args"
                                        value={editedTestStep.customFunction?.args ? JSON.stringify(editedTestStep.customFunction.args) : ""}
                                        onChange={(e) => {
                                            try {
                                                const args = e.target.value ? JSON.parse(e.target.value) : undefined
                                                setEditedTestStep(prev => ({
                                                    ...prev,
                                                    customFunction: {
                                                        ...prev.customFunction,
                                                        function: prev.customFunction?.function || "",
                                                        args
                                                    }
                                                }))
                                            } catch {
                                                // Invalid JSON, don't update
                                            }
                                        }}
                                        placeholder='["admin", "password123"] or [{"firstName": "John", "lastName": "Doe"}]'
                                    />
                                    <div className="text-xs text-gray-500">
                                        JSON array format: ["arg1", "arg2"] or [{'{ "key": "value" }'}]
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="custom-mapto">Variable Mapping (JSON Object)</Label>
                                    <Input
                                        id="custom-mapto"
                                        value={editedTestStep.customFunction?.mapTo ? JSON.stringify(editedTestStep.customFunction.mapTo) : ""}
                                        onChange={(e) => {
                                            try {
                                                const mapTo = e.target.value ? JSON.parse(e.target.value) : undefined
                                                setEditedTestStep(prev => ({
                                                    ...prev,
                                                    customFunction: {
                                                        ...prev.customFunction,
                                                        function: prev.customFunction?.function || "",
                                                        mapTo
                                                    }
                                                }))
                                            } catch {
                                                // Invalid JSON, don't update
                                            }
                                        }}
                                        placeholder='{"userId": "userId", "loginSuccess": "success"}'
                                    />
                                    <div className="text-xs text-gray-500">
                                        Maps function result to variables: {'{ "variableName": "resultProperty" }'}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Custom Code Configuration */}
                        {editedTestStep.keyword === "customCode" && (
                            <div className="space-y-4 border-t pt-4 bg-gray-50 p-4 rounded-lg">
                                <Label className="text-sm font-semibold text-gray-700">Raw Playwright Code</Label>
                                <div className="text-xs text-gray-600 mb-2">
                                    Write raw Playwright code. Available variables: page, browser, expect, console
                                </div>
                                
                                <div className="space-y-2">
                                    <Label htmlFor="custom-code">Playwright Code</Label>
                                    <Textarea
                                        id="custom-code"
                                        className="font-mono text-sm min-h-[200px]"
                                        value={editedTestStep.customCode || ""}
                                        onChange={(e) => handleTestStepChange("customCode", e.target.value)}
                                        placeholder={`// Example: Click multiple elements
await page.locator('.item').nth(0).click();
await page.locator('.item').nth(1).click();

// Example: Complex assertion
const count = await page.locator('.product').count();
expect(count).toBeGreaterThan(5);

// Example: Custom wait
await page.waitForFunction(() => {
  return document.querySelectorAll('.loaded').length > 3;
});`}
                                    />
                                </div>
                                
                                <div className="text-xs text-gray-500 space-y-1">
                                    <div>💡 <strong>Tips:</strong></div>
                                    <div>• Use <code>page</code> for page interactions</div>
                                    <div>• Use <code>expect</code> for assertions</div>
                                    <div>• Use <code>console.log()</code> for debugging</div>
                                    <div>• Code runs in async context - no need to wrap in async function</div>
                                </div>
                            </div>
                        )}

                        {/* Variable Storage Configuration */}
                        {(editedTestStep.keyword === "getText" || editedTestStep.keyword === "getAttribute") && (
                            <div className="space-y-4 border-t pt-4 bg-green-50 p-4 rounded-lg">
                                <Label className="text-sm font-semibold text-green-700">Variable Storage</Label>
                                <div className="text-xs text-green-600 mb-2">
                                    Store the extracted value in a variable for later use
                                </div>
                                
                                <div className="space-y-2">
                                    <Label htmlFor="store-variable">Variable Name</Label>
                                    <Input
                                        id="store-variable"
                                        value={editedTestStep.store ? Object.keys(editedTestStep.store)[0] || "" : ""}
                                        onChange={(e) => {
                                            const varName = e.target.value
                                            if (varName) {
                                                const path = editedTestStep.keyword === "getText" ? "$text" : "$attribute"
                                                setEditedTestStep(prev => ({
                                                    ...prev,
                                                    store: { [varName]: path }
                                                }))
                                            } else {
                                                setEditedTestStep(prev => ({
                                                    ...prev,
                                                    store: undefined
                                                }))
                                            }
                                        }}
                                        placeholder="pageTitle, userId, productName, etc."
                                    />
                                    <div className="text-xs text-green-600">
                                        Use this variable later with {"{{variableName}}"} syntax
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Special Options for Specific Keywords */}
                        {editedTestStep.keyword === "assertAttribute" && (
                            <div className="space-y-2">
                                <Label htmlFor="attribute">Attribute Name</Label>
                                <Input
                                    id="attribute"
                                    value={editedTestStep.options?.attribute || ""}
                                    onChange={(e) => handleOptionsChange("attribute", e.target.value)}
                                    placeholder="class, id, href, etc."
                                />
                            </div>
                        )}

                        {editedTestStep.keyword === "dragAndDrop" && (
                            <div className="space-y-2">
                                <Label htmlFor="target">Drop Target Selector</Label>
                                <Input
                                    id="target"
                                    value={editedTestStep.options?.target || ""}
                                    onChange={(e) => handleOptionsChange("target", e.target.value)}
                                    placeholder="CSS selector for drop target"
                                />
                            </div>
                        )}

                        <div className="bg-blue-50 p-4 rounded-lg">
                            <h4 className="font-medium text-blue-900 mb-2">Step Preview</h4>
                            <p className="text-blue-800 text-sm font-mono">
                                {(() => {
                                    const step = editedTestStep
                                    const locatorStr = step.locator ? `${step.locator.strategy}="${step.locator.value}"` : "[locator]"

                                    switch (step.keyword) {
                                        case "openBrowser": return "Open a new browser instance"
                                        case "closeBrowser": return "Close the browser"
                                        case "closePage": return "Close the current page"
                                        case "goto": return `Navigate to: ${step.value || "[URL]"}`
                                        case "waitForNavigation": return "Wait for page navigation"
                                        case "reload": return "Reload the current page"
                                        case "click": return `Click on element: ${locatorStr}`
                                        case "dblClick": return `Double click on element: ${locatorStr}`
                                        case "type":
                                        case "fill": return `Fill "${step.value || "[text]"}" into element: ${locatorStr}`
                                        case "press": return `Press key "${step.value || "[key]"}" on element: ${locatorStr}`
                                        case "clear": return `Clear element: ${locatorStr}`
                                        case "select": return `Select option "${step.value || "[option]"}" from element: ${locatorStr}`
                                        case "check": return `Check element: ${locatorStr}`
                                        case "uncheck": return `Uncheck element: ${locatorStr}`
                                        case "setChecked": return `Set checked state to "${step.value || "[true/false]"}" for element: ${locatorStr}`
                                        case "hover": return `Hover over element: ${locatorStr}`
                                        case "focus": return `Focus on element: ${locatorStr}`
                                        case "scrollIntoViewIfNeeded": return `Scroll element into view: ${locatorStr}`
                                        case "dragAndDrop": return `Drag element ${locatorStr} to ${step.options?.target || "[target]"}`
                                        case "assertText": return `Assert element contains text "${step.value || "[text]"}": ${locatorStr}`
                                        case "assertVisible": return `Assert element is visible: ${locatorStr}`
                                        case "assertHidden": return `Assert element is hidden: ${locatorStr}`
                                        case "assertEnabled": return `Assert element is enabled: ${locatorStr}`
                                        case "assertDisabled": return `Assert element is disabled: ${locatorStr}`
                                        case "assertCount": return `Assert element count is ${step.value || "[count]"}: ${locatorStr}`
                                        case "assertValue": return `Assert element value is "${step.value || "[value]"}": ${locatorStr}`
                                        case "assertAttribute": return `Assert element attribute "${step.options?.attribute || "[attr]"}" is "${step.value || "[value]"}": ${locatorStr}`
                                        case "waitForSelector": return `Wait for selector: ${step.value || "[selector]"}`
                                        case "waitForTimeout": return `Wait for ${step.value || "[ms]"}ms`
                                        case "waitForFunction": return `Wait for function: ${step.value || "[function]"}`
                                        case "screenshot": return `Take screenshot: ${step.value || "screenshot.png"}`
                                        case "scrollTo": return `Scroll to position: ${step.value || "[x,y]"}`
                                        case "scrollUp": return "Scroll up on the page"
                                        case "scrollDown": return "Scroll down on the page"
                                        case "maximize": return "Maximize browser window"
                                        case "minimize": return "Minimize browser window"
                                        case "setViewportSize": return `Set viewport size to: ${step.value || "[width,height]"}`
                                        case "goBack": return "Navigate back in browser history"
                                        case "goForward": return "Navigate forward in browser history"
                                        case "refresh": return "Refresh the current page"
                                        case "switchToFrame": return `Switch to frame: ${step.value || "[frame]"}`
                                        case "switchToMainFrame": return "Switch back to main frame"
                                        case "acceptAlert": return "Accept browser alert dialog"
                                        case "dismissAlert": return "Dismiss browser alert dialog"
                                        case "getAlertText": return "Get text from alert dialog"
                                        case "rightClick": return `Right click on element: ${locatorStr}`
                                        case "uploadFile": return `Upload file "${step.value || "[file path]"}" to element: ${locatorStr}`
                                        case "downloadFile": return `Download file from element: ${locatorStr}`
                                        case "getText": {
                                            const storeVar = step.store ? Object.keys(step.store)[0] : null
                                            return `Get text from element: ${locatorStr}${storeVar ? ` → store as {{${storeVar}}}` : ""}`
                                        }
                                        case "getAttribute": {
                                            const storeVar = step.store ? Object.keys(step.store)[0] : null
                                            return `Get attribute "${step.value || "[attribute]"}" from element: ${locatorStr}${storeVar ? ` → store as {{${storeVar}}}` : ""}`
                                        }
                                        case "getTitle": return "Get page title"
                                        case "getUrl": return "Get current page URL"
                                        case "customStep": return `Execute custom function: ${step.customFunction?.function || "[function]"}`
                                        case "customCode": return `Execute custom Playwright code: ${step.customCode ? step.customCode.substring(0, 50) + (step.customCode.length > 50 ? '...' : '') : "[code]"}`
                                        default: return `Execute ${step.keyword}`
                                    }
                                })()}
                            </p>

                            {/* JSON Preview */}
                            <div className="mt-3 pt-3 border-t border-blue-200">
                                <h5 className="text-xs font-medium text-blue-900 mb-1">JSON Output:</h5>
                                <pre className="text-xs text-blue-700 bg-blue-100 p-2 rounded overflow-x-auto">
                                    {JSON.stringify(cleanStepForSerialization(editedTestStep), null, 2)}
                                </pre>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
