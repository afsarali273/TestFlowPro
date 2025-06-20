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

interface TestDataEditorProps {
  testData: any
  onSave: (testData: any) => void
  onCancel: () => void
}

export function TestDataEditor({ testData, onSave, onCancel }: TestDataEditorProps) {
  const [editedTestData, setEditedTestData] = useState(JSON.parse(JSON.stringify(testData)))

  const handleChange = (field: string, value: any) => {
    setEditedTestData((prev: any) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleNestedChange = (parent: string, field: string, value: any) => {
    setEditedTestData((prev: any) => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [field]: value,
      },
    }))
  }

  const handleAddHeader = () => {
    const key = prompt("Enter header key:")
    const value = prompt("Enter header value:")
    if (key && value) {
      handleNestedChange("headers", key, value)
    }
  }

  const handleRemoveHeader = (key: string) => {
    setEditedTestData((prev: any) => {
      const newHeaders = { ...prev.headers }
      delete newHeaders[key]
      return { ...prev, headers: newHeaders }
    })
  }

  const handleAddAssertion = () => {
    const newAssertion = {
      type: "equals",
      jsonPath: "$.",
      expected: "",
    }
    setEditedTestData((prev: any) => ({
      ...prev,
      assertions: [...(prev.assertions || []), newAssertion],
    }))
  }

  const handleUpdateAssertion = (index: number, field: string, value: any) => {
    setEditedTestData((prev: any) => ({
      ...prev,
      assertions: prev.assertions.map((assertion: any, i: number) =>
        i === index ? { ...assertion, [field]: value } : assertion,
      ),
    }))
  }

  const handleRemoveAssertion = (index: number) => {
    setEditedTestData((prev: any) => ({
      ...prev,
      assertions: prev.assertions.filter((_: any, i: number) => i !== index),
    }))
  }

  const handleAddPreProcess = () => {
    const newPreProcess = {
      var: "",
      function: "",
      args: [],
    }
    setEditedTestData((prev: any) => ({
      ...prev,
      preProcess: [...(prev.preProcess || []), newPreProcess],
    }))
  }

  const handleUpdatePreProcess = (index: number, field: string, value: any) => {
    setEditedTestData((prev: any) => ({
      ...prev,
      preProcess: prev.preProcess.map((process: any, i: number) =>
        i === index ? { ...process, [field]: value } : process,
      ),
    }))
  }

  const handleRemovePreProcess = (index: number) => {
    setEditedTestData((prev: any) => ({
      ...prev,
      preProcess: prev.preProcess.filter((_: any, i: number) => i !== index),
    }))
  }

  const handleAddStoreVariable = () => {
    const key = prompt("Enter variable name:")
    const value = prompt("Enter JSON path:")
    if (key && value) {
      handleNestedChange("store", key, value)
    }
  }

  const handleRemoveStoreVariable = (key: string) => {
    setEditedTestData((prev: any) => {
      const newStore = { ...prev.store }
      delete newStore[key]
      return { ...prev, store: newStore }
    })
  }

  const handleSave = () => {
    onSave(editedTestData)
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
            <h1 className="text-2xl font-bold">Edit Test Data</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onCancel}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Save Test Data
            </Button>
          </div>
        </div>

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="headers">Headers</TabsTrigger>
            <TabsTrigger value="body">Body</TabsTrigger>
            <TabsTrigger value="assertions">Assertions</TabsTrigger>
            <TabsTrigger value="preprocess">Pre-Process</TabsTrigger>
            <TabsTrigger value="store">Store</TabsTrigger>
            <TabsTrigger value="json">JSON</TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle>General Information</CardTitle>
                <CardDescription>Configure the basic request information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Test Data Name</Label>
                  <Input
                    id="name"
                    value={editedTestData.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    placeholder="Enter test data name"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="method">HTTP Method</Label>
                    <Select value={editedTestData.method} onValueChange={(value) => handleChange("method", value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="GET">GET</SelectItem>
                        <SelectItem value="POST">POST</SelectItem>
                        <SelectItem value="PUT">PUT</SelectItem>
                        <SelectItem value="PATCH">PATCH</SelectItem>
                        <SelectItem value="DELETE">DELETE</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endpoint">Endpoint</Label>
                    <Input
                      id="endpoint"
                      value={editedTestData.endpoint}
                      onChange={(e) => handleChange("endpoint", e.target.value)}
                      placeholder="/api/endpoint"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="headers">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Headers</CardTitle>
                    <CardDescription>Configure request headers</CardDescription>
                  </div>
                  <Button onClick={handleAddHeader}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Header
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(editedTestData.headers || {}).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2 p-3 border rounded-lg">
                      <Input value={key} readOnly className="flex-1" />
                      <Input
                        value={value as string}
                        onChange={(e) => handleNestedChange("headers", key, e.target.value)}
                        className="flex-1"
                      />
                      <Button size="sm" variant="destructive" onClick={() => handleRemoveHeader(key)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="body">
            <Card>
              <CardHeader>
                <CardTitle>Request Body</CardTitle>
                <CardDescription>Configure the request body (JSON format)</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={JSON.stringify(editedTestData.body || {}, null, 2)}
                  onChange={(e) => {
                    try {
                      const parsed = JSON.parse(e.target.value)
                      handleChange("body", parsed)
                    } catch (error) {
                      // Invalid JSON, don't update
                    }
                  }}
                  className="font-mono text-sm min-h-[200px]"
                  placeholder="Enter JSON body"
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="assertions">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Assertions</CardTitle>
                    <CardDescription>Define response validation rules</CardDescription>
                  </div>
                  <Button onClick={handleAddAssertion}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Assertion
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(editedTestData.assertions || []).map((assertion: any, index: number) => (
                    <div key={index} className="p-4 border rounded-lg space-y-3">
                      <div className="grid grid-cols-3 gap-2">
                        <Select
                          value={assertion.type}
                          onValueChange={(value) => handleUpdateAssertion(index, "type", value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="equals">Equals</SelectItem>
                            <SelectItem value="exists">Exists</SelectItem>
                            <SelectItem value="size">Size</SelectItem>
                            <SelectItem value="statusCode">Status Code</SelectItem>
                            <SelectItem value="contains">Contains</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input
                          placeholder="JSON Path"
                          value={assertion.jsonPath || ""}
                          onChange={(e) => handleUpdateAssertion(index, "jsonPath", e.target.value)}
                        />
                        <Input
                          placeholder="Expected Value"
                          value={assertion.expected || ""}
                          onChange={(e) => handleUpdateAssertion(index, "expected", e.target.value)}
                        />
                      </div>
                      <Button size="sm" variant="destructive" onClick={() => handleRemoveAssertion(index)}>
                        <Trash2 className="h-3 w-3 mr-1" />
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preprocess">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Pre-Process</CardTitle>
                    <CardDescription>Define variables and functions to execute before the request</CardDescription>
                  </div>
                  <Button onClick={handleAddPreProcess}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Pre-Process
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(editedTestData.preProcess || []).map((process: any, index: number) => (
                    <div key={index} className="p-4 border rounded-lg space-y-3">
                      <div className="grid grid-cols-3 gap-2">
                        <Input
                          placeholder="Variable Name"
                          value={process.var || ""}
                          onChange={(e) => handleUpdatePreProcess(index, "var", e.target.value)}
                        />
                        <Input
                          placeholder="Function"
                          value={process.function || ""}
                          onChange={(e) => handleUpdatePreProcess(index, "function", e.target.value)}
                        />
                        <Input
                          placeholder="Args (comma separated)"
                          value={Array.isArray(process.args) ? process.args.join(", ") : ""}
                          onChange={(e) =>
                            handleUpdatePreProcess(index, "args", e.target.value.split(", ").filter(Boolean))
                          }
                        />
                      </div>
                      <Button size="sm" variant="destructive" onClick={() => handleRemovePreProcess(index)}>
                        <Trash2 className="h-3 w-3 mr-1" />
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="store">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Store Variables</CardTitle>
                    <CardDescription>Store response values for later use</CardDescription>
                  </div>
                  <Button onClick={handleAddStoreVariable}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Variable
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(editedTestData.store || {}).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2 p-3 border rounded-lg">
                      <Input value={key} readOnly className="flex-1" />
                      <Input
                        value={value as string}
                        onChange={(e) => handleNestedChange("store", key, e.target.value)}
                        className="flex-1"
                        placeholder="JSON Path"
                      />
                      <Button size="sm" variant="destructive" onClick={() => handleRemoveStoreVariable(key)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="json">
            <Card>
              <CardHeader>
                <CardTitle>JSON View</CardTitle>
                <CardDescription>View and edit the raw JSON structure</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={JSON.stringify(editedTestData, null, 2)}
                  onChange={(e) => {
                    try {
                      const parsed = JSON.parse(e.target.value)
                      setEditedTestData(parsed)
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
