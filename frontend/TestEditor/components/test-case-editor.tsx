"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Trash2, Save, X, ArrowLeft } from "lucide-react"
import { TestDataEditor } from "@/components/test-data-editor"

interface TestCaseEditorProps {
  testCase: any
  onSave: (testCase: any) => void
  onCancel: () => void
}

export function TestCaseEditor({ testCase, onSave, onCancel }: TestCaseEditorProps) {
  const [editedTestCase, setEditedTestCase] = useState(JSON.parse(JSON.stringify(testCase)))
  const [selectedTestData, setSelectedTestData] = useState<any>(null)
  const [isEditingTestData, setIsEditingTestData] = useState(false)

  const handleTestCaseChange = (field: string, value: any) => {
    setEditedTestCase((prev: any) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleAddTestData = () => {
    const newTestData = {
      name: "New Test Data",
      method: "GET",
      endpoint: "/",
      headers: {
        "Content-Type": editedTestCase.type === "SOAP" ? "text/xml; charset=utf-8" : "application/json",
      },
      assertions: [],
      store: {},
    }
    setSelectedTestData(newTestData)
    setIsEditingTestData(true)
  }

  const handleEditTestData = (testData: any, index: number) => {
    setSelectedTestData({ ...testData, index })
    setIsEditingTestData(true)
  }

  const handleSaveTestData = (testData: any) => {
    if (typeof testData.index === "number") {
      // Editing existing test data
      setEditedTestCase((prev: any) => ({
        ...prev,
        testData: prev.testData.map((td: any, i: number) =>
          i === testData.index ? { ...testData, index: undefined } : td,
        ),
      }))
    } else {
      // Adding new test data
      setEditedTestCase((prev: any) => ({
        ...prev,
        testData: [...(prev.testData || []), testData],
      }))
    }
    setIsEditingTestData(false)
    setSelectedTestData(null)
  }

  const handleDeleteTestData = (index: number) => {
    setEditedTestCase((prev: any) => ({
      ...prev,
      testData: prev.testData.filter((_: any, i: number) => i !== index),
    }))
  }

  const handleSave = () => {
    onSave(editedTestCase)
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
                {(editedTestCase.testData || []).map((testData: any, index: number) => (
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
            <Card>
              <CardHeader>
                <CardTitle>JSON View</CardTitle>
                <CardDescription>View and edit the raw JSON structure</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={JSON.stringify(editedTestCase, null, 2)}
                  onChange={(e) => {
                    try {
                      const parsed = JSON.parse(e.target.value)
                      setEditedTestCase(parsed)
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
