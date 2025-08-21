"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Trash2, Save, X, ArrowLeft, Globe, Download, Copy, Code, TreePine, Eye, Edit3 } from "lucide-react"
import dynamic from "next/dynamic"
import { TestCaseEditor } from "@/components/test-case-editor"
import { type TestSuite, type TestCase, type Tag, validateTestSuite } from "@/types/test-suite"

const ReactJson = dynamic(() => import("react-json-view"), { ssr: false })
const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false })

interface TestSuiteEditorProps {
  suite: TestSuite & { id?: string; status?: string; filePath?: string }
  onSave: (suite: TestSuite & { id?: string; status?: string; filePath?: string }) => void
  onCancel: () => void
}

export function TestSuiteEditor({ suite, onSave, onCancel }: TestSuiteEditorProps) {
  const [editedSuite, setEditedSuite] = useState<TestSuite & { id?: string; status?: string; filePath?: string }>(
      () => {
        const validated = validateTestSuite(suite)
        return {
          ...validated,
          id: suite.id,
          status: suite.status || "Not Started",
          filePath: suite.filePath,
        }
      },
  )
  const [selectedTestCase, setSelectedTestCase] = useState<(TestCase & { index?: number }) | null>(null)
  const [isEditingTestCase, setIsEditingTestCase] = useState(false)
  const [jsonViewMode, setJsonViewMode] = useState<"tree" | "code" | "raw">("tree")
  const [jsonError, setJsonError] = useState<string | null>(null)

  const handleSuiteChange = (field: keyof TestSuite, value: any) => {
    setEditedSuite((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleAddTag = () => {
    setEditedSuite((prev) => ({
      ...prev,
      tags: [...(prev.tags || []), {}],
    }))
  }

  const handleRemoveTag = (index: number) => {
    setEditedSuite((prev) => ({
      ...prev,
      tags: (prev.tags || []).filter((_, i) => i !== index),
    }))
  }

  const handleTagChange = (index: number, field: string, value: string | Tag) => {
    setEditedSuite((prev) => ({
      ...prev,
      tags: (prev.tags || []).map((tag, i) => {
        if (i === index) {
          if (field === "replace") {
            return value as Tag // Replace entire tag object
          }
          return { ...tag, [field]: value as string }
        }
        return tag
      }),
    }))
  }

  const handleAddTestCase = () => {
    const newTestCase: TestCase = {
      name: "New Test Case",
      status: "Not Started",
      type: "REST",
      testData: [],
    }
    setSelectedTestCase(newTestCase)
    setIsEditingTestCase(true)
  }

  const handleEditTestCase = (testCase: TestCase, index: number) => {
    setSelectedTestCase({ ...testCase, index })
    setIsEditingTestCase(true)
  }

  const handleSaveTestCase = (testCase: TestCase & { index?: number }) => {
    if (typeof testCase.index === "number") {
      // Editing existing test case
      const { index, ...cleanTestCase } = testCase
      setEditedSuite((prev) => ({
        ...prev,
        testCases: prev.testCases.map((tc, i) => (i === index ? cleanTestCase : tc)),
      }))
    } else {
      // Adding new test case
      const { index, ...cleanTestCase } = testCase
      setEditedSuite((prev) => ({
        ...prev,
        testCases: [...prev.testCases, cleanTestCase],
      }))
    }
    setIsEditingTestCase(false)
    setSelectedTestCase(null)
  }

  const handleDeleteTestCase = (index: number) => {
    setEditedSuite((prev) => ({
      ...prev,
      testCases: prev.testCases.filter((_, i) => i !== index),
    }))
  }

  const handleCloneTestCase = (testCase: TestCase, index: number) => {
    const clonedTestCase: TestCase = {
      ...JSON.parse(JSON.stringify(testCase)), // Deep clone to avoid reference issues
      name: `${testCase.name} - Copy`,
      status: "Not Started", // Reset status for the cloned test case
    }

    setEditedSuite((prev) => ({
      ...prev,
      testCases: [...prev.testCases, clonedTestCase],
    }))
  }

  const handleSave = async () => {
    try {
      const validatedSuite = validateTestSuite(editedSuite)
      const finalSuite = {
        ...validatedSuite,
        id: editedSuite.id,
        status: editedSuite.status,
        filePath: editedSuite.filePath,
      }

      console.log("[v0] Saving validated test suite:", finalSuite)

      const suitePath = localStorage.getItem("testSuitePath")

      if (!suitePath) {
        // If no suite path is configured, just update in memory
        onSave(finalSuite)
        return
      }

      // Generate filename from suite name if not editing existing file
      let targetFilePath = finalSuite.filePath
      if (!targetFilePath) {
        const fileName = `${finalSuite.suiteName.replace(/[^a-zA-Z0-9]/g, "_")}.json`
        targetFilePath = `${suitePath}/${fileName}`
      }

      // Save to file system
      const response = await fetch("/api/test-suites", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          testSuite: finalSuite,
          filePath: targetFilePath,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to save test suite")
      }

      // Update the suite with the file path for future saves
      const updatedSuite = {
        ...finalSuite,
        filePath: targetFilePath,
        fileName: targetFilePath.split("/").pop() || `${finalSuite.suiteName}.json`,
      }

      onSave(updatedSuite)

      // Show success message
      console.log(`Test suite saved to: ${targetFilePath}`)
    } catch (error: any) {
      console.error("Error saving test suite:", error)
      alert(`Failed to save test suite: ${error.message}`)
    }
  }

  const handleJsonTreeEdit = (edit: any) => {
    try {
      const validated = validateTestSuite(edit.updated_src)
      setEditedSuite({
        ...validated,
        id: editedSuite.id,
        status: edit.updated_src.status || editedSuite.status,
        filePath: editedSuite.filePath,
      })
      setJsonError(null)
    } catch (error: any) {
      setJsonError(`Invalid JSON structure: ${error.message}`)
    }
  }

  const handleMonacoChange = (value: string | undefined) => {
    if (!value) return

    try {
      const parsed = JSON.parse(value)
      const validated = validateTestSuite(parsed)
      setEditedSuite({
        ...validated,
        id: editedSuite.id,
        status: parsed.status || editedSuite.status,
        filePath: editedSuite.filePath,
      })
      setJsonError(null)
    } catch (error: any) {
      setJsonError(`Invalid JSON: ${error.message}`)
    }
  }

  if (isEditingTestCase && selectedTestCase) {
    return (
        <TestCaseEditor
            testCase={selectedTestCase}
            onSave={handleSaveTestCase}
            onCancel={() => {
              setIsEditingTestCase(false)
              setSelectedTestCase(null)
            }}
        />
    )
  }

  return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="max-w-6xl mx-auto p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={onCancel} className="hover:bg-white/80">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Edit Test Suite
              </h1>
            </div>
            <div className="flex gap-2">
              <Button
                  variant="outline"
                  onClick={async () => {
                    try {
                      const exportData = {
                        ...editedSuite,
                        testCases: editedSuite.testCases.map((tc) => {
                          // TestCase doesn't have index property, so no destructuring needed
                          return tc
                        }),
                      }

                      // Create and download the file
                      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
                        type: "application/json",
                      })
                      const url = URL.createObjectURL(blob)
                      const a = document.createElement("a")
                      a.href = url
                      a.download = `${editedSuite.suiteName.replace(/[^a-zA-Z0-9]/g, "_")}.json`
                      document.body.appendChild(a)
                      a.click()
                      document.body.removeChild(a)
                      URL.revokeObjectURL(url)
                    } catch (error) {
                      console.error("Error exporting test suite:", error)
                    }
                  }}
                  className="hover:bg-white/80"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" onClick={onCancel} className="hover:bg-white/80 bg-transparent">
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button
                  onClick={handleSave}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Suite
              </Button>
            </div>
          </div>

          <Tabs defaultValue="general" className="space-y-6">
            <TabsList className="bg-white/80 backdrop-blur-sm shadow-sm">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="testcases">Test Cases ({editedSuite.testCases.length})</TabsTrigger>
              <TabsTrigger value="json">JSON View</TabsTrigger>
            </TabsList>

            <TabsContent value="general">
              <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5 text-blue-600" />
                    Suite Information
                  </CardTitle>
                  <CardDescription>Configure the basic information for your test suite</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="suiteName" className="text-sm font-medium text-gray-700">
                        Suite Name
                      </Label>
                      <Input
                          id="suiteName"
                          value={editedSuite.suiteName}
                          onChange={(e) => handleSuiteChange("suiteName", e.target.value)}
                          placeholder="Enter suite name"
                          className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="status" className="text-sm font-medium text-gray-700">
                        Status
                      </Label>
                      <Select
                          value={editedSuite.status}
                          onValueChange={(value) => setEditedSuite((prev) => ({ ...prev, status: value }))}
                      >
                        <SelectTrigger className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500">
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

                  {/* Base URL Section */}
                  <div className="space-y-2">
                    <Label htmlFor="baseUrl" className="text-sm font-medium text-gray-700">
                      Base URL
                    </Label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                          id="baseUrl"
                          value={editedSuite.baseUrl || ""}
                          onChange={(e) => handleSuiteChange("baseUrl", e.target.value)}
                          placeholder="https://api.example.com"
                          className="h-11 pl-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <p className="text-xs text-gray-500">
                      The base URL will be prepended to all endpoint paths in this test suite
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium text-gray-700">Tags</Label>
                      <Button
                          size="sm"
                          onClick={handleAddTag}
                          className="h-8 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add Tag
                      </Button>
                    </div>
                    <div className="space-y-3">
                      {(editedSuite.tags || []).map((tag, index) => (
                          <div
                              key={index}
                              className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg bg-gray-50/50"
                          >
                            {Object.entries(tag).map(([key, value], entryIndex) => (
                                <div key={entryIndex} className="flex items-center gap-2 flex-1">
                                  <Input
                                      placeholder="Key (e.g., serviceName)"
                                      value={key}
                                      onChange={(e) => {
                                        const newKey = e.target.value
                                        const newTag = { ...tag }
                                        delete newTag[key]
                                        newTag[newKey] = value
                                        handleTagChange(index, "replace", newTag)
                                      }}
                                      className="flex-1 h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                  />
                                  <Input
                                      placeholder="Value (e.g., @UserService)"
                                      value={value}
                                      onChange={(e) => handleTagChange(index, key, e.target.value)}
                                      className="flex-1 h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                  />
                                </div>
                            ))}
                            {Object.keys(tag).length === 0 && (
                                <div className="flex items-center gap-2 flex-1">
                                  <Input
                                      placeholder="Key (e.g., serviceName)"
                                      onChange={(e) => {
                                        if (e.target.value) {
                                          handleTagChange(index, e.target.value, "")
                                        }
                                      }}
                                      className="flex-1 h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                  />
                                  <Input
                                      placeholder="Value"
                                      disabled
                                      className="flex-1 h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                  />
                                </div>
                            )}
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRemoveTag(index)}
                                className="h-10 px-3 border-red-300 hover:border-red-400 hover:bg-red-50 hover:text-red-700"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                      ))}
                      {(!editedSuite.tags || editedSuite.tags.length === 0) && (
                          <div className="text-center py-8 text-gray-500 bg-gray-50/50 rounded-lg border-2 border-dashed border-gray-200">
                            <p className="text-sm">No tags defined yet</p>
                            <p className="text-xs mt-1">Tags help organize and filter your test suites</p>
                          </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="testcases">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900">Test Cases</h3>
                  <Button
                      onClick={handleAddTestCase}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Test Case
                  </Button>
                </div>

                <div className="grid gap-4">
                  {editedSuite.testCases.map((testCase, index) => (
                      <Card
                          key={index}
                          className="bg-white/80 backdrop-blur-sm shadow-md border-0 hover:shadow-lg transition-shadow duration-200"
                      >
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="text-base text-gray-900">{testCase.name}</CardTitle>
                              <CardDescription>
                                {testCase.testData?.length || 0} test data item{testCase.testData?.length !== 1 ? "s" : ""}
                              </CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="bg-gray-100 text-gray-700">
                                {testCase.status}
                              </Badge>
                              <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEditTestCase(testCase, index)}
                                  className="hover:bg-blue-50 hover:border-blue-400 hover:text-blue-700"
                              >
                                Edit
                              </Button>
                              <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleCloneTestCase(testCase, index)}
                                  className="hover:bg-green-50 hover:border-green-400 hover:text-green-700"
                                  title="Clone test case"
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                              <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDeleteTestCase(index)}
                                  className="hover:bg-red-50 hover:border-red-400 hover:text-red-700"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                      </Card>
                  ))}

                  {editedSuite.testCases.length === 0 && (
                      <Card className="bg-white/80 backdrop-blur-sm shadow-md border-0">
                        <CardContent className="text-center py-12">
                          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl mb-4">
                            <Plus className="h-8 w-8 text-blue-600" />
                          </div>
                          <p className="text-gray-500 mb-4 font-medium">No test cases defined yet</p>
                          <p className="text-sm text-gray-400 mb-6">Create your first test case to get started</p>
                          <Button
                              onClick={handleAddTestCase}
                              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Your First Test Case
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
                        <Code className="h-5 w-5 text-blue-600" />
                        JSON View
                      </CardTitle>
                      <CardDescription>View and edit the test suite structure with rich JSON editors</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                          size="sm"
                          variant={jsonViewMode === "tree" ? "default" : "outline"}
                          onClick={() => setJsonViewMode("tree")}
                          className="h-8"
                      >
                        <TreePine className="h-3 w-3 mr-1" />
                        Tree
                      </Button>
                      <Button
                          size="sm"
                          variant={jsonViewMode === "code" ? "default" : "outline"}
                          onClick={() => setJsonViewMode("code")}
                          className="h-8"
                      >
                        <Edit3 className="h-3 w-3 mr-1" />
                        Editor
                      </Button>
                      <Button
                          size="sm"
                          variant={jsonViewMode === "raw" ? "default" : "outline"}
                          onClick={() => setJsonViewMode("raw")}
                          className="h-8"
                      >
                        <Eye className="h-3 w-3 mr-1" />
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
                            src={editedSuite}
                            theme="rjv-default"
                            name="testSuite"
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
                                  'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
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
                            value={JSON.stringify(editedSuite, null, 2)}
                            onChange={handleMonacoChange}
                            options={{
                              minimap: { enabled: false },
                              scrollBeyondLastLine: false,
                              fontSize: 13,
                              lineNumbers: "on",
                              roundedSelection: false,
                              scrollbar: {
                                vertical: "visible",
                                horizontal: "visible",
                              },
                              formatOnPaste: true,
                              formatOnType: true,
                              automaticLayout: true,
                              wordWrap: "on",
                              bracketPairColorization: { enabled: true },
                              folding: true,
                              foldingHighlight: true,
                              showFoldingControls: "always",
                            }}
                        />
                      </div>
                  )}

                  {jsonViewMode === "raw" && (
                      <Textarea
                          value={JSON.stringify(editedSuite, null, 2)}
                          onChange={(e) => {
                            try {
                              const parsed = JSON.parse(e.target.value)
                              const validated = validateTestSuite(parsed)
                              setEditedSuite({
                                ...validated,
                                id: editedSuite.id,
                                status: parsed.status || editedSuite.status,
                                filePath: editedSuite.filePath,
                              })
                              setJsonError(null)
                            } catch (error: any) {
                              setJsonError(`Invalid JSON: ${error.message}`)
                            }
                          }}
                          className="font-mono text-sm min-h-[500px] border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                          placeholder="Edit JSON structure..."
                      />
                  )}

                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <div className="flex items-start gap-2">
                      <div className="text-blue-600 mt-0.5">
                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                          <path
                              fillRule="evenodd"
                              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                              clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div className="text-sm text-blue-700">
                        <p className="font-medium mb-1">JSON Editor Tips:</p>
                        <ul className="text-xs space-y-1">
                          <li>
                            <strong>Tree View:</strong> Click to expand/collapse nodes, edit values inline, add/remove
                            properties
                          </li>
                          <li>
                            <strong>Code Editor:</strong> Full VS Code experience with syntax highlighting, folding, and
                            validation
                          </li>
                          <li>
                            <strong>Raw View:</strong> Simple textarea for quick edits and copy/paste operations
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
  )
}
