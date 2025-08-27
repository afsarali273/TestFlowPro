"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Save, X, ArrowLeft } from "lucide-react"
import type { TestStep } from "@/types/test-suite"

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

    const handleLocatorChange = (field: "strategy" | "value", value: string) => {
        setEditedTestStep((prev) => ({
            ...prev,
            locator: {
                strategy: prev.locator?.strategy || "role",
                value: prev.locator?.value || "",
                [field]: value,
            } as { strategy: "role" | "label" | "text" | "placeholder" | "altText" | "testId" | "css"; value: string },
        }))
    }

    const handleSave = () => {
        onSave(editedTestStep)
    }

    const keywordOptions = [
        { value: "openBrowser", label: "Open Browser", requiresValue: false, requiresLocator: false },
        { value: "goto", label: "Go To URL", requiresValue: true, requiresLocator: false },
        { value: "click", label: "Click Element", requiresValue: false, requiresLocator: true },
        { value: "type", label: "Type Text", requiresValue: true, requiresLocator: true },
        { value: "select", label: "Select Option", requiresValue: true, requiresLocator: true },
        { value: "waitFor", label: "Wait For", requiresValue: true, requiresLocator: false },
        { value: "assertText", label: "Assert Text", requiresValue: true, requiresLocator: true },
        { value: "assertVisible", label: "Assert Visible", requiresValue: false, requiresLocator: true },
        { value: "screenshot", label: "Take Screenshot", requiresValue: true, requiresLocator: false },
    ]

    const locatorStrategies = [
        { value: "role", label: "Role (button, link, textbox, etc.)" },
        { value: "label", label: "Label Text" },
        { value: "text", label: "Text Content" },
        { value: "placeholder", label: "Placeholder Text" },
        { value: "altText", label: "Alt Text" },
        { value: "testId", label: "Test ID" },
        { value: "css", label: "CSS Selector" },
    ]

    const selectedKeyword = keywordOptions.find((k) => k.value === editedTestStep.keyword)

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-4xl mx-auto">
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
                    <CardContent className="space-y-6">
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
                                    onValueChange={(value) => handleTestStepChange("keyword", value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {keywordOptions.map((option) => (
                                            <SelectItem key={option.value} value={option.value}>
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {selectedKeyword?.requiresValue && (
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
                                                        : editedTestStep.keyword === "waitFor"
                                                            ? "Enter selector or time in ms"
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
                                                    ? "button, link, textbox, etc."
                                                    : editedTestStep.locator?.strategy === "label"
                                                        ? "Label text"
                                                        : editedTestStep.locator?.strategy === "text"
                                                            ? "Exact text content"
                                                            : editedTestStep.locator?.strategy === "placeholder"
                                                                ? "Placeholder text"
                                                                : editedTestStep.locator?.strategy === "altText"
                                                                    ? "Alt text value"
                                                                    : editedTestStep.locator?.strategy === "testId"
                                                                        ? "Test ID value"
                                                                        : editedTestStep.locator?.strategy === "css"
                                                                            ? ".class, #id, element"
                                                                            : "Enter locator value"
                                            }
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="bg-blue-50 p-4 rounded-lg">
                            <h4 className="font-medium text-blue-900 mb-2">Step Preview</h4>
                            <p className="text-blue-800 text-sm">
                                {editedTestStep.keyword === "openBrowser" && "Open a new browser instance"}
                                {editedTestStep.keyword === "goto" && `Navigate to: ${editedTestStep.value || "[URL]"}`}
                                {editedTestStep.keyword === "click" &&
                                    `Click on element: ${editedTestStep.locator?.strategy || "[strategy]"} = "${editedTestStep.locator?.value || "[value]"}"`}
                                {editedTestStep.keyword === "type" &&
                                    `Type "${editedTestStep.value || "[text]"}" into element: ${editedTestStep.locator?.strategy || "[strategy]"} = "${editedTestStep.locator?.value || "[value]"}"`}
                                {editedTestStep.keyword === "select" &&
                                    `Select option "${editedTestStep.value || "[option]"}" from element: ${editedTestStep.locator?.strategy || "[strategy]"} = "${editedTestStep.locator?.value || "[value]"}"`}
                                {editedTestStep.keyword === "assertText" &&
                                    `Assert element contains text "${editedTestStep.value || "[text]"}": ${editedTestStep.locator?.strategy || "[strategy]"} = "${editedTestStep.locator?.value || "[value]"}"`}
                                {editedTestStep.keyword === "assertVisible" &&
                                    `Assert element is visible: ${editedTestStep.locator?.strategy || "[strategy]"} = "${editedTestStep.locator?.value || "[value]"}"`}
                                {editedTestStep.keyword === "screenshot" &&
                                    `Take screenshot: ${editedTestStep.value || "screenshot.png"}`}
                                {editedTestStep.keyword === "waitFor" && `Wait for: ${editedTestStep.value || "[selector or time]"}`}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
