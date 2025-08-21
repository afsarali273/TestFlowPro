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
import { type TestCase, type TestData, validateTestCase } from "@/types/test-suite"
import ReactJson from "react-json-view"
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
  const [jsonViewMode, setJsonViewMode] = useState<"tree" | "code" | "raw">("tree")
  const [jsonError, setJsonError] = useState<string | null>(null)

  const handleTestCaseChange = (field: keyof TestCase, value: any) => {
    setEditedTestCase((prev) => ({
      ...prev,
      [field]: value,
    }))
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
      // Editing existing test data
      setEditedTestCase((prev) => ({
        ...prev,
        testData: prev.testData.map((td, i) =>
            i === testData.index ? ({ ...testData, index: undefined } as TestData) : td,
        ),
      }))
    } else {
      // Adding new test data
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
      ...JSON.parse(JSON.stringify(testData)), // Deep clone
      name: `${testData.name} - Copy`,
    }

    setEditedTestCase((prev) => ({
      ...prev,
      testData: [...prev.testData, clonedTestData],
    }))
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

  const handleSave = () => {
    const validatedTestCase = validateTestCase(editedTestCase)
    const finalTestCase = {
      ...validatedTestCase,
      index: editedTestCase.index,
    }

    console.log("[v0] Saving validated test case:", finalTestCase)
    onSave(finalTestCase)
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

          <Tabs defaultValue="general" className="space-y-6">
            <TabsList>
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="testdata">Test Data ({editedTestCase.testData?.length || 0})</TabsTrigger>
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

                  {/* Add API Type Selection */}
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
                </CardContent>
              </Card>
            </TabsContent>

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

            <TabsContent value="json">
              <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        JSON View
                      </CardTitle>
                      <CardDescription>
                        View and edit the test case structure with rich JSON editors
                      </CardDescription>
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
