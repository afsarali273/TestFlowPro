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
import { Plus, Trash2, Save, X, ArrowLeft, Globe, Download } from "lucide-react"
import { TestCaseEditor } from "@/components/test-case-editor"

interface TestSuite {
  id: string
  suiteName: string
  baseUrl?: string
  status: string
  tags: Array<{ serviceName?: string; suiteType?: string }>
  testCases: Array<any>
  filePath?: string
}

interface TestSuiteEditorProps {
  suite: TestSuite
  onSave: (suite: TestSuite) => void
  onCancel: () => void
}

export function TestSuiteEditor({ suite, onSave, onCancel }: TestSuiteEditorProps) {
  const [editedSuite, setEditedSuite] = useState<TestSuite>(JSON.parse(JSON.stringify(suite)))
  const [selectedTestCase, setSelectedTestCase] = useState<any>(null)
  const [isEditingTestCase, setIsEditingTestCase] = useState(false)

  const handleSuiteChange = (field: string, value: any) => {
    setEditedSuite((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleAddTag = () => {
    setEditedSuite((prev) => ({
      ...prev,
      tags: [...prev.tags, { serviceName: "", suiteType: "" }],
    }))
  }

  const handleRemoveTag = (index: number) => {
    setEditedSuite((prev) => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index),
    }))
  }

  const handleTagChange = (index: number, field: string, value: string) => {
    setEditedSuite((prev) => ({
      ...prev,
      tags: prev.tags.map((tag, i) => (i === index ? { ...tag, [field]: value } : tag)),
    }))
  }

  const handleAddTestCase = () => {
    const timestamp = Date.now()
    const newTestCase = {
      id: `testcase_${timestamp}`,
      name: "New Test Case",
      status: "Not Started",
      testData: [],
    }
    setSelectedTestCase(newTestCase)
    setIsEditingTestCase(true)
  }

  const handleEditTestCase = (testCase: any, index: number) => {
    setSelectedTestCase({ ...testCase, index })
    setIsEditingTestCase(true)
  }

  const handleSaveTestCase = (testCase: any) => {
    if (typeof testCase.index === "number") {
      // Editing existing test case
      setEditedSuite((prev) => ({
        ...prev,
        testCases: prev.testCases.map((tc, i) => (i === testCase.index ? { ...testCase, index: undefined } : tc)),
      }))
    } else {
      // Adding new test case
      setEditedSuite((prev) => ({
        ...prev,
        testCases: [...prev.testCases, testCase],
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

  const handleSave = async () => {
    try {
      if (editedSuite.filePath) {
        // Save to existing file
        const response = await fetch("/api/test-suites", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            testSuite: editedSuite,
            filePath: editedSuite.filePath,
          }),
        })

        if (!response.ok) {
          throw new Error("Failed to save test suite")
        }
      }

      onSave(editedSuite)
    } catch (error) {
      console.error("Error saving test suite:", error)
      // You might want to show a toast notification here
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
                  // Clean the suite data for export (remove UI-specific fields)
                  const exportData = {
                    ...editedSuite,
                    testCases: editedSuite.testCases.map((tc) => {
                      const { index, ...cleanTestCase } = tc
                      return cleanTestCase
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
            <Button variant="outline" onClick={onCancel} className="hover:bg-white/80">
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
                    <Select value={editedSuite.status} onValueChange={(value) => handleSuiteChange("status", value)}>
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
                    {editedSuite.tags.map((tag, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg bg-gray-50/50"
                      >
                        <Input
                          placeholder="Service Name (e.g., @UserService)"
                          value={tag.serviceName || ""}
                          onChange={(e) => handleTagChange(index, "serviceName", e.target.value)}
                          className="flex-1 h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        />
                        <Input
                          placeholder="Suite Type (e.g., @smoke)"
                          value={tag.suiteType || ""}
                          onChange={(e) => handleTagChange(index, "suiteType", e.target.value)}
                          className="flex-1 h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        />
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
                    {editedSuite.tags.length === 0 && (
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
                <CardTitle>JSON View</CardTitle>
                <CardDescription>View and edit the raw JSON structure</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={JSON.stringify(editedSuite, null, 2)}
                  onChange={(e) => {
                    try {
                      const parsed = JSON.parse(e.target.value)
                      setEditedSuite(parsed)
                    } catch (error) {
                      // Invalid JSON, don't update
                    }
                  }}
                  className="font-mono text-sm min-h-[400px] border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
