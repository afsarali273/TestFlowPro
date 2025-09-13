"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Trash2, Save, X, ArrowLeft, Copy, HelpCircle, Play } from "lucide-react"
import { TestDataEditor } from "@/components/test-data-editor"
import { SuiteRunnerModal } from "@/components/suite-runner-modal"
import { type TestCase, type TestData, type TestStep, validateTestCase } from "@/types/test-suite"

import dynamic from "next/dynamic"

const ReactJson = dynamic(() => import("react-json-view"), {
  ssr: false,
  loading: () => <div className="p-4 text-center text-gray-500">Loading JSON viewer...</div>
})
import MonacoEditor from "@monaco-editor/react"

interface TestCaseEditorProps {
  testCase: TestCase & { index?: number }
  suiteId?: string
  suiteName?: string
  onSave: (testCase: TestCase & { index?: number }) => void
  onCancel: () => void
}

export function TestCaseEditor({ testCase, suiteId, suiteName, onSave, onCancel }: TestCaseEditorProps) {
  const [editedTestCase, setEditedTestCase] = useState<TestCase & { index?: number }>(() => {
    const validated = validateTestCase(testCase)
    return {
      ...validated,
      index: testCase.index,
      // Auto-generate ID if missing for run functionality
      id: validated.id || `tc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    }
  })
  const [selectedTestData, setSelectedTestData] = useState<TestData | null>(null)
  const [isEditingTestData, setIsEditingTestData] = useState(false)

  const [testType, setTestType] = useState<"API" | "UI">(editedTestCase.type === "UI" ? "UI" : "API")
  const [activeTab, setActiveTab] = useState("general")
  const [jsonViewMode, setJsonViewMode] = useState<"tree" | "code" | "raw">("tree")
  const [jsonError, setJsonError] = useState<string | null>(null)
  const [inlineEditingStepIndex, setInlineEditingStepIndex] = useState<number | null>(null)
  const [inlineEditingStep, setInlineEditingStep] = useState<TestStep | null>(null)
  const [isAddingNewStep, setIsAddingNewStep] = useState(false)
  const [keywordSearch, setKeywordSearch] = useState("")
  const [showKeywordDropdown, setShowKeywordDropdown] = useState(false)
  const [showRunnerModal, setShowRunnerModal] = useState(false)
  const [runTarget, setRunTarget] = useState<string | null>(null)
  const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(null)

  // Check for test data edit context on mount
  React.useEffect(() => {
    const testDataIndex = sessionStorage.getItem('editTestDataIndex')
    if (testDataIndex && editedTestCase.testData) {
      const index = parseInt(testDataIndex)
      sessionStorage.removeItem('editTestDataIndex')
      
      if (editedTestCase.testData[index]) {
        handleEditTestData(editedTestCase.testData[index], index)
      }
    }
  }, [editedTestCase])

  // Handle navigation to results
  React.useEffect(() => {
    const handleNavigateToResults = (event: any) => {
      // Prevent the event from bubbling to avoid double handling
      event.stopPropagation()
      // Close the test case editor first
      onCancel()
      // Then dispatch a new event after a delay with context
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('navigate-to-results-from-editor', {
          detail: {
            suite: { id: suiteId, suiteName: suiteName },
            testCase: editedTestCase,
            testCaseIndex: editedTestCase.index || 0
          }
        }))
      }, 200)
    }

    window.addEventListener("navigate-to-results", handleNavigateToResults)
    return () => {
      window.removeEventListener("navigate-to-results", handleNavigateToResults)
    }
  }, [onCancel, suiteId, suiteName, editedTestCase])

  const handleTestCaseChange = (field: keyof TestCase, value: any) => {
    setEditedTestCase((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const triggerAutoSave = () => {
    // Only auto-save if we have suite context (not a new standalone test case)
    if (!suiteId) return
    
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout)
    }
    const timeout = setTimeout(() => {
      handleSaveQuietly()
    }, 2000)
    setAutoSaveTimeout(timeout)
  }

  const handleSaveQuietly = () => {
    // Silent save for existing test cases without triggering onSave callback
    if (!suiteId) return
    
    try {
      const validatedTestCase = validateTestCase(editedTestCase)
      const finalTestCase = {
        ...validatedTestCase,
        index: editedTestCase.index,
      }
      // Don't call onSave to avoid navigation - just silent background save
    } catch (error) {
      // Silent fail for auto-save
      console.log('Auto-save failed:', error)
    }
  }

  const handleTestTypeChange = (type: "API" | "UI") => {
    setTestType(type)
    if (type === "UI") {
      setEditedTestCase((prev) => ({
        ...prev,
        type: "UI" as const,
        testSteps: prev.testSteps || [],
      }))
    } else {
      setEditedTestCase((prev) => ({
        ...prev,
        type: "REST" as const,
        testData: prev.testData || [],
      }))
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
    triggerAutoSave()
  }

  const handleDeleteTestData = (index: number) => {
    setEditedTestCase((prev) => ({
      ...prev,
      testData: prev.testData.filter((_, i) => i !== index),
    }))
    triggerAutoSave()
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
    triggerAutoSave()
  }

  const handleAddTestStep = () => {
    const newTestStep: TestStep = {
      id: `step${(editedTestCase.testSteps?.length || 0) + 1}`,
      keyword: "openBrowser",
    }
    setInlineEditingStep(newTestStep)
    setIsAddingNewStep(true)
    setInlineEditingStepIndex(-1)
    
    // Scroll to new step after state update
    setTimeout(() => {
      const newStepElement = document.querySelector('.border-2.border-blue-200')
      if (newStepElement) {
        newStepElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }, 100)
  }

  const handleEditTestStep = (testStep: TestStep, index: number) => {
    setInlineEditingStep({ ...testStep })
    setInlineEditingStepIndex(index)
    setIsAddingNewStep(false)
    setKeywordSearch(testStep.keyword)
  }

  const handleDeleteTestStep = (index: number) => {
    setEditedTestCase((prev) => ({
      ...prev,
      testSteps: prev.testSteps?.filter((_, i) => i !== index) || [],
    }))
    triggerAutoSave()
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
    triggerAutoSave()
  }

  const handleSave = () => {
    const validatedTestCase = validateTestCase(editedTestCase)
    const finalTestCase = {
      ...validatedTestCase,
      index: editedTestCase.index,
    }
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
    triggerAutoSave()
  }

  const handleInlineCancelTestStep = () => {
    setInlineEditingStep(null)
    setInlineEditingStepIndex(null)
    setIsAddingNewStep(false)
  }

  const handleInlineStepChange = (field: keyof TestStep, value: any) => {
    setInlineEditingStep((prev) => {
      if (!prev) return null
      
      // If changing keyword, clear incompatible fields
      if (field === 'keyword') {
        const newStep: TestStep = { ...prev, [field]: value }
        
        // Keywords that don't need locators
        const noLocatorKeywords = [
          'openBrowser', 'closeBrowser', 'closePage', 'maximize', 'minimize', 
          'switchToMainFrame', 'acceptAlert', 'dismissAlert', 'getAlertText',
          'waitForNavigation', 'reload', 'goBack', 'goForward', 'refresh',
          'screenshot', 'scrollUp', 'scrollDown', 'getTitle', 'getUrl'
        ]
        
        // Keywords that don't need values
        const noValueKeywords = [
          'openBrowser', 'closeBrowser', 'closePage', 'maximize', 'minimize',
          'switchToMainFrame', 'acceptAlert', 'dismissAlert', 'getAlertText',
          'waitForNavigation', 'reload', 'goBack', 'goForward', 'refresh',
          'click', 'dblClick', 'rightClick', 'clear', 'check', 'uncheck',
          'hover', 'focus', 'scrollIntoViewIfNeeded', 'dragAndDrop',
          'assertVisible', 'assertHidden', 'assertEnabled', 'assertDisabled',
          'screenshot', 'scrollUp', 'scrollDown', 'getText', 'getTitle', 'getUrl'
        ]
        
        // Clear locator if new keyword doesn't support it
        if (noLocatorKeywords.includes(value)) {
          delete newStep.locator
        }
        
        // Clear value if new keyword doesn't support it
        if (noValueKeywords.includes(value)) {
          delete newStep.value
        }
        
        return newStep
      }
      
      return { ...prev, [field]: value }
    })
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
        : null
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
                        onChange={() => handleTestTypeChange("API")}
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
                        onChange={() => handleTestTypeChange("UI")}
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

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="priority">Priority (Lower = Higher Priority)</Label>
                      <Input
                        id="priority"
                        type="number"
                        min="1"
                        value={editedTestCase.priority || ""}
                        onChange={(e) => handleTestCaseChange("priority", e.target.value ? parseInt(e.target.value) : undefined)}
                        placeholder="1, 2, 3..."
                      />
                      <div className="text-xs text-gray-500">
                        Lower numbers execute first (1 = highest priority)
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dependsOn">Dependencies (Comma-separated)</Label>
                      <Input
                        id="dependsOn"
                        value={editedTestCase.dependsOn?.join(", ") || ""}
                        onChange={(e) => {
                          const deps = e.target.value
                            .split(",")
                            .map(dep => dep.trim())
                            .filter(dep => dep.length > 0)
                          handleTestCaseChange("dependsOn", deps.length > 0 ? deps : undefined)
                        }}
                        placeholder="Generate Auth Token, Create User"
                      />
                      <div className="text-xs text-gray-500">
                        Test case names this test depends on
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t">
                  <Button onClick={() => {
                    triggerAutoSave()
                    setActiveTab(testType === "API" ? "testdata" : "teststeps")
                  }} size="lg">
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
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        if (suiteId) {
                          setRunTarget(`${suiteId}:${suiteName || 'Suite'} > ${editedTestCase.id}:${editedTestCase.name}`)
                          setShowRunnerModal(true)
                        }
                      }}
                      disabled={!suiteId}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Run Test Case
                    </Button>
                    <Button onClick={handleAddTestData}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Test Data
                    </Button>
                  </div>
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
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => {
                                if (suiteId) {
                                  setRunTarget(`${suiteId}:${suiteName || 'Suite'} > ${editedTestCase.id}:${editedTestCase.name} > ${index}:${testData.name}`)
                                  setShowRunnerModal(true)
                                }
                              }}
                              disabled={!suiteId}
                            >
                              <Play className="h-3 w-3 mr-1" />
                              Run
                            </Button>
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
                    <Card key={testStep.id || `step-${index}`}>
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
                              <div className="space-y-2 relative">
                                <Label>Keyword</Label>
                                <Input
                                  value={keywordSearch || (inlineEditingStep?.keyword || "")}
                                  onChange={(e) => {
                                    setKeywordSearch(e.target.value)
                                    setShowKeywordDropdown(true)
                                  }}
                                  onFocus={() => setShowKeywordDropdown(true)}
                                  onBlur={() => setTimeout(() => setShowKeywordDropdown(false), 200)}
                                  placeholder="Search keywords..."
                                />
                                {showKeywordDropdown && (
                                  <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                                    {[
                                      { value: "openBrowser", label: "[Browser] Open Browser" },
                                      { value: "closeBrowser", label: "[Browser] Close Browser" },
                                      { value: "closePage", label: "[Browser] Close Page" },
                                      { value: "maximize", label: "[Browser] Maximize Window" },
                                      { value: "minimize", label: "[Browser] Minimize Window" },
                                      { value: "setViewportSize", label: "[Browser] Set Viewport Size" },
                                      { value: "switchToFrame", label: "[Browser] Switch To Frame" },
                                      { value: "switchToMainFrame", label: "[Browser] Switch To Main Frame" },
                                      { value: "acceptAlert", label: "[Browser] Accept Alert" },
                                      { value: "dismissAlert", label: "[Browser] Dismiss Alert" },
                                      { value: "getAlertText", label: "[Browser] Get Alert Text" },
                                      { value: "goto", label: "[Navigation] Go To URL" },
                                      { value: "waitForNavigation", label: "[Navigation] Wait For Navigation" },
                                      { value: "reload", label: "[Navigation] Reload Page" },
                                      { value: "goBack", label: "[Navigation] Go Back" },
                                      { value: "goForward", label: "[Navigation] Go Forward" },
                                      { value: "refresh", label: "[Navigation] Refresh Page" },
                                      { value: "click", label: "[Actions] Click" },
                                      { value: "dblClick", label: "[Actions] Double Click" },
                                      { value: "rightClick", label: "[Actions] Right Click" },
                                      { value: "type", label: "[Actions] Type Text" },
                                      { value: "fill", label: "[Actions] Fill Input" },
                                      { value: "press", label: "[Actions] Press Key" },
                                      { value: "clear", label: "[Actions] Clear Input" },
                                      { value: "select", label: "[Actions] Select Option" },
                                      { value: "check", label: "[Actions] Check Checkbox" },
                                      { value: "uncheck", label: "[Actions] Uncheck Checkbox" },
                                      { value: "setChecked", label: "[Actions] Set Checked State" },
                                      { value: "hover", label: "[Actions] Hover" },
                                      { value: "focus", label: "[Actions] Focus Element" },
                                      { value: "scrollIntoViewIfNeeded", label: "[Actions] Scroll Into View" },
                                      { value: "dragAndDrop", label: "[Actions] Drag and Drop" },
                                      { value: "uploadFile", label: "[Actions] Upload File" },
                                      { value: "downloadFile", label: "[Actions] Download File" },
                                      { value: "waitForSelector", label: "[Wait] Wait For Selector" },
                                      { value: "waitForTimeout", label: "[Wait] Wait For Timeout" },
                                      { value: "waitForFunction", label: "[Wait] Wait For Function" },
                                      { value: "assertText", label: "[Assertions] Assert Text" },
                                      { value: "assertVisible", label: "[Assertions] Assert Visible" },
                                      { value: "assertHidden", label: "[Assertions] Assert Hidden" },
                                      { value: "assertEnabled", label: "[Assertions] Assert Enabled" },
                                      { value: "assertDisabled", label: "[Assertions] Assert Disabled" },
                                      { value: "assertCount", label: "[Assertions] Assert Count" },
                                      { value: "assertValue", label: "[Assertions] Assert Value" },
                                      { value: "assertAttribute", label: "[Assertions] Assert Attribute" },
                                      { value: "screenshot", label: "[Utilities] Take Screenshot" },
                                      { value: "scrollTo", label: "[Utilities] Scroll To Position" },
                                      { value: "scrollUp", label: "[Utilities] Scroll Up" },
                                      { value: "scrollDown", label: "[Utilities] Scroll Down" },
                                      { value: "getText", label: "[Utilities] Get Text" },
                                      { value: "getAttribute", label: "[Utilities] Get Attribute" },
                                      { value: "getTitle", label: "[Utilities] Get Page Title" },
                                      { value: "getUrl", label: "[Utilities] Get Current URL" },
                                      { value: "getValue", label: "[Utilities] Get Input Value" },
                                      { value: "getCount", label: "[Utilities] Get Element Count" },
                                      { value: "assertChecked", label: "[Assertions] Assert Checked" },
                                      { value: "assertUnchecked", label: "[Assertions] Assert Unchecked" },
                                      { value: "assertContainsText", label: "[Assertions] Assert Contains Text" },
                                      { value: "assertUrl", label: "[Assertions] Assert URL" },
                                      { value: "assertTitle", label: "[Assertions] Assert Title" },
                                      { value: "assertHaveText", label: "[Assertions] Assert Have Text" },
                                      { value: "assertHaveCount", label: "[Assertions] Assert Have Count" },
                                      { value: "waitForElement", label: "[Wait] Wait For Element" },
                                      { value: "waitForText", label: "[Wait] Wait For Text" },
                                      { value: "customStep", label: "[Custom] Custom Function" },
                                      { value: "customCode", label: "[Custom] Raw Playwright Code" }
                                    ].filter(item => 
                                      keywordSearch === "" || 
                                      item.label.toLowerCase().includes(keywordSearch.toLowerCase()) ||
                                      item.value.toLowerCase().includes(keywordSearch.toLowerCase())
                                    ).map((item) => (
                                      <div
                                        key={item.value}
                                        className="px-3 py-2 cursor-pointer hover:bg-gray-100"
                                        onClick={() => {
                                          handleInlineStepChange("keyword", item.value)
                                          setKeywordSearch(item.value)
                                          setShowKeywordDropdown(false)
                                        }}
                                      >
                                        {item.label}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>

                            {["goto", "type", "fill", "press", "select", "setChecked", "assertText", "assertValue", "assertCount", "assertAttribute", "assertContainsText", "assertUrl", "assertTitle", "assertHaveText", "assertHaveCount", "waitForSelector", "waitForTimeout", "waitForFunction", "waitForElement", "waitForText", "setViewportSize", "scrollTo", "switchToFrame", "uploadFile", "getAttribute"].includes(inlineEditingStep?.keyword || "") && (
                              <div className="space-y-2">
                                <Label>Value</Label>
                                <Input
                                  value={inlineEditingStep?.value || ""}
                                  onChange={(e) => handleInlineStepChange("value", e.target.value)}
                                  placeholder={
                                    inlineEditingStep?.keyword === "goto" ? "Enter URL" :
                                    ["type", "fill"].includes(inlineEditingStep?.keyword || "") ? "Enter text to type" :
                                    inlineEditingStep?.keyword === "press" ? "Enter key (e.g., Enter, Tab, Escape)" :
                                    "Enter value"
                                  }
                                />
                              </div>
                            )}

                            {["click", "dblClick", "rightClick", "type", "fill", "press", "clear", "select", "check", "uncheck", "setChecked", "hover", "focus", "scrollIntoViewIfNeeded", "dragAndDrop", "assertText", "assertVisible", "assertHidden", "assertEnabled", "assertDisabled", "assertCount", "assertValue", "assertAttribute", "assertChecked", "assertUnchecked", "assertContainsText", "uploadFile", "downloadFile", "getText", "getAttribute", "getValue", "getCount"].includes(inlineEditingStep?.keyword || "") && (
                              <div className="space-y-4">
                                <Label>Element Locator</Label>
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                      <Label>Strategy</Label>
                                      <div className="group relative">
                                        <HelpCircle className="h-4 w-4 text-gray-400 cursor-help" />
                                        <div className="absolute left-0 top-6 w-80 p-4 bg-gray-900 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
                                          <div className="font-semibold mb-2 text-blue-300">🎯 Locator Strategies</div>
                                          <div className="space-y-2">
                                            <div><span className="text-green-300">role:</span> <code className="text-yellow-200">"button"</code> - Semantic elements</div>
                                            <div><span className="text-green-300">testId:</span> <code className="text-yellow-200">"submit-btn"</code> - data-testid attribute</div>
                                            <div><span className="text-green-300">text:</span> <code className="text-yellow-200">"Sign Up"</code> - Exact text content</div>
                                            <div><span className="text-green-300">css:</span> <code className="text-yellow-200">".btn-primary"</code> - CSS selectors</div>
                                            <div><span className="text-green-300">xpath:</span> <code className="text-yellow-200">"//button[text()='OK']"</code> - XPath expressions</div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                    <Select
                                      value={inlineEditingStep?.locator?.strategy || "role"}
                                      onValueChange={(value) => handleInlineLocatorChange("strategy", value)}
                                    >
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="role">Role (button, link, textbox, etc.)</SelectItem>
                                        <SelectItem value="label">Label Text</SelectItem>
                                        <SelectItem value="text">Text Content</SelectItem>
                                        <SelectItem value="placeholder">Placeholder Text</SelectItem>
                                        <SelectItem value="altText">Alt Text</SelectItem>
                                        <SelectItem value="title">Title Attribute</SelectItem>
                                        <SelectItem value="testId">Test ID</SelectItem>
                                        <SelectItem value="css">CSS Selector</SelectItem>
                                        <SelectItem value="xpath">XPath</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Locator Value</Label>
                                    <Input
                                      value={inlineEditingStep?.locator?.value || ""}
                                      onChange={(e) => handleInlineLocatorChange("value", e.target.value)}
                                      placeholder={
                                        inlineEditingStep?.locator?.strategy === "role"
                                          ? "button, link, textbox, heading, etc."
                                          : inlineEditingStep?.locator?.strategy === "css"
                                            ? ".class, #id, element"
                                            : inlineEditingStep?.locator?.strategy === "xpath"
                                              ? "//div[@class='example']"
                                              : "Enter locator value"
                                      }
                                    />
                                  </div>
                                </div>
                                
                                {/* Locator Options */}
                                <div className="space-y-3 border-t pt-3">
                                  <div className="flex items-center gap-2">
                                    <Label className="text-sm font-medium text-gray-600">Locator Options (Optional)</Label>
                                    <div className="group relative">
                                      <HelpCircle className="h-3 w-3 text-gray-400 cursor-help" />
                                      <div className="absolute left-0 top-4 w-96 p-4 bg-gray-900 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
                                        <div className="font-semibold mb-2 text-blue-300">🔍 Locator Filters</div>
                                        <div className="space-y-2">
                                          <div><span className="text-green-300">name:</span> <code className="text-yellow-200">"Subscribe"</code> - Accessible name</div>
                                          <div><span className="text-green-300">hasText:</span> <code className="text-yellow-200">"Welcome"</code> - Contains text</div>
                                          <div><span className="text-green-300">exact:</span> <code className="text-yellow-200">true</code> - Exact text match</div>
                                          <div><span className="text-green-300">checked:</span> <code className="text-yellow-200">true</code> - Checkbox/radio state</div>
                                          <div className="text-gray-300 mt-2">💡 Combine with any locator strategy for precise targeting</div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-1">
                                        <Label className="text-xs">Name</Label>
                                        <div className="group relative">
                                          <HelpCircle className="h-3 w-3 text-gray-400 cursor-help" />
                                          <div className="absolute left-0 top-4 w-80 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
                                            <div className="font-semibold mb-2 text-blue-300">🏷️ Accessible Name</div>
                                            <div className="space-y-1">
                                              <div><code className="text-yellow-200">.getByRole('button', {'{ name: \'Subscribe\' }'}</code></div>
                                              <div><code className="text-yellow-200">.getByRole('button', {'{ name: /submit/i }'}</code></div>
                                              <div className="text-gray-300 mt-2">💡 Matches accessible name or aria-label</div>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                      <Input
                                        className="h-8 text-sm"
                                        value={typeof inlineEditingStep?.locator?.options?.name === 'object' ? JSON.stringify(inlineEditingStep.locator.options.name) : (inlineEditingStep?.locator?.options?.name?.toString() || "")}
                                        onChange={(e) => {
                                          if (!inlineEditingStep) return
                                          const newStep: TestStep = { ...inlineEditingStep }
                                          if (!newStep.locator) newStep.locator = { strategy: "role", value: "" }
                                          if (!newStep.locator.options) newStep.locator.options = {}
                                          newStep.locator.options.name = e.target.value || undefined
                                          handleInlineStepChange("locator", newStep.locator)
                                        }}
                                        placeholder="Subscribe, /Welcome.*/"
                                      />
                                    </div>
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-1">
                                        <Label className="text-xs">Exact Match</Label>
                                        <div className="group relative">
                                          <HelpCircle className="h-3 w-3 text-gray-400 cursor-help" />
                                          <div className="absolute left-0 top-4 w-80 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
                                            <div className="font-semibold mb-2 text-blue-300">🎯 Exact Text Matching</div>
                                            <div className="space-y-1">
                                              <div><span className="text-green-300">Exact:</span> <code className="text-yellow-200">.getByText('Sign up', {'{ exact: true }'}</code></div>
                                              <div><span className="text-green-300">Partial:</span> <code className="text-yellow-200">.getByText('Sign up')</code> (default)</div>
                                              <div className="text-gray-300 mt-2">💡 Controls whether text matching is exact or partial</div>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                      <div className="flex items-center space-x-2 h-8">
                                        <input
                                          type="checkbox"
                                          id="exact-match-edit"
                                          className="h-4 w-4"
                                          checked={!!inlineEditingStep?.locator?.options?.exact}
                                          onChange={(e) => {
                                            if (!inlineEditingStep) return
                                            const newStep: TestStep = { ...inlineEditingStep }
                                            if (!newStep.locator) newStep.locator = { strategy: "role", value: "" }
                                            if (!newStep.locator.options) newStep.locator.options = {}
                                            newStep.locator.options.exact = e.target.checked ? true : undefined
                                            handleInlineStepChange("locator", newStep.locator)
                                          }}
                                        />
                                        <Label htmlFor="exact-match-edit" className="text-xs">Enable exact matching</Label>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-1">
                                        <Label className="text-xs">Has Text</Label>
                                        <div className="group relative">
                                          <HelpCircle className="h-3 w-3 text-gray-400 cursor-help" />
                                          <div className="absolute left-0 top-4 w-80 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
                                            <div className="font-semibold mb-2 text-blue-300">✅ Contains Text Filter</div>
                                            <div className="space-y-1">
                                              <div><code className="text-yellow-200">.getByRole('button').filter({'{ hasText: \'Save\' }'}</code></div>
                                              <div><code className="text-yellow-200">.locator('div').filter({'{ hasText: /product/i }'}</code></div>
                                              <div className="text-gray-300 mt-2">💡 Filters elements that contain specific text</div>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                      <Input
                                        className="h-8 text-sm"
                                        value={typeof inlineEditingStep?.locator?.options?.hasText === 'object' ? JSON.stringify(inlineEditingStep.locator.options.hasText) : (inlineEditingStep?.locator?.options?.hasText?.toString() || "")}
                                        onChange={(e) => {
                                          if (!inlineEditingStep) return
                                          const newStep: TestStep = { ...inlineEditingStep }
                                          if (!newStep.locator) newStep.locator = { strategy: "role", value: "" }
                                          if (!newStep.locator.options) newStep.locator.options = {}
                                          newStep.locator.options.hasText = e.target.value || undefined
                                          handleInlineStepChange("locator", newStep.locator)
                                        }}
                                        placeholder="Text content or /regex/"
                                      />
                                    </div>
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-1">
                                        <Label className="text-xs">Has Not Text</Label>
                                        <div className="group relative">
                                          <HelpCircle className="h-3 w-3 text-gray-400 cursor-help" />
                                          <div className="absolute left-0 top-4 w-80 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
                                            <div className="font-semibold mb-2 text-blue-300">❌ Excludes Text Filter</div>
                                            <div className="space-y-1">
                                              <div><code className="text-yellow-200">.getByRole('button').filter({'{ hasNotText: \'Disabled\' }'}</code></div>
                                              <div><code className="text-yellow-200">.locator('div').filter({'{ hasNotText: /error/i }'}</code></div>
                                              <div className="text-gray-300 mt-2">💡 Filters out elements that contain specific text</div>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                      <Input
                                        className="h-8 text-sm"
                                        value={typeof inlineEditingStep?.locator?.options?.hasNotText === 'object' ? JSON.stringify(inlineEditingStep.locator.options.hasNotText) : (inlineEditingStep?.locator?.options?.hasNotText?.toString() || "")}
                                        onChange={(e) => {
                                          if (!inlineEditingStep) return
                                          const newStep: TestStep = { ...inlineEditingStep }
                                          if (!newStep.locator) newStep.locator = { strategy: "role", value: "" }
                                          if (!newStep.locator.options) newStep.locator.options = {}
                                          newStep.locator.options.hasNotText = e.target.value || undefined
                                          handleInlineStepChange("locator", newStep.locator)
                                        }}
                                        placeholder="Text to exclude"
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Variable Storage for data extraction keywords */}
                            {(["getText", "getAttribute", "getTitle", "getUrl", "getValue", "getCount"].includes(inlineEditingStep?.keyword || "")) && (
                              <div className="space-y-4 border-t pt-4 bg-green-50 p-4 rounded-lg">
                                <Label className="text-sm font-semibold text-green-700">Variable Storage</Label>
                                <div className="text-xs text-green-600 mb-2">
                                  Store the extracted value in a variable for later use
                                </div>
                                
                                <div className="space-y-2">
                                  <Label>Variable Name</Label>
                                  <Input
                                    value={inlineEditingStep?.store ? Object.keys(inlineEditingStep.store)[0] || "" : ""}
                                    onChange={(e) => {
                                      const varName = e.target.value
                                      if (varName) {
                                        let path = "$text"
                                        switch (inlineEditingStep?.keyword) {
                                          case "getAttribute": path = "$attribute"; break;
                                          case "getTitle": path = "$title"; break;
                                          case "getUrl": path = "$url"; break;
                                          case "getValue": path = "$value"; break;
                                          case "getCount": path = "$count"; break;
                                          default: path = "$text"; break;
                                        }
                                        handleInlineStepChange("store", { [varName]: path })
                                      } else {
                                        handleInlineStepChange("store", undefined)
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

                            {inlineEditingStep?.keyword === "customStep" && (
                              <div className="space-y-4 border-t pt-4">
                                <Label className="text-sm font-semibold">Custom Function Configuration</Label>
                                
                                <div className="space-y-2">
                                  <Label>Function Name</Label>
                                  <Input
                                    value={inlineEditingStep?.customFunction?.function || ""}
                                    onChange={(e) => {
                                      if (!inlineEditingStep) return
                                      const newStep: TestStep = { ...inlineEditingStep }
                                      if (!newStep.customFunction) newStep.customFunction = { function: "" }
                                      newStep.customFunction.function = e.target.value
                                      handleInlineStepChange("customFunction", newStep.customFunction)
                                    }}
                                    placeholder="loginUser, LoginPage.login, UserManagementPage.createUser"
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label>Arguments (JSON Array)</Label>
                                  <Input
                                    value={inlineEditingStep?.customFunction?.args ? JSON.stringify(inlineEditingStep.customFunction.args) : ""}
                                    onChange={(e) => {
                                      if (!inlineEditingStep) return
                                      try {
                                        const args = e.target.value ? JSON.parse(e.target.value) : undefined
                                        const newStep: TestStep = { ...inlineEditingStep }
                                        if (!newStep.customFunction) newStep.customFunction = { function: "" }
                                        newStep.customFunction.args = args
                                        handleInlineStepChange("customFunction", newStep.customFunction)
                                      } catch {
                                        // Invalid JSON, don't update
                                      }
                                    }}
                                    placeholder='["admin", "password123"] or [{"firstName": "John"}]'
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label>Variable Mapping (JSON Object)</Label>
                                  <Input
                                    value={inlineEditingStep?.customFunction?.mapTo ? JSON.stringify(inlineEditingStep.customFunction.mapTo) : ""}
                                    onChange={(e) => {
                                      if (!inlineEditingStep) return
                                      try {
                                        const mapTo = e.target.value ? JSON.parse(e.target.value) : undefined
                                        const newStep: TestStep = { ...inlineEditingStep }
                                        if (!newStep.customFunction) newStep.customFunction = { function: "" }
                                        newStep.customFunction.mapTo = mapTo
                                        handleInlineStepChange("customFunction", newStep.customFunction)
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

                            {inlineEditingStep?.keyword === "customCode" && (
                              <div className="space-y-4 border-t pt-4">
                                <Label className="text-sm font-semibold">Raw Playwright Code</Label>
                                <div className="text-xs text-gray-600 mb-2">
                                  Write raw Playwright code. Available variables: page, browser, expect, console
                                </div>
                                
                                <div className="space-y-2">
                                  <Textarea
                                    value={inlineEditingStep?.customCode || ""}
                                    onChange={(e) => handleInlineStepChange("customCode", e.target.value)}
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
                                    className="font-mono text-sm min-h-[200px]"
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

                            {/* Skip on Failure Option */}
                            <div className="space-y-4 border-t pt-4">
                              <div className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  id="skip-on-failure-edit"
                                  className="h-4 w-4"
                                  checked={!!inlineEditingStep?.skipOnFailure}
                                  onChange={(e) => handleInlineStepChange("skipOnFailure", e.target.checked)}
                                />
                                <Label htmlFor="skip-on-failure-edit" className="text-sm">
                                  Skip this step if any previous step fails
                                </Label>
                              </div>
                              <div className="text-xs text-gray-500">
                                When enabled, this step will be skipped if any previous step in the test case fails
                              </div>
                            </div>

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
                                {testStep.keyword === "customStep" && testStep.customFunction
                                  ? (
                                    <>
                                      Function: {testStep.customFunction.function}
                                      {testStep.customFunction.args && (
                                        <> | Args: {JSON.stringify(testStep.customFunction.args)}</>
                                      )}
                                    </>
                                  )
                                  : testStep.keyword === "customCode" && testStep.customCode
                                  ? (
                                    <>
                                      Code: {testStep.customCode.substring(0, 100)}{testStep.customCode.length > 100 ? '...' : ''}
                                    </>
                                  )
                                  : (
                                    <>
                                      {testStep.value && <>Value: {testStep.value}</>}
                                      {testStep.locator && <> | Locator: {testStep.locator.strategy} = "{testStep.locator.value}"</>}
                                    </>
                                  )
                                }
                                {testStep.skipOnFailure && (
                                  <div className="mt-1">
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-800">
                                      ⏭️ Skip on Failure
                                    </span>
                                  </div>
                                )}
                              </CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button size="sm" variant="outline" onClick={() => handleEditTestStep(testStep, index)}>
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
                            <div className="space-y-2 relative">
                              <Label>Keyword</Label>
                              <Input
                                value={keywordSearch}
                                onChange={(e) => {
                                  setKeywordSearch(e.target.value)
                                  setShowKeywordDropdown(true)
                                }}
                                onFocus={() => setShowKeywordDropdown(true)}
                                onBlur={() => setTimeout(() => setShowKeywordDropdown(false), 200)}
                                placeholder="Search keywords..."
                              />
                              {showKeywordDropdown && (
                                <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                                  {[
                                    { value: "openBrowser", label: "[Browser] Open Browser" },
                                    { value: "closeBrowser", label: "[Browser] Close Browser" },
                                    { value: "closePage", label: "[Browser] Close Page" },
                                    { value: "maximize", label: "[Browser] Maximize Window" },
                                    { value: "minimize", label: "[Browser] Minimize Window" },
                                    { value: "setViewportSize", label: "[Browser] Set Viewport Size" },
                                    { value: "switchToFrame", label: "[Browser] Switch To Frame" },
                                    { value: "switchToMainFrame", label: "[Browser] Switch To Main Frame" },
                                    { value: "acceptAlert", label: "[Browser] Accept Alert" },
                                    { value: "dismissAlert", label: "[Browser] Dismiss Alert" },
                                    { value: "getAlertText", label: "[Browser] Get Alert Text" },
                                    { value: "goto", label: "[Navigation] Go To URL" },
                                    { value: "waitForNavigation", label: "[Navigation] Wait For Navigation" },
                                    { value: "reload", label: "[Navigation] Reload Page" },
                                    { value: "goBack", label: "[Navigation] Go Back" },
                                    { value: "goForward", label: "[Navigation] Go Forward" },
                                    { value: "refresh", label: "[Navigation] Refresh Page" },
                                    { value: "click", label: "[Actions] Click" },
                                    { value: "dblClick", label: "[Actions] Double Click" },
                                    { value: "rightClick", label: "[Actions] Right Click" },
                                    { value: "type", label: "[Actions] Type Text" },
                                    { value: "fill", label: "[Actions] Fill Input" },
                                    { value: "press", label: "[Actions] Press Key" },
                                    { value: "clear", label: "[Actions] Clear Input" },
                                    { value: "select", label: "[Actions] Select Option" },
                                    { value: "check", label: "[Actions] Check Checkbox" },
                                    { value: "uncheck", label: "[Actions] Uncheck Checkbox" },
                                    { value: "setChecked", label: "[Actions] Set Checked State" },
                                    { value: "hover", label: "[Actions] Hover" },
                                    { value: "focus", label: "[Actions] Focus Element" },
                                    { value: "scrollIntoViewIfNeeded", label: "[Actions] Scroll Into View" },
                                    { value: "dragAndDrop", label: "[Actions] Drag and Drop" },
                                    { value: "uploadFile", label: "[Actions] Upload File" },
                                    { value: "downloadFile", label: "[Actions] Download File" },
                                    { value: "waitForSelector", label: "[Wait] Wait For Selector" },
                                    { value: "waitForTimeout", label: "[Wait] Wait For Timeout" },
                                    { value: "waitForFunction", label: "[Wait] Wait For Function" },
                                    { value: "assertText", label: "[Assertions] Assert Text" },
                                    { value: "assertVisible", label: "[Assertions] Assert Visible" },
                                    { value: "assertHidden", label: "[Assertions] Assert Hidden" },
                                    { value: "assertEnabled", label: "[Assertions] Assert Enabled" },
                                    { value: "assertDisabled", label: "[Assertions] Assert Disabled" },
                                    { value: "assertCount", label: "[Assertions] Assert Count" },
                                    { value: "assertValue", label: "[Assertions] Assert Value" },
                                    { value: "assertAttribute", label: "[Assertions] Assert Attribute" },
                                    { value: "screenshot", label: "[Utilities] Take Screenshot" },
                                    { value: "scrollTo", label: "[Utilities] Scroll To Position" },
                                    { value: "scrollUp", label: "[Utilities] Scroll Up" },
                                    { value: "scrollDown", label: "[Utilities] Scroll Down" },
                                    { value: "getText", label: "[Utilities] Get Text" },
                                    { value: "getAttribute", label: "[Utilities] Get Attribute" },
                                    { value: "getTitle", label: "[Utilities] Get Page Title" },
                                    { value: "getUrl", label: "[Utilities] Get Current URL" },
                                    { value: "getValue", label: "[Utilities] Get Input Value" },
                                    { value: "getCount", label: "[Utilities] Get Element Count" },
                                    { value: "assertChecked", label: "[Assertions] Assert Checked" },
                                    { value: "assertUnchecked", label: "[Assertions] Assert Unchecked" },
                                    { value: "assertContainsText", label: "[Assertions] Assert Contains Text" },
                                    { value: "assertUrl", label: "[Assertions] Assert URL" },
                                    { value: "assertTitle", label: "[Assertions] Assert Title" },
                                    { value: "assertHaveText", label: "[Assertions] Assert Have Text" },
                                    { value: "assertHaveCount", label: "[Assertions] Assert Have Count" },
                                    { value: "waitForElement", label: "[Wait] Wait For Element" },
                                    { value: "waitForText", label: "[Wait] Wait For Text" },
                                    { value: "customStep", label: "[Custom] Custom Function" },
                                    { value: "customCode", label: "[Custom] Raw Playwright Code" }
                                  ].filter(item => 
                                    keywordSearch === "" || 
                                    item.label.toLowerCase().includes(keywordSearch.toLowerCase()) ||
                                    item.value.toLowerCase().includes(keywordSearch.toLowerCase())
                                  ).map((item) => (
                                    <div
                                      key={item.value}
                                      className="px-3 py-2 cursor-pointer hover:bg-gray-100"
                                      onClick={() => {
                                        handleInlineStepChange("keyword", item.value)
                                        setKeywordSearch(item.value)
                                        setShowKeywordDropdown(false)
                                      }}
                                    >
                                      {item.label}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>

                          {["goto", "type", "fill", "press", "select", "setChecked", "assertText", "assertValue", "assertCount", "assertAttribute", "assertContainsText", "assertUrl", "assertTitle", "assertHaveText", "assertHaveCount", "waitForSelector", "waitForTimeout", "waitForFunction", "waitForElement", "waitForText", "setViewportSize", "scrollTo", "switchToFrame", "uploadFile", "getAttribute"].includes(inlineEditingStep.keyword) && (
                            <div className="space-y-2">
                              <Label>Value</Label>
                              <Input
                                value={inlineEditingStep.value || ""}
                                onChange={(e) => handleInlineStepChange("value", e.target.value)}
                                placeholder={
                                  inlineEditingStep.keyword === "goto" ? "Enter URL" :
                                  ["type", "fill"].includes(inlineEditingStep.keyword) ? "Enter text to type" :
                                  inlineEditingStep.keyword === "press" ? "Enter key (e.g., Enter, Tab, Escape)" :
                                  "Enter value"
                                }
                              />
                            </div>
                          )}

                          {["click", "dblClick", "rightClick", "type", "fill", "press", "clear", "select", "check", "uncheck", "setChecked", "hover", "focus", "scrollIntoViewIfNeeded", "dragAndDrop", "assertText", "assertVisible", "assertHidden", "assertEnabled", "assertDisabled", "assertCount", "assertValue", "assertAttribute", "assertChecked", "assertUnchecked", "assertContainsText", "uploadFile", "downloadFile", "getText", "getAttribute", "getValue", "getCount"].includes(inlineEditingStep.keyword) && (
                            <div className="space-y-4">
                              <Label>Element Locator</Label>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <Label>Strategy</Label>
                                    <div className="group relative">
                                      <HelpCircle className="h-4 w-4 text-gray-400 cursor-help" />
                                      <div className="absolute left-0 top-6 w-80 p-4 bg-gray-900 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
                                        <div className="font-semibold mb-2 text-blue-300">🎯 Locator Strategies</div>
                                        <div className="space-y-2">
                                          <div><span className="text-green-300">role:</span> <code className="text-yellow-200">"button"</code> - Semantic elements</div>
                                          <div><span className="text-green-300">testId:</span> <code className="text-yellow-200">"submit-btn"</code> - data-testid attribute</div>
                                          <div><span className="text-green-300">text:</span> <code className="text-yellow-200">"Sign Up"</code> - Exact text content</div>
                                          <div><span className="text-green-300">css:</span> <code className="text-yellow-200">".btn-primary"</code> - CSS selectors</div>
                                          <div><span className="text-green-300">xpath:</span> <code className="text-yellow-200">"//button[text()='OK']"</code> - XPath expressions</div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  <Select
                                    value={inlineEditingStep.locator?.strategy || "role"}
                                    onValueChange={(value) => handleInlineLocatorChange("strategy", value)}
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="role">Role (button, link, textbox, etc.)</SelectItem>
                                      <SelectItem value="label">Label Text</SelectItem>
                                      <SelectItem value="text">Text Content</SelectItem>
                                      <SelectItem value="placeholder">Placeholder Text</SelectItem>
                                      <SelectItem value="altText">Alt Text</SelectItem>
                                      <SelectItem value="title">Title Attribute</SelectItem>
                                      <SelectItem value="testId">Test ID</SelectItem>
                                      <SelectItem value="css">CSS Selector</SelectItem>
                                      <SelectItem value="xpath">XPath</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-2">
                                  <Label>Locator Value</Label>
                                  <Input
                                    value={inlineEditingStep.locator?.value || ""}
                                    onChange={(e) => handleInlineLocatorChange("value", e.target.value)}
                                    placeholder={
                                      inlineEditingStep.locator?.strategy === "role"
                                        ? "button, link, textbox, heading, etc."
                                        : inlineEditingStep.locator?.strategy === "css"
                                          ? ".class, #id, element"
                                          : inlineEditingStep.locator?.strategy === "xpath"
                                            ? "//div[@class='example']"
                                            : "Enter locator value"
                                    }
                                  />
                                </div>
                              </div>
                              
                              {/* Locator Options */}
                              <div className="space-y-3 border-t pt-3">
                                <div className="flex items-center gap-2">
                                  <Label className="text-sm font-medium text-gray-600">Locator Options (Optional)</Label>
                                  <div className="group relative">
                                    <HelpCircle className="h-3 w-3 text-gray-400 cursor-help" />
                                    <div className="absolute left-0 top-4 w-96 p-4 bg-gray-900 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
                                      <div className="font-semibold mb-2 text-blue-300">🔍 Locator Filters</div>
                                      <div className="space-y-2">
                                        <div><span className="text-green-300">name:</span> <code className="text-yellow-200">"Subscribe"</code> - Accessible name</div>
                                        <div><span className="text-green-300">hasText:</span> <code className="text-yellow-200">"Welcome"</code> - Contains text</div>
                                        <div><span className="text-green-300">exact:</span> <code className="text-yellow-200">true</code> - Exact text match</div>
                                        <div><span className="text-green-300">checked:</span> <code className="text-yellow-200">true</code> - Checkbox/radio state</div>
                                        <div className="text-gray-300 mt-2">💡 Combine with any locator strategy for precise targeting</div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-1">
                                      <Label className="text-xs">Name</Label>
                                      <div className="group relative">
                                        <HelpCircle className="h-3 w-3 text-gray-400 cursor-help" />
                                        <div className="absolute left-0 top-4 w-80 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
                                          <div className="font-semibold mb-2 text-blue-300">🏷️ Accessible Name</div>
                                          <div className="space-y-1">
                                            <div><code className="text-yellow-200">.getByRole('button', {'{ name: \'Subscribe\' }'}</code></div>
                                            <div><code className="text-yellow-200">.getByRole('button', {'{ name: /submit/i }'}</code></div>
                                            <div className="text-gray-300 mt-2">💡 Matches accessible name or aria-label</div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                    <Input
                                      className="h-8 text-sm"
                                      value={typeof inlineEditingStep.locator?.options?.name === 'object' ? JSON.stringify(inlineEditingStep.locator.options.name) : (inlineEditingStep.locator?.options?.name?.toString() || "")}
                                      onChange={(e) => {
                                        if (!inlineEditingStep) return
                                        const newStep: TestStep = { ...inlineEditingStep }
                                        if (!newStep.locator) newStep.locator = { strategy: "role", value: "" }
                                        if (!newStep.locator.options) newStep.locator.options = {}
                                        newStep.locator.options.name = e.target.value || undefined
                                        handleInlineStepChange("locator", newStep.locator)
                                      }}
                                      placeholder="Subscribe, /Welcome.*/"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-1">
                                      <Label className="text-xs">Exact Match</Label>
                                      <div className="group relative">
                                        <HelpCircle className="h-3 w-3 text-gray-400 cursor-help" />
                                        <div className="absolute left-0 top-4 w-80 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
                                          <div className="font-semibold mb-2 text-blue-300">🎯 Exact Text Matching</div>
                                          <div className="space-y-1">
                                            <div><span className="text-green-300">Exact:</span> <code className="text-yellow-200">.getByText('Sign up', {'{ exact: true }'}</code></div>
                                            <div><span className="text-green-300">Partial:</span> <code className="text-yellow-200">.getByText('Sign up')</code> (default)</div>
                                            <div className="text-gray-300 mt-2">💡 Controls whether text matching is exact or partial</div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex items-center space-x-2 h-8">
                                      <input
                                        type="checkbox"
                                        id="exact-match-add"
                                        className="h-4 w-4"
                                        checked={!!inlineEditingStep.locator?.options?.exact}
                                        onChange={(e) => {
                                          if (!inlineEditingStep) return
                                          const newStep: TestStep = { ...inlineEditingStep }
                                          if (!newStep.locator) newStep.locator = { strategy: "role", value: "" }
                                          if (!newStep.locator.options) newStep.locator.options = {}
                                          newStep.locator.options.exact = e.target.checked ? true : undefined
                                          handleInlineStepChange("locator", newStep.locator)
                                        }}
                                      />
                                      <Label htmlFor="exact-match-add" className="text-xs">Enable exact matching</Label>
                                    </div>
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-1">
                                      <Label className="text-xs">Has Text</Label>
                                      <div className="group relative">
                                        <HelpCircle className="h-3 w-3 text-gray-400 cursor-help" />
                                        <div className="absolute left-0 top-4 w-80 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
                                          <div className="font-semibold mb-2 text-blue-300">✅ Contains Text Filter</div>
                                          <div className="space-y-1">
                                            <div><code className="text-yellow-200">.getByRole('button').filter({'{ hasText: \'Save\' }'}</code></div>
                                            <div><code className="text-yellow-200">.locator('div').filter({'{ hasText: /product/i }'}</code></div>
                                            <div className="text-gray-300 mt-2">💡 Filters elements that contain specific text</div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                    <Input
                                      className="h-8 text-sm"
                                      value={typeof inlineEditingStep.locator?.options?.hasText === 'object' ? JSON.stringify(inlineEditingStep.locator.options.hasText) : (inlineEditingStep.locator?.options?.hasText?.toString() || "")}
                                      onChange={(e) => {
                                        if (!inlineEditingStep) return
                                        const newStep: TestStep = { ...inlineEditingStep }
                                        if (!newStep.locator) newStep.locator = { strategy: "role", value: "" }
                                        if (!newStep.locator.options) newStep.locator.options = {}
                                        newStep.locator.options.hasText = e.target.value || undefined
                                        handleInlineStepChange("locator", newStep.locator)
                                      }}
                                      placeholder="Text content or /regex/"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-1">
                                      <Label className="text-xs">Has Not Text</Label>
                                      <div className="group relative">
                                        <HelpCircle className="h-3 w-3 text-gray-400 cursor-help" />
                                        <div className="absolute left-0 top-4 w-80 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
                                          <div className="font-semibold mb-2 text-blue-300">❌ Excludes Text Filter</div>
                                          <div className="space-y-1">
                                            <div><code className="text-yellow-200">.getByRole('button').filter({'{ hasNotText: \'Disabled\' }'}</code></div>
                                            <div><code className="text-yellow-200">.locator('div').filter({'{ hasNotText: /error/i }'}</code></div>
                                            <div className="text-gray-300 mt-2">💡 Filters out elements that contain specific text</div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                    <Input
                                      className="h-8 text-sm"
                                      value={typeof inlineEditingStep.locator?.options?.hasNotText === 'object' ? JSON.stringify(inlineEditingStep.locator.options.hasNotText) : (inlineEditingStep.locator?.options?.hasNotText?.toString() || "")}
                                      onChange={(e) => {
                                        if (!inlineEditingStep) return
                                        const newStep: TestStep = { ...inlineEditingStep }
                                        if (!newStep.locator) newStep.locator = { strategy: "role", value: "" }
                                        if (!newStep.locator.options) newStep.locator.options = {}
                                        newStep.locator.options.hasNotText = e.target.value || undefined
                                        handleInlineStepChange("locator", newStep.locator)
                                      }}
                                      placeholder="Text to exclude"
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Variable Storage for data extraction keywords */}
                          {(["getText", "getAttribute", "getTitle", "getUrl", "getValue", "getCount"].includes(inlineEditingStep?.keyword || "")) && (
                            <div className="space-y-4 border-t pt-4 bg-green-50 p-4 rounded-lg">
                              <Label className="text-sm font-semibold text-green-700">Variable Storage</Label>
                              <div className="text-xs text-green-600 mb-2">
                                Store the extracted value in a variable for later use
                              </div>
                              
                              <div className="space-y-2">
                                <Label>Variable Name</Label>
                                <Input
                                  value={inlineEditingStep?.store ? Object.keys(inlineEditingStep.store)[0] || "" : ""}
                                  onChange={(e) => {
                                    const varName = e.target.value
                                    if (varName) {
                                      let path = "$text"
                                      switch (inlineEditingStep?.keyword) {
                                        case "getAttribute": path = "$attribute"; break;
                                        case "getTitle": path = "$title"; break;
                                        case "getUrl": path = "$url"; break;
                                        case "getValue": path = "$value"; break;
                                        case "getCount": path = "$count"; break;
                                        default: path = "$text"; break;
                                      }
                                      handleInlineStepChange("store", { [varName]: path })
                                    } else {
                                      handleInlineStepChange("store", undefined)
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

                          {inlineEditingStep?.keyword === "customStep" && (
                            <div className="space-y-4 border-t pt-4">
                              <Label className="text-sm font-semibold">Custom Function Configuration</Label>
                              
                              <div className="space-y-2">
                                <Label>Function Name</Label>
                                <Input
                                  value={inlineEditingStep?.customFunction?.function || ""}
                                  onChange={(e) => {
                                    if (!inlineEditingStep) return
                                    const newStep: TestStep = { ...inlineEditingStep }
                                    if (!newStep.customFunction) newStep.customFunction = { function: "" }
                                    newStep.customFunction.function = e.target.value
                                    handleInlineStepChange("customFunction", newStep.customFunction)
                                  }}
                                  placeholder="loginUser, LoginPage.login, UserManagementPage.createUser"
                                />
                              </div>

                              <div className="space-y-2">
                                <Label>Arguments (JSON Array)</Label>
                                <Input
                                  value={inlineEditingStep?.customFunction?.args ? JSON.stringify(inlineEditingStep.customFunction.args) : ""}
                                  onChange={(e) => {
                                    if (!inlineEditingStep) return
                                    try {
                                      const args = e.target.value ? JSON.parse(e.target.value) : undefined
                                      const newStep: TestStep = { ...inlineEditingStep }
                                      if (!newStep.customFunction) newStep.customFunction = { function: "" }
                                      newStep.customFunction.args = args
                                      handleInlineStepChange("customFunction", newStep.customFunction)
                                    } catch {
                                      // Invalid JSON, don't update
                                    }
                                  }}
                                  placeholder='["admin", "password123"] or [{"firstName": "John"}]'
                                />
                              </div>

                              <div className="space-y-2">
                                <Label>Variable Mapping (JSON Object)</Label>
                                <Input
                                  value={inlineEditingStep?.customFunction?.mapTo ? JSON.stringify(inlineEditingStep.customFunction.mapTo) : ""}
                                  onChange={(e) => {
                                    if (!inlineEditingStep) return
                                    try {
                                      const mapTo = e.target.value ? JSON.parse(e.target.value) : undefined
                                      const newStep: TestStep = { ...inlineEditingStep }
                                      if (!newStep.customFunction) newStep.customFunction = { function: "" }
                                      newStep.customFunction.mapTo = mapTo
                                      handleInlineStepChange("customFunction", newStep.customFunction)
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

                          {inlineEditingStep?.keyword === "customCode" && (
                            <div className="space-y-4 border-t pt-4">
                              <Label className="text-sm font-semibold">Raw Playwright Code</Label>
                              <div className="text-xs text-gray-600 mb-2">
                                Write raw Playwright code. Available variables: page, browser, expect, console
                              </div>
                              
                              <div className="space-y-2">
                                <Textarea
                                  value={inlineEditingStep?.customCode || ""}
                                  onChange={(e) => handleInlineStepChange("customCode", e.target.value)}
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
                                  className="font-mono text-sm min-h-[200px]"
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

                          {/* Skip on Failure Option */}
                          <div className="space-y-4 border-t pt-4">
                            <div className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id="skip-on-failure-add"
                                className="h-4 w-4"
                                checked={!!inlineEditingStep?.skipOnFailure}
                                onChange={(e) => handleInlineStepChange("skipOnFailure", e.target.checked)}
                              />
                              <Label htmlFor="skip-on-failure-add" className="text-sm">
                                Skip this step if any previous step fails
                              </Label>
                            </div>
                            <div className="text-xs text-gray-500">
                              When enabled, this step will be skipped if any previous step in the test case fails
                            </div>
                          </div>

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
                  <div className="flex justify-between items-center pt-4 border-t">
                    <Button onClick={handleAddTestStep}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Test Step
                    </Button>
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
                        fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, "Liberation Mono", monospace',
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
      

      
      {showRunnerModal && runTarget && (
        <SuiteRunnerModal
          isOpen={showRunnerModal}
          onClose={() => {
            setShowRunnerModal(false)
            setRunTarget(null)
          }}
          target={runTarget}
        />
      )}
    </div>
  )
}