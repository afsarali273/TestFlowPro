"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Trash2, Save, X, ArrowLeft, FileText, Upload, Code, Database } from "lucide-react"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

interface TestDataEditorProps {
  testData: any
  onSave: (testData: any) => void
  onCancel: () => void
  testCaseType?: string // Add this to know if it's SOAP or REST
}

interface PreProcessStep {
  var?: string // Legacy single variable
  function: string
  args?: any[]
  db?: string // Database name for dbQuery
  mapTo?: Record<string, string> // New multi-variable mapping
}

export function TestDataEditor({ testData, onSave, onCancel, testCaseType = "REST" }: TestDataEditorProps) {
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
      id: `assertion_${Date.now()}`,
      type: "equals",
      ...(testCaseType === "SOAP" ? { xpathExpression: "//*[local-name()='']" } : { jsonPath: "$." }),
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
    const newPreProcess: PreProcessStep = {
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

  // New handlers for mapTo functionality
  const handlePreProcessModeChange = (index: number, mode: "single" | "multiple") => {
    setEditedTestData((prev: any) => ({
      ...prev,
      preProcess: prev.preProcess.map((process: any, i: number) => {
        if (i === index) {
          if (mode === "single") {
            // Convert to single variable mode
            const { mapTo, ...rest } = process
            return { ...rest, var: "" }
          } else {
            // Convert to multiple variable mode
            const { var: singleVar, ...rest } = process
            return { ...rest, mapTo: {} }
          }
        }
        return process
      }),
    }))
  }

  const handleAddMapToEntry = (processIndex: number) => {
    const varName = prompt("Enter variable name:")
    const propertyName = prompt("Enter property name from function result:")
    if (varName && propertyName) {
      setEditedTestData((prev: any) => ({
        ...prev,
        preProcess: prev.preProcess.map((process: any, i: number) => {
          if (i === processIndex) {
            return {
              ...process,
              mapTo: {
                ...process.mapTo,
                [varName]: propertyName,
              },
            }
          }
          return process
        }),
      }))
    }
  }

  const handleRemoveMapToEntry = (processIndex: number, varName: string) => {
    setEditedTestData((prev: any) => ({
      ...prev,
      preProcess: prev.preProcess.map((process: any, i: number) => {
        if (i === processIndex) {
          const newMapTo = { ...process.mapTo }
          delete newMapTo[varName]
          return { ...process, mapTo: newMapTo }
        }
        return process
      }),
    }))
  }

  const handleUpdateMapToEntry = (processIndex: number, oldVarName: string, newVarName: string, propertyName: string) => {
    setEditedTestData((prev: any) => ({
      ...prev,
      preProcess: prev.preProcess.map((process: any, i: number) => {
        if (i === processIndex) {
          const newMapTo = { ...process.mapTo }
          if (oldVarName !== newVarName) {
            delete newMapTo[oldVarName]
          }
          newMapTo[newVarName] = propertyName
          return { ...process, mapTo: newMapTo }
        }
        return process
      }),
    }))
  }

  const handleAddStoreVariable = () => {
    const key = prompt("Enter variable name:")
    const value = prompt(testCaseType === "SOAP" ? "Enter XPath expression:" : "Enter JSON path:")
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

  const handleFileUpload = (field: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // In a real implementation, you would upload the file to your server
      // For now, we'll just store the filename
      handleChange(field, file.name)
    }
  }

  // Function to clean assertion data based on type
  const cleanAssertionData = (assertion: any) => {
    const baseAssertion = {
      id: assertion.id,
      type: assertion.type,
    }

    // Add path field based on test case type and assertion type
    if (assertion.type !== "statusCode") {
      if (testCaseType === "SOAP") {
        baseAssertion.xpathExpression = assertion.xpathExpression || "//*[local-name()='']"
      } else {
        baseAssertion.jsonPath = assertion.jsonPath || "$."
      }
    }

    // Add expected field for most assertion types
    if (assertion.type !== "exists") {
      if (assertion.type === "statusCode") {
        baseAssertion.expected = Number(assertion.expected) || 200
      } else {
        baseAssertion.expected = assertion.expected || ""
      }
    }

    // Add special fields for arrayObjectMatch
    if (assertion.type === "arrayObjectMatch") {
      baseAssertion.matchField = assertion.matchField || ""
      baseAssertion.matchValue = assertion.matchValue || ""
      baseAssertion.assertField = assertion.assertField || ""
    }

    return baseAssertion
  }

  // Function to clean pre-process data
  const cleanPreProcessData = (preProcess: PreProcessStep[]) => {
    return preProcess
      .filter((process: PreProcessStep) => process.function) // Only keep processes with functions
      .map((process: PreProcessStep) => {
        const cleanProcess: any = {
          function: process.function,
        }

        // Add args if they exist and are not empty
        if (process.args && process.args.length > 0 && process.args.some(arg => arg.trim() !== "")) {
          cleanProcess.args = process.args.filter(arg => arg.trim() !== "")
        }

        // Add database name for dbQuery function
        if (process.function === "dbQuery" && process.db) {
          cleanProcess.db = process.db
        }

        // Handle single variable mode
        if (process.var && !process.mapTo) {
          cleanProcess.var = process.var
        }

        // Handle multiple variable mode
        if (process.mapTo && Object.keys(process.mapTo).length > 0) {
          cleanProcess.mapTo = process.mapTo
        }

        return cleanProcess
      })
  }

  // Check if function is dbQuery
  const isDbQueryFunction = (functionName: string) => {
    return functionName === "dbQuery"
  }

  const handleSave = () => {
    // Clean the test data before saving
    const cleanedTestData = {
      ...editedTestData,
      // Clean assertions to remove unnecessary fields
      assertions: (editedTestData.assertions || []).map(cleanAssertionData),
      // Clean preProcess to remove empty entries and format correctly
      preProcess: cleanPreProcessData(editedTestData.preProcess || []),
    }

    onSave(cleanedTestData)
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
              Edit Test Data ({testCaseType})
            </h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onCancel} className="hover:bg-white/80">
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Test Data
            </Button>
          </div>
        </div>

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full grid-cols-8 bg-white/80 backdrop-blur-sm shadow-sm">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="headers">Headers</TabsTrigger>
            <TabsTrigger value="body">{testCaseType === "SOAP" ? "XML Body" : "JSON Body"}</TabsTrigger>
            <TabsTrigger value="assertions">Assertions</TabsTrigger>
            <TabsTrigger value="preprocess">Pre-Process</TabsTrigger>
            <TabsTrigger value="store">Store</TabsTrigger>
            <TabsTrigger value="schema">Schema</TabsTrigger>
            <TabsTrigger value="json">JSON</TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5 text-blue-600" />
                  General Information
                </CardTitle>
                <CardDescription>Configure the basic request information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                    Test Data Name
                  </Label>
                  <Input
                    id="name"
                    value={editedTestData.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    placeholder="Enter test data name"
                    className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="method" className="text-sm font-medium text-gray-700">
                      HTTP Method
                    </Label>
                    <Select value={editedTestData.method} onValueChange={(value) => handleChange("method", value)}>
                      <SelectTrigger className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500">
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
                    <Label htmlFor="endpoint" className="text-sm font-medium text-gray-700">
                      Endpoint
                    </Label>
                    <Input
                      id="endpoint"
                      value={editedTestData.endpoint}
                      onChange={(e) => handleChange("endpoint", e.target.value)}
                      placeholder="/api/endpoint"
                      className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="headers">
            <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Headers</CardTitle>
                    <CardDescription>Configure request headers</CardDescription>
                  </div>
                  <Button
                    onClick={handleAddHeader}
                    className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Header
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(editedTestData.headers || {}).map(([key, value]) => (
                    <div
                      key={key}
                      className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg bg-gray-50/50"
                    >
                      <Input value={key} readOnly className="flex-1 h-10 bg-gray-100" />
                      <Input
                        value={value as string}
                        onChange={(e) => handleNestedChange("headers", key, e.target.value)}
                        className="flex-1 h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRemoveHeader(key)}
                        className="h-10 px-3 border-red-300 hover:border-red-400 hover:bg-red-50 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                  {(!editedTestData.headers || Object.keys(editedTestData.headers).length === 0) && (
                    <div className="text-center py-8 text-gray-500 bg-gray-50/50 rounded-lg border-2 border-dashed border-gray-200">
                      <p className="text-sm">No headers defined yet</p>
                      <p className="text-xs mt-1">Add headers to customize your request</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="body">
            <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  Request Body
                </CardTitle>
                <CardDescription>
                  Configure the request body ({testCaseType === "SOAP" ? "XML format" : "JSON format"}) or upload from
                  file
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Body File Upload */}
                <div className="space-y-2">
                  <Label htmlFor="bodyFile" className="text-sm font-medium text-gray-700">
                    Body File
                  </Label>
                  <div className="flex items-center gap-3">
                    <Input
                      id="bodyFile"
                      value={editedTestData.bodyFile || ""}
                      onChange={(e) => handleChange("bodyFile", e.target.value)}
                      placeholder={`Path to body file (e.g., ./data/request-body.${testCaseType === "SOAP" ? "xml" : "json"})`}
                      className="flex-1 h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                    <div className="relative">
                      <Input
                        type="file"
                        accept={testCaseType === "SOAP" ? ".xml,.txt" : ".json,.txt"}
                        onChange={(e) => handleFileUpload("bodyFile", e)}
                        className="hidden"
                        id="body-file-upload"
                      />
                      <Button
                        variant="outline"
                        onClick={() => document.getElementById("body-file-upload")?.click()}
                        className="h-11 px-4 border-gray-300 hover:border-blue-400 hover:bg-blue-50"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Browse
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">
                    Specify a file path for the request body. This will override the inline body content.
                  </p>
                </div>

                {/* Inline Body */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">
                    Inline Body ({testCaseType === "SOAP" ? "XML" : "JSON"})
                  </Label>
                  {testCaseType === "SOAP" ? (
                    <Textarea
                      value={editedTestData.body || ""}
                      onChange={(e) => handleChange("body", e.target.value)}
                      className="font-mono text-sm min-h-[200px] border-gray-300 focus:border-blue-500 focus:ring-blue-500 whitespace-pre-wrap"
                      placeholder={`Enter XML body
Example:
<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <NumberToWords xmlns="http://www.dataaccess.com/webservicesserver/">
      <ubiNum>100</ubiNum>
    </NumberToWords>
  </soap:Body>
</soap:Envelope>`}
                    />
                  ) : (
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
                      className="font-mono text-sm min-h-[200px] border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Enter JSON body"
                    />
                  )}
                  <p className="text-xs text-gray-500">
                    Enter the request body in {testCaseType === "SOAP" ? "XML" : "JSON"} format. This will be ignored if
                    a body file is specified.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="assertions">
            <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Assertions</CardTitle>
                    <CardDescription>Define response validation rules</CardDescription>
                  </div>
                  <Button
                    onClick={handleAddAssertion}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Assertion
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(editedTestData.assertions || []).map((assertion: any, index: number) => (
                    <div key={index} className="p-4 border border-gray-200 rounded-lg space-y-3 bg-gray-50/50">
                      <div className="grid grid-cols-3 gap-3">
                        <Select
                          value={assertion.type}
                          onValueChange={(value) => handleUpdateAssertion(index, "type", value)}
                        >
                          <SelectTrigger className="h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="equals">Equals</SelectItem>
                            <SelectItem value="notEquals">Not Equals</SelectItem>
                            <SelectItem value="contains">Contains</SelectItem>
                            <SelectItem value="startsWith">Starts With</SelectItem>
                            <SelectItem value="endsWith">Ends With</SelectItem>
                            <SelectItem value="greaterThan">Greater Than</SelectItem>
                            <SelectItem value="lessThan">Less Than</SelectItem>
                            <SelectItem value="in">In Array</SelectItem>
                            <SelectItem value="notIn">Not In Array</SelectItem>
                            <SelectItem value="includesAll">Includes All</SelectItem>
                            <SelectItem value="length">Length</SelectItem>
                            <SelectItem value="size">Size</SelectItem>
                            <SelectItem value="statusCode">Status Code</SelectItem>
                            <SelectItem value="type">Type</SelectItem>
                            <SelectItem value="exists">Exists</SelectItem>
                            <SelectItem value="regex">Regex</SelectItem>
                            <SelectItem value="arrayObjectMatch">Array Object Match</SelectItem>
                          </SelectContent>
                        </Select>

                        {assertion.type !== "statusCode" && (
                          <Input
                            placeholder={testCaseType === "SOAP" ? "XPath Expression" : "JSON Path"}
                            value={assertion.xpathExpression || assertion.jsonPath || ""}
                            onChange={(e) =>
                              handleUpdateAssertion(
                                index,
                                testCaseType === "SOAP" ? "xpathExpression" : "jsonPath",
                                e.target.value,
                              )
                            }
                            className="h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                          />
                        )}

                        {assertion.type === "statusCode" ? (
                          <Input
                            type="number"
                            placeholder="Status Code (e.g., 200)"
                            value={assertion.expected || ""}
                            onChange={(e) =>
                              handleUpdateAssertion(index, "expected", Number.parseInt(e.target.value) || "")
                            }
                            className="h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                          />
                        ) : assertion.type !== "exists" ? (
                          <Input
                            placeholder="Expected Value"
                            value={assertion.expected || ""}
                            onChange={(e) => handleUpdateAssertion(index, "expected", e.target.value)}
                            className="h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                          />
                        ) : (
                          <div></div>
                        )}
                      </div>

                      {assertion.type === "arrayObjectMatch" && (
                        <div className="grid grid-cols-3 gap-3 mt-3">
                          <Input
                            placeholder="Match Field"
                            value={assertion.matchField || ""}
                            onChange={(e) => handleUpdateAssertion(index, "matchField", e.target.value)}
                            className="h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                          />
                          <Input
                            placeholder="Match Value"
                            value={assertion.matchValue || ""}
                            onChange={(e) => handleUpdateAssertion(index, "matchValue", e.target.value)}
                            className="h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                          />
                          <Input
                            placeholder="Assert Field"
                            value={assertion.assertField || ""}
                            onChange={(e) => handleUpdateAssertion(index, "assertField", e.target.value)}
                            className="h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                          />
                        </div>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRemoveAssertion(index)}
                        className="border-red-300 hover:border-red-400 hover:bg-red-50 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Remove
                      </Button>
                    </div>
                  ))}
                  {(!editedTestData.assertions || editedTestData.assertions.length === 0) && (
                    <div className="text-center py-8 text-gray-500 bg-gray-50/50 rounded-lg border-2 border-dashed border-gray-200">
                      <p className="text-sm">No assertions defined yet</p>
                      <p className="text-xs mt-1">Add assertions to validate your API responses</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preprocess">
            <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Database className="h-5 w-5 text-purple-600" />
                      Pre-Process
                    </CardTitle>
                    <CardDescription>Define variables and functions to execute before the request</CardDescription>
                  </div>
                  <Button
                    onClick={handleAddPreProcess}
                    className="bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-600 hover:to-violet-600"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Pre-Process
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {(editedTestData.preProcess || []).map((process: PreProcessStep, index: number) => {
                    const isMultipleMode = !!process.mapTo
                    const isSingleMode = !!process.var || !process.mapTo
                    const isDbQuery = isDbQueryFunction(process.function)

                    return (
                      <div key={index} className="p-6 border border-gray-200 rounded-lg space-y-4 bg-gray-50/50">
                        {/* Function Input */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700">Function</Label>
                          <Select
                            value={process.function || ""}
                            onValueChange={(value) => handleUpdatePreProcess(index, "function", value)}
                          >
                            <SelectTrigger className="h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                              <SelectValue placeholder="Select function type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="faker.email">faker.email</SelectItem>
                              <SelectItem value="faker.uuid">faker.uuid</SelectItem>
                              <SelectItem value="faker.username">faker.username</SelectItem>
                              <SelectItem value="date.now">date.now</SelectItem>
                              <SelectItem value="encrypt">encrypt</SelectItem>
                              <SelectItem value="authToken">authToken</SelectItem>
                              <SelectItem value="generateUser">generateUser</SelectItem>
                              <SelectItem value="dbQuery">dbQuery (Database Query)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Database Name - Only for dbQuery */}
                        {isDbQuery && (
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                              <Database className="h-4 w-4 text-blue-600" />
                              Database Name
                            </Label>
                            <Input
                              placeholder="Database name (e.g., userDb, productDb)"
                              value={process.db || ""}
                              onChange={(e) => handleUpdatePreProcess(index, "db", e.target.value)}
                              className="h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                            />
                          </div>
                        )}

                        {/* Arguments - Special handling for dbQuery */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700">
                            {isDbQuery ? "SQL Query" : "Arguments (Optional)"}
                          </Label>
                          {isDbQuery ? (
                            <Textarea
                              placeholder="SELECT id, email FROM users WHERE id = 1"
                              value={Array.isArray(process.args) ? process.args[0] || "" : ""}
                              onChange={(e) => handleUpdatePreProcess(index, "args", [e.target.value])}
                              className="font-mono text-sm min-h-[100px] border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                            />
                          ) : (
                            <Input
                              placeholder="Arguments (comma separated)"
                              value={Array.isArray(process.args) ? process.args.join(", ") : ""}
                              onChange={(e) =>
                                handleUpdatePreProcess(index, "args", e.target.value.split(", ").filter(Boolean))
                              }
                              className="h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                            />
                          )}
                        </div>

                        {/* Mode Selection - Only show for functions that support multiple variables */}
                        {(process.function === "generateUser" || isDbQuery) && (
                          <div className="space-y-3">
                            <Label className="text-sm font-medium text-gray-700">Variable Mode</Label>
                            <RadioGroup
                              value={isMultipleMode ? "multiple" : "single"}
                              onValueChange={(value) => handlePreProcessModeChange(index, value as "single" | "multiple")}
                              className="flex gap-6"
                            >
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="single" id={`single-${index}`} />
                                <Label htmlFor={`single-${index}`} className="text-sm">
                                  Single Variable
                                </Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="multiple" id={`multiple-${index}`} />
                                <Label htmlFor={`multiple-${index}`} className="text-sm">
                                  Multiple Variables (mapTo)
                                </Label>
                              </div>
                            </RadioGroup>
                          </div>
                        )}

                        {/* Single Variable Mode */}
                        {(isSingleMode && !isMultipleMode) && (
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700">Variable Name</Label>
                            <Input
                              placeholder="Variable name to store result"
                              value={process.var || ""}
                              onChange={(e) => handleUpdatePreProcess(index, "var", e.target.value)}
                              className="h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                            />
                          </div>
                        )}

                        {/* Multiple Variables Mode */}
                        {isMultipleMode && (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <Label className="text-sm font-medium text-gray-700">Variable Mappings</Label>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleAddMapToEntry(index)}
                                className="h-8 px-3 border-green-300 hover:border-green-400 hover:bg-green-50"
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                Add Mapping
                              </Button>
                            </div>
                            
                            <div className="space-y-2">
                              {Object.entries(process.mapTo || {}).map(([varName, propertyName]) => (
                                <div key={varName} className="flex items-center gap-3 p-3 bg-white rounded border">
                                  <div className="flex-1 space-y-1">
                                    <Label className="text-xs text-gray-500">Variable Name</Label>
                                    <Input
                                      value={varName}
                                      onChange={(e) => handleUpdateMapToEntry(index, varName, e.target.value, propertyName)}
                                      className="h-8 text-sm"
                                      placeholder="Variable name"
                                    />
                                  </div>
                                  <div className="flex-1 space-y-1">
                                    <Label className="text-xs text-gray-500">
                                      {isDbQuery ? "Column Name" : "Property Name"}
                                    </Label>
                                    <Input
                                      value={propertyName}
                                      onChange={(e) => handleUpdateMapToEntry(index, varName, varName, e.target.value)}
                                      className="h-8 text-sm"
                                      placeholder={isDbQuery ? "Column from query result" : "Property from function result"}
                                    />
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleRemoveMapToEntry(index, varName)}
                                    className="h-8 px-2 border-red-300 hover:border-red-400 hover:bg-red-50 hover:text-red-700 mt-5"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              ))}
                              
                              {(!process.mapTo || Object.keys(process.mapTo).length === 0) && (
                                <div className="text-center py-4 text-gray-500 bg-white rounded border-2 border-dashed">
                                  <p className="text-sm">No variable mappings defined</p>
                                  <p className="text-xs mt-1">
                                    Add mappings to store multiple {isDbQuery ? "columns" : "variables"} from {isDbQuery ? "query" : "function"} result
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Remove Button */}
                        <div className="flex justify-end pt-2 border-t">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRemovePreProcess(index)}
                            className="border-red-300 hover:border-red-400 hover:bg-red-50 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Remove Pre-Process
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                  
                  {(!editedTestData.preProcess || editedTestData.preProcess.length === 0) && (
                    <div className="text-center py-8 text-gray-500 bg-gray-50/50 rounded-lg border-2 border-dashed border-gray-200">
                      <p className="text-sm">No pre-process steps defined yet</p>
                      <p className="text-xs mt-1">Add pre-process steps to prepare data before requests</p>
                    </div>
                  )}
                </div>

                {/* Info Section */}
                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-medium mb-2 text-blue-800">Pre-Process Examples</h4>
                  <div className="space-y-3 text-sm text-blue-700">
                    <div>
                      <strong>Single Variable:</strong>
                      <code className="ml-2 bg-blue-100 px-2 py-1 rounded text-xs block mt-1">
                        {"{ \"var\": \"randomEmail\", \"function\": \"faker.email\" }"}
                      </code>
                    </div>
                    <div>
                      <strong>Multiple Variables:</strong>
                      <code className="ml-2 bg-blue-100 px-2 py-1 rounded text-xs block mt-1">
                        {"{ \"function\": \"generateUser\", \"mapTo\": { \"userNameVar\": \"username\", \"userEmailVar\": \"email\" } }"}
                      </code>
                    </div>
                    <div>
                      <strong>Database Query:</strong>
                      <code className="ml-2 bg-blue-100 px-2 py-1 rounded text-xs block mt-1">
                        {"{ \"function\": \"dbQuery\", \"args\": [\"SELECT id, email FROM users WHERE id = 1\"], \"db\": \"userDb\", \"mapTo\": { \"userId\": \"id\", \"userEmail\": \"email\" } }"}
                      </code>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="store">
            <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Store Variables</CardTitle>
                    <CardDescription>Store response values for later use</CardDescription>
                  </div>
                  <Button
                    onClick={handleAddStoreVariable}
                    className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Variable
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(editedTestData.store || {}).map(([key, value]) => (
                    <div
                      key={key}
                      className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg bg-gray-50/50"
                    >
                      <Input value={key} readOnly className="flex-1 h-10 bg-gray-100" />
                      <Input
                        value={value as string}
                        onChange={(e) => handleNestedChange("store", key, e.target.value)}
                        className="flex-1 h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        placeholder={testCaseType === "SOAP" ? "XPath Expression" : "JSON Path"}
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRemoveStoreVariable(key)}
                        className="h-10 px-3 border-red-300 hover:border-red-400 hover:bg-red-50 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                  {(!editedTestData.store || Object.keys(editedTestData.store).length === 0) && (
                    <div className="text-center py-8 text-gray-500 bg-gray-50/50 rounded-lg border-2 border-dashed border-gray-200">
                      <p className="text-sm">No store variables defined yet</p>
                      <p className="text-xs mt-1">Store response values to use in subsequent requests</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="schema">
            <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5 text-green-600" />
                  Response Schema Validation
                </CardTitle>
                <CardDescription>Define response schema validation using JSON Schema or file reference</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Response Schema File */}
                <div className="space-y-2">
                  <Label htmlFor="responseSchemaFile" className="text-sm font-medium text-gray-700">
                    Response Schema File
                  </Label>
                  <div className="flex items-center gap-3">
                    <Input
                      id="responseSchemaFile"
                      value={editedTestData.responseSchemaFile || ""}
                      onChange={(e) => handleChange("responseSchemaFile", e.target.value)}
                      placeholder="Path to schema file (e.g., ./schemas/user-response.json)"
                      className="flex-1 h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                    <div className="relative">
                      <Input
                        type="file"
                        accept=".json"
                        onChange={(e) => handleFileUpload("responseSchemaFile", e)}
                        className="hidden"
                        id="schema-file-upload"
                      />
                      <Button
                        variant="outline"
                        onClick={() => document.getElementById("schema-file-upload")?.click()}
                        className="h-11 px-4 border-gray-300 hover:border-green-400 hover:bg-green-50"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Browse
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">
                    Specify a file path for the JSON Schema. This will override the inline schema content.
                  </p>
                </div>

                {/* Inline Response Schema */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Inline Response Schema (JSON Schema)</Label>
                  <Textarea
                    value={JSON.stringify(editedTestData.responseSchema || {}, null, 2)}
                    onChange={(e) => {
                      try {
                        const parsed = JSON.parse(e.target.value)
                        handleChange("responseSchema", parsed)
                      } catch (error) {
                        // Invalid JSON, don't update
                      }
                    }}
                    className="font-mono text-sm min-h-[300px] border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    placeholder={`{
  "type": "object",
  "properties": {
    "id": {
      "type": "string"
    },
    "name": {
      "type": "string"
    },
    "email": {
      "type": "string",
      "format": "email"
    }
  },
  "required": ["id", "name", "email"]
}`}
                  />
                  <p className="text-xs text-gray-500">
                    Enter the JSON Schema for response validation. This will be ignored if a schema file is specified.
                  </p>
                </div>

                {/* Schema Info */}
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h4 className="font-medium mb-2 text-blue-800">JSON Schema Validation</h4>
                  <ul className="space-y-1 text-sm text-blue-700">
                    <li>• Use JSON Schema Draft 7 format for response validation</li>
                    <li>• Schema validation runs after assertions but before storing variables</li>
                    <li>• File-based schemas take precedence over inline schemas</li>
                    <li>• Validation failures will mark the test as failed</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="json">
            <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0">
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