"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Trash2, Save, X, ArrowLeft, Copy } from "lucide-react"
import { TestDataEditor } from "@/components/test-data-editor"
import { TestStepsEditor } from "@/components/test-steps-editor"
import { type TestCase, type TestData, type TestStep, validateTestCase } from "@/types/test-suite"
import dynamic from "next/dynamic"

const ReactJson = dynamic(() => import("react-json-view"), {
  ssr: false,
  loading: () => <div className="p-4 text-center text-gray-500">Loading JSON viewer...</div>
})
import MonacoEditor from "@monaco-editor/react"

interface TestCaseEditorProps {
  testCase: TestCase & { index?: number }
  onSave: (testCase: TestCase & { index?: number }) => void
  onCancel: () => void
}

export function TestCaseEditor({ testCase, onSave, onCancel }: TestCaseEditorProps) {
  const [editedTestCase, setEditedTestCase] = useState<TestCase & { index?: number }>(() => {
    const validated = validateTestCase(testCase)
    return {
      ...validated,
      index: testCase.index,
    }
  })
  const [selectedTestData, setSelectedTestData] = useState<TestData | null>(null)
  const [isEditingTestData, setIsEditingTestData] = useState(false)
  const [selectedTestStep, setSelectedTestStep] = useState<TestStep | null>(null)
  const [isEditingTestStep, setIsEditingTestStep] = useState(false)
  const [testType, setTestType] = useState<"API" | "UI">(editedTestCase.type === "UI" ? "UI" : "API")
  const [activeTab, setActiveTab] = useState("general")
  const [jsonViewMode, setJsonViewMode] = useState<"tree" | "code" | "raw">("tree")
  const [jsonError, setJsonError] = useState<string | null>(null)
  const [inlineEditingStepIndex, setInlineEditingStepIndex] = useState<number | null>(null)
  const [inlineEditingStep, setInlineEditingStep] = useState<TestStep | null>(null)
  const [isAddingNewStep, setIsAddingNewStep] = useState(false)

  const handleTestCaseChange = (field: keyof TestCase, value: any) => {
    setEditedTestCase((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleTestTypeChange = (type: "API" | "UI") => {
    setTestType(type)
    console.log("[v0] Changing test type to:", type)
    if (type === "UI") {
      setEditedTestCase((prev) => {
        const updated = {
          ...prev,
          type: "UI" as const,
          testSteps: prev.testSteps || [],
        }
        console.log("[v0] Updated test case for UI:", updated.type)
        return updated
      })
    } else {
      setEditedTestCase((prev) => {
        const updated = {
          ...prev,
          type: "REST" as const, // Default to REST for API tests
          testData: prev.testData || [],
        }
        console.log("[v0] Updated test case for API:", updated.type)
        return updated
      })
    }
  }

  const handleAddTestData = () => {
    const newTestData: TestData = {
      name: "New Test Data",
      method: "GET",
      endpoint: "/",
      headers: {
        "Content-Type": editedTestCase.type === "SOAP" ? "text/xml; charset=utf-8" : "application/json",
      },
      preProcess: null,
      assertions: [],
      store: {},
    }
    setSelectedTestData(newTestData)
    setIsEditingTestData(true)
  }

  const handleEditTestData = (testData: TestData, index: number) => {
    setSelectedTestData({ ...testData, index } as any)
    setIsEditingTestData(true)
  }

  const handleSaveTestData = (testData: TestData & { index?: number }) => {
    if (typeof testData.index === "number") {
      setEditedTestCase((prev) => ({
        ...prev,
        testData: prev.testData.map((td, i) =>
            i === testData.index ? ({ ...testData, index: undefined } as TestData) : td,
        ),
      }))
    } else {
      setEditedTestCase((prev) => ({
        ...prev,
        testData: [...prev.testData, testData as TestData],
      }))
    }
    setIsEditingTestData(false)
    setSelectedTestData(null)
  }

  const handleDeleteTestData = (index: number) => {
    setEditedTestCase((prev) => ({
      ...prev,
      testData: prev.testData.filter((_, i) => i !== index),
    }))
  }

  const handleCloneTestData = (testData: TestData, index: number) => {
    const clonedTestData: TestData = {
      ...JSON.parse(JSON.stringify(testData)),
      name: `${testData.name} - Copy`,
    }

    setEditedTestCase((prev) => ({
      ...prev,
      testData: [...prev.testData, clonedTestData],
    }))
  }

  const handleAddTestStep = () => {
    const newTestStep: TestStep = {
      id: `step${(editedTestCase.testSteps?.length || 0) + 1}`,
      keyword: "openBrowser",
    }
    setInlineEditingStep(newTestStep)
    setIsAddingNewStep(true)
    setInlineEditingStepIndex(-1) // -1 indicates new step
  }

  const handleEditTestStep = (testStep: TestStep, index: number) => {
    setInlineEditingStep({ ...testStep })
    setInlineEditingStepIndex(index)
    setIsAddingNewStep(false)
  }

  const handleSaveTestStep = (testStep: TestStep & { index?: number }) => {
    if (typeof testStep.index === "number") {
      setEditedTestCase((prev) => ({
        ...prev,
        testSteps:
            prev.testSteps?.map((ts, i) =>
                i === testStep.index ? ({ ...testStep, index: undefined } as TestStep) : ts,
            ) || [],
      }))
    } else {
      setEditedTestCase((prev) => ({
        ...prev,
        testSteps: [...(prev.testSteps || []), testStep as TestStep],
      }))
      setActiveTab("teststeps")
    }
    setIsEditingTestStep(false)
    setSelectedTestStep(null)
  }

  const handleDeleteTestStep = (index: number) => {
    setEditedTestCase((prev) => ({
      ...prev,
      testSteps: prev.testSteps?.filter((_, i) => i !== index) || [],
    }))
  }

  const handleCloneTestStep = (testStep: TestStep, index: number) => {
    const clonedTestStep: TestStep = {
      ...JSON.parse(JSON.stringify(testStep)),
      id: `${testStep.id}_copy`,
    }

    setEditedTestCase((prev) => ({
      ...prev,
      testSteps: [...(prev.testSteps || []), clonedTestStep],
    }))
  }

  const handleSave = () => {
    const validatedTestCase = validateTestCase(editedTestCase)
    const finalTestCase = {
      ...validatedTestCase,
      index: editedTestCase.index,
    }

    console.log("[v0] Saving validated test case with type:", finalTestCase.type)
    if (testType === "UI") {
      setActiveTab("teststeps")
    }
    onSave(finalTestCase)
  }

  const handleJsonTreeEdit = (edit: any) => {
    try {
      const updated = edit.updated_src
      const validated = validateTestCase(updated)
      setEditedTestCase({
        ...validated,
        index: editedTestCase.index,
      })
      setJsonError(null)
    } catch (error: any) {
      setJsonError(`Invalid JSON: ${error.message}`)
    }
  }

  const handleMonacoChange = (value: string | undefined) => {
    if (!value) return
    try {
      const parsed = JSON.parse(value)
      const validated = validateTestCase(parsed)
      setEditedTestCase({
        ...validated,
        index: editedTestCase.index,
      })
      setJsonError(null)
    } catch (error: any) {
      setJsonError(`Invalid JSON: ${error.message}`)
    }
  }

  const handleInlineSaveTestStep = () => {
    if (!inlineEditingStep) return

    if (isAddingNewStep) {
      setEditedTestCase((prev) => ({
        ...prev,
        testSteps: [...(prev.testSteps || []), inlineEditingStep],
      }))
    } else if (inlineEditingStepIndex !== null && inlineEditingStepIndex >= 0) {
      setEditedTestCase((prev) => ({
        ...prev,
        testSteps: prev.testSteps?.map((ts, i) => (i === inlineEditingStepIndex ? inlineEditingStep : ts)) || [],
      }))
    }

    setInlineEditingStep(null)
    setInlineEditingStepIndex(null)
    setIsAddingNewStep(false)
  }

  const handleInlineCancelTestStep = () => {
    setInlineEditingStep(null)
    setInlineEditingStepIndex(null)
    setIsAddingNewStep(false)
  }

  const handleInlineStepChange = (field: keyof TestStep, value: any) => {
    setInlineEditingStep((prev) => (prev ? { ...prev, [field]: value } : null))
  }

  const handleInlineLocatorChange = (field: "strategy" | "value", value: string) => {
    setInlineEditingStep((prev) =>
        prev
            ? {
              ...prev,
              locator: {
                strategy: prev.locator?.strategy || "css",
                value: prev.locator?.value || "",
                [field]: value,
              },
            }
            : null,
    )
  }

  if (isEditingTestStep && selectedTestStep) {
    return (
        <TestStepsEditor
            testStep={selectedTestStep}
            onSave={handleSaveTestStep}
            onCancel={() => {
              setIsEditingTestStep(false)
              setSelectedTestStep(null)
            }}
        />
    )
  }

  if (isEditingTestData && selectedTestData) {
    return (
        <TestDataEditor
            testData={selectedTestData}
            testCaseType={editedTestCase.type || "REST"}
            onSave={handleSaveTestData}
            onCancel={() => {
              setIsEditingTestData(false)
              setSelectedTestData(null)
            }}
        />
    )
  }

  return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={onCancel}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <h1 className="text-2xl font-bold">Edit Test Case</h1>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onCancel}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" />
                Save Test Case
              </Button>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList>
              <TabsTrigger value="general">General</TabsTrigger>
              {testType === "API" ? (
                  <TabsTrigger value="testdata">Test Data ({editedTestCase.testData?.length || 0})</TabsTrigger>
              ) : (
                  <TabsTrigger value="teststeps">Test Steps ({editedTestCase.testSteps?.length || 0})</TabsTrigger>
              )}
              <TabsTrigger value="json">JSON View</TabsTrigger>
            </TabsList>

            <TabsContent value="general">
              <Card>
                <CardHeader>
                  <CardTitle>Test Case Information</CardTitle>
                  <CardDescription>Configure the basic information for your test case</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Test Case Name</Label>
                      <Input
                          id="name"
                          value={editedTestCase.name}
                          onChange={(e) => handleTestCaseChange("name", e.target.value)}
                          placeholder="Enter test case name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <Select
                          value={editedTestCase.status}
                          onValueChange={(value) => handleTestCaseChange("status", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Not Started">Not Started</SelectItem>
                          <SelectItem value="Running">Running</SelectItem>
                          <SelectItem value="Passed">Passed</SelectItem>
                          <SelectItem value="Failed">Failed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label>Test Type</Label>
                    <div className="flex gap-6">
                      <div className="flex items-center space-x-2">
                        <input
                            type="radio"
                            id="api-test"
                            name="testType"
                            value="API"
                            checked={testType === "API"}
                            onChange={(e) => handleTestTypeChange("API")}
                            className="h-4 w-4"
                        />
                        <Label htmlFor="api-test" className="font-normal">
                          API Test
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                            type="radio"
                            id="ui-test"
                            name="testType"
                            value="UI"
                            checked={testType === "UI"}
                            onChange={(e) => handleTestTypeChange("UI")}
                            className="h-4 w-4"
                        />
                        <Label htmlFor="ui-test" className="font-normal">
                          UI Test
                        </Label>
                      </div>
                    </div>
                  </div>

                  {testType === "API" && (
                      <div className="space-y-2">
                        <Label htmlFor="type">API Type</Label>
                        <Select
                            value={editedTestCase.type || "REST"}
                            onValueChange={(value) => handleTestCaseChange("type", value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="REST">REST API</SelectItem>
                            <SelectItem value="SOAP">SOAP API</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                  )}

                  <div className="flex justify-end pt-4 border-t">
                    <Button onClick={() => setActiveTab(testType === "API" ? "testdata" : "teststeps")} size="lg">
                      Next: {testType === "API" ? "Test Data" : "Test Steps"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {testType === "API" && (
                <TabsContent value="testdata">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold">Test Data</h3>
                      <Button onClick={handleAddTestData}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Test Data
                      </Button>
                    </div>

                    <div className="grid gap-4">
                      {(editedTestCase.testData || []).map((testData: TestData, index: number) => (
                          <Card key={index}>
                            <CardHeader>
                              <div className="flex items-center justify-between">
                                <div>
                                  <CardTitle className="text-base">{testData.name}</CardTitle>
                                  <CardDescription>
                                    {testData.method} {testData.endpoint}
                                  </CardDescription>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button size="sm" variant="outline" onClick={() => handleEditTestData(testData, index)}>
                                    Edit
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={() => handleCloneTestData(testData, index)}>
                                    <Copy className="h-3 w-3" />
                                  </Button>
                                  <Button size="sm" variant="destructive" onClick={() => handleDeleteTestData(index)}>
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            </CardHeader>
                          </Card>
                      ))}

                      {(!editedTestCase.testData || editedTestCase.testData.length === 0) && (
                          <Card>
                            <CardContent className="text-center py-8">
                              <p className="text-gray-500 mb-4">No test data defined yet</p>
                              <Button onClick={handleAddTestData}>
                                <Plus className="h-4 w-4 mr-2" />
                                Add Your First Test Data
                              </Button>
                            </CardContent>
                          </Card>
                      )}
                    </div>
                  </div>
                </TabsContent>
            )}

            {testType === "UI" && (
                <TabsContent value="teststeps">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold">Test Steps</h3>
                      <Button onClick={handleAddTestStep}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Test Step
                      </Button>
                    </div>

                    <div className="grid gap-4">
                      {(editedTestCase.testSteps || []).map((testStep: TestStep, index: number) => (
                          <Card key={index}>
                            {inlineEditingStepIndex === index ? (
                                <CardContent className="p-6">
                                  <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                      <div className="space-y-2">
                                        <Label>Step ID</Label>
                                        <Input
                                            value={inlineEditingStep?.id || ""}
                                            onChange={(e) => handleInlineStepChange("id", e.target.value)}
                                            placeholder="Enter step ID"
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label>Keyword</Label>
                                        <Select
                                            value={inlineEditingStep?.keyword || "openBrowser"}
                                            onValueChange={(value) => handleInlineStepChange("keyword", value)}
                                        >
                                          <SelectTrigger>
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="openBrowser">Open Browser</SelectItem>
                                            <SelectItem value="goto">Go To</SelectItem>
                                            <SelectItem value="click">Click</SelectItem>
                                            <SelectItem value="type">Type</SelectItem>
                                            <SelectItem value="select">Select</SelectItem>
                                            <SelectItem value="waitFor">Wait For</SelectItem>
                                            <SelectItem value="assertText">Assert Text</SelectItem>
                                            <SelectItem value="assertVisible">Assert Visible</SelectItem>
                                            <SelectItem value="screenshot">Screenshot</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                    </div>

                                    {inlineEditingStep?.keyword !== "openBrowser" &&
                                        inlineEditingStep?.keyword !== "screenshot" && (
                                            <div className="space-y-2">
                                              <Label>Value</Label>
                                              <Input
                                                  value={inlineEditingStep?.value || ""}
                                                  onChange={(e) => handleInlineStepChange("value", e.target.value)}
                                                  placeholder="Enter value"
                                              />
                                            </div>
                                        )}

                                    {["click", "type", "select", "assertText", "assertVisible"].includes(
                                        inlineEditingStep?.keyword || "",
                                    ) && (
                                        <div className="space-y-4">
                                          <Label>Locator</Label>
                                          <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                              <Label>Strategy</Label>
                                              <Select
                                                  value={inlineEditingStep?.locator?.strategy || "css"}
                                                  onValueChange={(value) => handleInlineLocatorChange("strategy", value)}
                                              >
                                                <SelectTrigger>
                                                  <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                  <SelectItem value="role">Role</SelectItem>
                                                  <SelectItem value="label">Label</SelectItem>
                                                  <SelectItem value="text">Text</SelectItem>
                                                  <SelectItem value="placeholder">Placeholder</SelectItem>
                                                  <SelectItem value="altText">Alt Text</SelectItem>
                                                  <SelectItem value="testId">Test ID</SelectItem>
                                                  <SelectItem value="css">CSS Selector</SelectItem>
                                                </SelectContent>
                                              </Select>
                                            </div>
                                            <div className="space-y-2">
                                              <Label>Value</Label>
                                              <Input
                                                  value={inlineEditingStep?.locator?.value || ""}
                                                  onChange={(e) => handleInlineLocatorChange("value", e.target.value)}
                                                  placeholder="Enter locator value"
                                              />
                                            </div>
                                          </div>
                                        </div>
                                    )}

                                    <div className="flex justify-end gap-2">
                                      <Button variant="outline" onClick={handleInlineCancelTestStep}>
                                        Cancel
                                      </Button>
                                      <Button onClick={handleInlineSaveTestStep}>
                                        <Save className="h-4 w-4 mr-2" />
                                        Save Step
                                      </Button>
                                    </div>
                                  </div>
                                </CardContent>
                            ) : (
                                <CardHeader>
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <CardTitle className="text-base">
                                        Step {index + 1}: {testStep.keyword}
                                      </CardTitle>
                                      <CardDescription>
                                        {testStep.value && `Value: ${testStep.value}`}
                                        {testStep.locator &&
                                            ` | Locator: ${testStep.locator.strategy} = "${testStep.locator.value}"`}
                                      </CardDescription>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Button size="sm" variant="outline" onClick={() => handleEditTestStep(testStep, index)}>
                                        <Plus className="h-3 w-3 mr-1" />
                                        Edit
                                      </Button>
                                      <Button size="sm" variant="outline" onClick={() => handleCloneTestStep(testStep, index)}>
                                        <Copy className="h-3 w-3" />
                                      </Button>
                                      <Button size="sm" variant="destructive" onClick={() => handleDeleteTestStep(index)}>
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>
                                </CardHeader>
                            )}
                          </Card>
                      ))}

                      {isAddingNewStep && inlineEditingStep && (
                          <Card className="border-2 border-blue-200 bg-blue-50/50">
                            <CardContent className="p-6">
                              <div className="space-y-4">
                                <h4 className="font-medium text-blue-900">Add New Test Step</h4>

                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <Label>Step ID</Label>
                                    <Input
                                        value={inlineEditingStep.id}
                                        onChange={(e) => handleInlineStepChange("id", e.target.value)}
                                        placeholder="Enter step ID"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Keyword</Label>
                                    <Select
                                        value={inlineEditingStep.keyword}
                                        onValueChange={(value) => handleInlineStepChange("keyword", value)}
                                    >
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="openBrowser">Open Browser</SelectItem>
                                        <SelectItem value="goto">Go To</SelectItem>
                                        <SelectItem value="click">Click</SelectItem>
                                        <SelectItem value="type">Type</SelectItem>
                                        <SelectItem value="select">Select</SelectItem>
                                        <SelectItem value="waitFor">Wait For</SelectItem>
                                        <SelectItem value="assertText">Assert Text</SelectItem>
                                        <SelectItem value="assertVisible">Assert Visible</SelectItem>
                                        <SelectItem value="screenshot">Screenshot</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>

                                {inlineEditingStep.keyword !== "openBrowser" &&
                                    inlineEditingStep.keyword !== "screenshot" && (
                                        <div className="space-y-2">
                                          <Label>Value</Label>
                                          <Input
                                              value={inlineEditingStep.value || ""}
                                              onChange={(e) => handleInlineStepChange("value", e.target.value)}
                                              placeholder="Enter value"
                                          />
                                        </div>
                                    )}

                                {["click", "type", "select", "assertText", "assertVisible"].includes(
                                    inlineEditingStep.keyword,
                                ) && (
                                    <div className="space-y-4">
                                      <Label>Locator</Label>
                                      <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                          <Label>Strategy</Label>
                                          <Select
                                              value={inlineEditingStep.locator?.strategy || "css"}
                                              onValueChange={(value) => handleInlineLocatorChange("strategy", value)}
                                          >
                                            <SelectTrigger>
                                              <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="role">Role</SelectItem>
                                              <SelectItem value="label">Label</SelectItem>
                                              <SelectItem value="text">Text</SelectItem>
                                              <SelectItem value="placeholder">Placeholder</SelectItem>
                                              <SelectItem value="altText">Alt Text</SelectItem>
                                              <SelectItem value="testId">Test ID</SelectItem>
                                              <SelectItem value="css">CSS Selector</SelectItem>
                                            </SelectContent>
                                          </Select>
                                        </div>
                                        <div className="space-y-2">
                                          <Label>Value</Label>
                                          <Input
                                              value={inlineEditingStep.locator?.value || ""}
                                              onChange={(e) => handleInlineLocatorChange("value", e.target.value)}
                                              placeholder="Enter locator value"
                                          />
                                        </div>
                                      </div>
                                    </div>
                                )}

                                <div className="flex justify-end gap-2">
                                  <Button variant="outline" onClick={handleInlineCancelTestStep}>
                                    Cancel
                                  </Button>
                                  <Button onClick={handleInlineSaveTestStep}>
                                    <Save className="h-4 w-4 mr-2" />
                                    Save Step
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                      )}

                      {(!editedTestCase.testSteps || editedTestCase.testSteps.length === 0) && !isAddingNewStep && (
                          <Card>
                            <CardContent className="text-center py-8">
                              <p className="text-gray-500 mb-4">No test steps defined yet</p>
                              <Button onClick={handleAddTestStep}>
                                <Plus className="h-4 w-4 mr-2" />
                                Add Your First Test Step
                              </Button>
                            </CardContent>
                          </Card>
                      )}
                    </div>

                    {(editedTestCase.testSteps?.length || 0) > 0 && (
                        <div className="flex justify-end pt-4 border-t">
                          <Button onClick={handleSave} size="lg">
                            <Save className="h-4 w-4 mr-2" />
                            Save All Changes
                          </Button>
                        </div>
                    )}
                  </div>
                </TabsContent>
            )}

            <TabsContent value="json">
              <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">JSON View</CardTitle>
                      <CardDescription>View and edit the test case structure with rich JSON editors</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                          size="sm"
                          variant={jsonViewMode === "tree" ? "default" : "outline"}
                          onClick={() => setJsonViewMode("tree")}
                          className="h-8"
                      >
                        Tree
                      </Button>
                      <Button
                          size="sm"
                          variant={jsonViewMode === "code" ? "default" : "outline"}
                          onClick={() => setJsonViewMode("code")}
                          className="h-8"
                      >
                        Editor
                      </Button>
                      <Button
                          size="sm"
                          variant={jsonViewMode === "raw" ? "default" : "outline"}
                          onClick={() => setJsonViewMode("raw")}
                          className="h-8"
                      >
                        Raw
                      </Button>
                    </div>
                  </div>
                  {jsonError && (
                      <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
                        <p className="text-sm text-red-700">{jsonError}</p>
                      </div>
                  )}
                </CardHeader>

                <CardContent>
                  {jsonViewMode === "tree" && (
                      <div className="border border-gray-200 rounded-lg p-4 bg-gray-50/50 min-h-[500px]">
                        <ReactJson
                            src={editedTestCase}
                            theme="rjv-default"
                            name="testCase"
                            collapsed={1}
                            displayDataTypes={false}
                            displayObjectSize={false}
                            enableClipboard={true}
                            indentWidth={2}
                            collapseStringsAfterLength={50}
                            onEdit={handleJsonTreeEdit}
                            onAdd={handleJsonTreeEdit}
                            onDelete={handleJsonTreeEdit}
                            style={{
                              backgroundColor: "transparent",
                              fontSize: "13px",
                              fontFamily:
                                  'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, "Liberation Mono", monospace',
                            }}
                        />
                      </div>
                  )}

                  {jsonViewMode === "code" && (
                      <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <MonacoEditor
                            height="500px"
                            language="json"
                            theme="vs"
                            value={JSON.stringify(editedTestCase, null, 2)}
                            onChange={handleMonacoChange}
                            options={{
                              minimap: { enabled: false },
                              scrollBeyondLastLine: false,
                              fontSize: 13,
                              lineNumbers: "on",
                              roundedSelection: false,
                              formatOnPaste: true,
                              formatOnType: true,
                              automaticLayout: true,
                              wordWrap: "on",
                            }}
                        />
                      </div>
                  )}

                  {jsonViewMode === "raw" && (
                      <Textarea
                          value={JSON.stringify(editedTestCase, null, 2)}
                          onChange={(e) => {
                            try {
                              const parsed = JSON.parse(e.target.value)
                              const validated = validateTestCase(parsed)
                              setEditedTestCase({
                                ...validated,
                                index: editedTestCase.index,
                              })
                              setJsonError(null)
                            } catch (error: any) {
                              setJsonError(`Invalid JSON: ${error.message}`)
                            }
                          }}
                          className="font-mono text-sm min-h-[500px] border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      />
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
  )
}
