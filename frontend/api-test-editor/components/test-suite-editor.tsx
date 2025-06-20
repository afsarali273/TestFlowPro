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
import { Plus, Trash2, Save, X, ArrowLeft } from "lucide-react"
import { TestCaseEditor } from "@/components/test-case-editor"

interface TestSuite {
  id: string
  suiteName: string
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
    const newTestCase = {
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
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={onCancel}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-2xl font-bold">Edit Test Suite</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onCancel}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Save Suite
            </Button>
          </div>
        </div>

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="testcases">Test Cases ({editedSuite.testCases.length})</TabsTrigger>
            <TabsTrigger value="json">JSON View</TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle>Suite Information</CardTitle>
                <CardDescription>Configure the basic information for your test suite</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="suiteName">Suite Name</Label>
                    <Input
                      id="suiteName"
                      value={editedSuite.suiteName}
                      onChange={(e) => handleSuiteChange("suiteName", e.target.value)}
                      placeholder="Enter suite name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select value={editedSuite.status} onValueChange={(value) => handleSuiteChange("status", value)}>
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
                  <div className="flex items-center justify-between">
                    <Label>Tags</Label>
                    <Button size="sm" onClick={handleAddTag}>
                      <Plus className="h-3 w-3 mr-1" />
                      Add Tag
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {editedSuite.tags.map((tag, index) => (
                      <div key={index} className="flex items-center gap-2 p-3 border rounded-lg">
                        <Input
                          placeholder="Service Name (e.g., @UserService)"
                          value={tag.serviceName || ""}
                          onChange={(e) => handleTagChange(index, "serviceName", e.target.value)}
                          className="flex-1"
                        />
                        <Input
                          placeholder="Suite Type (e.g., @smoke)"
                          value={tag.suiteType || ""}
                          onChange={(e) => handleTagChange(index, "suiteType", e.target.value)}
                          className="flex-1"
                        />
                        <Button size="sm" variant="destructive" onClick={() => handleRemoveTag(index)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="testcases">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Test Cases</h3>
                <Button onClick={handleAddTestCase}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Test Case
                </Button>
              </div>

              <div className="grid gap-4">
                {editedSuite.testCases.map((testCase, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-base">{testCase.name}</CardTitle>
                          <CardDescription>
                            {testCase.testData?.length || 0} test data item{testCase.testData?.length !== 1 ? "s" : ""}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{testCase.status}</Badge>
                          <Button size="sm" variant="outline" onClick={() => handleEditTestCase(testCase, index)}>
                            Edit
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleDeleteTestCase(index)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))}

                {editedSuite.testCases.length === 0 && (
                  <Card>
                    <CardContent className="text-center py-8">
                      <p className="text-gray-500 mb-4">No test cases defined yet</p>
                      <Button onClick={handleAddTestCase}>
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
            <Card>
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
                  className="font-mono text-sm min-h-[400px]"
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
